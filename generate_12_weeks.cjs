const fs = require('fs');

// Read the original program
const program = JSON.parse(fs.readFileSync('programreal2.json', 'utf8'));

// Get week 1 as the template
const week1Template = program.weeks[0];

// Generate 12 weeks
const weeks = [];

for (let weekNum = 1; weekNum <= 12; weekNum++) {
  // Deep clone week 1
  const newWeek = JSON.parse(JSON.stringify(week1Template));
  
  // Update week number
  newWeek.week_number = weekNum;
  
  // Update intensity_week_index for all SBS exercises
  // Week 1 = index 0, Week 2 = index 1, ..., Week 12 = index 11
  const intensityIndex = weekNum - 1;
  
  for (const day of newWeek.days) {
    for (const exercise of day.exercises) {
      if (exercise.type === 'sbs' && exercise.sbs_config) {
        exercise.sbs_config.intensity_week_index = intensityIndex;
      }
    }
  }
  
  weeks.push(newWeek);
}

// Update the program with all 12 weeks
program.weeks = weeks;

// Write the updated program
fs.writeFileSync('programreal2.json', JSON.stringify(program, null, 2) + '\n');

console.log('Successfully generated 12 weeks!');
console.log('\nSummary:');
console.log(`- Total weeks: ${weeks.length}`);

// Count SBS exercises per week
const sbsExercises = week1Template.days.flatMap(day => 
  day.exercises.filter(ex => ex.type === 'sbs')
);
console.log(`- SBS exercises per week: ${sbsExercises.length}`);
console.log(`- SBS exercise names: ${sbsExercises.map(ex => ex.name).join(', ')}`);

// Verify intensity indices
console.log('\nIntensity week index mapping:');
for (let i = 0; i < weeks.length; i++) {
  const week = weeks[i];
  const firstSbsExercise = week.days[0].exercises.find(ex => ex.type === 'sbs');
  if (firstSbsExercise) {
    console.log(`  Week ${week.week_number}: intensity_week_index = ${firstSbsExercise.sbs_config.intensity_week_index}`);
  }
}

