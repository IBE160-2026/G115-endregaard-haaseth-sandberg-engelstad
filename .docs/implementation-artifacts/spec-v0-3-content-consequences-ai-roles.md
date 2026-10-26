---
title: 'v0.3: more content and story, visible consequences (fork), and a bigger part for the AI roles'
type: 'feature'
created: '2026-10-26'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '69f3ac808b8b96cda339928898330a39c2b853fe'
context:
  - '{project-root}/brief-G115-AI-prosjektledelse-simulering.md'
  - '{project-root}/.docs/implementation-artifacts/spec-v0-2-interactive-simulator.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A v0.2 game is thin. Each event fires at most once, so a game has only a few decisions, and there is no story arc. The player cannot see what an option leads to before or after choosing it. The AI roles only speak when they raise an event. The brief's core mechanic (fork the student's path against the AI's path) and two of its four decision types (planning strategy, change approval) are missing.

**Approach:** Keep the two targets (283.10 MNOK, 114 weeks) and the pure, seeded engine, and add:
- **Content and story:**
  - six story chapters, each with an intro from the Prosjektleder;
  - new decision types: **strategy choices** that always come when a key discipline starts, and **change requests**;
  - **follow-up events** unlocked by earlier choices;
  - **delayed consequences** (an option can cost money or time some weeks later);
  - at least 12 new events.
- **Visible consequences (the fork):**
  - every option shows, before choosing, what it costs and delays now and later, plus the forecast end week and MNOK with Δ against today's forecast and the targets;
  - after choosing, a fork card shows the player's path next to the Prosjektleder's recommendation from the same state;
  - the final report compares the player's result with a full "AI path" (all recommendations followed) and the story solution.
- **Bigger AI roles:**
  - at every decision, three roles each give a recommendation and a reason from their own perspective, and they can disagree;
  - a message feed where the roles report starts, finishes, chapters, delayed consequences and forecast changes all game long.

## Boundaries & Constraints

**Always:**
- **Engine:** the engine stays pure and deterministic (same seed, difficulty and choices give the same game) and separate from the UI. With events off, the game still equals `simulate()`, so all v0.1/v0.2 number tests stay green (only tests whose expected text or counts must change for v0.3 may be updated).
- **Forecasts:** forecasts and option outcomes assume no *new* events, but they include delayed consequences that are already scheduled.
- **Voices:** the official AI recommendation (used for the fork and the "followed" count) is the Prosjektleder's. It is target-based, with the existing difficulty reliability. The other two voices follow fixed lenses: Site manager = least delay, the raising foreman/role = lowest cost now. When the Prosjektleder raises the event itself, the Site manager and the affected discipline's foreman speak.
- **Story:** every new game is still a story that can be solved within both targets (`findStory`). Event numbers are proposals for the team to check, as in v0.2.
- **Text and money:** the UI text is Norwegian, and money is shown in MNOK with 2 decimals.
- **Decisions (2026-10-26):**
  - **Two targets only:** no third score. Benefits of change requests and strategy choices are expressed as money and time, e.g. saying no now gives a delayed rebuild cost later.
  - **Pace:** a typical game has about 12–15 decisions: the 4 strategy choices plus random risks, change requests and follow-ups. Tune the chances to this.
  - **Fork card:** a short blocking dialog after each choice, with both outcomes and a «Fortsett» button.

**Never:**
- No LLM calls, backend or accounts.
- No 3D changes in this spec (a separate slice).
- Do not change the Appendix A numbers.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Strategy at start | F starts (events on) | F's strategy decision is pending in its start week, every seed | Not in forecasts |
| Delayed consequence | Option with `later` chosen at week w | At week w + later.weeks: cost added, affected task stalls; feed message; forecasts before then already include it | Task finished → cost only |
| Follow-up | `requires` event/option not chosen | Follow-up never fires; after that choice it can fire | — |
| Option preview | Pending decision | Each option shows the forecast weeks/MNOK equal to `forecast()` after choosing it | — |
| Fork card | Player chooses ≠ recommended | Card shows both outcomes and Δ; recorded in `g.decisions` | Followed → one column, "Du fulgte anbefalingen" |
| AI path | Game done | Final report: player vs AI path vs story, deterministic per seed | — |
| Work change | Strategy option `work: -0.2` on F | F's remaining hours × 0.8; progress and costs use the new total | — |

