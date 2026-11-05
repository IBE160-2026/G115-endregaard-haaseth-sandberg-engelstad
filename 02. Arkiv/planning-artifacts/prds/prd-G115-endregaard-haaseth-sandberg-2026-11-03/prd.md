---
title: "PRD: ByggAPP — AI-driven project management simulation"
status: draft
created: 2026-11-03
updated: 2026-11-03
---

# PRD: ByggAPP — AI-driven project management simulation

*Working title. Draft for group approval. Every decision in this PRD has one of three statuses, listed in §10:*

- ***Provisional*** — *recommended solution written into the PRD, waiting for group approval;*
- ***Confirm*** — *already decided by the group earlier (source given), to be confirmed as a PRD requirement;*
- ***Open*** — *not decided.*

*In the text, decisions are tagged `[P-n · provisional]`, `[P-n · confirm]` or `[P-n · open]`.*

## 0. Document Purpose

This PRD is for the G115 group (IBE160, autumn 2026) and the examiner. It turns the product brief (`01. Admin/brief-G115-AI-prosjektledelse-simulering.md`, updated 2026-10-22, incl. Appendix A) into numbered, testable requirements, and takes in the instructor's feedback (`01. Admin/tilbakemelding-product-brief.md`, 2026-10-06). It is the input for UX, architecture and epics/stories.

Three things shape the document:

- **Releases follow the instructor's advice.** Release 1 is the minimal version: one fixed scenario (the **demo game**), two decision types, the fork and the side-by-side comparison. Releases 2 and 3 add the rest in clear steps (§7). `[P-15 · provisional]`
- **v0.5 already exists.** Every FR carries a status against the v0.5 code in `ByggAPP/src/` (checked 2026-11-03): **✅ in v0.5**, **◐ partly in v0.5**, or **○ not built**. The PRD is the requirement; v0.5 is evidence of how far it is met.
- **The PRD departs from the brief in places, and the brief has not been updated yet.** The instructor asked for the brief to be updated so the history shows how the plan changed. §7.2 lists what must change once the group has approved the decisions.

Vocabulary is fixed in §3. Technology and implementation notes are in `addendum.md`.

## 1. Vision

ByggAPP is a web-based simulation where a student plays the project owner of a construction project and makes the real decisions: how to respond to a risk, where to put the crews, which strategy to choose, whether to approve a change. An AI advisor recommends an option at every decision. After the student chooses, the simulation runs forward twice from the same state, once with the student's choice and once with the recommendation, and shows the two outcomes side by side.

That comparison is the teaching mechanic. Project management is usually taught as static artefacts (Gantt charts, WBS, risk registers). ByggAPP lets the student see how a plan actually breaks: how one week on the critical path costs site overhead, how speeding up a task with slack costs money and saves nothing, how insurance covers cost but not time. The debrief is against a reasoned benchmark, like a flight simulator, not against a fixed plan.

**The AI is a transparent, rule-based advisor, not a language model** `[P-7 · provisional]`. It scores every option with a written rule the student and the examiner can check by hand. For teaching, an advisor whose reasoning can be inspected is worth more than a black box. It also means the app needs no key and every recommendation can be tested.

The version graded in this course is one domain (construction), one scenario (*Regjeringskvartalet Light*) and rules the group has written and checked by hand. Generalising to other domains, generated scenarios, or language-model narrative is a vision, not a goal for this course (§6).

## 2. Target Users

### 2.1 Jobs To Be Done

- **The student** wants to build judgement for project decisions under uncertainty, without real construction experience, by deciding, seeing the consequence, and comparing it with a reasoned alternative.
- **The student** wants to understand *why* the advisor recommended something, not only *what* it recommended.
- **The examiner** wants to open the app, play it through unassisted, and check that the outcomes are correct against rules written down in advance.
- **The group** wants a scope that can be finished, tested and traced from brief to code within the semester.

**The student's role** `[P-17 · provisional]`: the student plays the **project owner** (Statsbygg), with Elisabeth as the project manager, as in v0.5. The brief says "project manager". The owner role fits better with an AI project manager who advises and an owner who decides and holds the budget.

### 2.2 Non-Users

- Other students or the public as an audience for this version.
- Professional project managers looking for a planning tool.
- Instructors who want to author their own scenarios.

### 2.3 Key User Journeys

- **UJ-1. Nora plays the demo game and sees where she and the advisor parted ways.** *(Release 1)*
  - **Persona + context:** Nora, second-year business student, has read about critical paths but never managed a project. She has an hour on a laptop.
  - **Entry state:** opens the app link in a browser and picks the demo game. No account, no key.
  - **Path:** reads the project brief (114 weeks, 283.10 MNOK) → approves the start-up plan → the clock runs week by week → in week 16 the ground surveys point to weathered rock (DP1). The advisor recommends *avoid* (pile foundation) and explains: if the rock is weathered, avoiding costs the least. Nora chooses *transfer* (insurance) → the comparison shows both options, with and without the rock being weathered.
  - **Climax:** the rock turns out to be weathered. Insurance covered the 6 MNOK, but the project still slipped four weeks, and four weeks of site overhead made her choice 2.4 MNOK dearer than the advisor's.
  - **Resolution:** at DP2 (week 50) she puts the office structure on overtime, as the advisor recommends. At the end, the final report lists all four decisions with their difference from the advisor, and her result against both targets.
  - **Edge case:** she disagrees with the advisor on every decision; the comparison still shows both outcomes each time, and the final report shows the total gap.

