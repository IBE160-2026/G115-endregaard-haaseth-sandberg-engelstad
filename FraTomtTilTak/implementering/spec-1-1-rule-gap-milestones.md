---
title: 'Story 1.1: Rule gap: milestones (R31)'
type: 'chore'
created: '2026-11-22'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/FraTomtTilTak/planlegging/epics.md'
  - '{project-root}/FraTomtTilTak/implementering/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** FR-32 (milestones) has no rule in `simulation-rules.md` (§5 open point 20), so the schedule, execution and debrief stories cannot build the same thing. Spine Open Question 2 lists FR-32 as still open.

**Approach:** Write the group-confirmed resolution from epics story 1.1 (confirmed 2026-11-18) into `simulation-rules.md` as R31 with worked example (e), drop milestones from open point 20, and remove FR-32 from spine Open Question 2. The example (e) figures are weeks only, so the 2026-11-05 fire-rule change does not affect them (frame 29 → 41, envelope 37 → 51, both *Ikke nådd*, 12 and 14 weeks late).

</frozen-after-approval>

## Implementation Notes

- Files: `FraTomtTilTak/planlegging/prds/prd-fra-tomt-til-tak-2026-10-31/simulation-rules.md` (R31, example (e), §1.1 input, §5 point 20, revision 5 note, `updated`), `FraTomtTilTak/planlegging/architecture/architecture-fra-tomt-til-tak-2026-11-05/ARCHITECTURE-SPINE.md` (Open Question 2).
- R34 (visible forecast) is not written yet (story 1.4). R31 refers to it forward as "R34, epics story 1.4" and states the one property the example needs: unstarted parts count at the student's estimate.
- R31 goes in a new subsection after R30, because it spans stage 1 input, stage 2 status and the debrief.
- Example (e) goes after example (d), keeping the letter order.
- `02. Arkiv/` is not used.
- Surprise: a second session worked on story 1.2 in the same checkout and switched the branch. With the user's approval the 1.1 work moved to a separate worktree (`../G115-story-1-1`, branch `story/1-1-rule-gap-milestones`) and was removed from the shared checkout. Story 1.1 takes revision 5; story 1.2 must renumber to revision 6.
- Also changed: `FraTomtTilTak/implementering/sprint-status.yaml` (1-1 status), `FraTomtTilTak/implementering/epic-1-context.md` (new; R31 status line), `FraTomtTilTak/G115_Changelog.md` (revision 5 entry), §1.4 state note.
- After review: R31 now defines finish week and "passed", re-check cadence, week ≥ 1, the visible-forecast property inline, debrief wording for Nådd; example (e) week 30 row filled in and an edited-week variant added that ends Nådd.

## Review Triage Log

- Example (e) lacks Nådd — medium, real (FR-31 wants every rule testable). Patched: edited-week variant ends Nådd.
- Edited-week behaviour not exemplified — medium, real. Patched with the same variant.
- Week 30 row has blank cells — low, real. Patched (39, 47).
- "Has passed" boundary and re-check cadence unclear — medium, real. Patched: finish week as R8, passed = current week greater; re-checked weekly and after decisions (FR-22).
- No validity limits on milestone week — low, real. Patched: whole week ≥ 1.
- Visible-forecast property only in the example — low, real. Patched into R31's I fare bullet.
- Debrief wording for Nådd undefined — low, real. Patched.
- Spine OQ2 rewrites the dated note; R34 mislisted — medium, real. Patched: 2026-11-18 note restored verbatim, a 2026-11-22 note appended with R32/R33 and R34 separated; FR-32 dropped only from the headline as the AC requires.
- Other docs still call R31 unwritten — epic-1-context: low, patched. PRD FR-32: medium, deferred (spec edit).
- EXPERIENCE.md not updated — medium, deferred (UX contract, outside the AC).
- Changelog/memlog/spec file list — changelog low, patched; memlog low, deferred; file list patched in notes.
- Spec has no AC or verification — false: the oneshot route drops those sections by design; the group confirmation (2026-11-18) is recorded in the Intent and epics story 1.1.
- Milestones absent from §1.4 state and decision log — low, real. Patched: one sentence in §1.4 (from the plan, status computed, not logged).
</content>
</invoke>
<invoke name="Bash">
<parameter name="command">cat "C:/Users/eliza/Documents/IBE160/Semester_oppgave/G115-endregaard-haaseth-sandberg/_bmad/render/bmad-build/g115-endregaard-haaseth-sandberg-c9638d499fa6/7a5326f3faf99535f713/step-oneshot.md"