</frozen-after-approval>

## Code Map

- `src/engine/events.ts` -- `EventDef`/`EventOption`/`EVENTS`. Extend the kinds (`change`, `strategy`), add `trigger: 'start'`, `requires`, and the option effects `later` and `work`. Add the new events here.
- `src/engine/game.ts` -- `GameState`, `step`, `raise`, `bestOption` (already scores every option: reuse it for the previews), `choose`, `forecast`, `outcome`, `solveStory`/`findStory`, `progress`, `crewPlan`. Every `task.hours` read in `step`/`progress`/`forecast` must use the per-game total.
- `src/engine/advisor.ts` -- `adviceFor`, which uses `task.hours`: switch it to the per-game total. Add the voice texts here.
- `src/engine/chapters.ts` (new) -- the six chapters (Grunnarbeid C,D · Kjeller E,L · Råbygg F,O · Tett bygg G · Teknikk og innredning H,I,J,K · Overlevering N) with title and intro text.
- `src/ui/play.ts` -- `renderEvent` (options with previews, three voices), new `renderFork`, `renderFeed`, and `renderFinal` with the AI-path comparison.
- `src/main.ts` -- dialog routing (pending → event; last decision unseen → fork; done → final), feed placement, `choose` flow.
- `src/ui/tabs/people.ts` -- the alert and active challenge also for voices. Show the person's latest messages. Line 18 reads `task.hours`: switch it to the per-game total.
- `src/ui/tabs/disciplines.ts` -- line 13 reads `task.hours`: switch it to the per-game total.
- `src/styles.css` -- feed, option preview, fork card; light and dark.
- Tests: `src/engine/events.test.ts` (catalogue invariants per kind), `story.test.ts`, `game.test.ts`, `src/ui/tabs/tabs.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/events.ts` -- Add the new fields and at least 12 new events:
  - 4 strategy events (start of C, F, H, N);
  - at least 3 change requests;
  - at least 2 follow-ups (e.g. the hired pump fails after `water:rent`);
  - at least 3 new risks or opportunities.

  Strategy and follow-up events have `button: false`.
- [x] `src/engine/chapters.ts` -- Chapters, plus a `chapterOf(s, g)` function.
- [x] `src/engine/game.ts` -- Add `TaskState.work` (the total hours), `scheduled`, `choices`, `decisions` and a `from` field on log entries. Then:
  - `step`: fire start triggers; apply due delayed consequences; write feed messages (start, finish, chapter, consequence).
  - `raise`: store the per-option outcomes and the three voices in `Pending`.
  - `choose`: record the fork (chosen vs recommended outcome) in `decisions`.
  - Add `aiPath(s, difficulty, seed)` by generalising `solveStory` with a chooser.
- [x] `src/engine/advisor.ts` -- Voice reasons that quote the numbers; use the per-game hours.
- [x] `src/ui/play.ts`, `src/main.ts`, `src/styles.css`, `src/ui/tabs/people.ts` -- Event dialog with a kind chip, voices and option previews; fork card; feed panel; final report with player vs AI path vs story and a per-decision list.
- [x] Tests -- Cover the matrix rows, the voice lenses, the catalogue invariants per kind, story solvability on all difficulties, and the UI renderers (previews, voices, fork, feed, final report).
- [x] `package.json`, `G115_Changelog.md`, `G115_Dilemmas.md`, `README.md` -- Version 0.3.0, a changelog entry, the logged prompts and replies, and a README line for the new decision types.