- **UJ-2. The examiner checks a decision by hand.** *(Release 1)*
  - **Persona + context:** the examiner grading portfolio part 1, with the PRD and Appendix A open.
  - **Entry state:** runs the app locally from the README, with no API key, or opens the published link.
  - **Path:** starts the demo game → at DP2 (week 50) chooses *overtime* on F → reads the comparison: 111 weeks, 282.77 MNOK → compares with worked example 1 in Appendix A → runs `npm test` and sees the same worked examples as passing tests.
  - **Climax:** the number on the screen, the number in the brief and the number in the test agree.
  - **Resolution:** the examiner trusts that the rest of the outcomes follow the same rules.

- **UJ-3. Nora plays an ordinary game and gets a different story.** *(Release 2)*
  - Nora starts an ordinary game on *hard*. The same building and targets, but different events happen, an opportunity (cheaper steel) turns up, and the advisor recommends something other than the best option about 4 times in 10. Following it blindly no longer works; she has to weigh it.

## 3. Glossary

- **Scenario** — the fixed project the game is built on: tasks, predecessors, base crews, hours, rates, materials, events and targets. There is exactly one: *Regjeringskvartalet Light* (Appendix A of the brief).
- **Task** — one discipline of work in the scenario (A, C, D … N), with predecessors, hours, base crew, hourly rate and materials. 13 tasks.
- **Base crew** — the planned number of workers on a task (Appendix A §3b). Crew changes and crowding are measured against it.
- **Foreman** — the in-game person responsible for one task. Raises events on that task. 13 foremen, one per task.
- **Targets** — the two goals the student plays against: finish within **114 weeks** and **283.10 MNOK**.
- **Game state** — everything the simulation needs to continue: current week, progress per task, crews and work modes, events that have happened, money spent. Deterministic: the same game state and choice always give the same result.
- **Seed** — the number that drives every random draw in a game (which events happen, and when the advisor is wrong). The same seed, difficulty and choices give the same game.
- **Demo game** — the Release 1 game: a fixed seed, no random events, the four decision points DP1–DP4 of Appendix A §5 in fixed weeks, and risks R1–R5 that happen or not as fixed by the demo seed. All its outcomes can be checked against Appendix A.
- **Ordinary game** — a Release 2 game: a new seed, events drawn week by week from the event library, and a difficulty.
- **Work mode** — how a task is staffed: *normal* (37.5 h/week), *overtime* (45 h/week), *extra hire* (+50 % hired workers).
- **Site overhead** (*rigg og drift*) — 0.45 MNOK per week from week 16 until handover. The mechanism that makes delay cost money.
- **Forecast** — the outcome (finish week, total cost, schedule) computed by running the game state forward to completion with no new events.
- **Event** — something that happens in a given week and needs a decision. Four kinds: *risk*, *strategy choice*, *opportunity*, *change request*. The full set of events is the **event library**.
- **Follow-up event** — an event that can only happen after a given earlier option was chosen.
- **Decision point** — the moment an event stops the clock and the student must pick one **option**. In the game it is shown as a **challenge**: the foreman stands with a «!».
- **Option** — one of the fixed choices at a decision point. The student and the advisor choose from the same options.
- **Decision type** — the category of a decision point: *risk response*, *resource allocation*, *planning strategy*, *change approval*.
- **Risk response** — one of four options for a risk in the demo game: *accept*, *mitigate*, *transfer*, *avoid* (Appendix A §5).
- **Advisor** — the rule-based AI that recommends an option at each decision point, with reasoning. In the game it speaks as Elisabeth (project manager). Hedda (site manager) and the foreman give secondary views.
- **Target score** — how far a forecast misses the targets: the relative cost overrun plus the relative schedule overrun, each counted only when above zero. 0 means both targets are met.
- **Difficulty** — easy, medium or hard. Sets how reliable the advisor is in ordinary games.
- **Fork** — running the game state forward twice from the same decision point: once with the student's option, once with the advisor's.
- **Comparison** — the side-by-side view of the two forecasts of a fork.
- **AI path** — the whole game played from the same seed with the advisor's recommendations, shown in the final report.
- **Story solution** — the same seed played with perfect information (the best option at every decision point). Shows that the seed can be won.
- **Chapter** — a phase of the game that opens when its tasks start: Groundwork, Basement, Structure, Weathertight, Services and fit-out, Handover. Chapters serve as the scenario's milestones `[P-22 · provisional]`.
- **Meeting** — the in-game scene where a decision point is presented and decided, with the foreman, Elisabeth and Hedda.
- **Final report** — the debrief at the end of a game: result against targets, the AI path, the story solution, and every decision with its difference.

## 4. Features

Release tags: **[R1]**, **[R2]**, **[R3]** (§7). Status against v0.5: ✅ / ◐ / ○.

**Rounding (applies to all FRs).** The engine computes with full precision. The UI shows MNOK with 2 decimals and weeks as whole numbers. A target counts as met when the cost rounded to 0.01 MNOK is at or below the target. Tests compare the engine's values with the brief's answers with full precision. This is how v0.5 works.

### 4.1 Scenario and simulation engine

**Description:** The engine computes everything the student sees from written rules. It is pure code with no UI and no network, so every result can be tested and checked by hand. The rules are the ones in Appendix A §3b of the brief, which is the instructor's main demand.

#### FR-1: Fixed scenario [R1] ✅

The engine loads the *Regjeringskvartalet Light* scenario: 13 tasks with predecessors, base crews, hours, hourly rates and materials as in Appendix A §3b.

**Consequences (testable):**
- The baseline forecast is exactly **114 weeks** and **283.10 MNOK**.
- The critical path is A → C → D → E → F → G → I → J → N.
- Slack is H 8, K 10, O 32 and L 50 weeks.

