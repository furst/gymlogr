## Program Summary: SBS + Hyper

**Name:** SBS + hyper  
**Description:** Strong by science + hypertrophy program (SBS + Jeff Nippard–style hypertrophy with some tweaks). This only contains 1 week but will later be around 12 weeks.

### Settings

- **Training maxes**
  - **Squat:** 115 kg  
  - **Bench Press:** 112.5 kg  
  - **Deadlift:** 170 kg  
  - **Overhead Press (OHP):** 62.5 kg  
  - **Close Grip Bench:** 100 kg  
  - **Incline Press:** 85 kg   

> **Note:** Exercises with `"type": "sbs"` are main strength lifts whose exact set/rep/intensity prescription is handled by an external SBS system using the above maxes and `intensity_week_index`. Accessories (`"type": "regular"`) define sets/reps and RIR directly below.

---

## Week 1 Overview

The program defines **Week 1** with **5 training days**.

### Day 1 – Squat + Lower / Back / Calves / Abs

- **Squat** – `sbs` (main strength lift)  
  - **Config:** `lift_key: Squat`, `intensity_week_index: 0`  
  - **Cue:** Focus on depth, keep chest up.

- **Leg Press** – regular hypertrophy  
  - **Targets:** 3 sets × 10–12 reps, RIR 1–2  
  - **Notes:** Controlled negative, explode on the positive.

- **Lean-back Lat Pulldown** – back width  
  - **Targets:** 3 sets × 10–12 reps, RIR 1–2  
  - **Notes:** Start upright, lean back 15–30° as you pull, touch bar softly to chest.  
  - **Alternatives:** Pull-up; Lean-back machine pulldown.

- **Standing Calf Raise** – calves  
  - **Targets:** 3 sets × 12–15 reps, RIR 0–2  
  - **Last-set intensity:** Static stretch 30s  
  - **Notes:** 1–2 s pause at bottom; think about “rolling” on the balls of the feet.

- **Machine Crunch (Bonus)** – abs  
  - **Targets:** 3 sets × 10–12 reps, RIR 0–1  
  - **Notes:** Round lower back, focus on ab mind–muscle connection.

---

### Day 2 – Bench + Push/Pull (Chest, Back, Arms)

- **Bench Press** – `sbs` (main strength lift)  
  - **Config:** `lift_key: Bench Press`, `intensity_week_index: 0`  

- **Chest-Supported Machine Row** – upper back  
  - **Targets:** 3 sets × 10–12 reps, RIR 0–2  
  - **Notes:** Elbows ~45°, hard scap squeeze at top.  
  - **Link:** `youtube.com/watch?si=ADBJRkNSajLiVayN&v=ijsSiWSzYw0&feature=youtu.be`

- **Pec Deck** – chest  
  - **Targets:** 3 sets × 10–12 reps, RIR 0–2  
  - **Notes:** Focus on bringing elbows together, not hands.

- **Triceps Pressdown (bar)** – triceps  
  - **Targets:** 3 sets × 15–20 reps, RIR 0–1  
  - **Last-set intensity:** Myo-reps every other week  
  - **Notes:** Emphasize triceps squeeze to move weight.

- **Bayesian Curl** – biceps  
  - **Targets:** 3 sets × 10–12 reps, RIR 0–1  
  - **Last-set intensity:** Myo-reps every other week  
  - **Notes:**  
    - If asymmetry: do 1 arm at a time, start with weaker side to RIR target, then match reps with stronger side.  
    - If no imbalance: do both arms together.

---

### Day 3 – Deadlift + Hamstrings/Glutes + Biceps

- **Deadlift** – `sbs` (main strength lift)  
  - **Config:** `lift_key: Deadlift`, `intensity_week_index: 0`  
  - **Notes:** Brace, push through floor, hips/shoulders rise together.  
  - **Link:** `https://www.youtube.com/watch?v=op9kVnSso6Q`

- **Lying Leg Curl** – hamstrings  
  - **Targets:** 3 sets × 10–12 reps, RIR 0–1  
  - **Last-set intensity:** Failure + LLPs (extended set) every other week  
  - **Notes:** Max stretch at bottom, avoid hips/butt lifting.

- **Back Extension** – posterior chain  
  - **Targets:** 3 sets × 8–10 reps, RIR 0–1  
  - **Notes:** Squeeze glutes at top, slow negative, explosive positive.

- **Hammer Curl** – biceps/brachialis  
  - **Targets:** 3 sets × 12–15 reps, RIR 0–1  
  - **Notes:** Squeeze handle hard, smooth controlled reps.

- **DB Concentration Curl** – biceps  
  - **Targets:** 3 sets × 15–20 reps, RIR 0–1  
  - **Last-set intensity:** Myo-reps every other week  
  - **Notes:** Strong mind–muscle connection, controlled reps.

---

### Day 4 – OHP + Upper Back/Delts/Triceps

- **OHP (Overhead Press)** – `sbs` (main strength lift)  
  - **Config:** `lift_key: OHP`, `intensity_week_index: 0`  
  - **Notes:** Strict press, no leg drive, full lockout.  
  - **Link:** `https://www.youtube.com/watch?v=2yjwXTZQDDI`

- **Single-Arm DB Row** – lats/upper back  
  - **Targets:** 3 sets × 12–15 reps, RIR 0–1  
  - **Last-set intensity:** Failure + LLPs every other week  
  - **Notes:** Elbows ~45°, smooth, controlled reps.

- **Cable Lateral Raise** – lateral delts  
  - **Targets:** 3 sets × 12–15 reps, RIR 0–1  
  - **Last-set intensity:** Myo-reps  
  - **Notes:** Focus on lateral delt squeeze.

- **Face Pulls** – rear delts/upper back  
  - **Targets:** 3 sets × 12–15 reps, RIR 0–1  
  - **Notes:** Emphasis on upper back / rear delt squeeze (cue text is slightly garbled in JSON).

- **Overhead Cable Triceps Extension (Bar)** – triceps  
  - **Targets:** 3 sets × 10–12 reps, RIR 0–1  
  - **Notes:** Optional 0.5–1 s pause in stretched position.

---

### Day 5 – Incline + Close-Grip + Back/Legs/Abs

- **Incline Press** – `sbs` (main strength lift)  
  - **Config:** `lift_key: Incline Press`, `intensity_week_index: 0`  
  - **Notes:** ~45° bench angle, controlled descent.

- **Close-Grip Bench Press** – `sbs` (secondary strength lift)  
  - **Config:** `lift_key: Close Grip Bench`, `intensity_week_index: 0`  

- **Dual-Handle Lat Pulldown** – back  
  - **Targets:** 3 sets × 10–12 reps, RIR 1–2  
  - **Notes:** Lean back ~15°, drive elbows down, mix of lats and mid-traps.

- **Leg Extension** – quads  
  - **Targets:** 3 sets × 10–12 reps, RIR 0–2  
  - **Last-set intensity:** Myo-reps every other week  
  - **Notes:** Seat back far, pull butt into seat, 2–3 s negatives, focus on quad stretch.

- **Ab Wheel Rollout** – core  
  - **Targets:** 3 sets × 12–15 reps, RIR 0–1  
  - **Notes:** Use abs (not just hip hinge), control ROM, progress ROM over time if needed.


