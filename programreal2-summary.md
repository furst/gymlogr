### Summary of `programreal2.json` – "SBS + Jeff"

- **Program name**: SBS + Jeff
- **Description**: 21-week hypertrophy program (JSON currently defines explicit content for **weeks 1 and 2** only).
- **Structure**: 5 training days per week, combining SBS-style main lifts (auto-regulated via RIR and intensity weeks) with traditional hypertrophy accessories (fixed sets/reps/RIR, sometimes with special last-set intensifiers). For example purposes the program is only 2 weeks. It will likely last 21 weeks in reality

### Settings

- **Maxes** (assumed in kg):

  - Squat: 115
  - Bench Press: 107.5
  - Deadlift: 170
  - OHP: 62.5
  - Close Grip Bench: 95
  - Incline Press: 85

### High-level weekly structure

- **Weeks defined**: 1 and 2.
- **Days per week**: 5 (Day 1–Day 5).
- **Main SBS lifts**: Squat, Bench Press, Deadlift, OHP, Close-Grip Bench Press, Incline Press.
- **Accessory work**: Mix of legs, back, chest, delts, arms, and core using regular exercises with targets in `sets` / `reps` / `rir` strings.
- **Progression between week 1 and week 2**:
  - Exercise selection, targets, and ordering are **identical** between weeks 1 and 2.
  - Only the `intensity_week_index` for each SBS lift changes from **0 (week 1)** to **1 (week 2)**.

### Week 1 – Day-by-day

#### Day 1

- **Squat** (SBS)
  - `type`: `sbs`
  - `sbs_config`: `lift_key = "Squat"`, `intensity_week_index = 0`
  - Cue: focus on depth, chest up.
- **Leg Press** (regular)
  - Targets: 3 × 10–12 @ 1–2 RIR.
- **Lean-back Lat Pulldown** (regular)
  - Targets: 3 × 10–12 @ 1–2 RIR.
  - Alternatives: Pull-up (with video link), Lean-Back Machine Pulldown.
- **Standing Calf Raise** (regular)
  - Targets: 3 × 12–15 @ 0–2 RIR.
  - `lastSetIntensity`: Static Stretch (30s).
- **Machine Crunch (BONUS)** (regular)
  - Targets: 3 × 10–12 @ 0–1 RIR.
  - Marked as **BONUS**, implying optional extra core volume.

#### Day 2

- **Bench Press** (SBS)
  - `type`: `sbs`
  - `sbs_config`: `lift_key = "Bench Press"`, `intensity_week_index = 0`.
- **Chest-Supported Machine Row** (regular)
  - Targets: 3 × 10–12 @ 0–2 RIR.
- **Pec Deck** (regular)
  - Targets: 3 × 10–12 @ 1–2 RIR.
- **Triceps Pressdown (bar)** (regular)
  - Targets: 3 × 15–20 @ 0–1 RIR.
  - Has `intensity = "Myo-reps"` (special intensifier, not stored as `lastSetIntensity`).
- **Bayesian Curl** (regular)
  - Targets: 3 × 10–12 @ 0–1 RIR.
  - Includes detailed instructions for addressing left–right imbalances.

#### Day 3

- **Deadlift** (SBS)
  - `type`: `sbs`
  - `sbs_config`: `lift_key = "Deadlift"`, `intensity_week_index = 0`.
  - Includes video link and bracing cues.
- **Close-Grip Bench Press** (SBS)
  - `type`: `sbs`
  - `sbs_config`: `lift_key = "Close Grip Bench"`, `intensity_week_index = 0`.
- **Lying Leg Curl** (regular)
  - Targets: 3 × 10–12 @ 0–1 RIR.
  - `lastSetIntensity`: Failure + LLPs (Extend set).
- **Back Extension** (regular)
  - Targets: 3 × 8–10 @ 0–1 RIR.

#### Day 4

- **OHP** (SBS)
  - `type`: `sbs`
  - `sbs_config`: `lift_key = "OHP"`, `intensity_week_index = 0`.
  - Strict press cue (no leg drive) with video link.
- **Single-Arm DB Row** (regular)
  - Targets: 3 × 12–15 @ 0–1 RIR.
  - `lastSetIntensity`: Failure + LLPs (Extend set).
- **Cable Lateral Raise** (regular)
  - Targets: 3 × 12–15 @ 0–1 RIR.
  - `lastSetIntensity`: Myo-reps.
- **Face Pulls** (regular)
  - Targets: 3 × 12–15 @ 0–1 RIR.
- **EZ Bar Skull Crusher** (regular)
  - Targets: 3 × 12–15 @ 0–1 RIR.

#### Day 5

- **Incline Press** (SBS)
  - `type`: `sbs`
  - `sbs_config`: `lift_key = "Incline Press"`, `intensity_week_index = 0`.
  - Cue: 45° angle, controlled descent.
- **Dual-Handle Lat Pulldown** (regular)
  - Targets: 3 × 10–12 @ 1–2 RIR.
- **Hammer Curl** (regular)
  - Targets: 3 × 12–15 @ 0–1 RIR.
- **DB Concentration Curl (BONUS)** (regular)
  - Targets: 3 × 15–20 @ 0–1 RIR.
  - `lastSetIntensity`: Myo-reps.
- **Ab Wheel Rollout** (regular)
  - Targets: 3 × 12–15 @ 0–1 RIR.

### Week 2 – Day-by-day

**Week 2 mirrors Week 1** in exercise selection, ordering, descriptions, and accessory targets. The only difference is the progression of SBS intensity weeks.

- **General pattern**: For each SBS main lift, `intensity_week_index` is set to **1** instead of **0**, indicating the second week in the SBS intensity schedule.

#### Day 1–5 in Week 2

- **Day 1**: Same exercises and targets as Week 1 Day 1, but:
  - **Squat** `sbs_config.intensity_week_index = 1`.
- **Day 2**: Same as Week 1 Day 2, but:
  - **Bench Press** `sbs_config.intensity_week_index = 1`.
- **Day 3**: Same as Week 1 Day 3, but:
  - **Deadlift** `sbs_config.intensity_week_index = 1`.
  - **Close-Grip Bench Press** `sbs_config.intensity_week_index = 1`.
- **Day 4**: Same as Week 1 Day 4, but:
  - **OHP** `sbs_config.intensity_week_index = 1`.
- **Day 5**: Same as Week 1 Day 5, but:
  - **Incline Press** `sbs_config.intensity_week_index = 1`.