**Notes:** `[P-1 · open]` The office block in the game is A-blokka with 11 floors (v0.5), while Appendix A describes 7 floors. Proposal: keep the Appendix A numbers (15,000 m² BTA) as the model and treat the floor count as presentation only.

#### FR-2: Week-by-week scheduling [R1] ✅

The engine advances one week at a time. A task starts when all its predecessors are finished. Duration = ⌈hours / (workers × hours per week)⌉.

**Consequences (testable):**
- No task starts before all its predecessors are finished.
- The schedule shown in the Gantt equals the forecast.

#### FR-3: Cost model [R1] ◐

Cost = labour (hours × rate × work-mode factor) + materials + site overhead.

**Consequences (testable):**
- **Overtime:** 7.5 of 45 hours a week are overtime, at factor **1.4** `[P-2 · provisional]`. So 1/6 of the hours cost 1.4 → labour × 16/15 (≈ 1.0667).
- **Extra hire:** ⌈N/2⌉ hired workers; hired hours at factor 1.5 → labour × 1.1667 for an even N.
- Materials cost the same in every work mode.
- Site overhead is 0.45 MNOK per week from week 16 until handover.
- A delay from an event costs site overhead, but not the task's weekly rate. `[P-3 · open]`

**Notes:** ◐ because v0.5 uses overtime factor 1.3. Arbeidsmiljøloven § 10-6 requires an overtime supplement of at least 40 %, which Appendix A §7.6 already points out. Overtime of 7.5 h/week is 30 h per 4 weeks, above the act's 25 h without a written agreement, so the scenario assumes such an agreement. Changing to 1.4 changes one constant in the code, the expected values in the tests, and Appendix A's worked examples 1 and 2 (FR-7).

#### FR-4: Crew size and crowding [R2] ✅

The student can set a crew from 50 % to 200 % of the base crew, in steps of 2. Above the planned crew (the base crew, plus the planned hire share when hiring), each extra worker adds only half a worker of capacity but is paid in full. Hired workers crowd too.

**Consequences (testable):**
- F with crew 24: F takes 29 weeks, the project finishes in week 123 (+9 weeks, +4.05 MNOK site overhead).
- Base crew + extra hire gives the same result as Appendix A example 1 (108 weeks, 282.950 MNOK).

**Notes:** The crowding rule and "hired workers crowd too" are a team decision of 2026-10-22 (`ByggAPP/.docs/implementation-artifacts/spec-v0-2-interactive-simulator.md`, Spec Change Log). `[P-4 · confirm]` Write them into the brief's simulation model.

#### FR-5: Two game modes, both deterministic [R1 demo game, R2 ordinary game] ◐

`[P-18 · provisional]` The engine has two game modes on the same rules and the same event mechanism:

- **Demo game (R1).** A fixed seed and no random events. Whether R1–R5 happen is fixed by the demo seed when the game starts, as in Appendix A §4. The decision points are DP1–DP4 in the weeks of Appendix A §5.
- **Ordinary game (R2).** A new seed. Events are drawn week by week from the seed (a chance per week while the task is active), as in v0.5.

**Consequences (testable):**
- The same seed, difficulty and choices always give an identical game (identical forecasts at every week). *(✅ test.)*
- The same seed gives the same events on every difficulty. *(✅ test.)*
- In the demo game, the student's path and the AI path meet exactly the same events, whatever the choices.
- In the demo game, no event outside DP1–DP4 and R1–R5 happens.

**Notes:** ◐ because v0.5 has only the ordinary game. The reasons for the two modes are in §10 (P-18); how the demo game fits v0.5's engine is in `addendum.md` §E.

#### FR-6: Forecast [R1] ✅

At any week, the engine can run the game state forward to completion with no new events and return finish week, total cost and schedule.

**Consequences (testable):**
- Computing the forecast does not change the game state.

#### FR-7: Worked examples as tests [R1] ◐

The worked examples in Appendix A §6 are automated tests with the expected answers. With the overtime factor 1.4 (P-2), examples 1 and 2 change as shown. Extra hire does not change.

**Consequences (testable):**

| Example | Option | Weeks | MNOK (factor 1.4) | MNOK (factor 1.3, today) |
|---|---|---|---|---|
| 1 · DP2, F (critical) | Overtime | 111 | **282.770** | 282.515 |
| 1 · DP2, F (critical) | Extra hire | 108 | 282.950 | 282.950 |
| 2 · DP4, H (slack) | Overtime | 114 | **283.964** | 283.748 |
| 2 · DP4, H (slack) | Extra hire | 114 | 285.260 | 285.260 |
| 2 · DP4, I (critical) | Overtime | 112 | **282.968** | 282.776 |
| 2 · DP4, I (critical) | Extra hire | 109 | 282.770 | 282.770 |
| 3 · DP1, R1 happens | Accept / mitigate / transfer / avoid | 118 / 116 / 118 / 116 | 290.9 / 288.5 / 287.4 / 285.0 | same |
| 3 · DP1, R1 does not happen | Accept / mitigate / transfer / avoid | 114 / 114 / 114 / 116 | 283.1 / 284.6 / 285.6 / 285.0 | same |

- How the 1.4 figures are worked out: F 15.30 × 16/15 = 16.320 (+1.020), and 283.1 + 1.020 − 3 × 0.45 = 282.770. H: 12.96 × 1/15 = +0.864 → 283.964. I: 11.52 × 1/15 = +0.768, and 283.1 + 0.768 − 2 × 0.45 = 282.968. *(Hand-calculated; to be confirmed by the tests.)*
- The teaching points of Appendix A §6 still hold: overtime on the critical path pays for itself (−0.33 MNOK, −3 weeks); overtime on H costs money and gains no time.

