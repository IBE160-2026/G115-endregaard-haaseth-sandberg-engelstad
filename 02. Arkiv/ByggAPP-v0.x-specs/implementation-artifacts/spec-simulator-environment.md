---
title: 'Simulator environment: Windows-style app with five tabs and a testable engine'
type: 'feature'
created: '2026-10-22'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'e7cd525f87f69985c0c60368bc2046eddb37aae5'
context:
  - '{project-root}/brief-G115-AI-prosjektledelse-simulering.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The project has a brief, a scenario (Appendix A) and an icon set, but no running application. The team and the instructor cannot yet see the scenario's people, buildings, disciplines, budget and schedule, or how the cost factors change them.

**Approach:** A Vite + TypeScript web app that looks like an in-game Windows 11 desktop (as in IT Specialist Simulator). It has one app window with five tabs: Menneskene, Byggene, Disiplinene, Budsjett, Fremdriftsplan. A pure simulation engine, separate from the UI, computes durations, cost and the Gantt schedule from the Appendix A data. The student can set each discipline to normal time (1.0), overtime (1.3) or extra hire (1.5), and the budget and Gantt chart recompute.

## Boundaries & Constraints

**Always:**
- The engine (`src/engine/`) has no DOM access and is deterministic. It reproduces Appendix A exactly: baseline 114 weeks / 283.10 MNOK, and examples 1 and 2.
- Money is shown in MNOK with 2 decimals, Norwegian format (`283,10`). The UI text is Norwegian.
- Uses the existing SVG icons from `assets/icons/` without redrawing them. Follows the system's light/dark theme.
- People: Prosjekteier, Prosjektleder, Site manager, plus one Formann per discipline (13).
- Buildings: the real phases as in `assets/icons/manifest.json` (BT1 A/D/H + basement, BT2 C + kjeller 2 + G, BT3 E, park).
- **Decision (Byggene):** the scenario is linked to **A-blokka + Kjelleranlegget (BT1)**. Those two cards are marked "I simulering" and show the scenario's areas (11,000 m² office, 4,000 m² basement) and its tasks. All other buildings are marked "Ikke i scenarioet". A short note says that the areas are those of the Light scenario, not the real buildings'.

**Never:**
- No AI advisor, decision points, forking, risks R1–R5 or LLM calls in this spec. They come in later stories.
- No backend, no accounts, no persistence beyond the current page.
- No UI framework (React etc.) and no chart library. The Gantt chart is generated SVG.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Baseline | All disciplines normal | 114 weeks, 283.10 MNOK, critical path A-C-D-E-F-G-I-J-N | N/A |
| Critical overtime | F = overtime | F 17 weeks, project 111 weeks, 282.52 MNOK (282.515) | N/A |
| Critical hire | F = extra hire | F 14 weeks, project 108 weeks, 282.95 MNOK | N/A |
| Non-critical hire | H = extra hire | H 12 weeks, project 114 weeks, 285.26 MNOK | N/A |
| Critical-path shift | I = extra hire | I 11 weeks, project 109 weeks, 282.77 MNOK | N/A |
| Rounding | Duration not a whole number of weeks | Rounded up to whole weeks. Labour paid for the actual hours only | N/A |

</frozen-after-approval>

## Code Map

