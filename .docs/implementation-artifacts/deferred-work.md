# Deferred work

- source_spec: `.docs/implementation-artifacts/spec-simulator-environment.md`
  summary: Add DOM tests (Vitest + happy-dom or jsdom) for the click → mode → re-render flow in `src/main.ts`, including `#reset` and tab switching.
  evidence: No test imports `main.ts` and the repo has no DOM test environment. Only checked by hand: Edge headless over CDP gave F=overtime → 282,52 MNOK / 111 weeks.