**Notes:** v0.5 tests examples 1 and 2 with factor 1.3. Example 3 is not tested, because v0.5's weathered-rock event has other options (FR-8).

### 4.2 Decisions and the advisor

**Description:** At each decision point the clock stops, the student sees the situation, the options and the advisor's recommendation with its reasoning, and chooses. The advisor picks from the same options as the student, so both choices can be simulated with the same rules (instructor's advice, point 2).

**Where the rules live.** The instructor's main concern was that the rules must be written by the group, simple and explicit, with hand-calculated examples. Appendix A covers R1. The rules v0.5 added for R2 and R3 (crowding, strategy choices, change requests, opportunities, follow-up events, difficulty) are only in the code and the specs, and the event prices and delays in the code are marked there as proposals for the team to check. `[P-19 · provisional]` Write them as a new appendix to the brief (Appendix B: event library and R2 rules), with at least one hand-calculated example per event kind, and have the group review the event prices there.

#### FR-8: Risk response decisions [R1] ◐

In the demo game, at a risk decision point the student chooses one of four risk responses: *accept*, *mitigate*, *transfer*, *avoid*. Each has an upfront cost and a defined effect if the risk happens.

**Consequences (testable):**
- DP1 (week 16, R1 weathered rock, task D) and DP3 (week 70, R3 facade delivery, task G) come in every demo game.
- R1 prices follow example 3: *accept* costs nothing; *mitigate* 1.5 MNOK and halves the impact (+2 weeks, +3 MNOK); *transfer* 2.5 MNOK and covers the cost but not the delay (+4 weeks); *avoid* +2 weeks and +1 MNOK, and the risk is removed.
- The totals equal example 3 (FR-7).
- In ordinary games (R2), each risk keeps its own options from the event library. For example, weathered rock offers new foundations (6 MNOK, +4 weeks), grouting and bolting (3.5, +2) or redesign to piles (2, +3).

**Notes:** ◐ because v0.5 has only the ordinary-game version (FR-5). `[P-5 · open]` Prices for the four risk responses on R3 (needed for DP3), and on R2, R4 and R5.

#### FR-9: Resource allocation decisions [R1] ◐

In the demo game, at a resource decision point the student chooses the work mode for a task: *normal*, *overtime* or *extra hire*.

**Consequences (testable):**
- DP2 (week 50, F on the critical path): options normal, overtime and extra hire on F. The outcomes equal example 1 (FR-7).
- DP4 (week 84): options overtime or extra hire on H, overtime or extra hire on I, or no change. The outcomes equal example 2 (FR-7).
- Both are forked and compared like every other decision point (FR-16).
- In every game, the student can also change work mode and crew in the Disciplines panel and at staffing reviews. *(✅ in v0.5.)*

**Notes:** ◐ because v0.5 has no decision point for DP2 and DP4. The calculation exists and is tested.

#### FR-10: Planning strategy decisions [R2] ✅

In ordinary games, when tasks C, F, H and N become ready, a strategy decision point always comes, with 2–4 options (for example prefabricated or cast-in-place for F).

**Consequences (testable):**
- Exactly four strategy events, for C, F, H and N. They come every ordinary game, in the week the task becomes ready, and are not drawn by chance.
- No strategy option has a negative cost. An option that reduces the task's hours always costs something.
- Example (C): «Kjernebor og forsiktig sprengning» costs 0.9 MNOK, stalls C 2 weeks and cuts C's remaining hours by 25 %.

#### FR-11: Change approval decisions [R2] ✅

A change request (stronger security, solar panels, new floor plan, charging points) can be approved now, or deferred or declined at a higher cost later.

**Consequences (testable):**
- Every change request has an option that costs 0 now and has a later consequence with a cost above 0.
- At least three change requests in the event library (v0.5 has four).

#### FR-12: Advisor recommendation [R1] ✅

The advisor recommends one option at every decision point, with reasoning: what it expects to happen to time and cost, and why.

**Rule** `[P-6 · confirm]` (team decision 2026-10-22, v0.2 spec change log): for each option, the advisor computes the forecast after that option (FR-6) and its **target score** (§3). The best option is the one with the lowest target score; ties go to the lower total cost, then the fewer weeks, then option order.

**What the weighting means:** the rule does not weight cost against time; the targets do. One week over the target is 1/114 ≈ 0.88 %; one MNOK over is 1/283.1 ≈ 0.35 %. So, once both targets are exceeded, one week weighs about as much as 2.5 MNOK, on top of the 0.45 MNOK site overhead the week already costs. Below both targets the score is 0 and the cheapest option wins.

**Risks that may happen** `[P-21 · provisional]`: at a risk decision point in the demo game, the advisor scores the options on the case **the risk happens**, using Appendix A's "if it happens" figures. This is planning for the risk that was reported, not betting on luck. It can be checked by hand from Appendix A example 3. At DP1 the advisor therefore recommends *avoid* (285.0 MNOK, 116 weeks).

**Consequences (testable):**
- The recommendation is always one of the options offered to the student.
- On easy, and always in the demo game, the recommendation is the option with the lowest target score.
- The advisor does not know whether a future event will happen: it scores on the forecast, which assumes no new events, except for the reported risk at a risk decision point (P-21).
- The same game state always gives the same recommendation.
- Example (ordinary game): «Vann i kjeller» in week 40 while E is active → the advisor recommends «Installer fast pumpe» (+2 weeks, +0.80 + 2 × 0.45 = +1.70 MNOK). *(✅ test.)*
- Example (demo game): DP1 → *avoid*; DP2 → overtime on F (lowest target score, cheaper than extra hire with 1.4). *(○ to be tested.)*

