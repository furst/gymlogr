import type { SBSSettings, ProgramSettings } from './types';
import sbsSettingsJson from '../sbs_settings.json';

const sbsSettings = sbsSettingsJson as SBSSettings;

// Round weight to nearest increment (default 2.5kg)
export function roundWeight(weight: number, increment: number = 2.5): number {
  return Math.round(weight / increment) * increment;
}

// Resolve a setting value (handles "default" references)
function resolveSettingValue<T>(
  settings: Record<string, T | 'default'>,
  key: string
): T {
  const value = settings[key] ?? settings['default'];
  if (value === 'default') {
    return settings['default'] as T;
  }
  return value as T;
}

// Get intensity for a lift at a specific week
export function getIntensity(liftKey: string, weekIndex: number): number {
  const schedule = resolveSettingValue(sbsSettings.intensity_schedule, liftKey);

  // Clamp week index to valid range
  const index = Math.max(0, Math.min(weekIndex, schedule.length - 1));
  return schedule[index];
}

// Get target reps for a given intensity percentage
export function getTargetReps(liftKey: string, intensityPercent: number): number {
  const repsTable = resolveSettingValue(sbsSettings.reps_at_percent, liftKey);

  // Convert intensity to percentage key format (e.g., 0.70 -> "70.0")
  const percentKey = (intensityPercent * 100).toFixed(1);

  // Direct lookup
  if (repsTable[percentKey] !== undefined) {
    return repsTable[percentKey];
  }

  // Find the closest matching percentage (floor)
  const percentages = Object.keys(repsTable)
    .map(Number)
    .filter(p => !isNaN(p))
    .sort((a, b) => a - b);

  const targetPercent = intensityPercent * 100;
  let closestPercent = percentages[0];

  for (const p of percentages) {
    if (p <= targetPercent) {
      closestPercent = p;
    } else {
      break;
    }
  }

  return repsTable[closestPercent.toFixed(1)] ?? 5;
}

// Get target RIR for a given intensity percentage
export function getTargetRIR(liftKey: string, intensityPercent: number): number {
  const rirTable = resolveSettingValue(sbsSettings.rir_cutoffs, liftKey);

  const percentKey = (intensityPercent * 100).toFixed(1);

  if (rirTable[percentKey] !== undefined) {
    return rirTable[percentKey];
  }

  // Find the closest matching percentage (floor)
  const percentages = Object.keys(rirTable)
    .map(Number)
    .filter(p => !isNaN(p))
    .sort((a, b) => a - b);

  const targetPercent = intensityPercent * 100;
  let closestPercent = percentages[0];

  for (const p of percentages) {
    if (p <= targetPercent) {
      closestPercent = p;
    } else {
      break;
    }
  }

  return rirTable[closestPercent.toFixed(1)] ?? 3;
}

// Get sets per week logic for an exercise
export function getSetsPerWeekLogic(liftKey: string) {
  return resolveSettingValue(sbsSettings.sets_per_week_logic, liftKey);
}

// Calculate the working weight for an SBS exercise
export function calculateSBSWeight(
  liftKey: string,
  weekIndex: number,
  programSettings: ProgramSettings,
  weightIncrement: number = 2.5
): number {
  // First try to get the max directly for this lift
  // Only use auxiliary_mapping as fallback if no direct max exists
  let max = programSettings.maxes[liftKey];

  if (!max && programSettings.auxiliary_mapping?.[liftKey]) {
    const mappedLift = programSettings.auxiliary_mapping[liftKey];
    max = programSettings.maxes[mappedLift];
  }

  if (!max) {
    console.warn(`No max found for lift: ${liftKey}`);
    return 0;
  }

  const intensity = getIntensity(liftKey, weekIndex);
  const rawWeight = max * intensity;

  return roundWeight(rawWeight, weightIncrement);
}

// Get full SBS prescription for an exercise
export interface SBSPrescription {
  weight: number;
  intensity: number;
  targetReps: number;
  targetRIR: number;
  liftKey: string;
  weekIndex: number;
}

export function getSBSPrescription(
  liftKey: string,
  weekIndex: number,
  programSettings: ProgramSettings,
  weightIncrement: number = 2.5
): SBSPrescription {
  const intensity = getIntensity(liftKey, weekIndex);
  const weight = calculateSBSWeight(liftKey, weekIndex, programSettings, weightIncrement);
  const targetReps = getTargetReps(liftKey, intensity);
  const targetRIR = getTargetRIR(liftKey, intensity);

  return {
    weight,
    intensity,
    targetReps,
    targetRIR,
    liftKey,
    weekIndex,
  };
}

// Calculate TM adjustment based on weekly set count
export function calculateTMAdjustment(
  liftKey: string,
  completedSets: number
): { action: 'increase' | 'decrease' | 'maintain'; adjustmentPercent: number } {
  const logic = getSetsPerWeekLogic(liftKey);

  if (completedSets > logic.default_range.max) {
    return {
      action: 'increase',
      adjustmentPercent: logic.adjustment.above_range.value,
    };
  }

  if (completedSets < logic.default_range.min) {
    return {
      action: 'decrease',
      adjustmentPercent: logic.adjustment.below_range.value,
    };
  }

  return {
    action: 'maintain',
    adjustmentPercent: 0,
  };
}
