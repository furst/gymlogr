# GymLogr - Personal Strength Training Application

## Overview
A Next.js application for tracking strength training workouts, with special support for "Stronger By Science" (SBS) programming methodology.

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **UI**: shadcn/ui components, Tailwind CSS v4
- **Database**: IndexedDB via Dexie.js (designed for easy PostgreSQL migration)
- **Language**: TypeScript

## Key Concepts

### Exercise Types
1. **SBS Exercises**: Use the RIR (Reps In Reserve) model with auto-calculated weights based on:
   - User's max for the lift
   - Week-specific intensity percentage from `sbs_settings.json`
   - Target reps and RIR cutoffs
   - Sets completed (for auto-regulation)

2. **Regular Exercises**: Traditional sets/reps/weight tracking with:
   - Targets (sets, reps, RIR) defined in program JSON
   - Previous workout data shown for reference
   - Manual weight/reps logging per set

### Core Files

**Configuration:**
- `sbs_settings.json` - Static SBS logic (reps_at_percent, rir_cutoffs, intensity_schedule, sets_per_week_logic). This is the "brain" of SBS calculations. Keyed by exercise name.

**Database & Types:**
- `lib/db.ts` - IndexedDB layer with CRUD operations for programs, workout sessions, user settings
- `lib/types.ts` - TypeScript interfaces for Program, ExerciseDefinition, WorkoutSession, ExerciseLog

**SBS Logic:**
- `lib/sbs-calculations.ts` - Weight calculation, reps/RIR lookup, intensity schedules. Uses maxes directly, falls back to auxiliary_mapping only if no direct max exists.

**Components:**
- `components/sbs-exercise-card.tsx` - SBS exercise with prescription display and sets completed counter
- `components/regular-exercise-card.tsx` - Regular exercise with previous workout display and set logging

**Pages:**
- `app/page.tsx` - Main workout view with week/day navigation
- `app/programs/page.tsx` - Upload JSON programs, edit maxes, set active program
- `app/history/page.tsx` - View past workout sessions
- `app/settings/page.tsx` - User preferences (weight increment)

### Program JSON Structure
Programs are uploaded as JSON files. Exercise IDs are auto-generated if not provided.

```json
{
  "name": "Program Name",
  "settings": {
    "maxes": {
      "Squat": 200,
      "Bench Press": 107.5,
      "Incline Press": 85
    },
    "auxiliary_mapping": {
      "Push Press": "OHP"
    }
  },
  "weeks": [
    {
      "week_number": 1,
      "days": [
        {
          "name": "Day 1",
          "exercises": [
            {
              "name": "Squat",
              "type": "sbs",
              "sbs_config": {
                "lift_key": "Squat",
                "intensity_week_index": 0
              },
              "description": "Focus on depth",
              "link": "https://youtube.com/...",
              "alternatives": [{ "name": "Leg Press", "link": "..." }]
            },
            {
              "name": "Leg Curl",
              "type": "regular",
              "lastSetIntensity": "Drop set",
              "description": "Control the eccentric",
              "targets": {
                "sets": "3",
                "reps": "10-12",
                "rir": "1"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### Exercise Definition Fields
- `name`: Exercise name
- `type`: "sbs" or "regular"
- `sbs_config`: For SBS exercises - `lift_key` (lookup key in sbs_settings) and `intensity_week_index`
- `targets`: For regular exercises - sets, reps, rir (all strings, e.g., "8-12")
- `lastSetIntensity`: Optional intensity technique for last set (e.g., "Drop set", "Myo-reps")
- `description`: Form cues or notes
- `link`: Video/tutorial URL
- `alternatives`: Array of alternative exercises with optional links

### Max Lookup Logic
1. First checks `maxes[lift_key]` directly
2. Falls back to `auxiliary_mapping` only if no direct max exists
3. This allows exercises like "Incline Press" to have their own max while "Push Press" can map to "OHP"

## Development
```bash
npm run dev   # Start development server
npm run build # Build for production
```

## Weight Rounding
Default: 2.5kg increments (configurable in settings)
