# Recommendations – G115 simulator

An assessment of how well the simulator meets its goals, measured against the instructor's feedback (`tilbakemelding-product-brief.md`, the part 1 criteria of the grading guide) and the brief's success criteria, with recommended next steps. One section per simulator version (newest first). Each entry has at most four lines.

## v0.2 – 2026-10-22

**Overall:** the app is playable, tested and runs without an API key, but it has drifted away from what the instructor called the core of the project (forking and side-by-side comparison). The planning documents (brief → PRD → architecture → stories) have not kept up. The task description itself is not in the repo, so these parts were assessed against the feedback and the brief.

1. **Forking and side-by-side comparison (top priority).** Missing, although the instructor called it "det som gjør prosjektet unikt" and part of the minimal version.
   At each event, run both the player's choice and the AI's recommendation forward, and show weeks, MNOK and the Gantt chart next to each other. The engine already supports it (clone + forecast).
   Affects criterion 2, Functionality (20 %), and the brief's second success criterion.
2. **Update the brief.** Scope and success criteria still describe four decision types, five outputs, an LLM scenario and forking.
   Set Scope to the minimal version that has been built. Move the v0.2 rules (crowding, event prices, the game engine) into Appendix A as the group's own rules, and check the numbers the AI proposed.
   Affects criterion 1, Process (30 %), and the instructor's next steps 1 and 2.
3. **Catch up on the PRD and the architecture.** The BMAD path skipped from the brief straight to build specs, so the trail from plan to code has a gap.
   Write a PRD (`bmad-prd`) and an architecture document (`bmad-architecture`) that describe what has actually been built, then break any further work into epics and stories.
   Affects criterion 1, Process (30 %), and criterion 5, Architecture (10 %).
4. **Clarify the AI part.** The AI roles are rule-based: no key is needed and they are testable, but it is not "KI-styrt" in the usual sense.
   Either add an optional LLM layer (reasoning text from Claude) with a demo mode of saved answers, or justify rule-based AI in the brief.
   Covers the instructor's next step 3 (choose a model, plan a demo mode).
5. **Two decision types of four.** Risk response and resource allocation are in place, which is the instructor's minimum.
   Planning strategy and change requests can come later as separate stages. Make sure the brief says so.
6. **Tests of the click flow and the 3D view.** There are 79 tests of the engine and the tab renderers, but none of `main.ts` or `view3d.ts`.
   Add DOM tests (Vitest + happy-dom) for play, pause, decision and resume, and pull the 3D floor and water counts out into a pure helper. Already recorded in `deferred-work.md`.
   Affects criterion 3, Quality assurance (15 %).
7. **README and repo tidiness.** The README's scope and success criteria do not match the app, and the planning documents are spread across the root and `.docs/`.
   Update the README, and gather the planning documents in one folder as the instructor suggested.
   Affects criterion 6, README (10 %), and criterion 7, Repo tidiness (5 %).
8. **What is going well, and should be kept.** The engine is pure, deterministic and separate from the UI. The hand-calculated examples are the tests' expected answers. Three independent reviews have triage logs. The game runs without a key.
   `G115_Dilemmas.md` and `G115_Changelog.md` give traceability. Keep writing in them on every change.