**Notes:** In ordinary games, a decision on a risk that has already happened is scored on its known effect, as in v0.5. P-21 only concerns the demo game's risk decision points, where the risk is reported before it is known.

#### FR-13: Second opinions [R2] ✅

Besides the advisor, two more views are given at every decision point. Hedda (site manager) recommends the option with the fewest weeks. The foreman recommends the option with the lowest cost now. The student sees the foreman's view only as input passed on by Elisabeth and Hedda.

**Consequences (testable):**
- Hedda's option has the lowest forecast finish week; ties go to the lower total cost, then option order.
- The foreman's option has the lowest upfront cost; ties go to the lower total cost, then option order.
- Example: «Vann i kjeller» → Elisabeth «Installer fast pumpe», Hedda «Installer fast pumpe», foreman E «Lei midlertidig pumpe». *(✅ test.)*

#### FR-14: Difficulty [R2] ✅

In ordinary games, the student picks easy, medium or hard. Difficulty sets how reliable the advisor is. The demo game always uses easy, so its recommendations can be checked against Appendix A.

**Rule (as in v0.5):** at every decision point, a draw from the seed decides whether the advisor recommends the best option (FR-12). The chance is 1.0 on easy, 0.8 on medium and 0.6 on hard. Otherwise it recommends one of the other options, chosen by a second draw from the seed.

**Consequences (testable):**
- Easy: over 60 seeds, the recommendation at «Vann i kjeller» is always the best option. *(✅ test.)*
- Hard: over the same 60 seeds, at least one recommendation is not the best option. *(✅ test.)*
- The same seed and difficulty always give the same recommendations.
- The final report shows the difficulty.

**Notes:** On medium and hard, the advisor is sometimes wrong on purpose. The comparison then teaches the student to weigh advice, not to follow it.

#### FR-15: Rule-based advisor, no language model [R1] ✅

The advisor and all other AI roles are rule-based. The app makes no calls to a language model. `[P-7 · provisional]`

**Consequences (testable):**
- The app runs end to end with no network access beyond loading its own files.
- Every recommendation can be reproduced from the rule in FR-12 and the forecast.

**Notes:** This replaces the brief's LLM layer (generated scenario narrative, novel risk events, LLM advisor). It answers the instructor's three points: no model or cost to choose, no key for the examiner, and testable recommendations. The instructor also advised deferring the LLM until the core works. Variation between games comes from seeds instead (FR-32). Why this is still an AI advisor: see §1 and `addendum.md` §B.

### 4.3 Fork and comparison

**Description:** The core mechanic. After each choice, the student sees what happened with their choice next to what would have happened with the advisor's, both computed from the same state.

#### FR-16: Fork at every decision [R1] ✅

After the student chooses, the engine forecasts from the same game state twice: with the student's option and with the advisor's option.

**Consequences (testable):**
- Both forecasts start from an identical game state and see the same events.
- If the student chose the advisor's option, the two forecasts are identical, and the comparison says so.
- Every fork is recorded for the final report. *(✅ test.)*
- At a risk decision point in the demo game, the comparison shows both forecasts for both cases (the risk happens / does not happen), as in Appendix A example 3. When the risk's week comes, the game shows which case came true. `[P-21 · provisional]`

#### FR-17: Side-by-side comparison [R1] ✅

The comparison shows, for both forecasts, finish week and total cost against the targets, the difference between them, and the revised schedule and budget (before → after).

**Consequences (testable):**
- The difference is shown as a single short line (for example "+2 weeks · +1.70 MNOK").
- The student can see whether they followed the advisor or not.

**Notes:** The instructor asked how two Gantt charts and cost figures can be shown together without clutter (assessment criterion 4). v0.5 shows before → after numbers and one Gantt. `[P-8 · open]` Keep it that way and do not show two full Gantt charts side by side. The sketch of this screen belongs in the UX step (`bmad-ux`).

#### FR-18: Option previews [R2] ✅

Before choosing, each option shows its cost now, its delay, any later consequence, its forecast as one short change, and which of the three roles back it.

**Consequences (testable):**
- Every option shows its forecast finish week and total cost, computed as in FR-12.
- An option with a later consequence shows its cost and the number of weeks until it lands.
- The roles shown as backing an option are exactly the roles whose recommendation it is (FR-12, FR-13).

### 4.4 Outputs

All outputs are computed from the forecast (FR-6). They show the current forecast after every decision, and after every crew or work-mode change, including while a decision point is open.

#### FR-19: Gantt schedule [R1] ✅

A Gantt chart of all tasks from the forecast, with the critical path marked.

**Consequences (testable):**
- Every task's start and finish in the Gantt equal the forecast.
- The tasks marked as critical are exactly the forecast's critical path.
- After a decision, or a crew or work-mode change, the Gantt shows the new forecast.

#### FR-20: Cost forecast [R1] ✅

A budget view with forecast total cost against the target, broken down by task and site overhead.

**Consequences (testable):**
- The sum of the tasks and site overhead equals the forecast total.
- After a decision, or a crew or work-mode change, the view shows the new forecast.

#### FR-21: Recommended actions [R1] ✅

The advisor's recommendation and reasoning are visible at each decision point and in the final report.

**Consequences (testable):**
- At every decision point, the advisor's recommended option and a reason are shown before the student chooses.
- The final report shows, for every decision, the recommended option next to the chosen one.

#### FR-22: Scenario results / final report [R1] ✅

At the end of a game, the final report shows the result against both targets, the AI path, the story solution, and every decision with its difference from the advisor.

