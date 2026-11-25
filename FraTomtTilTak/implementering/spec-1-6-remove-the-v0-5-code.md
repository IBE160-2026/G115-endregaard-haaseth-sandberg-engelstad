---
title: 'Story 1.6: Remove the v0.5 code'
type: 'chore'
created: '2026-11-22'
status: 'done'
baseline_commit: '2491c85c62071025cfd1d4759df44cfb0d088e40'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/FraTomtTilTak/implementering/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `FraTomtTilTak/app/src` still holds the whole v0.5 game (*Regjeringskvartalet Light*). It is no longer started, but anyone can build on it by mistake, and it competes with the building-block model as a second "model of truth".

**Approach:** Carry out the spine's table "What happens to the v0.5 code": delete every **Remove** file with its tests, park the **Adapt** files (excluded from type-check and Vitest in one commented block), move the kept helpers (`format`, `iconUrl`), and rewrite `main.ts` to start through `mountApp(root, realDeps)`, which for now shows Oskar's landing page (`src/landing.ts`, commit `936a62b`). Drop `BASE_PATH`. The deployed page looks the same as today.

## Boundaries & Constraints

**Always:**
- `npm test` and `npm run build` pass in `FraTomtTilTak/app`.
- No non-parked file imports a removed module.
- The park list is one commented block in `tsconfig.json` and one in `vite.config.ts`, listing the same files.
- `mountApp` shows the existing landing page by calling `mountLanding(root)` from `src/landing.ts`, so the live page does not change. Decision: the AC's "only a placeholder title" is read as "nothing of the game", since the group chose the landing page after the epics were written.
- Code and comments in English; the Norwegian placeholder text stays as is.

**Never:**
- No new engine code, no styling work (`styles.css` stays untouched until story 2.2), no edits to parked files beyond the `iconUrl` import path, no edits to `src/landing.ts`, `src/landing3d.ts` or `assets/spill/`.
- No changes to `02. Arkiv/`, `package.json` version, dependencies or `vercel.json`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Start | Page loads `main.ts` | `mountApp(#app, realDeps)` renders the landing page | N/A |
| Repeat render | `setHtml(el, sameHtml)` twice | Second call returns `false` and leaves `innerHTML` alone | N/A |
| Delegated click | Click inside an element with `data-action="x"` and a handler for `x` | Handler runs once with that element | Unknown action or no `data-action`: nothing happens |
| Old URL params | `?uke=12&scene=walk` | Ignored; landing page renders | N/A |

</frozen-after-approval>

## Code Map

