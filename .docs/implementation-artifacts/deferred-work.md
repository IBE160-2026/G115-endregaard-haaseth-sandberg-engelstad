# Deferred work

- source_spec: `.docs/implementation-artifacts/spec-simulator-environment.md`
  summary: Add DOM tests (Vitest + happy-dom or jsdom) for the click → mode → re-render flow in `src/main.ts`, including `#reset` and tab switching.
  evidence: No test imports `main.ts` and the repo has no DOM test environment. Only checked by hand: Edge headless over CDP gave F=overtime → 282,52 MNOK / 111 weeks.

- source_spec: `.docs/implementation-artifacts/spec-v0-2-interactive-simulator.md`
  summary: Widen the DOM tests to v0.2: play/pause/tick, pause on decision and resume after choosing, speed, toggle3d; pull the 3D floor/water counts out into a pure, testable helper.
  evidence: No test imports `main.ts` or `view3d.ts`; only checked over CDP (medium playthrough to the final report, no JS errors, light and dark).

- source_spec: `.docs/implementation-artifacts/spec-v0-2-interactive-simulator.md`
  summary: Team questions on game design. Should the "best" option be scored against the target (weeks + MNOK) instead of total cost? Should hired workers also count towards crowding? Should an event-chosen mode (overtime/hire) be locked for the rest of the discipline?
  evidence: maybe-false (medium if true). The frozen intent does not settle the rules. They change what the AI recommends and whether the base crew is always cheapest.

- source_spec: `.docs/implementation-artifacts/spec-v0-2-interactive-simulator.md`
  summary: Let the player enter a scenario number (seed) to replay or share a game.
  evidence: The seed is shown in the final report but cannot be entered.
