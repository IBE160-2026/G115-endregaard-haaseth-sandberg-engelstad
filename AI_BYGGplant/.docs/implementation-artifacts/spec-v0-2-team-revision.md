---
title: 'AI_BYGGplant v0.2: the team revision (risks, change log, budget ranges, report, projects, production server)'
type: 'feature'
created: '2026-10-29'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'e1b168c'
context:
  - '{project-root}/AI_BYGGplant/.docs/planning-artifacts/team-meeting-2026-10-29.md'
  - '{project-root}/AI_BYGGplant/.docs/implementation-artifacts/spec-v0-1-ai-dialog-draft.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The group's mandate is software worth 250 000 USD. In team meeting 1, Mats (the seller) named what a buyer asks first: can my customer take the result with them, can I trust the numbers, can I keep several projects? Jonas (the developer) added: can it run outside a laptop?

**Approach:** Ingrid's decisions 1–5 from the meeting:
- The AI also returns **risks** (probability, consequence, measure, cost) and **changes** (one line per change this turn). New tabs: **Risiko** and **Endringer** (with the budget total before and after each turn).
- Each budget line gets **uncertainty_pct**; the total is shown as a range.
- **Rapport**: a print layout of every tab, which the browser saves as PDF.
- **Prosjekter**: several projects in the browser; export and import as a `.byggplan.json` file. Sessions saved by v0.1 are migrated.
- **Production server**: `npm start` serves `dist/` and `/api/turn` with the same handler as the dev server, with a 512 kB request limit.

## Boundaries & Constraints

**Always:** the app keeps no building rules. The range comes from the AI's own uncertainty, and the risk total is a plain sum (the app does not guess at chances). The key stays on the server, and all AI text is escaped.

**Never (decision 7):** accounts, payment, a database, white-label, 3D or supplier price lists in this revision.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| A turn that changes something | `changes` not empty | A new entry in Endringer with the request, the changes and the budget Δ | — |
| A turn that changes nothing | `changes` empty | No new log entry | — |
| v0.1 data in the browser | `ai-byggplant-session` key | Becomes the first project; missing fields are filled in | Broken data → a fresh project |
| Import | Another JSON file | Not imported | «Filen er ikke et AI Byggplan-prosjekt.» |
| Deleting the last project | One project | A fresh empty project takes its place | — |
| Request too large | > 512 kB | 413 with a Norwegian message | Body drained, connection kept |
| Bad JSON body | `{bad` | 400 «Ugyldig forespørsel.» | — |
| Path traversal | `/../package.json` | `index.html` is served | — |

</frozen-after-approval>

## Code Map

- `server/prompt.ts` -- risks, changes, uncertainty in the prompt and the schema.
- `server/claude.ts` -- `createHandler` (shared), the body limit; the Claude call is streamed (`max_tokens` 32 000).
- `server/start.ts` -- the production server.
- `src/budget.ts` -- `budgetTotal`, `budgetRange`, `riskTotal`.
- `src/session.ts` -- `log` (the change log), `normalizeSession`.
- `src/projects.ts` -- the project store, export/import, v0.1 migration.
- `src/ui/tabs.ts` -- the Risiko and Endringer tabs, the range, `renderReport`.
- `src/main.ts`, `src/styles.css` -- the project bar, export/import/report buttons, the print layout.
- `.claude/skills/g115-agent-pm|dev|sales` -- Ingrid, Jonas and Mats.

## Tasks & Acceptance

- [x] Decisions 1–5 built, with tests (16 in total).
- [x] Agent skills for the three roles (decision 6).
- [x] Meeting notes, roadmap, changelog, dilemmas, README.

**Acceptance Criteria:**
- Given a project with a budget, when Budsjett opens, then every line shows ± % and the total shows a range.
- Given two turns that changed something, when Endringer opens, then both show with their budget Δ, the newest first.
- Given any project, when Rapport is clicked, then the print preview contains all six sections.
- Given `npm run build`, when `npm start` runs, then the app and `/api/turn` are served on PORT (default 8080).
- *(Still to verify with a real key: the AI fills in risks, changes and uncertainty sensibly.)*
