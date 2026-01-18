import { z } from "zod";

// Alternative exercise schema
const AlternativeExerciseSchema = z.object({
  name: z.string().min(1, "Alternative exercise name is required"),
  link: z.string().url().optional().or(z.literal("")),
});

// Regular exercise targets schema
const RegularExerciseTargetsSchema = z.object({
  sets: z.string().optional(),
  reps: z.string().optional(),
  rir: z.string().optional(),
});

// SBS config schema
const SBSConfigSchema = z.object({
  lift_key: z.string().min(1, "lift_key is required for SBS exercises"),
  intensity_week_index: z.number().int().min(0, "intensity_week_index must be >= 0"),
});

// Exercise definition schema with type-based validation
const ExerciseDefinitionSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Exercise name is required"),
    type: z.enum(["sbs", "regular"], {
      message: "Exercise type must be 'sbs' or 'regular'",
    }),
    sbs_config: SBSConfigSchema.optional(),
    targets: RegularExerciseTargetsSchema.optional(),
    lastSetIntensity: z.string().optional(),
    description: z.string().optional(),
    link: z.string().url().optional().or(z.literal("")),
    alternatives: z.array(AlternativeExerciseSchema).optional(),
    restTime: z.string().optional(),
  })
  .refine(
    (data) => {
      // SBS exercises should have sbs_config
      if (data.type === "sbs" && !data.sbs_config) {
        return false;
      }
      return true;
    },
    {
      message: "SBS exercises must have sbs_config with lift_key and intensity_week_index",
      path: ["sbs_config"],
    }
  );

// Workout day schema
const WorkoutDaySchema = z.object({
  name: z.string().min(1, "Day name is required"),
  exercises: z
    .array(ExerciseDefinitionSchema)
    .min(1, "Each day must have at least one exercise"),
});

// Program week schema
const ProgramWeekSchema = z.object({
  week_number: z.number().int().min(1, "Week number must be >= 1"),
  days: z.array(WorkoutDaySchema).min(1, "Each week must have at least one day"),
});

// Program settings schema
const ProgramSettingsSchema = z.object({
  maxes: z
    .record(z.string(), z.number().positive("Max values must be positive numbers"))
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "At least one max must be defined",
    }),
  auxiliary_mapping: z.record(z.string(), z.string()).optional(),
});

// Main program schema
export const ProgramSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Program name is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
  settings: ProgramSettingsSchema,
  weeks: z.array(ProgramWeekSchema).min(1, "Program must have at least one week"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Type inference from schema
export type ValidatedProgram = z.infer<typeof ProgramSchema>;

// Validation result type
export interface ValidationResult {
  success: boolean;
  data?: ValidatedProgram;
  errors?: string[];
}

/**
 * Validates a program JSON object
 * Returns a ValidationResult with either the validated data or error messages
 */
export function validateProgram(data: unknown): ValidationResult {
  const result = ProgramSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Format error messages for user display
  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join(" > ");
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return {
    success: false,
    errors,
  };
}

/**
 * Validates that all SBS exercises have their lift_keys defined in maxes or auxiliary_mapping
 */
export function validateLiftKeys(
  program: ValidatedProgram
): { valid: boolean; missingKeys: string[] } {
  const missingKeys: string[] = [];
  const { maxes, auxiliary_mapping } = program.settings;

  for (const week of program.weeks) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        if (exercise.type === "sbs" && exercise.sbs_config) {
          const liftKey = exercise.sbs_config.lift_key;
          const hasDirectMax = liftKey in maxes;
          const hasMappedMax =
            auxiliary_mapping &&
            liftKey in auxiliary_mapping &&
            auxiliary_mapping[liftKey] in maxes;

          if (!hasDirectMax && !hasMappedMax) {
            if (!missingKeys.includes(liftKey)) {
              missingKeys.push(liftKey);
            }
          }
        }
      }
    }
  }

  return {
    valid: missingKeys.length === 0,
    missingKeys,
  };
}
