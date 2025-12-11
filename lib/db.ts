import Dexie, { type EntityTable } from "dexie";
import type { Program, WorkoutSession, UserSettings } from "./types";
import { calculateTMAdjustment, roundWeight } from "./sbs-calculations";

// Database schema with Dexie
// This abstraction layer makes it easy to migrate to PostgreSQL later
// by replacing these implementations with API calls

interface ProgramRecord extends Omit<Program, "id"> {
  id: string;
}

interface WorkoutSessionRecord extends Omit<WorkoutSession, "id"> {
  id: string;
}

interface UserSettingsRecord extends Omit<UserSettings, "id"> {
  id: string;
}

class GymLogDatabase extends Dexie {
  programs!: EntityTable<ProgramRecord, "id">;
  workoutSessions!: EntityTable<WorkoutSessionRecord, "id">;
  userSettings!: EntityTable<UserSettingsRecord, "id">;

  constructor() {
    super("GymLogr");

    this.version(1).stores({
      programs: "id, name, createdAt",
      workoutSessions:
        "id, programId, date, weekNumber, [programId+weekNumber+dayName]",
      userSettings: "id",
    });
  }
}

const db = new GymLogDatabase();

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============ Programs API ============

export async function saveProgram(program: Program): Promise<string> {
  const id = program.id || generateId();
  const now = new Date();

  await db.programs.put({
    ...program,
    id,
    createdAt: program.createdAt || now,
    updatedAt: now,
  });

  return id;
}

export async function getProgram(id: string): Promise<Program | undefined> {
  return db.programs.get(id);
}

export async function getAllPrograms(): Promise<Program[]> {
  return db.programs.orderBy("createdAt").reverse().toArray();
}

export async function deleteProgram(id: string): Promise<void> {
  await db.programs.delete(id);
}

// ============ Workout Sessions API ============

export async function saveWorkoutSession(
  session: WorkoutSession
): Promise<string> {
  const id = session.id || generateId();

  await db.workoutSessions.put({
    ...session,
    id,
  });

  return id;
}

export async function getWorkoutSession(
  id: string
): Promise<WorkoutSession | undefined> {
  return db.workoutSessions.get(id);
}

export async function getWorkoutSessionsForProgram(
  programId: string
): Promise<WorkoutSession[]> {
  return db.workoutSessions
    .where("programId")
    .equals(programId)
    .reverse()
    .sortBy("date");
}

export async function getWorkoutSessionForDay(
  programId: string,
  weekNumber: number,
  dayName: string
): Promise<WorkoutSession | undefined> {
  return db.workoutSessions
    .where("[programId+weekNumber+dayName]")
    .equals([programId, weekNumber, dayName])
    .first();
}

export async function getRecentWorkoutSessions(
  limit: number = 10
): Promise<WorkoutSession[]> {
  return db.workoutSessions.orderBy("date").reverse().limit(limit).toArray();
}

// Get last logged data for a specific exercise (for regular exercises)
// Returns all sets from the previous workout for this exercise
// Excludes the current week+day to avoid showing today's data as "previous"
export async function getLastExerciseSets(
  exerciseName: string,
  programId?: string,
  excludeWeekNumber?: number,
  excludeDayName?: string
): Promise<{
  sets: Array<{ weight: number; reps: number; notes?: string }>;
  exerciseNotes?: string;
} | null> {
  const query = programId
    ? db.workoutSessions.where("programId").equals(programId)
    : db.workoutSessions;

  const sessions = await query.reverse().sortBy("date");

  for (const session of sessions) {
    // Skip the current week+day (more reliable than session ID for new sessions)
    if (
      excludeWeekNumber !== undefined &&
      excludeDayName !== undefined &&
      session.weekNumber === excludeWeekNumber &&
      session.dayName === excludeDayName
    ) {
      continue;
    }

    for (const exercise of session.exercises) {
      if (exercise.exerciseName === exerciseName && exercise.sets.length > 0) {
        const completedSets = exercise.sets.filter((s) => s.completed);
        if (completedSets.length > 0) {
          return {
            sets: completedSets.map((s) => ({
              weight: s.weight,
              reps: s.reps,
              notes: s.notes,
            })),
            exerciseNotes: exercise.notes,
          };
        }
      }
    }
  }

  return null;
}

