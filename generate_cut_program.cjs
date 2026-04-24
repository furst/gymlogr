const fs = require('fs');

const weekTemplate = {
  days: [
    {
      name: "Mon - Lower",
      exercises: [
        {
          name: "Romanian Deadlift",
          type: "regular",
          description: "First compound. Ramp-up sets, then working sets. Never to failure on this cut.",
          restTime: "2-3 min",
          targets: { sets: "3", reps: "5-8", rir: "1-2" }
        },
        {
          name: "Leg Press",
          type: "regular",
          description: "Only if knees/hips are not hurting. 2-3 working sets.",
          restTime: "60-90 sec",
          targets: { sets: "2-3", reps: "10-15", rir: "1-2" }
        },
        {
          name: "Hip Thrust",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "8-12", rir: "1-2" }
        },
        {
          name: "Seated Leg Curl",
          type: "regular",
          lastSetIntensity: "0-1 RIR if recovery is good",
          restTime: "60-90 sec",
          targets: { sets: "3", reps: "8-12", rir: "1" }
        },
        {
          name: "Leg Extension",
          type: "regular",
          description: "Pain-free mid-range only. If this irritates the knee, swap to the alternative.",
          restTime: "60-90 sec",
          targets: { sets: "3", reps: "12-15", rir: "2-3" },
          alternatives: [
            { name: "Reverse Sled Drag (4x20-30 m)" }
          ]
        },
        {
          name: "Seated Calf Raise",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "8-12", rir: "1-2" }
        },
        {
          name: "Pallof Press",
          type: "regular",
          description: "Per side.",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "10-12/side", rir: "" }
        }
      ]
    },
    {
      name: "Wed - Upper 1",
      exercises: [
        {
          name: "Bench Press",
          type: "regular",
          description: "First compound. Ramp-up sets, then working sets.",
          restTime: "2-3 min",
          targets: { sets: "3", reps: "5-8", rir: "1-2" }
        },
        {
          name: "Chest-Supported Row",
          type: "regular",
          restTime: "2-3 min",
          targets: { sets: "3", reps: "6-10", rir: "1-2" }
        },
        {
          name: "Incline DB Press",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "8-12", rir: "1-2" }
        },
        {
          name: "Neutral-Grip Pulldown",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "8-12", rir: "1-2" },
          alternatives: [
            { name: "Weighted Pull-Up" }
          ]
        },
        {
          name: "Cable Lateral Raise",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "12-20", rir: "0-1" }
        },
        {
          name: "Rope Pressdown",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "10-15", rir: "0-1" }
        },
        {
          name: "Ab Roller",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "10-15", rir: "0-1" }
        }
      ]
    },
    {
      name: "Fri - Upper 2",
      exercises: [
        {
          name: "Seated DB Shoulder Press",
          type: "regular",
          description: "First compound. Ramp-up sets, then working sets.",
          restTime: "2-3 min",
          targets: { sets: "2", reps: "5-8", rir: "1-2" },
          alternatives: [
            { name: "Machine Shoulder Press" }
          ]
        },
        {
          name: "One-Arm Cable Row",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "3", reps: "8-12", rir: "1-2" }
        },
        {
          name: "Machine Chest Press",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "8-12", rir: "1-2" }
        },
        {
          name: "Pec Deck",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "10-15", rir: "1-2" },
          alternatives: [
            { name: "Cable Fly" }
          ]
        },
        {
          name: "Lat Pulldown",
          type: "regular",
          description: "Use a different grip than Wednesday's pulldown.",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "8-12", rir: "1-2" }
        },
        {
          name: "Rear Delt Fly",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "12-20", rir: "0-1" }
        },
        {
          name: "BB Lateral Raise",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "12-20", rir: "0-1" }
        },
        {
          name: "Cable Curl",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "10-15", rir: "0-1" }
        },
        {
          name: "Overhead Rope Extension",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "10-15", rir: "0-1" }
        }
      ]
    },
    {
      name: "Sun - Low-Fatigue Support",
      exercises: [
        {
          name: "45° Back Extension",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "10-15", rir: "2" }
        },
        {
          name: "Lying Leg Curl",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "12-15", rir: "1" }
        },
        {
          name: "Standing Calf Raise",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "12-15", rir: "1-2" }
        },
        {
          name: "Tibialis Raise",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "15-20", rir: "1-2" }
        },
        {
          name: "Hip Abduction Machine",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "15-20", rir: "0-1" }
        },
        {
          name: "Cable Lateral Raise",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "15-20", rir: "0-1" }
        },
        {
          name: "Cable Curl",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "10-15", rir: "0-1" }
        },
        {
          name: "Rope Pressdown",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "10-15", rir: "0-1" }
        },
        {
          name: "Ab Crunch",
          type: "regular",
          restTime: "60-90 sec",
          targets: { sets: "2", reps: "12-15", rir: "0-1" }
        }
      ]
    }
  ]
};

const program = {
  name: "Cut - 4-Day Lower/Upper/Upper/Support",
  description: "8-week cut. Lower body never to failure. Ramp-up sets only for the first compound of the day.",
  notes: "Rest 2-3 min on the first lift or pairing, 60-90s elsewhere. Ramp-up sets only for the first compound. Lower-body compounds never to failure on this cut.",
  settings: {
    maxes: {},
    auxiliary_mapping: {}
  },
  weeks: []
};

for (let weekNum = 1; weekNum <= 8; weekNum++) {
  const week = JSON.parse(JSON.stringify(weekTemplate));
  week.week_number = weekNum;
  program.weeks.push(week);
}

fs.writeFileSync('cut-program.json', JSON.stringify(program, null, 2) + '\n');

console.log(`Generated ${program.weeks.length} weeks`);
console.log(`Days per week: ${program.weeks[0].days.length}`);
program.weeks[0].days.forEach(d => {
  console.log(`  ${d.name}: ${d.exercises.length} exercises`);
});
