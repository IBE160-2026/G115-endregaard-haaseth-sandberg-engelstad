---
title: 'Save code: what a playthrough code must hold'
status: draft
created: '2026-11-22'
author: Trond Engelstad (with Claude Code)
decisions:
  - 'Self-contained code: the whole state is packed into the code itself. No server, no database. (Trond, 2026-11-22)'
  - 'A code from another rules version is rejected with an explanation, never replayed on new rules. (Trond, 2026-11-22)'
  - 'For now this is a description only. PRD, UX, architecture and epics are not changed yet. (Trond, 2026-11-22)'
---

# Save code: what a playthrough code must hold

## Idea

The student can choose **Lagre**. The page then shows a code. Typed in later, the code restores the playthrough exactly where the student left it, with exactly the same numbers, events and adviser output as the first time.

No account, e-mail or password is needed, and nothing is stored on a server. The code holds only game choices, so no personal data is collected. This keeps NFR-1 (runs with no keys, accounts or backend) and the PRD's privacy rule ("No personal data is collected").

## Why a short code is enough

The architecture already makes a playthrough reproducible from a few inputs:

- The engine is pure and deterministic: the same seed, plan and decisions give the same result (FR-30, AD-1).
- All randomness is drawn once from the seed into a fixed table (`drawAll(seed)`, AD-2). Events are fixed at approval from plan and draws (AD-6).
- Every figure, warning, suggestion, forecast and the debrief is computed by `derive(state)` and never stored (AD-7, AD-8).

So the code stores only what the student **chose**, plus the seed. Everything else is recomputed.

## What the code must hold

| Field | Values | Why it is needed |
|---|---|---|
| Format version | Integer | Lets the code layout change later. |
| Rules version | Integer, from the simulation rules revision and `params.ts` | The same choices give other numbers if a rule or parameter changes. A mismatch is rejected (see below). |
| `seed` | 32-bit integer | Drives all draws (R15). |
| `difficulty` | easy, medium, hard | AI reliability (S35, R25). |
| `stage` | Where the student stopped: site office, a stage 1 step, stage 2, debrief | Where to reopen. |
| `floors` | 3–8 | Concept (FR-4). |
| `system` | cast-in-place, precast, steel, CLT | Concept (FR-5). |
| `estimate[1..6]` | Whole weeks ≥ 1 per main part | Schedule (FR-8). |
| Milestones | 2–3, each a main part or week | FR-32 (rule pending, story 1.1). |
| `response[risk]` | accept, reduce, transfer, avoid, per known risk (4) | FR-11. |
| `reserveWeeks` | Whole weeks ≥ 0 | FR-12. |
| `reserveCost` | Whole NOK ≥ 0 (or whole thousands) | FR-12. |
| Plan approved | Yes or no | After approval the plan is locked (FR-13). |
| Stage 2 decisions | In event order: the option chosen per event, incl. overtime, heavy overtime or hiring, and the part it applies to | `replay` reads decisions from the log (AD-6, AD-8). |
| Playback week | Whole week | Where in stage 2 to reopen. Not a decision; could be dropped and reopened at the last decided event. |
| Checksum | A few characters | Catches a mistyped code before it is read. |

**Not in the code:** wall-clock times in the log (`at`), UI state (open panels, adviser chat, free-text questions and answers, 3D camera), anything derived (costs, weeks, events, warnings, AI path, debrief). Free-text questions are never saved, so nothing the student wrote leaves the browser.

## Size

Roughly 150–200 bits: seed 32, plan about 80, milestones about 20, stage 2 decisions about 15, versions, stage and checksum the rest. In a readable alphabet without look-alike characters (Crockford base32: no I, L, O, U) that is **about 30–45 characters**, shown in groups, for example `FTT1-K7Q2-9XMB-…`. The same code can also be offered as a link (`?kode=…`) and a copy button.

## Rules for reading a code

- **Same code, same result.** Reading a code rebuilds the state by replaying the stored commands through `reduce`, then `derive` does the rest. Nothing else is restored.
- **Wrong rules version:** the page says the code is from an older version of the game and cannot be opened. It never replays old choices on new rules.
- **Bad checksum or unreadable code:** the page asks the student to check the code. No technical error is shown (spine convention: the student never sees an error message).
- **A value outside the rules** (e.g. 9 floors) is treated as an unreadable code.
- Reading a code is a pure function, so it is tested in Node like the engine: encode → decode gives the same `Playthrough`, and a code from every worked example reopens with the same figures.

## Open points

1. **Stage 1 log entries.** The decision log records stage 1 at commit points, including "used the suggestion" (AD-8). If the code holds only the final plan, a restored log shows the plan but not those steps. Options: keep only the final plan (shorter code), or add a few bits per step for "suggestion used". Affects FR-29 (decision log) only, not the numbers.
2. **Fields not settled yet.** Milestones (story 1.1), site capacity and the crew stepper (story 1.2) and opportunities (story 1.3) may add choices. The field list is final only after those stories.
3. **Rules version.** How it is set: by hand on every rule change, or computed from `params.ts` and the rules revision.
4. **Planning documents.** EXPERIENCE.md says "no save or resume in v1" and PRD §8.3 lists "Saving and resuming (could have)" as out of scope for MVP. Adopting the save code needs a change to the PRD (new FR), UX, architecture (code format) and a new story, likely in Epic 2 after story 2.1. Not done; the group decides.
5. **The prototype at `/spill/`** does not use the new engine, so the save code does not apply to it.