**Consequences (testable):**
- The AI path is the same seed played with the advisor's recommendations, including its mistakes on medium and hard.
- In the demo game, the AI path meets the same events as the student (FR-5).
- The final report shows the seed, the game mode and the difficulty.
- Every recorded fork (FR-16) appears once, in order.

**Notes:** In ordinary games, the AI path can meet other events than the student (FR-5). The final report should say so.

#### FR-23: Risk exposure [R2] ○

A view of the open risks: which risks can still happen, their possible delay and cost, and which have been mitigated, transferred or avoided.

**Consequences (testable):**
- The view shows the current state after every decision.
- A risk that has happened or been closed is no longer counted as open.
- The view never reveals which risks the seed will make happen.

**Notes:** This is the only one of the five outputs in the brief that v0.5 does not show. `[P-9 · open]` Exposure = the sum of delay and cost of risks not yet happened or closed, shown per risk.

### 4.5 Running without a key

#### FR-24: Runs locally and from a link, no key [R1] ✅

Anyone can run the app locally from the README with Node.js only, or open the published link, without an API key, account or paid service.

**Consequences (testable):**
- `npm install`, `npm run dev`, `npm test` and `npm run build` work in `ByggAPP/` on a clean machine with Node.js 22.12+.

#### FR-25: Demo game [R1] ○

The start screen offers the demo game (FR-5) as its own choice. The README documents its seed and which risks happen.

**Consequences (testable):**
- DP1–DP4 come in weeks 16, 50, 70 and 84.
- Played with the advisor's recommendation at every decision point, the outcomes at DP1 and DP2 equal Appendix A examples 3 and 1.
- Two runs of the demo game with the same choices give identical final reports.

**Notes:** v0.5 has demo links that open a given event in a given week (`addendum.md` §F), but no demo game. `[P-10 · open]` Which of R1–R5 happen in the demo seed (Appendix A §7.5). UJ-1 assumes that R1 happens.

### 4.6 Game experience (3D site and story)

**Description:** v0.5 has gone well beyond the brief's interface: a full-screen 3D building site where the student walks with Elisabeth and Hedda, meetings round a 3D model of each challenge, an HMS check at the gate, a start-up meeting and staffing reviews. This makes the decisions concrete, but it is presentation: it reads the game state and never changes the rules.

#### FR-26: The 3D view only reads the game [R1] ✅

The 3D site, meetings and story layer read the game state and never change the simulation results. This requirement is in R1 even though the 3D view itself is R3: whatever view is shown, the results must not depend on it.

**Consequences (testable):**
- The same seed and choices give the same forecasts whether or not the 3D view is shown.

#### FR-27: Walkable 3D site [R3] ✅

The student walks the site, the building grows with progress, and a foreman with an open decision point stands with a «!».

**Consequences (testable):**
- When a decision point opens, the clock stops and the foreman of the affected task is marked with «!».
- The clock does not start again until the student has chosen an option.

#### FR-28: Meetings and story [R3] ✅

Each decision is made in a meeting with the foreman, Elisabeth and Hedda. The first meeting is played line by line; later meetings open on the summary. There is an HMS check at the gate, a start-up meeting, and a staffing review at each new chapter.

**Consequences (testable):**
- The first meeting of a game is played line by line; every later meeting opens on the summary.
- A staffing review opens when a new chapter starts, for the tasks in that chapter.
- The story layer's objectives and meeting scripts are covered by tests (`story.test.ts`).

#### FR-29: Opportunities and follow-up events [R3] ✅

In ordinary games: opportunities (for example cheaper steel) and follow-up events triggered by earlier choices (for example a hired pump failing). At most 9 decision points per game: the four strategy choices always come, and there is room for up to five more.

**Consequences (testable):**
- Every opportunity has one option that saves money and costs time, and one that costs nothing and keeps the plan.
- A follow-up event only happens after its earlier option was chosen. Example: the pump failure only comes after «Lei midlertidig pumpe». *(✅ test.)*
- No game has more than 9 decision points.

#### FR-30: Replay a seed [R3] ○

The student can enter a seed to replay or share an ordinary game.

**Consequences (testable):**
- Entering the seed and difficulty from a final report and making the same choices gives the same final report.

#### FR-31: Save and resume [R3] ○

`[P-11 · open]` Not needed: a full game fits in one session. Revisit if test rounds show games take longer than about an hour.

#### FR-32: Different but winnable games [R2] ✅

Each new ordinary game uses a new seed, so two games on the same difficulty meet different events. The game picks a seed whose story solution (§3) meets both targets.

**Consequences (testable):**
- Two new games normally get different seeds and different events.
- The game tries up to 40 seeds from a random start and uses the first whose story solution meets both targets. If none of the 40 does, it uses the seed whose story solution has the lowest target score.
- The final report shows the story solution.

**Notes:** This is how v0.5 meets the brief's success criterion 3 ("two playthroughs … produce recognizably different … while remaining internally coherent") without an LLM. "Internally coherent" here means that the seed can be solved within both targets. "Every game has a story solution" is a team decision of 2026-10-22 (v0.2 spec change log). The change from LLM-driven variation to seeds is part of P-7.

## 5. Cross-Cutting NFRs

