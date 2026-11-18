---
title: 'AI_BYGGplant v0.5: generate only what is asked, clarify first'
type: 'bugfix'
created: '2026-11-09'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Trond asked for a small cabin and got a large block of flats. In demo mode (no API key) the demo provider ignores what the user types and plays a scripted dialog step by step, so any free text shows a building nobody asked for. In live mode the system prompt lets Claude assume a common choice and draw a building before size, roof pitch and style are settled.

**Approach:**
- Demo mode plays a scripted step only when the user's line is that step's scripted line. Any other line gets an honest reply (this is a pre-written demo; choose a demo or connect Claude), no changes, and the project unchanged. Free text never picks a dialog the user did not choose.
- The system prompt makes Claude a construction project manager (prosjektleder) who generates only what the user asked for, never adds volumes, floors, units or openings the user did not ask for, and does not draw a building (volumes stay empty, budget and schedule stay empty) until building type, size, floors, roof type and pitch, and style (cladding/material) are clarified with the user. If the user does not know, Claude proposes a common value and asks the user to confirm it before using it.

</frozen-after-approval>

## Implementation Notes

- Files: `server/prompt.ts` (SYSTEM_PROMPT), `server/providers/demo.ts` (`demoTurn`), `src/main.ts` (`send`: only set the project's demo dialog when the first line is a dialog's first scripted line), tests in `server/providers/demo.test.ts` and `server/http.test.ts`.
- Matching the user's own text: `toApiMessages` prefixes the first message with `GREETING + "\n\n"` and suffixes the last one with `"\n\n[Prosjektet slik det står nå, som JSON]\n…"`; strip both, then compare case-insensitively with whitespace collapsed and trailing punctuation removed.
- Step counting: a step advances only for an assistant message that answered an on-script user line, so off-script turns never shift the script. Stopped turns (two user lines in a row) keep working as before.
- The off-script turn keeps the project of the last answered step (the demo project is only ever changed by scripted steps), or `emptyProject()` before the first step.
- Added `src/contract/script.ts` (`sameLine`, `scriptProgress`, import-free so node loads it) and used it in both the demo provider and `nextDemoLine` in `src/ui/chat.ts`, so «Neste demo-replikk» follows the same count as the server. `GREETING`/`PROJECT_SUFFIX` are kept in `server/providers/demo.ts` because node cannot load `src/session.ts` (extensionless imports); a test checks they match the client.
- `src/main.ts` picks a dialog when a typed line equals a dialog's first scripted line, at any point before a dialog is chosen (not only the first message), because the chooser now stays visible after free text.
- `src/ui/shell.ts` `demoChoices`: chips stay until a dialog is chosen. Removed the unused `userCount`. Version 0.5.0; G115_Changelog.md and G115_Dilemmas.md updated.

## Review Triage Log

- Off-script reply points to a chooser that is hidden after free text — medium, patched (`demoChoices` keys on the chosen dialog only).
- Demo fixtures still draw before roof/style are settled — medium, deferred (rewriting four scripted dialogs is beyond this fix; logged in deferred-work.md and as an open question in G115_Dilemmas.md).
- Off-script turn moves phase to `tomt` before anything is answered — low, patched (`oppstart`).
- GREETING/PROJECT_SUFFIX duplicated with no drift guard — medium, patched (test compares with `src/session.ts` and runs `toApiMessages` through `ownText`).
- `main.ts` picks a dialog on any message, not just the first — low, kept on purpose and the notes updated (the chooser now stays after free text).
- System prompt contradictions (lists, budget line, site-first order, flat-roof pitch, null wording) — medium, patched.
- No regression coverage for the live prompt — medium, patched with a test of the key rules; a server-side guard is deferred.
- `sameLine` is strict for retyped lines — low, rejected (the button and chips send the exact line; looser matching adds complexity for rare use).
- `userCount` dead code — low, patched (removed).
- Missing changelog/dilemmas/spec bookkeeping — low, patched.
