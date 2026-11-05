# Reconciliation: instructor feedback → PRD

Input: `01. Admin/tilbakemelding-product-brief.md` (2026-10-06). Checked against `prd.md` and `addendum.md` (draft 2026-11-03).

## Covered

- **Change 1, simulation model written:** FR-1–7, NFR-3, with the worked examples as tests (FR-7).
- **Change 2, minimal version:** R1 = one fixed scenario, risk response + resource allocation, fork and comparison of schedule and cost (§7, P-15). Matches the instructor's suggestion almost word for word.
- **Change 3, LLM choice, cost and key:** answered by removing the LLM (FR-15, P-7, addendum B), with no key needed (FR-24) and a demo game (FR-25).
- The advisor picks from the same options as the student: FR-12.
- Determinism as a basis for tests: FR-5, NFR-1.
- Separation of engine, AI layer and view: NFR-2, FR-26.
- Secrets in `.env` outside Git: NFR-6. Planning documents in their own folder: the PRD is in `01. Admin/planning-artifacts/`.
- Construction only: P-14.

## Gaps

1. **[high] The new rules have no written rules or worked examples.** The instructor's biggest concern: "if Claude Code also invents the simulation rules, nobody can tell whether the outcomes are reasonable. Write the rules yourselves, simple and explicit, with hand-calculated examples." The PRD meets this for R1 (Appendix A), but not for the rules v0.5 added: crowding (FR-4, only one example), strategy choices (FR-10), change requests with the cost of deferring (FR-11), opportunities and follow-up events (FR-29), and difficulty (FR-14). NFR-3 requires them, but no FR has a testable consequence for them. *Fix:* give FR-10, FR-11, FR-14 and FR-29 at least one testable consequence each, and point to where the rule will be written (brief Appendix A, or a new appendix). v0.5's tested example «Vann i kjeller» (+2 weeks, +1.70 MNOK) can be the first one for events.
2. **[high] How the advisor scores options is not written as a rule, although the group decided it.** The v0.2 spec change log (2026-10-22) records the team's answer: the AI scores options against both targets as **the sum of the relative overruns in MNOK and weeks**. The PRD has only "closest to both targets" under P-6, which cannot be tested. It also does not say what the advisor knows: in v0.5 it scores options on the forecast, which assumes no new events, so it does not know the seed. *Fix:* write the scoring formula into FR-12 and add "the advisor does not know which risks will happen". Change P-6 from an open proposal to "team decision 2026-10-22, confirm".
3. **[medium] Sketch of the comparison screen (assessment criterion 4, 10 %).** The instructor asked to sketch how two Gantt charts and cost figures are shown together without clutter. FR-17 and P-8 describe it, but there is no sketch. *Fix:* leave the sketch to the UX step (`bmad-ux`), and point to it from FR-17.
4. **[medium] "Update correctly" and "internally coherent" need definitions.** The instructor flagged both in the brief's success criteria. "Update correctly" → see brief gap 3. "Internally coherent" → see brief gap 2 (story solution within both targets).
5. **[low] Time and scope risk.** The instructor rated time and scope a big risk and asked for time to test, fix and write the README. The PRD has no time plan. That belongs in sprint planning, but §7 could say which remaining items (FR-7, FR-25, FR-23, NFR-4, the brief update) must be done before the deadline.
6. **[low] Repo tidiness.** The brief and the feedback still sit loose in `01. Admin/`, while the PRD is in `planning-artifacts/`. Moving them is the group's decision; it is not a PRD issue.