- **NFR-1 Determinism.** Same seed, difficulty and choices → identical game. Applies to the engine, the advisor and the AI path, in both game modes.
- **NFR-2 Separation.** The simulation engine has no UI or network code. The story layer and 3D view only read from it (instructor: keep engine, AI layer and view apart).
- **NFR-3 Traceability.** Every rule in §4.1 and §4.2 is written in the brief (Appendix A for R1, Appendix B for R2, P-19) before it is coded, and has at least one hand-calculated example with an answer.
- **NFR-4 Testing.** Engine and advisor are covered by automated tests, including every row of FR-7. `[P-12 · open]` Add DOM tests for the click flow (pause on decision, resume after choosing), which `deferred-work.md` lists as missing.
- **NFR-5 Platform.** Desktop browser with a keyboard. Mobile is out of scope.
- **NFR-6 No secrets.** The repo contains no keys. `.env` files are ignored by Git.
- **NFR-7 Language.** The game UI is Norwegian; documentation is English. `[P-13 · open]`

## 6. Non-Goals

- No language model calls in the app: no generated narrative, no novel risk events, no LLM advisor. `[P-7 · provisional]` A language model writing narrative text on top of fixed events is an idea for after R3, outside this course.
- No generated scenarios. One fixed, hand-made scenario.
- No other domains than construction (instructor's recommendation, brief open question resolved). `[P-14 · open]`
- No multiplayer, roles negotiating, or accounts.
- No import or export of scheduling formats (MSPDI, XER, PMXML). The scenario uses its own lightweight format, informed by PMI's WBS practice (addendum §D).
- No separate milestone tracking; the chapters mark the phases (§3). `[P-22 · provisional]`
- No analytics across several games.
- No claim of construction realism beyond the public sources in Appendix A.

## 7. Releases and Scope

`[P-15 · provisional]` The release split below.

| Release | Content | Status v0.5 |
|---|---|---|
| **R1 — minimal version: the demo game** (instructor's advice) | Fixed scenario, week-by-week engine, cost model with overtime 1.4, demo game mode, forecast (FR-1–3, 5–7). Risk response at DP1 and DP3, resource allocation at DP2 and DP4 (FR-8, 9). Rule-based advisor (FR-12, 15). Fork and comparison (FR-16, 17). Gantt, cost forecast, recommended actions, final report (FR-19–22). No key (FR-24). Demo game on the start screen (FR-25). 3D only reads (FR-26). | Calculation, advisor, fork and outputs are done. **To build:** demo game mode (FR-5, FR-25), DP1–DP4 as decision points with Appendix A's options (FR-8, FR-9), overtime 1.4 (FR-3), example 3 and the new 1.4 values as tests (FR-7). |
| **R2 — ordinary games, all four decision types and five outputs** | Ordinary game mode (FR-5). Crowding (FR-4). Strategy and change decisions (FR-10, 11). Second opinions, difficulty (FR-13, 14). Option previews (FR-18). Risk exposure (FR-23). Different but winnable games (FR-32). | Done except FR-23 |
| **R3 — game experience** | Walkable 3D site, meetings and story, opportunities and follow-ups (FR-27–29). Replay a seed (FR-30). Save and resume if needed (FR-31). | Done except FR-30, FR-31 |

**Note:** v0.5 was built before this PRD and went beyond the minimal version. R1 is therefore not "done first" in time; it is the part that must be correct and traceable before anything else counts. For the portfolio, the trace runs brief → PRD → stories → code. The stories for R2 and R3 will mostly point at existing code and tests; the stories for R1 are mostly new.

### 7.1 Remaining work

`[P-20 · provisional]` The order below. Items 1–5 are needed before submission, because they decide whether R1 is correct and traceable.

1. **Group decision:** approve, change or reject the decisions in §10, starting with the phase-blocking ones.
2. **Update the brief** as the instructor asked (§7.2).
3. **Write Appendix B** with the v0.5 rules and event prices (P-19).
4. **Build R1:** overtime 1.4 (FR-3), demo game mode with DP1–DP4 (FR-5, FR-8, FR-9, FR-25), the P-21 rule for risk decision points (FR-12, FR-16), and all rows of FR-7 as tests.
5. **Tests:** DOM tests for the click flow (P-12).
6. **R2 gap:** risk exposure (FR-23).
7. **R3 gaps:** replay a seed (FR-30); save and resume only if P-11 is rejected.

### 7.2 Changes to the brief after the group's decisions

Once the decisions are approved, the brief should be updated in these places, so the history shows how the plan changed:

- **Executive Summary, The Solution, Scope:** rule-based AI advisor instead of an LLM layer, with the reason (§1, FR-15); the R1/R2/R3 split with the demo game as R1.
- **Who This Serves:** the student plays the project owner (P-17).
- **Success Criteria 3:** variation through seeds and story solutions (FR-32), not through an LLM.
- **Scope, Open questions:** answered by P-11 (save and resume) and P-14 (domain).
- **Appendix A:** overtime factor 1.4 and new figures in examples 1 and 2 (P-2); crowding rule (P-4); the two game modes (P-18); how the advisor scores a reported risk (P-21); the team questions in §7 marked as answered where decided.
- **New Appendix B:** event library and R2 rules (P-19).

## 8. Success Metrics

**Primary**
- **SM-1**: The examiner completes the demo game unassisted, from start to final report. Validates FR-22, FR-24, FR-25.
- **SM-2**: Every row of FR-7 passes as an automated test, and matches what the screen shows (with the rounding rule in §4). Validates FR-3, FR-7, FR-16.
- **SM-3**: A full game meets every decision type in its release at least once (R1 demo game: two; R2 ordinary game: four). Validates FR-8–11.

**Secondary**
- **SM-4**: The same seed and choices give identical final reports in two runs, in both game modes. Validates FR-5, NFR-1.
- **SM-5**: In user tests, at least one decision changes the tester's understanding of the critical path or site overhead (one question after the game). `[P-16 · open]`
- **SM-6**: Two new ordinary games on the same difficulty meet different events, and both have a story solution within both targets. Validates FR-32.

**Counter-metrics (do not optimise)**
- **SM-C1**: How often the student agrees with the advisor. A high rate is not a goal; on medium and hard the advisor is wrong on purpose. Counterbalances SM-5.
- **SM-C2**: Number of events and amount of 3D detail. More content does not count if the rules behind it are not written down and tested. Counterbalances SM-3 and SM-6.

## 9. Open Questions

These are the remaining questions from Appendix A §7 that no decision in this PRD answers.

1. Are the durations reasonable? About 2.2 years for 15,000 m² has not been checked against a source (Appendix A §7.1).
2. Index 2017 prices to 2026, or keep 2017 for teaching? (§7.2)
3. Should overtime and hired workers be less productive? (§7.7). With overtime at 1.4, overtime on the critical path still pays (FR-7), but the margin shrinks from −0.59 to −0.33 MNOK in example 1. v0.5's crowding rule covers part of this for crew size, but not for work mode.
4. Fixed +50 % extra hire, or the student chooses how many? (§7.8). v0.5 has both: work mode +50 %, and crew 50–200 %.
5. Crew sizes and hourly rates in Appendix A §3b are unchecked estimates (§7.9).

## 10. Decisions for Group Approval

Tick each decision as **approved**, **changed** or **rejected** when the group reviews them. Start with the phase-blocking ones: they must be settled before architecture and stories.

### 10.1 Phase-blocking

| ID | Decision | Status | Recommended solution and why | Where |
|---|---|---|---|---|
| **P-7** | LLM or rule-based AI | Provisional | **Rule-based advisor, no language model.** Answers the instructor's three objections (model and cost, key, testability) in one go; already built and tested in v0.5; the instructor advised deferring the LLM. Risk: "AI-driven" in the title, so the brief must explain why a transparent rule-based advisor is the AI choice. | §1, FR-15, FR-32, §6 |
| **P-15** | Release split | Provisional | **R1 demo game, R2 ordinary games, R3 game experience.** R1 matches the instructor's minimal version almost word for word; R2 and R3 are their "clear steps afterwards". Tells the examiner what must be correct and what is extra. | §7 |
| **P-18** | Appendix A risk model vs v0.5 event model | Provisional | **Hybrid: a demo game that follows Appendix A, built on v0.5's event mechanism; ordinary games keep v0.5's model.** Keeps the group's hand-calculated rules (strongest answer to the instructor's main criticism) and the 27 tested events, without a second engine. Fixes the AI path meeting other events in R1. Rejected: change Appendix A to fit v0.5 (loses the hand-calculated examples); change v0.5 to fit Appendix A (too costly). | FR-5, FR-8, FR-9, FR-25 |
| **P-21** | How the advisor scores a reported risk | Provisional | **On the case "the risk happens", using Appendix A's figures; the comparison shows both cases.** The only alternative that needs no new numbers (expected value needs probabilities the group has not set), and it can be checked by hand from example 3. Arose from P-18. | FR-12, FR-16 |
| **P-6** | The advisor's rule | Confirm | **Lowest target score; ties to lower cost, then fewer weeks.** Decided by the team on 2026-10-22, implemented and tested; follows the instructor's advice that the advisor picks from the same options. | FR-12 |
| **P-2** | Overtime factor | Provisional | **1.4 instead of 1.3.** 1.3 is below the legal minimum supplement (arbeidsmiljøloven § 10-6), which the group pointed out itself. The teaching points still hold (FR-7). Costs one constant, the test values and Appendix A examples 1–2. Decide last, since it changes the examples P-18 builds on. | FR-3, FR-7 |

### 10.2 Other decisions

| ID | Decision | Status | Recommended solution | Where |
|---|---|---|---|---|
| P-1 | Model size vs 11 floors in the game | Open | Appendix A's 15,000 m² is the model; the floors are presentation only. | FR-1 |
| P-3 | Delay costs site overhead, not the task's weekly rate | Open | Keep it (Appendix A §7.3); v0.5 already works this way. | FR-3 |
| P-4 | Write the crowding rule into the brief | Confirm | Team decision 2026-10-22; only the writing remains. | FR-4 |
| P-5 | Risk-response prices for R2–R5 | Open | Needed at least for R3 (DP3). The group sets them. | FR-8 |
| P-8 | One Gantt, before → after numbers in the comparison | Open | Keep v0.5's solution; sketch it in the UX step. | FR-17 |
| P-9 | How risk exposure is calculated | Open | Sum of delay and cost of open risks, per risk. | FR-23 |
| P-10 | Which risks happen in the demo seed | Open | The group decides. UJ-1 assumes R1 happens. | FR-25 |
| P-11 | Save and resume | Open | Not needed for a one-hour game. | FR-31 |
| P-12 | DOM tests for the click flow | Open | Add them (listed in `deferred-work.md`). | NFR-4 |
| P-13 | Norwegian UI, English documentation | Open | Keep as in v0.5. | NFR-7 |
| P-14 | Construction is the only domain | Open | Yes, as the instructor recommended. | §6 |
| P-16 | One learning question after user tests | Open | — | SM-5 |
| P-17 | The student plays the project owner | Provisional | Keep the owner role from v0.5; update the brief. | §2.1 |
| P-19 | Where to write the v0.5 rules and event prices | Provisional | New Appendix B to the brief, with one worked example per event kind. | §4.2, NFR-3 |
| P-20 | Order of the remaining work | Provisional | As in §7.1; items 1–5 before submission. | §7.1 |
| P-22 | Milestones | Provisional | Chapters serve as milestones; no separate milestone tracking. | §3, §6 |