**Acceptance Criteria:**
- Given a new game on any difficulty, when it is played to the end with the story steps, then it is on target, and the player meets at least 4 strategy decisions plus random events.
- Given a pending decision, when the dialog shows, then every option lists its now/later effects and its forecast end week and MNOK with Δ, and three roles each name an option with a reason.
- Given a running game, when tasks start or finish, chapters change or a consequence lands, then the feed shows a message from the right role with the week.
- Given the game is done, when the final report opens, then it shows the player's result, the AI path and the story solution side by side, and every decision with the Δ between the player's and the recommended outcome.

## Design Notes

Delayed consequences are state, not chance, so forecasts and the AI scoring can see them. That is what lets the preview honestly show "billig nå, dyrt senere". Follow-up events stay random (like other risks) and are therefore not in forecasts.

**Engine rules (settled in the spec review, 2026-10-26):**

- **Start triggers:**
  - Start triggers run only when `randomEvents` is true. That keeps "game ≡ `simulate()`" and keeps them out of forecasts.
  - In `step`, they are checked *before* the work loop, in the week the task becomes ready, so the choice (including `work`) applies from that week. Mark the task `start = w` and raise the decision, but work no hours that week.
  - They use no rng roll. When one fires, no random event is rolled that week.
  - If a decision is already pending, the start trigger is queued in `g.queue` and raised as soon as the pending decision is chosen. So a strategy event can never be lost.
