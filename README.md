# GymLogr

A personal strength training application built with Next.js, featuring special support for the "Stronger By Science" (SBS) programming methodology with auto-regulated training.

## Features

- **SBS Auto-Regulation**: Automatically calculates weights based on your training max, week intensity, and performance
- **Regular Exercise Tracking**: Traditional sets/reps/weight logging with targets and previous workout reference
- **Program Management**: Upload custom programs via JSON or create them in the UI
- **Workout History**: View and review past workout sessions
- **Offline-First**: All data stored locally in IndexedDB (works without internet)
- **Configurable**: Adjust weight increments and other settings to match your gym's equipment

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: shadcn/ui components, Tailwind CSS v4
- **Database**: IndexedDB via Dexie.js
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gymlogr.git
cd gymlogr

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

### 1. Create or Import a Program

Go to the **Programs** page to either:
- **Create a new program** using the UI builder
- **Upload a JSON file** with your program definition

An example program is available at [`example-program.json`](./example-program.json).

### 2. Set Your Training Maxes

On the Programs page, edit the training maxes for each lift. These are used to calculate your working weights for SBS exercises.

### 3. Start Training

Navigate to the main page, select your week and day, and start logging your workout.

## Program JSON Format

Programs are defined as JSON files with the following structure:

```json
{
  "name": "My Program",
  "description": "Optional program description",
  "settings": {
    "maxes": {
      "Squat": 200,
      "Bench Press": 100,
      "Deadlift": 220
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
          "name": "Day 1 - Lower",
          "exercises": [...]
        }
      ]
    }
  ]
}
```

### Exercise Types

#### SBS Exercises (Auto-Regulated)

For exercises using the Stronger By Science methodology:

```json
{
  "name": "Squat",
  "type": "sbs",
  "sbs_config": {
    "lift_key": "Squat",
    "intensity_week_index": 0
  },
  "description": "Focus on depth",
  "link": "https://youtube.com/...",
  "alternatives": [
    { "name": "Leg Press", "link": "..." }
  ]
}
```

- `lift_key`: The key to look up in `settings.maxes` for weight calculation
- `intensity_week_index`: Which week of the intensity schedule to use (0-based)

#### Regular Exercises

For traditional sets/reps exercises:

```json
{
  "name": "Leg Curl",
  "type": "regular",
  "targets": {
    "sets": "3",
    "reps": "10-12",
    "rir": "2"
  },
  "lastSetIntensity": "Drop set",
  "description": "Control the eccentric"
}
```

- `targets`: Target sets, reps, and RIR (Reps In Reserve)
- `lastSetIntensity`: Optional intensity technique for the last set (e.g., "Drop set", "Myo-reps")

### Exercise Fields Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Exercise name |
| `type` | `"sbs"` \| `"regular"` | Yes | Exercise type |
| `sbs_config` | object | For SBS | SBS configuration (lift_key, intensity_week_index) |
| `targets` | object | For Regular | Target sets, reps, and RIR |
| `description` | string | No | Form cues or notes |
| `link` | string | No | Video/tutorial URL |
| `lastSetIntensity` | string | No | Last set intensity technique |
| `alternatives` | array | No | Alternative exercises with optional links |
| `restTime` | string | No | Rest time between sets |

### Training Maxes

The `settings.maxes` object maps lift names to training max weights:

```json
{
  "maxes": {
    "Squat": 200,
    "Bench Press": 100,
    "Deadlift": 220,
    "OHP": 60
  }
}
```

#### Auxiliary Mapping

For exercises that should use another lift's max:

```json
{
  "auxiliary_mapping": {
    "Push Press": "OHP",
    "Close Grip Bench": "Bench Press"
  }
}
```

The system first checks for a direct max, then falls back to auxiliary mapping. This allows exercises like "Incline Press" to have their own max while "Push Press" can map to "OHP".

## How SBS Auto-Regulation Works

SBS exercises calculate weights based on:

1. **Training Max**: Your max for that lift
2. **Intensity Schedule**: A percentage that varies by week (e.g., 70%, 75%, 80%)
3. **Reps at Percentage**: How many reps you should hit at that intensity
4. **RIR Cutoffs**: Target Reps In Reserve for auto-regulation

As you complete sets, the app tracks your progress and can suggest training max adjustments based on your performance.

## Configuration

### Weight Increments

By default, weights are rounded to 2.5kg increments. You can change this in **Settings** to match your gym's available plates.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