- `FraTomtTilTak/app/src/engine/{scenario,game,simulate,events,chapters,advisor}.ts` + `events.test.ts`, `game.test.ts`, `simulate.test.ts`, `story.test.ts` -- **delete** (AD-4).
- `src/ui/{story,scenes,play,hud,budgetLines}.ts`, `story.test.ts`, `src/ui/tabs/*` (incl. `tabs.test.ts`, `context.ts`), `src/ui/scene/walk.ts` + `walk.test.ts`, `src/ui/scene/challenge.ts` -- **delete**.
- `src/ui/tabs/context.ts:20-23` -- `iconUrl` and `icon` live here; move both to new `src/ui/icons.ts` before deleting.
- **Park** (keep, exclude): `src/ui/view3d.ts`, `src/ui/gantt.ts`, `src/ui/scene/visuals.ts`, `visuals.test.ts`, `world.ts`, `props.ts`, `cast.ts`. `view3d.ts` and `gantt.ts` import `iconUrl` from `./tabs/context` -- repoint to `./icons`. Their other broken imports (engine, walk, story, challenge) stay; they are fixed by the stories that adapt them.
- `src/ui/format.ts` + `format.test.ts` -- `git mv` to `src/content/format.ts` + `format.test.ts`; content unchanged.
- `src/main.ts` -- currently calls `mountLanding(#app)`; becomes an entry calling `mountApp`.
- `src/landing.ts` -- Oskar's landing page (`mountLanding(root)`, uses `document`/`window`, scroll animation). Keep untouched; `mountApp` calls it. Same for `src/landing3d.ts` (lazy three.js scene, commit `cf882bb`) and `assets/spill/index.html` (prototype served at `/spill/` through `publicDir: 'assets'`, commit `2bf37a8`): untouched, and `publicDir` and the three.js `optimizeDeps` stay.
- Old `setHtml` (git `167ad7c:FraTomtTilTak/app/src/main.ts:93-99`, WeakMap of shown HTML) -- reuse as `src/ui/dom.ts`.
- `src/version.ts` + test -- keep untouched (not in the table).
- `vite.config.ts:7-8` -- `BASE_PATH` line and comment; `test.include` is where Vitest exclusion goes (spread `configDefaults.exclude`).
- `tsconfig.json` -- `include: ["src", "vite.config.ts"]`; add `exclude`.
- `index.html` -- uses `%BASE_URL%`; still valid with base `/`, title already *Fra tomt til tak*. `package.json` name already `fra-tomt-til-tak`.
- No jsdom in the project: tests must use plain fake objects, not `document`.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/icons.ts` -- new: `iconUrl` and `icon`, copied from `tabs/context.ts` -- kept module for parked 3D/Gantt.
- [x] `src/ui/view3d.ts`, `src/ui/gantt.ts` -- import `iconUrl` from `./icons` -- only edit to parked files.
- [x] `src/content/format.ts`, `format.test.ts` -- `git mv` from `src/ui/` -- spine: format belongs in content.
- [x] Remove-list files above -- `git rm` -- AD-4.
- [x] `src/ui/dom.ts` -- new: `setHtml(el, html): boolean` and `onAction(root, handlers)` (one click listener, `closest('[data-action]')`, calls `handlers[action]?.(el)`), with `dom.test.ts` using fake elements -- AD-17 helpers kept from v0.5.
- [x] `src/ui/app.ts` -- new: `AppDeps` (`now(): number`, `seed(): number`) and `mountApp(root, deps)` that calls `mountLanding(root)`; `app.test.ts` mocks `../landing` and checks the root is handed over -- AD-17 entry point.
- [x] `src/main.ts` -- rewrite: `realDeps` (`Date.now`, random 32-bit seed) and `mountApp(document.querySelector('#app')!, realDeps)`.
- [x] `tsconfig.json`, `vite.config.ts` -- one commented "Parked until adapted (story 1.6)" block each; remove `BASE_PATH` and its comment (`base: '/'`).

**Acceptance Criteria:**
- Given the repo, when searching `src` (excluding parked files) for imports of any removed module, then there are none.
- Given `FraTomtTilTak/app`, when `npm test` and `npm run build` run, then both pass.
- Given `vite.config.ts`, when read, then it has no `BASE_PATH`.
- Given `npm run dev`, when the page opens, then it shows the same landing page as before.

## Implementation Notes

- Story 1.6 was implemented directly in the main session (no implementation subagent). The deleted file bodies were left out of the review diff (`git diff -D`).
- Added `src/ui/app.test.ts` (mocks `../landing`), so the matrix rows "Start" and "Old URL params" are covered by tests. The spec task originally said "no unit test".
- Review patches: `app.test.ts` now stubs `location` with `?uke=12&scene=walk`, and the `dom.test.ts` fake `closest()` answers only `'[data-action]'`. Added cases for a text-node target and an empty action, a JSDoc saying `setHtml` must be the only writer, and the `seed()` range in JSDoc. `vite.config.ts` exports `parked`, and the new `src/parked.test.ts` checks that it equals the tsconfig `exclude`. `README.md:35` and the `simulation-rules.md` example (i) generator pointer no longer point at deleted code.
- Final: `npm test` 5 files / 13 tests pass, `npm run build` OK.

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Evidence / route |
|---|---|---|---|---|
| 1 | BH, VG, ECH | URL-params test never sets `?uke`/`?scene`; it only checks that `location` is undefined | medium | True: the old test asserted the environment. Patch: stub `location` and assert `mountLanding(root)` once. |
| 2 | VG | `onAction` tests ignore the selector passed to `closest` | medium | True: the fake returned the holder for any selector. Patch: the fake answers only `'[data-action]'`. |
| 3 | BH, VG, ECH | Parked list in two places with nothing checking they match | medium | True: an un-park in one file only would silently skip tests. Patch: export `parked` and add `src/parked.test.ts`. |
| 4 | BH | No lasting guard that non-parked files never import parked/removed modules | low | True but planned: the import-direction scan is story 1.10. Defer. |
| 5 | BH, ECH | `setHtml` cache goes stale if someone else writes innerHTML | low | True by design (v0.5 behaviour); no writer other than setHtml exists. Patch: JSDoc says it must be the only writer. |
| 6 | BH, ECH | `onAction` has no unsubscribe and does not pass the Event | low | No caller exists (mountApp does not use it). The fix adds public surface. Rejected; the first story that wires clicks decides. |
| 7 | BH | `dom.test.ts` misses text-node target, empty action, `__proto__` | low | `Object.hasOwn` already guards prototype names (the `toString` case). Patch: added text-node and empty-action cases. |
| 8 | BH, ECH | `seed()` contract unclear; a zero seed could lock a xorshift PRNG | low / false | Range undocumented: patched in JSDoc. Zero seed: false for mulberry32, which adds 0x6D2B79F5 before mixing, so 0 is a valid seed. |
| 9 | BH, ECH | `icons.ts` untested; `icon()` unused; no escaping, always `alt=""` | low | Moved unchanged as the spec says; `icon()` is kept for the surfaces that will use it. Rejected. |
| 10 | BH | README, simulation-rules and FinalPrompt point at deleted code | medium / false | README:35 and simulation-rules example (i): true, patched. G115_FinalPrompt.md:139 describes v0.5 as built (ByggAPP paths, history for Epic 0): false. |
| 11 | BH | `base: '/'` redundant; comment duplicated; `#app!` gives an opaque error | low | Cosmetic; `index.html` always has `#app`. Rejected. |
| 12 | ECH | `./icons` import edit in parked files is unverified by tsc | low | `icons.ts` exports `iconUrl` with the same signature; checked by grep. Rejected; verified when the files are un-parked. |
| 13 | ECH | v0.5 `focusKey` (focus restore) was lost | false | It was removed with the placeholder in `5f3cc7c` (PR #6), not by this change, and the `setHtml` comment only claims focus is kept when the HTML is unchanged. |

## Verification

**Commands:**
- `cd FraTomtTilTak/app && npm test` -- expected: all pass (fewer than the 187 v0.5 tests; new dom/app tests included).
- `cd FraTomtTilTak/app && npm run build` -- expected: success.
- `grep -rnE "engine/(scenario|game|simulate|events|chapters|advisor)|ui/(story|scenes|play|hud|budgetLines)|tabs/|scene/(walk|challenge)|from '\./(story|scenes|play|hud|budgetLines|walk|challenge)'" FraTomtTilTak/app/src` -- expected: hits only in parked files.
- `grep -n BASE_PATH FraTomtTilTak/app/vite.config.ts` -- expected: no output.

**Manual checks:**
- `npm run dev`, open the page: landing page identical to before, scroll animation works.
