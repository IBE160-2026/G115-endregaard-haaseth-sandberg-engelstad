---
title: 'AI_BYGGplant v0.1: an AI dialog that plans a building project, shown in tabs (draft)'
type: 'feature'
created: '2026-10-29'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'a765ca3'
context:
  - '{project-root}/01. Admin/brief-G115-AI-prosjektledelse-simulering.md'
  - '{project-root}/ByggAPP/G115_FinalPrompt.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** ByggAPP runs one fixed scenario with rule-based roles. The group wants a second app where the building project itself comes from a conversation: the user says what is to be built, and an AI asks the questions a builder would ask, in a natural order, and turns the answers into a structured project with a budget and a Gantt schedule.

**Approach:** A new folder `AI_BYGGplant/` with the same stack and look as ByggAPP (Vite + TypeScript, Fluent glass):
- The app opens with «Hei, hva skal bygges?». The user answers in free text.
- Claude asks 1–3 questions per turn, narrow first and broader later: site and terrain, size and floors, doors, windows and gates (a garage gets a question about its gate), materials and services, then budget and schedule, then details.
- Every turn Claude returns the whole project as structured JSON (facts, building, openings, budget lines, tasks, assumptions). The app has no building rules; it only draws what the AI returns.
- The dialog is always open: the user can change anything at any time, and the AI updates the whole project.
- Tabs: Oversikt (phase, facts, assumptions), Bygget (four elevations and a plan in SVG, openings table), Budsjett (lines with shares and total), Fremdrift (Gantt).

## Boundaries & Constraints

**Always:**
- The input is AI-generated without rules (the group's wording, 2026-10-29): the questions, the budget and the schedule come from Claude. The drawing defaults (e.g. 1.0 × 2.1 m for a door without measures) only affect the picture, never the data.
- The API key stays on the dev server (`AI_BYGGplant/.env`, git-ignored); the browser only calls `POST /api/turn`.
- Model `claude-opus-5-5`, structured output against a strict JSON schema, refusal fallback on.
- UI text in Norwegian; everything the AI writes is escaped before it is shown.

**Never:**
- No accounts, no database. The dialog is remembered in the browser only (localStorage, guarded).
- No 3D in this draft.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Start | New session | «Hei, hva skal bygges?» and empty tabs with hints | — |
| First answer | "En garasje" | AI reply, 1–3 questions with answer chips, phase moves on | — |
| Change | "Gjør den 8 m lang" | The whole project is updated, tabs redraw | — |
| Answer chips | Click a chip | The answer is added to the text box; Send submits | — |
| No key | `.env` missing | Error in the dialog saying how to add the key | 503 from `/api/turn` |
| Bad JSON / refusal / rate limit | — | A Norwegian error message in the dialog; the session is kept | 502 / 429 |

</frozen-after-approval>

## Code Map

- `server/prompt.ts` -- the system prompt (the question order) and the strict JSON schema.
- `server/claude.ts` -- the Vite plugin: `POST /api/turn`, `askClaude`, `cleanMessages`, error mapping.
- `src/types.ts` -- `AiTurn`, `Project`, `Building`, `Opening`, `BudgetLine`, `Task`, the phases.
- `src/session.ts` -- the dialog state; `toApiMessages` sends the current project with the newest user message only.
- `src/ui/building.ts`, `src/ui/gantt.ts`, `src/ui/tabs.ts` -- the tabs.
- `src/main.ts`, `src/styles.css` -- the page: the dialog on the left, the tabs on the right.

## Tasks & Acceptance

- [x] Scaffold `AI_BYGGplant/` (package.json, Vite, TypeScript, icons from ByggAPP).
- [x] Prompt, schema and server route.
- [x] Dialog with answer chips and «Ny» (new session).
- [x] The four tabs.
- [x] Tests: session messages, server validation, schema strictness, drawing, Gantt, formatting.
- [x] `G115_Changelog.md`, `G115_Dilemmas.md`, README section.

**Acceptance Criteria:**
- Given a new session, when the app opens, then it says «Hei, hva skal bygges?».
- Given a valid API key, when the user describes a garage, then the AI asks narrow questions first and asks about the gate before materials, and the budget and the Gantt appear once size, floors and openings are known. *(Not yet verified: no API key on the development PC.)*
- Given a project, when the user asks for a change, then the tabs show the updated project.

## Design Notes

The AI returns the whole project every turn rather than a diff. That costs more output tokens but makes changes trivial and keeps the app free of merge rules. The project JSON goes with the newest user message only, so the history does not repeat it.
