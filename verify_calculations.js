const fs = require('fs');
const path = require('path');

const programPath = '/Users/andreas/Documents/projects/gymlogr3/program.json';
const settingsPath = '/Users/andreas/Documents/projects/gymlogr3/sbs_settings.json';

const program = JSON.parse(fs.readFileSync(programPath, 'utf8'));
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

function roundToNearest(value, step) {
    return Math.round(value / step) * step;
}

function verifyExercise(exerciseName, liftKey, maxKey, expectedIntensities) {
    console.log(`\nVerifying ${exerciseName} (Lift Key: ${liftKey}, Max Key: ${maxKey})...`);

    const max = program.settings.maxes[maxKey];
    console.log(`Max: ${max}`);

    // Resolve intensity schedule
    let schedule = settings.intensity_schedule[liftKey];
    if (schedule === 'default') {
        schedule = settings.intensity_schedule['default'];
    }

    // Resolve Reps (just to check lookup works)
    let repsTable = settings.reps_at_percent[liftKey];
    if (repsTable === 'default') {
        repsTable = settings.reps_at_percent['default'];
    }
    console.log(`Reps at 50%: ${repsTable['50.0']}`);

    console.log('Week | Intensity | Raw Calc | Rounded (2.5) | Expected | Match?');
    console.log('-----|-----------|----------|---------------|----------|-------');

    for (let i = 0; i < expectedIntensities.length; i++) {
        const intensity = schedule[i];
        const raw = max * intensity;
        const rounded = roundToNearest(raw, 2.5);
        const expected = expectedIntensities[i];
        const isMatch = rounded === expected;

        console.log(`${i + 1}    | ${intensity.toFixed(3)}     | ${raw.toFixed(3)}   | ${rounded.toFixed(1)}          | ${expected}       | ${isMatch ? '✅' : '❌'}`);
    }
}

// 1. Verify Bench Press (Standard)
// Expected: 75, 80, 85 (based on 107.5 max and default schedule: 0.70, 0.75, 0.80)
verifyExercise('Bench Press', 'Bench Press', 'Bench Press', [75, 80, 85]);

// 2. Verify Close Grip Bench (Custom Logic)
// Max is 107.5 (mapped to Bench Press)
// Schedule is custom: 0.60, 0.65, 0.70
// Expected: 
// Week 1: 107.5 * 0.60 = 64.5 -> 65
// Week 2: 107.5 * 0.65 = 69.875 -> 70
// Week 3: 107.5 * 0.70 = 75.25 -> 75
verifyExercise('Close Grip Bench', 'Close Grip Bench', 'Bench Press', [65, 70, 75]);
