import type { ExerciseDefinition, Program } from "./types";

// Groups instances of the "same" exercise across all days/weeks of a program.
// Identity is templateId when present, otherwise the exercise name (legacy fallback).
//
// instance `id` (referenced by ExerciseLog.exerciseId) stays unique per occurrence —
// templates are a program-level concept that does not affect workout logs.

export interface TemplateOccurrence {
  weekIndex: number;
  dayIndex: number;
  exerciseIndex: number;
}

export interface ExerciseTemplate {
  key: string;
  templateId?: string;
  fallbackName?: string;
  representative: ExerciseDefinition;
  occurrences: TemplateOccurrence[];
}

function templateKey(exercise: ExerciseDefinition): string {
  return exercise.templateId
    ? `tid:${exercise.templateId}`
    : `name:${exercise.name}`;
}

function generateTemplateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function generateExerciseId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function groupExerciseTemplates(program: Program): ExerciseTemplate[] {
  const groups = new Map<string, ExerciseTemplate>();

  program.weeks.forEach((week, weekIndex) => {
    week.days.forEach((day, dayIndex) => {
      day.exercises.forEach((exercise, exerciseIndex) => {
        const key = templateKey(exercise);
        const occurrence: TemplateOccurrence = {
          weekIndex,
          dayIndex,
          exerciseIndex,
        };

        const existing = groups.get(key);
        if (existing) {
          existing.occurrences.push(occurrence);
        } else {
          groups.set(key, {
            key,
            templateId: exercise.templateId,
            fallbackName: exercise.templateId ? undefined : exercise.name,
            representative: exercise,
            occurrences: [occurrence],
          });
        }
      });
    });
  });

  return Array.from(groups.values());
}

// Assigns templateIds to exercises that don't have one, grouping by name so
// that legacy programs (and JSON uploads without templateIds) get treated as
// shared templates.
export function backfillTemplateIds(program: Program): Program {
  const nameToTemplateId = new Map<string, string>();

  for (const week of program.weeks) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        if (exercise.templateId && !nameToTemplateId.has(exercise.name)) {
          nameToTemplateId.set(exercise.name, exercise.templateId);
        }
      }
    }
  }

  return {
    ...program,
    weeks: program.weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => {
          if (exercise.templateId) return exercise;
          let id = nameToTemplateId.get(exercise.name);
          if (!id) {
            id = generateTemplateId();
            nameToTemplateId.set(exercise.name, id);
          }
          return { ...exercise, templateId: id };
        }),
      })),
    })),
  };
}

// Applies field updates to every instance of a template. Instance-specific
// fields (id, templateId) are preserved on each occurrence.
export function updateTemplate(
  program: Program,
  key: string,
  updates: Partial<ExerciseDefinition>
): Program {
  return {
    ...program,
    weeks: program.weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => {
          if (templateKey(exercise) !== key) return exercise;
          return {
            ...exercise,
            ...updates,
            id: exercise.id,
            templateId: exercise.templateId,
          };
        }),
      })),
    })),
  };
}

export function deleteTemplate(program: Program, key: string): Program {
  return {
    ...program,
    weeks: program.weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        exercises: day.exercises.filter(
          (exercise) => templateKey(exercise) !== key
        ),
      })),
    })),
  };
}

// Inserts a new exercise into the selected (week, day) slots, all sharing one
// fresh templateId. Each insertion gets a unique instance id.
export function addTemplateToSlots(
  program: Program,
  exercise: Omit<ExerciseDefinition, "id" | "templateId">,
  slots: Array<{ weekIndex: number; dayIndex: number }>
): Program {
  const newTemplateId = generateTemplateId();
  const slotSet = new Set(slots.map((s) => `${s.weekIndex}:${s.dayIndex}`));

  return {
    ...program,
    weeks: program.weeks.map((week, weekIndex) => ({
      ...week,
      days: week.days.map((day, dayIndex) => {
        if (!slotSet.has(`${weekIndex}:${dayIndex}`)) return day;
        const newExercise: ExerciseDefinition = {
          ...exercise,
          id: generateExerciseId(),
          templateId: newTemplateId,
        };
        return { ...day, exercises: [...day.exercises, newExercise] };
      }),
    })),
  };
}
