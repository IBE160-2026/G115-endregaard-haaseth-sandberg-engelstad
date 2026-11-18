# Deferred work

- source_spec: `ByggAPP/.docs/implementation-artifacts/spec-simulator-environment.md`
  summary: Add DOM tests (Vitest + happy-dom or jsdom) for the click → mode → re-render flow in `src/main.ts`, including `#reset` and tab switching.
  evidence: No test imports `main.ts` and the repo has no DOM test environment. Only checked by hand: Edge headless over CDP gave F=overtime → 282,52 MNOK / 111 weeks.

- source_spec: `ByggAPP/.docs/implementation-artifacts/spec-v0-2-interactive-simulator.md`
  summary: Widen the DOM tests to v0.2: play/pause/tick, pause on decision and resume after choosing, speed, toggle3d; pull the 3D floor/water counts out into a pure, testable helper.
  evidence: No test imports `main.ts` or `view3d.ts`; only checked over CDP (medium playthrough to the final report, no JS errors, light and dark).

- source_spec: `ByggAPP/.docs/implementation-artifacts/spec-v0-2-interactive-simulator.md`
  summary: (Resolved 2026-10-22, see the Spec Change Log in the v0.2 spec.) Team questions on game design. Should the "best" option be scored against the target (weeks + MNOK) instead of total cost? Should hired workers also count towards crowding? Should an event-chosen mode (overtime/hire) be locked for the rest of the discipline?
  evidence: maybe-false (medium if true). The frozen intent does not settle the rules. They change what the AI recommends and whether the base crew is always cheapest.

- source_spec: `ByggAPP/.docs/implementation-artifacts/spec-v0-2-interactive-simulator.md`
  summary: Let the player enter a scenario number (seed) to replay or share a game.
  evidence: The seed is shown in the final report but cannot be entered.

- source_spec: `ByggAPP/.docs/implementation-artifacts/spec-v0-3-content-consequences-ai-roles.md`
  summary: Generate dedicated icons (via `assets/icons/generate.mjs`) for the v0.3 events, so strategy choices, change requests and risks such as theft, inspection and crane failure no longer share or borrow unrelated icons.
  evidence: Review 1 (BH13): every strategy uses `decision-point.svg` and every change request uses `resource-allocation.svg`; `theft`, `inspection` and `crane` reuse risk icons drawn for other risks.

- source_spec: `ByggAPP/.docs/implementation-artifacts/spec-v0-3-content-consequences-ai-roles.md`
  summary: Cover play/pause resume around the fork card in a DOM test (resume only after «Fortsett», and stay paused while a queued decision is open).
  evidence: Review 1 (VG1): no test imports `main.ts`; only checked by reading the click handler. Belongs with the existing DOM-test entries above.
