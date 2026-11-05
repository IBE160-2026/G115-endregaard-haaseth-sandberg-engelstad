# Addendum: ByggAPP PRD

Material that belongs in architecture or later documents, kept out of the PRD itself. Status: draft.

## A. Technology in v0.5 (input to architecture)

From `ByggAPP/G115_FinalPrompt.md` §9:

- TypeScript, Vite, Three.js 0.186 (OrbitControls, EffectComposer with UnrealBloom, RoomEnvironment), Vitest. No backend, no API key.
- `ByggAPP/src/engine/`: the pure simulation (scenario, game, events, advisor, chapters, simulate). No UI code. Has `aiPath` and fork records (`game.ts`).
- `ByggAPP/src/ui/story.ts`: the story layer (objectives, meeting scripts, HMS checks, start-up meeting, staffing reviews). Pure and tested.
- `ByggAPP/src/ui/scene/` and `view3d.ts`: 3D, read-only against the game.
- `ByggAPP/src/main.ts`: directs the clock, scenes and input. Not covered by tests (`deferred-work.md`).
- Published as a Claude Artifact; a GitHub Pages workflow is ready but sits in `ByggAPP/.github/` and does not run until moved to the repo root and Pages is turned on by an admin.

## B. Why rule-based instead of a language model (P-7)

The brief planned an LLM layer for scenario narrative, novel risk events and the advisor. The instructor raised three problems with it: no model chosen, no cost plan, and no way for the examiner to run the app without the group's key. They also pointed out that an LLM-generated scenario is harder to test, and recommended deferring it until the core works.

v0.5 made every AI role rule-based. What this gives:

- The examiner needs no key (FR-24).
- Every recommendation can be tested against a hand-calculated answer (FR-12, NFR-1).
- The advisor always picks from the same options as the student, so both branches of a fork use the same rules (instructor's advice, point 2).

What it costs: no generated narrative, and variation between games comes only from the seed, difficulty and the fixed event library (27 events). The brief's success criterion "two playthroughs with the same parameters produce recognizably different scenarios" is met through seeds, not through an LLM.

If the group later wants an LLM, the natural place is narrative text on top of fixed events, never the rules or the recommendation, with stored responses for demo mode.

**Why it is still an AI advisor** (draft text for the brief update, P-7 · provisional). The course and the assignment are about AI-driven decision support. A rule-based advisor is a classic form of AI: an expert system that reasons from explicit rules and gives a recommendation with its reasons. For a teaching simulator, that is a strength. The student can see why the advisor recommends what it does, and the examiner can check it by hand against the written rule (FR-12). A language model would give more varied text, but its recommendations could be neither reproduced nor checked, and the comparison (the core of the app) would lose its value as a benchmark.

## D. Scenario format (from the brief's Out of scope)

The brief rules out real scheduling interchange formats (MSPDI, XER, PMXML) in favour of a custom lightweight schema informed by PMI's WBS and RBS practice standards. In v0.5 that is the `Scenario` type in `ByggAPP/src/engine/scenario.ts`: tasks with ID, name, predecessors, base crew, hours, hourly rate and materials (the WBS), and the people and foremen per task (the resources). Input to architecture; not a requirement.

## E. Demo game on v0.5's event mechanism (P-18 and P-21 · provisional)

Notes for architecture and stories, from a read of `ByggAPP/src/engine/game.ts` and `events.ts` on 2026-11-03:

- **Already there:** `newGame(..., { randomEvents: false })` turns off the weekly draws. `triggerEvent` raises a given event. `EventOption.setMode` lets an option change a task's work mode (DP2, DP4). `EventOption.later` gives a consequence that lands some weeks later (cost and delay).
- **Missing:** a trigger by week (DP1 week 16, DP2 week 50, DP3 week 70, DP4 week 84); a demo flag on the start screen; the four generic risk responses for R1 and R3 as events with Appendix A's prices.
- **To check when the story is written:** that *transfer* (cost covered, delay not) and *mitigate* (half impact) can be expressed with `cost`, `delay` and `later`, given that the demo seed fixes whether the risk happens. And how the advisor scores "if the risk happens" (P-21), since today's `outcome()` runs without new events.
- **Why the hybrid** (moved from PRD FR-5): Appendix A holds the group's own rules with hand-calculated answers, which is what the instructor asked for. v0.5 holds 27 tested events. The hybrid keeps both, without a second engine. The full reasoning, with the rejected alternatives, is in PRD §10 (P-18).
- **Overtime 1.4 (P-2):** the factor is a constant in the scenario. The expected values in `simulate.test.ts` and `game.test.ts` (282.515, 283.748, 282.776, and the F overtime test via the game) must change with it.

## C. Instructor's assessment criteria (portfolio part 1), for traceability

Process and AI steering 30 %, functionality and scope 20 %, QA and testing 15 %, design and UX 10 %, code quality and architecture 10 %, README and runnability 10 %, repo tidiness 5 %. The instructor also suggested moving planning documents into a dedicated folder and keeping keys in `.env` outside Git.

## F. v0.5 evidence per FR (moved from the PRD)

Where the ✅ marks in the PRD come from. Files are in `ByggAPP/src/engine/` unless another path is given. Checked 2026-11-03.

| PRD | Evidence in v0.5 |
|---|---|
| §4 Rounding | `advisor.ts` (MNOK shown with 2 decimals, target met when rounded to 0.01); `simulate.test.ts` (full precision) |
| FR-5 | `game.test.ts`: "is deterministic: same seed, difficulty and choices give the same game"; "the same seed gives the same events on every difficulty" |
| FR-7 | `simulate.test.ts`: "critical overtime", "critical hire", "non-critical overtime", "non-critical hire", "I overtime", "critical-path shift"; `game.test.ts`: "modes via game: F overtime set before week 50" (all with factor 1.3) |
| FR-12 | `game.test.ts`: water in the basement while E is active, option pump; `targetScore` and `bestOption` in `game.ts` |
| FR-13 | `game.test.ts`: the three voices at «Vann i kjeller» (`voicesFor` in `game.ts`) |
| FR-14 | `game.test.ts`: "easy: the AI always recommends the best option; hard: sometimes not"; `RELIABILITY` in `game.ts` |
| FR-16 | `game.test.ts`: "records the fork: chosen and recommended outcome from the same state" |
| FR-25 | Demo links in v0.5: `?scene=hms`, `?scene=kickoff&steg=9`, `?uke=60&hendelse=change-security&steg=9` (`ByggAPP/G115_FinalPrompt.md` §9) |
| FR-28 | `story.test.ts` |
| FR-29 | `game.test.ts`: "the pump failure only comes after «lei midlertidig pumpe»"; `MAX_CHALLENGES` in `game.ts` |
| FR-10, FR-11, FR-29 | `events.test.ts`: event catalogue rules for strategies, change requests, follow-ups, risks and opportunities |
