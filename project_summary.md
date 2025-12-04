I want to build a personal strength training application focused on "Stronger By Science" (SBS) programming. The foundation is already in place(nextjs, shadui, some config/example files). We should support both sbs exercises(RIR model) and normal exercies(sets, reps and a note on each exercise). On the non-SBS exercises we should show the previous weight etc. when doing the exercise next time. Database for now should be indexeddb but later we should be able to move easily to postgres. Programs should be uploaded with json and stored. The SBS configuration is in the sbs_settings.json file and we support different settings based on exercise(it maps to the program). verify_calculations.js is to verify SBS calcs against the real sheet. Note that the program also includes max weights that we base calcs on.

**`sbs_settings.json`**: Defines the "brain" of the progression logic.

- **Per-Exercise Configuration**: Logic is keyed by exercise name (e.g., "Squat", "Close Grip Bench"). This should be static and not uploaded by the user.
- **Components**:
  - `reps_at_percent`: Lookup table for Rep targets based on intensity.
  - `rir_cutoffs`: RIR targets based on intensity.
  - `intensity_schedule`: The week-by-week % of 1RM progression.
  - `sets_per_week_logic`: Rules for auto-regulating volume (increasing/decreasing sets).