- **`later` effect:**
  - Shape: `{ weeks, cost, delay, taskId?, text }`.
  - It lands in `g.scheduled` at week `choiceWeek + weeks` and stalls `taskId` (default: the decision's task) by `delay` weeks. If that task is finished, it adds the cost only.
  - Due entries are applied at the start of `step`, also in forecast clones.
  - When the game completes, every entry still outstanding is charged at once (cost only), so the real result equals the forecast.
- **`work` effect:**
  - A fraction applied to the *remaining* hours: `TaskState.work = hoursDone + (work − hoursDone) × (1 + fraction)`.
  - Materials stay the task's fixed amount. Book them as `materials × done/work` per week, so the full amount is reached at the finish.
  - Read the per-game `work` total in `step`, `progress`, `forecast`, `adviceFor`, `src/ui/tabs/disciplines.ts:13` and `src/ui/tabs/people.ts:18`.
- **Feed:**
  - `step` writes messages only for facts: start, finish, chapter, consequence, event raised, choice.
  - Forecast clones must not grow the log. Clone without the log, or give the clone an empty one.
  - "Forecast changed" messages are written by `main.ts`, after a choice or a staffing change, by comparing the forecasts before and after.
- **Previews and Δ:**
  - Option previews are the outcomes `bestOption` already computes, stored in `Pending.outcomes`.
  - Δ on every option, the recommended one included, is measured against today's forecast (`Pending.before`), as the frozen intent says. The recommended option also carries the «anbefalt» chip. The fork card shows Δ against the recommendation. (Corrected in review 1: this note first said Δ against the recommendation, which contradicted the intent.)
- **Voices:**
  - Deterministic, no rng. The three speakers are always Prosjektleder + Site manager + the affected discipline's foreman, whoever raised the event. The raiser is marked with a "meldte saken" chip.
  - Site-manager lens: lowest forecast end week. Foreman lens: lowest `cost` now. Ties go to the lower total forecast, then to option order.
  - The Prosjektleder's voice is `pending.recommended`, including the difficulty noise.
- **AI path:**
  - `aiPath(s, difficulty, seed)` plays the same seed with `pmPlan` staffing (at the start and after each choice) and picks `pending.recommended` at every decision.
  - It can meet other events than the player did. The final report says so.
  - Compute it once per game, when the game is done, and cache it in UI state.
  - The per-decision list in the final report uses `g.decisions` (the fork records), not `aiPath`.
- **Chapters:**
  - Task A (Prosjektering) is a prologue: the Prosjektleder's game-start message. It is not one of the six chapters.
  - `chapterOf` returns the chapter of the earliest unfinished non-A task that has started, or `null` in the prologue.
- **Catalogue invariants (tests):**
  - **strategy:** `trigger: 'start'`, `chance` 0, `button: false`, 2–4 options. Costs may be ≥ 0. A `work` fraction may be negative only together with a positive cost.
  - **change:** at least one "defer or decline" option with cost 0 now and a `later` cost > 0.
  - **follow-up:** has `requires`, `button: false`.
  - **risk and opportunity:** the v0.2 rules are unchanged.
- **UI flow:**
  - The fork card is routed by `forkSeen` in UI state (`main.ts`), not in the engine.
  - Play stays paused until «Fortsett», then resumes if it was playing before the decision.
  - Add a renderer test for the routing.
- **Performance:**
  - `findStory` on Start plus one decision click (previews + `pmPlan`) must stay fast.
  - Add a test that `findStory` on all three difficulties together finishes in under 3 s in Vitest.
  - If it is slower, reduce `tries` or cache, but never drop the solvability guarantee.

## Implementation Notes

- New: `src/engine/chapters.ts`. Changed: `events.ts` (16 new events: 4 strategy, 4 change, 3 follow-up, 5 risk/opportunity; `later`, `work`, `trigger`, `requires`, custom `dilemma`), `game.ts`, `advisor.ts` (`voiceReason`), `play.ts` (`renderFork`, `renderFeed`, `dialogFor`, new `renderEvent`/`renderFinal`), `main.ts` (feed panel, fork routing, forecast-change messages, cached AI path), `people.ts`, `disciplines.ts`, `styles.css`, tests, version 0.3.0.
- Pace: v0.2 chances were lowered too (water 0.06→0.04, soil, facade, electricians 0.1→0.08, wind 0.08→0.06, rock 0.12→0.1, integration 0.12→0.1, reuse 0.1→0.08, frost 0.08→0.07). Measured over 60 seeds on the story path: mean 14.3, median 15 decisions; about 28 % of seeds are solvable, so `findStory` needs about 4 tries (25 ms each).
- Routing: a fork card is shown before a queued strategy decision, so no fork is skipped (`dialogFor`).
- `canTrigger` now also requires `button: true`, so strategy and follow-up events can never be started from the menu.
- `pmPlan` reuses the current forecast instead of recomputing it for every discipline (same result, about half the work).
- The forecast-change message merges repeated staffing clicks in the same week into one message.
- Verified: 156 tests, `npm run build` OK. Not done: a manual browser playthrough (no DOM tests exist; see deferred-work).

## Review Triage Log

Review 1 (2026-10-27): blind hunter (BH), edge-case hunter (EC), verification gap (VG).

| # | Finding | Verdict | Evidence | Route |
|---|---------|---------|----------|-------|
| EC1 | A scenario button can re-trigger a fired event, for unlimited savings | medium | `canTrigger` never checks `g.fired`, and the menu stays enabled. `lift-crew` on O (which has slack) gives −0.6 MNOK per press. Patched: each button event now fires once. This reverses the v0.2 triage note (#8) that kept buttons pressable again as a scenario tool, so it was flagged to the group. | patch |
| EC2 | A mode set by an event option can be set back afterwards | false | The v0.2 group decision (Dilemmas v0.2 #5: "no") says an event-chosen mode is not locked. | reject |
| EC3, EC4, BH1 | The feed header uses `chapterOf` live: it shows "Prolog" at handover weeks and an older chapter when a task runs late | low | Real: `chapterOf` is null when no started task is unfinished. The fix is a one-line change to read `CHAPTERS[g.chapter]`. | patch |
| EC5 | `announceChapter` can skip a chapter intro when `chapterOf` jumps | low | Real if L outlives G (L at minimum crew plus stalls). The fix logs each skipped intro in order. | patch |
| EC6 | `land` overwrites the cause of an existing stall | low | Real: the 3D water display reads `stallCause === 'water'`. The fix sets the cause only when the task was not already stalled. | patch |
| EC7 | `work ≤ −1` gives 0/0 | false | No option has `work` below −0.5. Code that fails on input that is never given is not a defect. | reject |
| EC8 | Play or step works behind the fork card | false | `.backdrop` is `position:absolute; inset:0` over the main window, toolbar included, so it cannot be clicked. | reject |
| EC9, EC10 | Option Δ is measured against the recommendation, not today's forecast, and the recommended option has no Δ | medium | A deviation from the frozen intent ("Δ against today's forecast"), caused by a design note. The fix measures Δ against `p.before` on every option. The design note is corrected. | patch |
| EC11 | `findStory` can return an unsolved story | false | Unchanged from v0.2. Tests check that the sampled seeds are solved on all difficulties. | reject |
| BH2 | Recalculating materials goes backwards if `work` changes mid-task | false | Every `work` option is on a start-trigger strategy, so `hoursDone` is 0. This cannot happen. | reject |
| BH3 | The name `randomEvents` also turns off the strategy choices | low | Naming only, with no harm to users. | reject |
| BH4 | `game.ts` and `advisor.ts` import each other | low | Both are used only inside functions, and the build and tests pass. No harm can be named. | reject |
| BH5 | The foreman lens ignores mode cost; the Site manager says «tidligst» on ties | false / low | The lens is the spec's ("lowest `cost` now"). The tie wording is cosmetic. | reject |
| BH6 | No test that a game has 12–15 decisions | medium | The frozen decision fixes the pace. Without a test, the lowered chances can drift unnoticed. | patch |
| BH7 | Only one of the three follow-ups is tested | low | The `requires` gating is a single code path that the `pump-fail` test already covers. | reject |
| BH8 | The queue is tested only with a hand-made entry | low | With today's data, two strategies never fall in the same week. | reject |
| BH9, VG3 | The wall-clock 3 s test could flake | low | The whole suite runs in 1.4 s (more than 10× margin), and the spec asked for this test. | reject |
| BH10 | `aiPath` is computed inside `render()` | low | It runs once per game, in about 25 ms. | reject |
| BH11 | `mnok`, `weeksWord` and `verdictOf` are duplicated | low | No present harm. | reject |
| BH12 | The UI writes forecast notes into `g.log`; `lastNote` is never reset | low | The engine logic never reads the log (follow-ups use `choices`), and the identity check stops the note carrying over to a new game. | reject |
| BH13 | Reused icons misdescribe some events | low | A user-visible mismatch: `steel-quality` (a risk) has a discount icon. The direct fix is to swap it for an existing risk icon. New icons are deferred. | patch |
| BH14 | The feed has `border-top` as a side column; there is no `aria-live` | low | The border fix is a direct correction. `aria-live` on a feed re-rendered every tick would flood screen readers, so it is left out. | patch |
| BH15 | The catalogue raiser check is weak | low | Every raiser in the data is the foreman of the first task, the PM or the site manager. | reject |
| BH16 | The changelog and Dilemmas dates differ | false | The decisions were made 2026-10-26 and the release is 2026-10-27. | reject |
| VG1 | `noteForecast` and resume-after-fork in `main.ts` are untested | medium | No test imports `main.ts`. Extract the note logic into a pure helper and test it; resume-on-continue is deferred, as the reviewer advised. | patch |
| VG2 | No tab test changes `work` | medium | Disciplines and People read `st.work`, and no renderer test varies it. | patch |

## Verification

**Commands:**
- `npm test` -- expected: all green, including the existing v0.1/v0.2 number tests.
- `npm run build` -- expected: no type errors.

**Manual checks (if no CLI):**
- Play one game on Medium in `npm run dev`. Check the strategy dialogs, the option previews, the fork card, the feed, and the final comparison in light and dark theme.
