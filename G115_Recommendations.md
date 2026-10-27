# Recommendations – G115 simulator

An assessment of how well the simulator meets its goals, measured against the instructor's feedback (`tilbakemelding-product-brief.md`, the part 1 criteria of the grading guide) and the brief's success criteria, with recommended next steps. One section per simulator version (newest first). Each entry has at most four lines.

## v0.5 – 2026-10-27

**Overall:** the app is now a game you walk through. As Statsbygg you go to a foreman with a «!», meet with Elisabeth and Hedda round a 3D model of the challenge, and review the hours at the start-up meeting and at each chapter. The core from the feedback, the fork and the comparison with the AI's path, has been in place since v0.3. The engine is unchanged in v0.5: walking, meetings and HMS are presentation only. The biggest gaps now are the planning documents and tests of the click flow.

1. **Update the brief, the PRD and the architecture for v0.5 (top priority).** The documents still describe a dialog-based simulator without walking, meetings, HMS or staffing reviews.
   Describe the story layer (`src/ui/story.ts`) and the scene (`src/ui/scene/`) as their own parts beside the pure engine, and add the group's choices: Statsbygg as the player, the foremen's titles, and the foreman's view as input to Elisabeth and Hedda.
   Affects criterion 1, Process (30 %), and criterion 5, Architecture (10 %).
2. **Tests of the click flow.** The new logic is pure and tested (walking, routes, meeting scripts, HMS, objectives; 184 tests), but `main.ts`, which drives the clock and the scenes, has no tests.
   Add DOM tests (Vitest + happy-dom) for: arrive → meeting → choice → fork → resume, the staffing review, and the HMS check that pauses and resumes the clock.
   Affects criterion 3, Quality assurance (15 %).
3. **Play it on a real GPU, and keep the pace.** v0.5 has only been checked in headless Chrome with software WebGL. Bloom, up to 160 workers and the cast must hold a good frame rate on a student laptop.
   Time a full game: if walking and meetings make it too long, keep «Hopp over intro», G (walk there) and «Hopp over» in the meetings as the fast route, and consider a setting that starts meetings without walking.
4. **Clarify the AI part.** The AI roles are still rule-based. In v0.5 the foreman's view is input to Elisabeth and Hedda, and the player only sees their proposals.
   Explain this in the brief as a deliberate choice (testable, no key needed), or add an optional LLM layer for the reasoning text, with a demo mode of saved answers.
5. **Decisions that are still open.** Is 9 challenges per game the right pace (the story solutions now reach about 8–9)? Should the HMS checks or the replies cost money or time? Are the foremen's titles right (e.g. «Formann Betong» for E)? Are the v0.3 event prices and chances right?
   Answer them in `G115_Dilemmas.md` and update the scenario.
6. **Publishing.** Testers play the Claude Artifact (https://claude.ai/artifact/Nh9p4q3T5mbQaphKD9iSdY), which has to be shared from the Share menu and republished by hand.
   Ask the repo admins (bipa, TesAgi-HiMolde) to turn on GitHub Pages, so that every push to main publishes itself after the tests, at a fixed link anyone can open without logging in.
7. **The fork in 3D.** The fork card and the final report show the AI's path in numbers, but the site does not show it.
   A ghost building for the AI's path (Kai's roadmap) would make the comparison visible where the player is.
8. **What is going well, and should be kept.** The engine is pure and deterministic, and v0.5 left it untouched. The new story and walking logic is pure and tested. Demo links make presentations easy.
   `G115_Changelog.md`, `G115_Dilemmas.md` and the session logs give traceability. Keep updating them with every change.
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
