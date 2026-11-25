---
title: 'Rule gap: site capacity and the crew stepper'
type: 'feature'
created: '2026-11-22'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/FraTomtTilTak/implementering/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** R21 hires a fixed 12 workers, so the site never holds more than 24 + 12 = 36, while UX stops the crew stepper at a placeholder of 40. FR-33 (site capacity) can therefore never fire, and the rules have no R32, S36 or S37.

**Approach:** Write the group's confirmed resolution (epics story 1.2, confirmed 2026-11-18) into the planning documents. Keep the stepper, generalise R21 to `h` hired workers (4 to 16 in steps of 4, default 12), add R32 `24 + h ≤ 40` with S36 and S37, and add worked example (f). Then mark UX's 40 as the agreed figure and close spine Open Question 3. Example (c) must stay unchanged, because `h = 12` reproduces today's R21 exactly.

</frozen-after-approval>

## Implementation Notes

Files (all under `FraTomtTilTak/planlegging/`):

- `prds/prd-fra-tomt-til-tak-2026-10-31/simulation-rules.md`
  - Frontmatter `updated: 2026-11-22`. Add a **Revision 5** paragraph after Revision 4 (story 1.2, group confirmed 2026-11-18).
  - §2.1: S32 becomes the stepper default (12 = +50 % of crew; range 4–16 in S37 steps). Insert S36 (site capacity 40 at once, UX placeholder, [ESTIMATE]) and S37 (hiring step 4 workers, design choice) after S35. Leave S38–S40 to story 1.3.
  - §3 R21 generalised: `D = round(W × 24 ÷ (24 + 0.5h))`, extra cost `h × 37.5 × 650 × 0.5` NOK per week × D, rounded at the end. State that `h = 12` gives today's ×0.8 and 0.14625 MNOK/week. R25 ranks the hire option at `h = 12`; R27, R28 and R30 use the student's `h`.
  - New **R32. Site capacity** (FR-33), placed directly after R21 because it belongs with hiring. Ids are stable, so being out of numeric order is acceptable. Content: `24 + h ≤ 40` (S36). At `h = 16` the plus is disabled with "Maks 40 på byggeplassen samtidig". The adviser returns one capacity record the first time the plus is disabled at that event, so once per hiring decision. This reads "once" in the confirmed text as once per decision, not once per playthrough. Flag that choice to the group at checkpoint.
  - §4: add example (f) after example (d), copying the confirmed table and verifying each value by hand: h = 4/8/12/16 gives D 15/14/13/12, extra cost 0.731/1.365/1.901/2.340 and +0.431/+0.765/+1.001/+1.140 against 168.154. `h = 20` is impossible (44 > 40). Hiring 4 or 8 misses "resources have limits", because overtime gives D = 14 for 0.546. Example (c) text unchanged.
  - §5 open point 8: hiring range and capacity instead of "+12 hired".
- `ux-designs/ux-fra-tomt-til-tak-2026-10-31/EXPERIENCE.md` line ~108, the crew stepper row: steps of 4, from 4 to 16, starting at 12. Replace the placeholder assumption with "40 is S36 (R32), confirmed by the group 2026-11-18".
- `architecture/architecture-fra-tomt-til-tak-2026-11-05/ARCHITECTURE-SPINE.md` Open Questions: mark 3 closed (date, R21 generalised + R32). In 2, note that the FR-33 part is now written (R32).

Not in scope: R31, R33 and R34 or S38–S40 (stories 1.1, 1.3 and 1.4), the PRD (FR-33 already names R32 and S36), code, and `02. Arkiv/`.

**Paused 2026-11-22:** a parallel session is building story 1.1 in the same worktree and touches the same files (rules doc "Revision 5", spine OQ 2, sprint-status). The user chose to wait until 1.1 is committed. Then: rename this story's paragraph to **Revision 6**, re-apply on top of 1.1's spine OQ 2 text, and commit only the 1.2 hunks. Done so far: Revision paragraph, S32/S36/S37, R21 generalised, R32 after R21. Example (f) arithmetic has been checked with Node and matches the confirmed table (h = 20 gives 44 > 40).

**Resumed 2026-11-22 (user instruction):** branch `docs/1-2-site-capacity` was reset onto `story/1-1-rule-gap-milestones` (PR #7, tip `63cc7f1f18c4692da4a3a25f6bf4aef411689a39`). It had no commits of its own, so this is the rebase. The uncommitted WIP is kept in `git stash` ("story 1.2 WIP before rebase onto 1.1"). 1.2 is **Revision 6** and sits after 1.1's Revision 5. Example (f) is placed after 1.1's example (e). The spine's Open Question 2 builds on 1.1's update text. `G115_Changelog.md` gets a 1.2 entry above 1.1's. In sprint-status, 1.1 stays `review`. `epic-1-context.md` is 1.1's committed version, not the uncommitted copy. Example (c) was checked byte-identical against `HEAD`. Two choices were made here: closed Open Question 3 is struck through with a "Closed" note, and the R21 note says "the rule before revision 6".

Verify by recomputing the example (f) arithmetic and diffing to confirm example (c) is byte-identical. Work on branch `docs/1-2-site-capacity`. Commit locally. Pushing or opening the PR only on the user's go-ahead, because the PR needs the group's confirmation.

**Correction after review:** the file list above was written before the rebase. Where it says "Revision 5" and "after example (d)", read **Revision 6** and **after example (e)**, as the Resumed note says. Also changed: `FraTomtTilTak/G115_Changelog.md` and `sprint-status.yaml`. Review patches: R21/R32 now name S27/S36 and S37 instead of only the numbers, §1.4 state keeps `h`, the per-week-saved note covers every `h`, the "once" reading is marked [ASSUMPTION] with §5 point 21, open point 20 names R32, the spine's update is labelled story 1.2, and the UX row disables the minus at 4.

## Review Triage Log

Blind Hunter, 12 findings:

1. R32/S32 hardcode 24 and 16 instead of S27/S36: **medium**. The doc promises one data file. Patched: the formula names S27 + h ≤ S36 and the max is derived.
2. Cost per week saved is the same for every h: **low**. True, since D/(W−D) ≈ 48/h. Patched as a one-line rewording.
3. §1.4 state does not keep h: **medium**. R24/R27/R28/R30 need it. Patched.
4. R27 "followed" undefined when hiring with h ≠ 12: **medium**. Real new edge case, but it needs a group rule decision. Deferred.
5. Event-card forecast for the hire option and the stepper: **medium**. Unspecified in rules and UX. Deferred (stories 4.3/4.7).
6. "Once" interpretation not flagged in the rules doc: **medium**. Patched with [ASSUMPTION] and §5 point 21.
7. Open point 20 not updated for FR-33: **low**. Simple, so patched.
8. PRD FR-33 and epics still say "proposed": **low**. Out of scope by spec, and PRD edits use their own PR (same as 1.1). Deferred.
9. Stepper minimum not described: **low**. Simple, so patched in the EXPERIENCE row (minus disabled at 4).
10. No worked example for the R32 capacity record: **medium**. Belongs with the adviser rules. Deferred.
11. Spec notes contradict the Resumed note: **low**. Patched with the correction note above.
12. Two "Update 2026-11-22" entries in spine OQ 2: **low**. Patched with the label "(story 1.2, after 1.1)". The strikethrough style for closed OQ 3 is kept, because it shows the question and its answer together.