// Get previous comment for a specific day name (e.g., "Day 3")
// This looks for the most recent workout session with the same day name
// that has a comment, excluding the current week
export async function getPreviousDayComment(
  programId: string,
  dayName: string,
  currentWeekNumber: number
): Promise<string | null> {
  const sessions = await db.workoutSessions
    .where("programId")
    .equals(programId)
    .reverse()
    .sortBy("date");

  for (const session of sessions) {
    // Skip current week's session
    if (session.weekNumber === currentWeekNumber) {
      continue;
    }

    // Check if this is the same day name and has a comment
    if (session.dayName === dayName && session.comment) {
      return session.comment;
    }
  }

  return null;
}

// ============ User Settings API ============

const USER_SETTINGS_ID = "user-settings";

export async function getUserSettings(): Promise<UserSettings> {
  const settings = await db.userSettings.get(USER_SETTINGS_ID);

  if (!settings) {
    // Return defaults
    return {
      weightIncrement: 2.5,
      unit: "kg",
    };
  }

  return settings;
}

export async function saveUserSettings(
  settings: Partial<UserSettings>
): Promise<void> {
  const current = await getUserSettings();

  await db.userSettings.put({
    ...current,
    ...settings,
    id: USER_SETTINGS_ID,
  });
}

// ============ Weekly Sets Aggregation for SBS ============

// Build a mapping of exerciseId to lift_key from a program
export function buildExerciseToLiftKeyMap(
  program: Program
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const week of program.weeks) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        if (exercise.type === "sbs" && exercise.sbs_config && exercise.id) {
          map[exercise.id] = exercise.sbs_config.lift_key;
        }
      }
    }
  }

  return map;
}

// Get total sets completed for each lift_key in a given week
export async function getWeeklySetsPerLift(
  programId: string,
  weekNumber: number,
  program: Program
): Promise<Record<string, number>> {
  const sessions = await db.workoutSessions
    .where("programId")
    .equals(programId)
    .filter((session) => session.weekNumber === weekNumber)
    .toArray();

  const exerciseToLiftKey = buildExerciseToLiftKeyMap(program);
  const setsPerLift: Record<string, number> = {};

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exercise.type === "sbs" && exercise.setsCompleted !== undefined) {
        // Look up lift_key from exerciseId
        const liftKey = exerciseToLiftKey[exercise.exerciseId];
        if (liftKey) {
          setsPerLift[liftKey] = (setsPerLift[liftKey] || 0) + exercise.setsCompleted;
        }
      }
    }
  }

  return setsPerLift;
}

// ============ TM Adjustment Logic ============

export interface TMAdjustmentResult {
  liftKey: string;
  oldMax: number;
  newMax: number;
  setsCompleted: number;
  action: "increase" | "decrease" | "maintain";
  adjustmentPercent: number;
}

// Calculate and apply TM adjustments based on completed sets for a week
// Returns the adjustments that were made
export async function applyWeeklyTMAdjustments(
  programId: string,
  weekNumber: number,
  weightIncrement: number = 2.5
): Promise<TMAdjustmentResult[]> {
  const program = await getProgram(programId);
  if (!program) return [];

  const weeklySets = await getWeeklySetsPerLift(programId, weekNumber, program);
  const adjustments: TMAdjustmentResult[] = [];
  let programModified = false;

  for (const [liftKey, setsCompleted] of Object.entries(weeklySets)) {
    const currentMax = program.settings.maxes[liftKey];
    if (!currentMax) continue;

    const { action, adjustmentPercent } = calculateTMAdjustment(liftKey, setsCompleted);

    if (action !== "maintain") {
      const rawNewMax = currentMax * (1 + adjustmentPercent);
      const newMax = roundWeight(rawNewMax, weightIncrement);

      // Only record adjustment if the rounded max actually changed
      if (newMax !== currentMax) {
        program.settings.maxes[liftKey] = newMax;
        programModified = true;

        adjustments.push({
          liftKey,
          oldMax: currentMax,
          newMax,
          setsCompleted,
          action,
          adjustmentPercent,
        });
      }
    }
  }

  if (programModified) {
    await saveProgram(program);
  }

  return adjustments;
}

// ============ Database Utilities ============

export async function clearAllData(): Promise<void> {
  await db.programs.clear();
  await db.workoutSessions.clear();
  await db.userSettings.clear();
}

export { db };