- `brief-G115-AI-prosjektledelse-simulering.md` §Appendix A, sections 3, 3b and 6 -- the source for all task data (hours, crews, rates, materials, dependencies), the site overhead of 0.45 MNOK/week from week 16, the factor rules, and the expected answers.
- `assets/icons/manifest.json` -- categories, file names and Norwegian labels for every icon. The UI reads labels from here.
- `assets/icons/generate.mjs` -- the icon source. Don't change it; only read its output.
- `.gitignore` -- already covers `node_modules/` and `dist/`.
- There is no existing code, `package.json` or test setup.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` -- Vite + TypeScript + Vitest with scripts `dev`, `build`, `test`. `publicDir: 'assets'` so the icons are served under `/icons/`.
- [x] `src/engine/scenario.ts` -- typed scenario data from Appendix A (13 tasks, people, buildings, overhead).
- [x] `src/engine/simulate.ts` -- `simulate(scenario, modes)`. Returns, per task, the duration, start/finish week, labour and material cost and whether it's on the critical path, plus the project's weeks, overhead and total.
- [x] `src/engine/simulate.test.ts` -- tests for every row of the I/O matrix.
- [x] `src/ui/format.ts` -- `formatMnok(x)` → `"283,10"`, with a test.
- [x] `src/ui/gantt.ts` -- builds the SVG Gantt chart: a week axis, one bar per task with a discipline icon, the critical path highlighted, and a handover milestone diamond.
- [x] `src/ui/tabs/*.ts` -- one module per tab. Disciplinene has a mode selector (Normal/Overtid/Ekstra innleie) per discipline.
- [x] `src/main.ts`, `src/styles.css` -- the desktop (wallpaper and taskbar with app icons), the window (title bar and a NavigationView-style tab list), and Fluent tokens for light and dark.
- [x] `README.md` -- a short "Kjør lokalt" section (`npm install`, `npm run dev`, `npm test`).

**Acceptance Criteria:**
- Given the app is open, when the user clicks each of the five tabs, then the matching content is shown and the active tab is highlighted.
- Given Disciplinene, when F is set to overtime, then Budsjett shows a total of 282,52 and Fremdriftsplan shows 111 weeks, without reloading the page.
- Given Byggene, then A-blokka and Kjelleranlegget are marked "I simulering" and the other buildings "Ikke i scenarioet".
- Given Menneskene, then 16 people are shown with an icon, a role and (for foremen) their discipline and crew size.
- Given Budsjett, then every line and every sum has 2 decimals, and the labour, materials and site overhead lines add up to the total.
- Given Windows dark mode, then the window, cards and Gantt chart use the dark tokens and stay readable.

## Implementation Notes

- Implemented directly in the main session (no subagent). Files: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/engine/{scenario,simulate,simulate.test}.ts`, `src/ui/{format,format.test,gantt}.ts`, `src/ui/tabs/{context,people,buildings,disciplines,budget,schedule}.ts`, `src/main.ts`, `src/styles.css`, `README.md` (Kjør lokalt).
- Deviation from Code Map: icon paths and labels live in `src/engine/scenario.ts`, not read from `assets/icons/manifest.json`. Vite does not allow JS imports from `publicDir`, and fetching the manifest at runtime would add an async step for no gain.
- `formatMnok` rounds half away from zero with a 1e-6 nudge so 282.515 shows as 282,52 (binary floating point would otherwise give 282,51).
- Overtime and hire factors are applied per hour as in Appendix A 3b; extra hire is ⌈N/2⌉ workers. All crews are even, so the hired share is exactly 1/3.
- The Gantt chart scales to the container (viewBox, width 100%, min-width 820px); the dashed outline shows the baseline position for changed tasks.
- Verified: `npm test` 13/13 green, `npm run build` clean, Edge headless screenshots of all five tabs in light and dark, F=overtime → 282,52 MNOK / 111 weeks in the UI, 16 people, A-blokka + Kjelleranlegget marked "I simulering", no horizontal page scroll at 390 px.

## Spec Change Log

## Review Triage Log

Pass 1 (blind-hunter, edge-case-hunter, verification-gap). Route: patch, unless noted.

| # | Finding | Verdict | Evidence / route |
|---|---------|---------|------------------|
| 1 | Tab renderers and `ganttSvg` have no executing test (VG) | medium | Pre-verified gap. Patched: `src/ui/tabs/tabs.test.ts`. |
| 2 | Click → mode → re-render wiring in `main.ts` is untested (VG, BH) | medium | Pre-verified gap; needs a DOM test environment. Deferred to `deferred-work.md`. Checked by hand with CDP: F=overtime gives 282,52 / 111. |
| 3 | Mode-change tests never assert the critical path (VG) | medium | Pre-verified gap. Patched: `criticalPath` assertions for F-hire, I-hire and the new I+J-hire test. |
| 4 | Rounded budget rows don't add up to the shown sums (VG, BH, EC) | medium | Reproduced: F+H overtime rows give 107,59, the sum shows 107,58. Patched: `src/ui/budgetLines.ts` builds sums from øre-rounded lines; the statusbar uses the same total; reconciliation test added. |
| 5 | Critical tasks shown as an arrow chain when parallel (BH, EC) | low | Reproduced: I+J hire makes H critical, and it showed "G → H → I → J". Patched: shown as a list, "Kritiske aktiviteter". |
| 6 | Absolute `/icons/` paths break under a sub-path deploy (BH, EC) | low | Real for e.g. GitHub Pages; direct fix. Patched: `iconUrl()` with `import.meta.env.BASE_URL`. |
| 7 | `role="application"` on the window; tabs lack `aria-controls`/`aria-labelledby` (BH) | low | Real; direct fix. Patched. |
| 8 | Focus lost after a mode click re-renders the tab body (BH, EC) | low | Real for keyboard users. Patched: focus restored to the matching mode button. |
| 9 | Title-bar glyphs need Segoe Fluent Icons (BH) | low | Real on macOS/Linux. Patched: inline SVG glyphs. |
| 10 | README: Node 20 is too old, and "opens" is wrong (BH) | low | Vitest 5 needs Node ^22.12. Patched README. |
| 11 | "Innleie" vs "Ekstra innleie"; generator comment and `PALETTE.apps: null` (BH) | low | Direct fixes. Patched. |
| 12 | Gantt line labelled "Byggestart" at week 16 when A is shortened (BH) | low | The label was misleading. Patched: "Rigg og drift fra uke 16". The rule itself matches Appendix A §2 (see #13). |
| 13 | Overhead should follow A's actual finish (BH) | false | Appendix A §2 sets overhead "from week 16 until the project is finished"; the code follows it. Raised to the user as a team question. |
| 14 | Icon count missing from the diff / spec claims the icons already exist (BH) | false | The SVGs exist in the working tree. They were left out of the review diff on purpose (size), and they predate this build. |
| 15 | `publicDir: 'assets'` ships `generate.mjs`, `preview.html`, `manifest.json` (BH, EC) | low | Rejected: the files are harmless, and the fix means restructuring the folder. |
| 16 | Cycle, empty tasks or zero crew crash the engine (BH, EC) | false | The scenario is a fixed literal with no input path; nothing can reach these states. |
| 17 | No arrow-key navigation in the tablist (BH, EC) | low | Rejected: unlikely in this course context, and the fix adds a keydown handler. |
| 18 | Untested: odd crew, A-mode change, combined modes, icon paths vs manifest (BH) | low | Combined modes and icon-path tests added. Odd crew is not in the data (all crews are even), so rejected. |
| 19 | No lockfile; caret ranges; no `engines` field (BH) | false | `package-lock.json` exists; it was left out of the review diff on purpose. The lockfile pins the versions. |

## Design Notes

Factor rules (Appendix A 3b): overtime = 45 h/week, so labour × (1 + 1/6 × 0.3) = × 1.05. Extra hire = own crew N + ⌈N/2⌉ hired workers at 1.5, so labour × (N + 1.5h)/(N + h). Duration = ⌈hours / (workers × hours per week)⌉. Overhead = (project weeks − 16) × 0.45. Floating-point: compare sums with a tolerance of 1e-9 in tests, and round only for display.

## Verification

**Commands:**
- `npm test` -- expected: all tests green, including the I/O matrix.
- `npm run build` -- expected: no TypeScript errors.

**Manual checks (if no CLI):**
- `npm run dev`: click through the five tabs in light and dark mode, change the mode for F and H, and check the totals against the matrix.
