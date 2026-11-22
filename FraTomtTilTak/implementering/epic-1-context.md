# Epic 1 Context: A foundation the group can check by hand

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Give the group a repo where every simulation rule runs as a test, every estimate can be changed in one data file, and the old v0.5 game (*Regjeringskvartalet Light*) is gone. Stories 1.1–1.5 are document stories that close rule gaps in `simulation-rules.md` (each needs a group confirmation in its pull request). Stories 1.6–1.13 are code: remove v0.5, add lint/format and CI, then build the pure engine foundation (units, parameters, seeded draws, worked examples, building-block model, risks and targets) that Epics 2–5 stand on.

## Stories

- Story 1.1: Rule gap: milestones
- Story 1.2: Rule gap: site capacity and the crew stepper
- Story 1.3: Rule gap: opportunities
- Story 1.4: Rule gap: a forecast that does not reveal the overrun
- Story 1.5: Rule gap: worked examples for R15, R29 and R30
- Story 1.6: Remove the v0.5 code
- Story 1.7: Linter and formatter
- Story 1.8: Continuous integration
- Story 1.9: Units, parameter file and references
- Story 1.10: Seeded table and purity checks
- Story 1.11: Worked examples as tests
- Story 1.12: Building-block model: concept to cost and time
- Story 1.13: Risks, responses, suggested reserve, targets and bands

## Requirements & Constraints

- The simulation is deterministic: same seed, plan and decisions give the same result.
- Every rule in `simulation-rules.md` has a worked example that runs as a test; a test fails if an `R` id has no test.
- Every parameter (S-values, risk table) lives in one data file so an estimate changes without touching code.
- `npm test` and `npm run build` in `FraTomtTilTak/app` must pass at the end of every story.
- Vercel deploys `main` automatically and does not run tests; CI (story 1.8) fills that gap.

## Technical Decisions

- **Layers and imports:** engine (`src/engine`, incl. `engine/adviser`) → nothing outside itself; content (`src/content`) → engine; ai (`src/ai`) → content, engine, `import type` of `server/contract.ts`; ui (`src/ui`, `main.ts`) → all. `server` imports nothing from `src`. Nothing imports from `02. Arkiv/`.
- **Pure engine:** no DOM, `three`, `fetch`, `Date`, `Math.random`, `localStorage`, `process` in `src/engine`; a test scans for these.
- **Draws:** `drawAll(seed)` runs mulberry32 (kept from v0.5) once into a fixed slot table; engine functions take `Draws`, not a seed.
- **Units:** money whole NOK, percent whole, weeks whole at rule outputs; rounding only via `roundDiv`/`floorDiv` in `engine/units.ts`; MNOK formatting only in `src/content/format.ts`.
- **Building-block model replaces the v0.5 scenario.** v0.5 `engine/scenario, game, simulate, events, chapters, advisor` and their tests are removed, never adapted or imported. Keep only mulberry32, the reliability values and the fork-record idea.
- **v0.5 disposition:** Remove `ui/story, scenes, play, hud, budgetLines`, `ui/tabs/*`, `scene/walk` (+tests) and `scene/challenge`. Rewrite `main.ts` as `mountApp(root, deps)` (keep `setHtml` and delegated `data-action` clicks; `?uke`/`?scene` give way to `?seed`). Adapt later: `ui/view3d.ts`, `scene/visuals.ts`, `scene/world, props, cast`, `ui/gantt.ts`. Keep `ui/format.ts`, moved to `src/content/format.ts`. `styles.css` is replaced by `DESIGN.md` tokens later.
- **UI:** vanilla TypeScript, no framework; surfaces are pure HTML-string renderers via `setHtml`, one delegated listener.
- **Rule traceability:** functions implementing a rule start their doc comment with the rule id (`/** R16: … */`); test titles start with the id.
- **Tests:** Vitest in Node for engine/content; DOM flows under jsdom later.
- **Conventions:** camelCase `.ts` files, test beside code as `name.test.ts`; code, comments and docs in English; student-facing text Norwegian, only in `src/content`.
- **Deployment:** Vercel is the only deployment; GitHub Pages is dropped, so `BASE_PATH` goes. Package and page title read *Fra tomt til tak*.
- **Stack:** TypeScript 7.0.2 (app), Vite 8.3.5, Vitest 5.0.5, three 0.186.1, Node 22 for CI.

## Cross-Story Dependencies

- 1.6 depends on nothing; 1.7 depends on 1.6 (one-time reformat skips parked files); 1.8 on 1.7; 1.9 on 1.7; 1.10 on 1.9; 1.11 on 1.10; 1.12 on 1.11; 1.13 on 1.5 and 1.12.
- 1.9 takes S36–S43 from stories 1.2, 1.3 and 1.5 (entered as proposed if not merged).
- Epic 2 stands on Epic 1; files parked by 1.6 are un-parked by the stories that adapt them (3D, Gantt).
