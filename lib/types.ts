// Core types for the GymLogr application

// ============ Program Types ============

export interface ProgramSettings {
  maxes: Record<string, number>; // e.g., { "Squat": 200, "Bench Press": 107.5 }
  auxiliary_mapping?: Record<string, string>; // e.g., { "Front Squat": "Squat" }
}

export interface SBSConfig {
  lift_key: string; // Key to look up in sbs_settings (e.g., "Squat", "Close Grip Bench")
  intensity_week_index: number; // Which week in the intensity_schedule to use
}

export interface AlternativeExercise {
  name: string;
  link?: string; // Video/tutorial link
}

export interface RegularExerciseTargets {
  sets?: string; // Target sets (e.g., "3" or "3-4")
  reps?: string; // Target reps (e.g., "10" or "8-12")
  rir?: string; // Target RIR (e.g., "2" or "1-2")
}

export interface ExerciseDefinition {
  id?: string; // Auto-generated on upload if not provided
  name: string;
  type: 'sbs' | 'regular';
  sbs_config?: SBSConfig;
  targets?: RegularExerciseTargets; // For regular exercises: prescribed sets/reps/RIR
  lastSetIntensity?: string; // Last-Set Intensity Technique (e.g., "Drop set", "Myo-reps")
  description?: string; // Description of the exercise (from program)
  link?: string; // Video/tutorial link for main exercise
  alternatives?: AlternativeExercise[]; // Alternative exercises if machine is occupied
}

export interface WorkoutDay {
  name: string;
  exercises: ExerciseDefinition[];
}

export interface ProgramWeek {
  week_number: number;
  days: WorkoutDay[];
}

export interface Program {
  id?: string; // Generated when saved to DB
  name: string;
  description?: string;
  settings: ProgramSettings;
  weeks: ProgramWeek[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ============ Workout Logging Types ============

export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number; // Reps In Reserve (for SBS exercises)
  completed: boolean;
  notes?: string;
}

export interface ExerciseLog {
  exerciseId: string; // References ExerciseDefinition.id
  exerciseName: string;
  type: 'sbs' | 'regular';
  targetWeight?: number; // Calculated target for SBS
  targetReps?: number; // Target reps for SBS
  targetRIR?: number; // Target RIR for SBS
  setsCompleted?: number; // For SBS: total sets completed until RIR cutoff
  sets: SetLog[]; // For regular exercises: individual set logs
  notes?: string;
}

export interface WorkoutSession {
  id?: string;
  programId: string;
  weekNumber: number;
  dayName: string;
  date: Date;
  exercises: ExerciseLog[];
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
}

// ============ SBS Settings Types ============

export interface SetsPerWeekLogic {
  default_range: {
    min: number;
    max: number;
  };
  adjustment: {
    above_range: {
      action: 'increase_tm';
      value: number;
    };
    below_range: {
      action: 'decrease_tm';
      value: number;
    };
  };
}

export interface SBSSettings {
  reps_at_percent: Record<string, Record<string, number> | 'default'>;
  rir_cutoffs: Record<string, Record<string, number> | 'default'>;
  intensity_schedule: Record<string, number[] | 'default'>;
  sets_per_week_logic: Record<string, SetsPerWeekLogic | 'default'>;
}

// ============ User Settings Types ============

export interface UserSettings {
  id?: string;
  activeProgramId?: string;
  currentWeek?: number;
  currentDay?: string; // Active day name within the current week
  weightIncrement: number; // Default 2.5 for kg
  unit: 'kg' | 'lb';
}

// ============ Exercise History Types ============

export interface ExerciseHistoryEntry {
  date: Date;
  weight: number;
  reps: number;
  rir?: number;
  notes?: string;
}
