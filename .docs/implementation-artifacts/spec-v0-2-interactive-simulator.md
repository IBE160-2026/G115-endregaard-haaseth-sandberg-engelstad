---
title: 'v0.2: interactive owner simulator with AI roles, org chart, events, crew choice, difficulty and 3D view'
type: 'feature'
created: '2026-10-22'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '40b488efb4ed2d8ae320edf7eff47df4eb56ed57'
context:
  - '{project-root}/brief-G115-AI-prosjektledelse-simulering.md'
  - '{project-root}/.docs/implementation-artifacts/spec-simulator-environment.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** v0.1 shows the scenario and recomputes it, but the user cannot play it. There is no time, no roles with agency, no events and no goal, so it does not yet train decisions under uncertainty.

**Approach:** The player is the **Prosjekteier**. A week-by-week game runs from construction start to completion. AI roles (Prosjektleder, Site manager and 13 foremen) raise challenges and recommend options, and the player decides. The goal is to finish within budget and the planned schedule. v0.2 adds:
- an interactive org chart;
- event buttons (e.g. water in the basement);
- a crew-size choice per discipline;
- easy, medium and hard difficulty;
- a 3D window of the construction stage;
- real facts and as-built icons in Byggene.

## Boundaries & Constraints

**Always:**
- **Engine:** the engine stays pure, deterministic (seeded) and separate from the UI. The new week-by-week game engine reproduces `simulate()` exactly when nothing happens, so all v0.1 matrix tests stay green.
- **Org chart:** only the Prosjektleder and the Site manager report to the Prosjekteier. Foremen report to one of those two. Clicking a person opens their details: AI role, current challenge, crew and mode.
- **Crew-size choice:** each discipline chooses its own crew c in [50 %, 200 %] of the base crew N. Effective workers = c when c ≤ N, otherwise N + 0.5·(c − N), because crowding gives diminishing returns. Paid hours = task hours × c / effective. Too few workers makes the task slower, which costs site overhead. Too many costs extra hours. The base crew is the cheapest option overall.
- **Events:** each event has 2–4 options with explicit cost (MNOK), delay (weeks) and effects. A role recommends one option and gives its reasoning. Example: **Vann i kjeller** → install a pump: +cost, and the active basement task is delayed by drying time.
- **Byggene:** use the real facts for A-blokka (11 floors, 50 m, about 17,300 m² above ground, departments, contents, the artwork «AAkhA» by Outi Pieski). Use the real facts for the basement complex: a logistics and operations hub with goods and waste handling, technical operations, bicycle parking with changing rooms, and a rotunda for secure vehicle access; BT1 by Veidekke, finished April 2026; Kjeller 2 by Hent, about 10,000 m², start January 2027, finished 2030. New icons use the existing Fluent tile style from `generate.mjs`.
- **3D window:** the 3D view is a separate window on the desktop that shows how far each building part has come in the current week.
- **Text and money:** the UI text is Norwegian, and money is shown in MNOK with 2 decimals.
- **Decisions (Q1–Q4):**
  - AI roles are **rule-based**: built-in logic and texts, no key.
  - The calculation **keeps the Light numbers** (Appendix A: 11,000 m², 283.10 MNOK, 114 weeks). Byggene and the 3D view show the real A-blokka (11 floors), with a note that the calculation is the Light version.
  - Time is **auto-play with pause**: play/pause, speeds 1×/2×/4× and "Neste uke". The game pauses by itself when an event needs a decision.
  - Difficulty changes **only how reliable the AI advice is**: easy = the roles always recommend the best option, medium ≈ 80 %, hard ≈ 60 % (seeded). Events, information and the target are the same on every level. The target is 283.10 MNOK and 114 weeks.

