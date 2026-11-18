# Reconciliation: product brief → PRD

Input: `01. Admin/brief-G115-AI-prosjektledelse-simulering.md` (updated 2026-10-22, incl. Appendix A). Checked against `prd.md` and `addendum.md` (draft 2026-11-03).

## Covered

- Core loop (situation → recommendation → decision → two forecasts → comparison): FR-12, FR-16, FR-17.
- Four decision types: FR-8–11. Five outputs: FR-19–23.
- Users: student (primary) and instructor as evaluator: §2.1, UJ-1, UJ-2. No broader audience: §2.2.
- Out-of-scope list (multiplayer, MSPDI/XER/PMXML, cross-game analytics, realism beyond research): §6.
- Brief open questions: save/resume → P-11; domain → P-14.
- Vision of generalising to other domains: §1, kept outside the course scope.
- Appendix A §3–3b (tasks, crews, cost factors): FR-1–3. §4 seeded risks: FR-5. §5 DP1–DP4: FR-8, FR-9, FR-25. §6 worked examples: FR-7.
- Appendix A §7 team questions: 1, 2, 7, 8, 9 → §9 open questions; 3 → P-3; 4 → P-5; 5 → P-10; 6 → P-2. All nine covered.

## Gaps

1. **[high] The PRD and the brief now contradict each other on purpose, but the brief has not been updated.** The brief still has an LLM layer, a scenario parameterised by size/budget/risk profile, and all four decision types in v1. The PRD drops the LLM (P-7) and splits the scope into R1–R3 (P-15). The instructor explicitly asked for the brief to be updated so the history shows how the plan changed. The PRD only mentions it in a sentence in §7. *Fix:* make "update the brief" an explicit item, listing the brief sections it affects (Solution, Scope, Success Criteria 3).
2. **[high] Brief success criterion 3 (variation between playthroughs) has no FR or SM.** "Two playthroughs with the same input parameters produce recognizably different … while remaining internally coherent." The PRD has this only as UJ-3 and an addendum note. v0.5 meets it through seeds and `findStory` (every seed can be solved within both targets with full information), which the PRD does not mention. *Fix:* add an R2 FR for seed variation, with the testable condition "every seed has a story solution within both targets", and an SM. Mark the reinterpretation (seeds instead of an LLM) as part of P-7.
3. **[medium] Brief success criterion 4, "all outputs … update correctly after each decision", is not a consequence of any FR.** FR-19 and FR-20 describe the views but not that they refresh after a decision. *Fix:* add to FR-19, FR-20 and FR-23 that the view equals the current forecast after every decision and every crew or work-mode change.
4. **[medium] It is not stated which risks and events R1 contains.** Appendix A has five risks (R1–R5) and four decision points; v0.5 has 27 events. FR-5 and FR-8 do not say whether R1 is limited to R1–R5 plus DP1–DP4. *Fix:* state in FR-5 (or §7) that the event library for R1 is R1–R5, and that the other v0.5 events belong to R2/R3.
5. **[low] Milestones.** The brief lists milestones as part of the scenario skeleton; the PRD does not mention them. *Fix:* either define milestones (for example the chapters in FR-28) or drop them consciously in §6.
6. **[low] Who the student plays.** The brief says the student plays the *project manager*; the PRD's Vision and v0.5 have the student as the *project owner* (Statsbygg), with Elisabeth as the project manager. *Fix:* new proposal, P-17, to adopt the project owner role, and note it in the brief update.
7. **[low] Lightweight schema informed by PMI WBS/RBS** (brief, Out of scope). Not mentioned. Could go in the addendum as an architecture note.
