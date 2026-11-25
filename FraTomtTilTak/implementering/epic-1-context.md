# Epic 1 Context: A foundation the group can check by hand

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Every simulation rule runs as an automated test, every estimate can be changed in one data file, and the repo no longer contains the old v0.5 game (*Regjeringskvartalet Light*). The rule gaps that block later epics (milestones, site capacity, opportunities, the visible forecast, missing worked examples) are closed first as document changes to `simulation-rules.md`. Then the old code is removed, lint/format/CI are set up so every later pull request uses them, and the pure engine base is built: units, parameters, seeded draws, worked-example tests, the building-block model, and risks/targets/bands. Epics 2 and 3 build on this, so the numbers on screen are ones the group can check with a calculator.

## Stories

- Story 1.1: Rule gap: milestones (R31)
- Story 1.2: Rule gap: site capacity and the crew stepper (R32, generalised R21)
- Story 1.3: Rule gap: opportunities (R33)
- Story 1.4: Rule gap: a forecast that does not reveal the overrun (R34)
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

- **Determinism:** the same seed, plan and decisions always give the same result.
- **Traceable rules:** every parameter has a source or is flagged as an estimate; every rule has a worked example that runs as a test.
- **Pure, tested core:** engine, building-block model, adviser rules and event selection are pure and covered by automated tests (Vitest in Node, no network, no key).
- **Rule-gap stories (1.1–1.5) are document stories:** each edits `simulation-rules.md` (and where named `EXPERIENCE.md` or the architecture spine's open questions), and needs a group confirmation in its pull request. The resolutions were confirmed by the group on 2026-11-18. The ids R31–R34 and S36–S43 are now all in the rules.
- **Current figures live in `simulation-rules.md`, not in the epics file.** The worked examples in the epic were written before the fire rule changed (revision 3). Current values: building cost 75.534, base cost 166.054 for 7 floors/steel, targets **week 67 and 171 MNOK**, band limits 179.550 / week 71. Revision 4 (R30 amendment, S41–S43, examples (i), (j), (k)) is in the rules; S43 "small" means under 0.900 MNOK **and** under 3 weeks. R31–R34 are written into the rules (revisions 5–8, stories 1.1–1.4, examples (e)–(h)), and spine Open Questions 1–3 are closed. Example (d) ends at 174.354, week 69 (the epics file still shows the pre-fire-rule 172.554). The rule-gap phase is complete with story 1.5.
- **No unnecessary seed hunting:** targets are derived by R14 and judged in bands (R29: *På mål*, *Litt over*, *Klart over*), never stored.
- **Scope boundary:** no UI work in this epic beyond a placeholder `main.ts`; surfaces start in Epic 2.
- `npm test` and `npm run build` in `FraTomtTilTak/app` must pass at the end of every story.
- Vercel deploys `main` automatically and does not run tests; CI (story 1.8) fills that gap.

## Technical Decisions

- **Layers and import direction (enforced by tests):** `engine` (incl. `engine/adviser`) imports nothing outside itself; `content` → `engine`; `ai` → `content`, `engine`, `import type` from `server/contract.ts`; `ui` → all; `server` imports nothing from `src`. Nothing imports from `02. Arkiv/AI_BYGGplant/`.
- **Purity scan:** `src/engine` must contain no DOM, `three`, `fetch`, `Date`, `Math.random`, `localStorage`, `process`, and no imports from `ui`, `ai`, `content`.
- **Seeded draws:** `drawAll(seed)` runs the v0.5 mulberry32 once and returns a fixed `Draws` table: 5 deviations (slots 0–4), 4 known risks (5–8), 6 reliability (9–14), opportunity occurrence and choice (15–16). Slots never move; new draws are appended. Engine functions take `Draws`, not a seed, so tests inject values. Seed 115 must reproduce example (i) to 4 decimals.
- **Integer units:** money in whole NOK, probability in whole percent, durations as whole weeks at rule outputs (tenths inside a rule). All rounding division goes through `roundDiv` / `floorDiv` in `engine/units.ts` (half up; a halved risk delay rounds down). Round once, at the end of each rule. MNOK decimals exist only in `src/content/format.ts`.
- **One data file:** every S-value keyed by S-id plus the R10 risk table in `engine/data/params.ts`, each with `source` or `estimate`; citable projects (exactly those in the addendum's reference list, with figure, source, year) in `engine/data/references.ts`. A numeric literal in a rule function, other than 0, 1 and 100, is a defect.
- **Building-block model replaces the fixed scenario:** the project is derived from `Concept` (floors 3–8, system) by R1–R14. The six main parts are the only work breakdown, in fixed order.
- **Rule traceability:** the function implementing a rule has a doc comment starting with its id (`/** R16: … */`); test titles start with the id. `engine/worked-examples.test.ts` copies inputs and answers from the rules as fixtures. Unbuilt rules are `it.todo`. A coverage test reads `simulation-rules.md` and fails for any R id without a test, except ids in a `pending` list that shrinks to empty by the end of Epic 5. A failing example is fixed in code, or in the document first if the rule changes.
- **Errors:** the engine throws only on programmer error (unknown id). Bad input (e.g. 8 floors breaking the 28 m height limit) is returned as a warning record.
- **Ids:** parts `permit, ground, frame, envelope, interior, handover`; systems `cast, precast, steel, clt`; responses `accept, reduce, transfer, avoid`; events `E1`–`E10`, opportunities `O1`, `O2`.
- **Files:** camelCase `.ts`, test beside code as `name.test.ts`, one rule group per engine file. Target layout: `engine/{data, adviser, debrief}`, `engine/units, draws, concept, risks, targets, …`.
- **v0.5 removal (1.6):** remove `engine/scenario, game, simulate, events, chapters, advisor`, `ui/story, scenes, play, hud, budgetLines`, `ui/tabs/*`, `scene/walk`, `scene/challenge`, with their tests. Keep the mulberry32 generator and the reliability values (copy them into the new code first). Move `ui/format.ts` to `src/content/format.ts`; move `iconUrl` out of `ui/tabs/context`. Park the files marked "Adapt" (`ui/view3d.ts`, `ui/gantt.ts`, `ui/scene/visuals.ts`, `world.ts`, `props.ts`, `cast.ts`) in one commented exclusion block in `tsconfig.json` and `vite.config.ts`. Rewrite `main.ts` to `mountApp(root, realDeps)` with a placeholder title; drop `?uke`, `?scene`, and `BASE_PATH`; rename the package and page title to *Fra tomt til tak*.
- **v0.5 disposition:** Remove `ui/story, scenes, play, hud, budgetLines`, `ui/tabs/*`, `scene/walk` (+tests) and `scene/challenge`. Rewrite `main.ts` as `mountApp(root, deps)` (keep `setHtml` and delegated `data-action` clicks; `?uke`/`?scene` give way to `?seed`). Adapt later: `ui/view3d.ts`, `scene/visuals.ts`, `scene/world, props, cast`, `ui/gantt.ts`. Keep `ui/format.ts`, moved to `src/content/format.ts`. `styles.css` is replaced by `DESIGN.md` tokens later.
- **UI:** vanilla TypeScript, no framework; surfaces are pure HTML-string renderers via `setHtml`, one delegated listener.
- **Tests:** Vitest in Node for engine/content; DOM flows under jsdom later.
- **Conventions:** camelCase `.ts` files, test beside code as `name.test.ts`; code, comments and docs in English; student-facing text Norwegian, only in `src/content`.
- **Deployment:** Vercel is the only deployment; GitHub Pages is dropped, so `BASE_PATH` goes. Package and page title read *Fra tomt til tak*.
- **Stack:** TypeScript 7.0.2 (app), Vite 8.3.5, Vitest 5.0.5, Node 22.x. The server package (later, Story 3.7) stays on TypeScript ~5.9.3.
- **Lint/format (1.7):** proposed Biome, because TypeScript 7 lacks the JS API that `typescript-eslint` relies on. Verify before choosing, and record the reason if it changes. The one-time reformat goes in that pull request only, and parked files are left out.
- **CI (1.8):** a root GitHub Action on Node 22 runs lint, tests and build for `FraTomtTilTak/app`. It skips `FraTomtTilTak/app/server` while it does not exist. Vercel does not run tests.

## Cross-Story Dependencies

- **Phase A (rules):** 1.1–1.4 are merged; 1.5 closes the phase.
- **Phase B (clear the ground):** 1.6 is merged; 1.7 → 1.8 next, one at a time, since 1.7 touches nearly every file. Hold other code branches until 1.7 merges.
- **Phase C (engine):** 1.9 (after 1.7) → 1.10 → 1.11 → 1.12 → 1.13. 1.13 also needs 1.5. S36–S43 come from the rules as written.
- **Downstream:** Epic 2 builds on the engine; Story 2.2 can start after 1.7. Adviser rule stories 3.1 and 3.2 need only 1.13. Story 3.7 turns on the server package in CI. R31–R34 are implemented in 2.7, 4.2, 4.3, 4.4 and 4.9, not in this epic.
- **Archive:** `02. Arkiv/` is history and not a source. The only planned exception is Story 3.7, which copies server code from it.
