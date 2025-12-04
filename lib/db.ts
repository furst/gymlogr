import Dexie, { type EntityTable } from 'dexie';
import type { Program, WorkoutSession, UserSettings } from './types';

// Database schema with Dexie
// This abstraction layer makes it easy to migrate to PostgreSQL later
// by replacing these implementations with API calls

interface ProgramRecord extends Omit<Program, 'id'> {
  id: string;
}

interface WorkoutSessionRecord extends Omit<WorkoutSession, 'id'> {
  id: string;
}

interface UserSettingsRecord extends Omit<UserSettings, 'id'> {
  id: string;
}

class GymLogDatabase extends Dexie {
  programs!: EntityTable<ProgramRecord, 'id'>;
  workoutSessions!: EntityTable<WorkoutSessionRecord, 'id'>;
  userSettings!: EntityTable<UserSettingsRecord, 'id'>;

  constructor() {
    super('GymLogr');

    this.version(1).stores({
      programs: 'id, name, createdAt',
      workoutSessions: 'id, programId, date, weekNumber, [programId+weekNumber+dayName]',
      userSettings: 'id',
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
  return db.programs.orderBy('createdAt').reverse().toArray();
}

export async function deleteProgram(id: string): Promise<void> {
  await db.programs.delete(id);
}

// ============ Workout Sessions API ============

export async function saveWorkoutSession(session: WorkoutSession): Promise<string> {
  const id = session.id || generateId();

  await db.workoutSessions.put({
    ...session,
    id,
  });

  return id;
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
  return db.workoutSessions.get(id);
}

export async function getWorkoutSessionsForProgram(programId: string): Promise<WorkoutSession[]> {
  return db.workoutSessions
    .where('programId')
    .equals(programId)
    .reverse()
    .sortBy('date');
}

export async function getWorkoutSessionForDay(
  programId: string,
  weekNumber: number,
  dayName: string
): Promise<WorkoutSession | undefined> {
  return db.workoutSessions
    .where('[programId+weekNumber+dayName]')
    .equals([programId, weekNumber, dayName])
    .first();
}

export async function getRecentWorkoutSessions(limit: number = 10): Promise<WorkoutSession[]> {
  return db.workoutSessions
    .orderBy('date')
    .reverse()
    .limit(limit)
    .toArray();
}

// Get last logged data for a specific exercise (for regular exercises)
// Returns all sets from the previous workout for this exercise
export async function getLastExerciseSets(
  exerciseName: string,
  programId?: string
): Promise<{ sets: Array<{ weight: number; reps: number; notes?: string }>; exerciseNotes?: string } | null> {
  const query = programId
    ? db.workoutSessions.where('programId').equals(programId)
    : db.workoutSessions;

  const sessions = await query.reverse().sortBy('date');

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exercise.exerciseName === exerciseName && exercise.sets.length > 0) {
        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length > 0) {
          return {
            sets: completedSets.map(s => ({
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

// ============ User Settings API ============

const USER_SETTINGS_ID = 'user-settings';

export async function getUserSettings(): Promise<UserSettings> {
  const settings = await db.userSettings.get(USER_SETTINGS_ID);

  if (!settings) {
    // Return defaults
    return {
      weightIncrement: 2.5,
      unit: 'kg',
    };
  }

  return settings;
}

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
  const current = await getUserSettings();

  await db.userSettings.put({
    ...current,
    ...settings,
    id: USER_SETTINGS_ID,
  });
}

// ============ Database Utilities ============

export async function clearAllData(): Promise<void> {
  await db.programs.clear();
  await db.workoutSessions.clear();
  await db.userSettings.clear();
}

export { db };