**Never:**
- No LLM calls, backend or accounts.
- No forking or side-by-side comparison of the player's and the AI's paths in v0.2.
- Do not change the v0.1 Appendix A numbers or examples.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No events, base crew | Game run to the end | 114 weeks, 283.10 MNOK (equals `simulate()`) | N/A |
| Modes via game | F overtime set before week 50 | 111 weeks, 282.515 MNOK | N/A |
| Crew too low | F crew 24 (of 34) | F ⌈25,500 / (24 × 37.5)⌉ = 29 weeks, project +9 weeks, overhead +4.05 | N/A |
| Crew too high | F crew 44 | effective 39, F 18 weeks, paid hours 25,500 × 44/39, net cost > base | N/A |
| Water in basement | Button pressed while E is active, option "pumpe" | +pump cost, E stalls for the drying weeks, forecast updates | Button disabled when no basement task is active or ahead |
| Mid-task change | Mode/crew changed while a task is in progress | Applies to the remaining hours only | N/A |
| Determinism | Same seed, difficulty and choices | Identical event sequence and result | N/A |
| Completion | N finished | Final report: weeks and total against the targets, with a verdict | Controls locked |

</frozen-after-approval>

## Code Map

- `src/engine/simulate.ts` -- reuse `workPlan` logic. `simulate()` stays the reference that the game engine is tested against.
- `src/engine/scenario.ts` -- extend with crew bounds, events, role mapping (reportsTo) and building facts.
- `src/ui/tabs/*.ts`, `src/main.ts` -- add the org chart (people), the play controls and event panel, and the 3D window toggle in the taskbar.
- `src/ui/budgetLines.ts`, `format.ts`, `gantt.ts` -- reuse for the live budget and the Gantt (progress overlay).
- `assets/icons/generate.mjs` -- add icons: a 3D app, events (water, pump), play controls, and as-built A-blokka and basement hub.
- `.docs/implementation-artifacts/deferred-work.md` -- the DOM-test item from v0.1 still applies.

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/game.ts` (+ `game.test.ts`) -- week-by-week state: remaining hours, crew, mode, active events, accrued cost, forecast. Uses a seeded RNG.
- [x] `src/engine/events.ts` (+ tests) -- the event catalogue (water in basement, R1–R5 and discipline challenges), the options, the recommendation logic per role and difficulty.
- [x] `src/engine/scenario.ts` -- crew bounds, reportsTo, building facts, difficulty presets.
- [x] `assets/icons/generate.mjs` -- the new icons, then regenerate.
- [x] `src/ui/tabs/people.ts` -- the org chart with a details panel and crew/mode controls.
- [x] `src/ui/tabs/buildings.ts` -- the real facts.
- [x] `src/ui/play.ts` -- the start screen (difficulty), play/pause/step, event dialog, status (week, cost against budget, forecast), final report.
- [x] `src/ui/view3d.ts` -- the 3D window (three.js): basement in the pit, floors rising, facade, crane, water in the pit during the event.
- [x] `src/main.ts`, `src/styles.css` -- wiring, the second window, taskbar.
- [x] `G115_Changelog.md` (was `changelog_G115.md`), `package.json` -- v0.2.

**Acceptance Criteria:**
- Given a new game on any difficulty, when it runs to the end with no decisions, then the final report appears with weeks and total.
- Given the org chart, then the Prosjekteier is at the top with exactly two direct reports, and every foreman sits under one of them.
- Given the 3D window, when the week advances, then the visible construction matches the tasks' progress.
- Given Byggene, then A-blokka and the basement complex show the real facts.

## Implementation Notes

- Implemented directly in the main session. New: `src/engine/{game,events,advisor}.ts`, `game.test.ts`, `src/ui/{play,view3d}.ts`, `src/ui/tabs/controls.ts`. Changed: scenario (reportsTo, facts, crewRange, crowdingProductivity, target), simulate (`events: 0` in the result), the tabs, main, styles, generator (+ the icons 3D, play/pause/step/new, water/frost/wind, A-blokka as built, basement hub with rotunda), `vite.config.ts`, `package.json` 0.2.0, changelog.
- The game engine steps through weeks with whole-week rounding, so with no events it is exactly `simulate()` (tested for 5 mode combinations). Mid-task changes apply to the remaining hours.
- Crew model: effective = min(c, N) + 0.5·max(0, c − N); hired workers (extra hire) are counted on top, at full productivity, as in v0.1. Own workers are paid c/effective per worked hour (crowding).
- AI recommendation: every option is scored by a forecast (clone → apply → run to the end without new events). The best option is recommended with probability RELIABILITY[difficulty], otherwise a random other option. The reasoning text describes the option (cheapest or fastest), not the forecast, so the player still has to think about the critical path.
- Random events: each fires at most once, with the chance per week while its task is active, on every difficulty. The scenario buttons can be pressed while the task is not finished. The scenario number (seed) is shown in the final report.
- 3D: three.js is loaded lazily (`import()`) when the window opens; `optimizeDeps` stops the dev server from reloading the page then. The scene is rebuilt from `progress()` every week. Water shows while a basement task has `stallCause === 'water'`.
- Verified: 43/43 tests, build OK. A CDP playthrough on medium (start → water + pump → 3D → final report in week 121, 289,65 MNOK) with no JS errors; screenshots of all tabs.
- Proposals for the team: event prices and delays, crowding productivity of 0.5, the 50–200 % crew range, and A/N under the project manager.

## Spec Change Log

- 2026-10-22 – the team's answers to the review's game-design questions (triage #21 and the four open questions):
  1. **Dilemmas:** events are short dilemmas shown to the player (a one-line "Dilemma: …" in the dialog). The AI scores options against **both targets** (the sum of the relative overruns in MNOK and weeks), not cost alone. The project manager plans the staffing (`pmPlan`) so the crews are used as well as possible, and offers it to the player ("Følg prosjektlederens plan").
  2. **Crowding:** hired workers crowd too. Above the planned crew (the base crew, plus the planned hire share when hiring), everyone counts 0.5. Base crew + hire is unchanged, so Appendix A and the v0.1 tests still hold. New **opportunities** (masses reused, cheaper steel, facade discount) save money at the cost of time, for surprise.
  3. **No lock** on a mode chosen through an event.
  4. **"Late but within budget" must be possible** (it now is, through the opportunities). **Every game has a story solution:** `findStory` picks a seed whose story can be solved within both targets with full information (the PM plan plus the best option at each event), and the final report shows "Historiens løsning".
  KEEP: game ≡ simulate with no events; the seeded RNG draws both numbers on every recommendation; events are the same on every difficulty.

## Review Triage Log

Pass 1 (blind-hunter, edge-case-hunter, verification-gap). Route: patch, unless noted.

| # | Finding | Verdict | Evidence / route |
|---|---------|---------|------------------|
| 1 | `budgetOf` with events ≠ 0 is never tested; the old sum check has no events term (VG) | medium | Pre-verified. Patched: Budsjett test with water + pump (0,80; 284,80); the sum check includes events. |
| 2 | `verdict` branches and `renderFinal` are untested (VG) | medium | Patched: tests for over-and-late (crew 24), over-budget (H hire), late (constructed) and the final-report text. |
| 3 | `adviceFor` is never asserted (VG) | medium | Patched: `events.test.ts` covers under- and overstaffing, slack and the PM's late forecast. |
| 4 | Event catalogue integrity (icon, raisedBy, taskIds) is unchecked (VG, EC) | medium | Patched: integrity test per event, plus toolbar icons. |
| 5 | Gantt `week` overlay and today line are untested (VG) | low | Patched: test with 4 done overlays at week 40 and the today line's x position. |
| 6 | The removed hired-crew display is untested and missing in Disiplinene (VG, EC) | low | Patched: "+ N innleid" in Disiplinene; test in the org chart details. |
| 7 | Water can be shown in a pit not yet dug (BH) | medium | The button allows "ahead" (frozen matrix), but 3D flooded on `stallCause` alone. Patched: flooding only while the task is in progress. |
| 8 | A button event is not added to `fired`, so it can come again at random (BH, EC, VG) | low | Patched: `triggerEvent` marks it fired. Buttons can still be pressed again (a deliberate scenario tool). Test added. |
| 9 | The RNG stream depends on difficulty (an extra `rand` on a wrong pick) (EC) | medium | Breaks the frozen rule "events are the same on every level". Patched: both numbers always drawn. Test: same seed gives the same `fired` on easy and hard. |
| 10 | Crew/mode can change while a decision is pending (EC) | low | Patched: `editable()` returns null while pending. Test added. |
| 11 | The final report uses the raw `spent()`, the rest uses the øre-rounded `budgetOf` (EC) | low | Patched: the final report uses `budgetOf(forecast)`; `verdict` compares in øre. |
| 12 | The details panel does not show the current challenge (BH) | medium | A frozen Always rule. Patched: "Aktiv utfordring" with the recommendation; test added. |
| 13 | Electrician options with `setMode` are shown as "Ingen ekstra kostnad" (EC, BH) | low | Patched: the text shows the higher hourly cost. The mode switch-back is a team question (#21). |
| 14 | Stale `resume` on new/start; a disabled trigger pauses silently (EC) | low | Patched: reset, plus a `canTrigger` guard. |
| 15 | Lazy 3D: double-click gives two renderers; no error handling; the loop runs while hidden (EC, BH) | medium | Patched: shared `viewLoading`, try/catch with a message, `setActive()` pauses the loop. |
| 16 | Re-rendering on every tick: clicks lost at 4×, org scroll reset, 3D rebuilt on every click, `aria-live` spam (BH, EC) | medium | Patched: the render waits while a pointer is down, the scroll is kept, the 3D rebuilds only on a new week or state, and `aria-live` is removed from the status bar. |
| 17 | Focus is lost for play/pause, speed and "Grunn N" (EC) | low | Patched: `focusKey` handles these; "Grunn" got a `title`. |
| 18 | Drag: no `pointercancel`, can go off-screen (EC) | low | Patched: cleanup on cancel, `left` clamped. |
| 19 | `.g-done` has no dark value; the 3D background does not follow a theme change (BH) | low | Patched: dark values, plus a `matchMedia` listener. |
| 20 | The real facts have no source (BH) | low | Patched: a source comment in `scenario.ts` (given by the group; to be verified). |
| 21 | Best option ranked by cost, not by the target; hired workers are not crowded; mode switch-back after an event (BH) | maybe-false | Game design the frozen intent does not settle. Deferred as team questions in `deferred-work.md`. |
| 22 | Difficulty does not affect the reports in the org chart (BH) | false | Q4 was decided as "the reliability of the AI *recommendation*" on events. The reports are status, not choices. |
| 23 | The v0.1 what-if mode and "Tilbakestill" are gone (BH, EC) | false | Replaced on purpose by the game. Tabs show the baseline before start. |
| 24 | Play loop, resume and 3D have no DOM tests (VG, BH) | medium | Deferred: `deferred-work.md` is extended to cover v0.2 (needs happy-dom/jsdom). |
| 25 | The seed cannot be entered (BH) | low | Deferred as a feature request. |
| 26 | 0- vs 1-based week numbers (BH) | low | Rejected: the game starts at "uke 0", and the forecast uses the same scale everywhere. |
| 27 | Dialogs without a focus trap; the final report cannot be reopened (BH) | low | Rejected: the backdrop covers the window, and a focus trap adds complexity. |
| 28 | NaN crew, MAX_WEEKS forecast with null (EC) | false | `data-crew` is always numeric from our markup; the crew minimum is 50 %, so every task finishes. |
| 29 | Spec says the recommendation lives in events.ts and the difficulty presets in scenario.ts (EC) | low | Rejected: a documentation detail; the fix would be a spec edit. |
| 30 | AC "runs to end with no decisions" is impossible with random events (EC) | false | The AC is tested with `randomEvents: false`; a real game requires decisions on purpose. |

## Verification

**Commands:**
- `npm test` -- expected: all green, including the v0.1 tests and the game ≡ simulate equivalence.
- `npm run build` -- expected: no errors.

**Manual checks (if no CLI):**
- Play one game on each difficulty, trigger "Vann i kjeller", and check the 3D window in light and dark mode.
