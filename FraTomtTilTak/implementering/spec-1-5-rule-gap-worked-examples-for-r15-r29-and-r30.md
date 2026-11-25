---
title: 'Rule gap: worked examples for R15, R29 and R30'
type: 'chore'
created: '2026-11-25'
status: 'done'
route: 'oneshot'
baseline_commit: '4d970eac5e54848d35954c332dbd4e6c7deb29a1'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 1.5 has been `in-progress` since sprint planning. Its content (examples (i), (j), (k), the amended R30, and S41–S43) went into `simulation-rules.md` as revision 4 on 2026-11-18. The last criterion, "§5 lists no rule gap", had to wait for 1.1–1.4, and they are now merged. Nobody has checked the story against its acceptance criteria and closed it.

**Approach:** Check every acceptance criterion against `main` and recompute the figures in (i), (j) and (k). Fix the small faults that turn up, close the story, and record it in the changelog and sprint status. No rule, parameter or confirmed figure changes.

</frozen-after-approval>

## Implementation Notes

**Acceptance check (2026-11-25, against `4d970ea`):**

- `simulation-rules.md` holds (i), (j), (k), the amended R30 (ranking by what the estimate hid, S43 "small") and S41–S43 in the parameter table ✓.
- `EXPERIENCE.md` Flow 1 step 3 gives 0.981, under S42, "about 1 MNOK", which matches the closeness table in (k) ✓.
- Spine Open Question 2 is struck through and closed on 2026-11-23 ✓.
- §5 lists no rule gap: items 1–19 and 21 are values or design choices to confirm. Item 20 said where FR-32, FR-33 and FR-35 are specified but did not name R34. The forecast gap (Open Question 1) was the fourth gap, so R34 was added to item 20.

**Figures recomputed:**

- (i): mulberry32 from tag `v0.5` with seed 115 gives all 17 values (slots 0–16) to 4 decimals. The R16 deviations, the actual durations against the reference 13/8/10/10/5, the overrun on the envelope, and the u ÷ p for E2 (0.4766 ÷ 0.35 = 1.362) all hold.
- (j): 171 × 1.05 = 179.550 and 67 × 1.05 = 70.35, which rounds up to week 71 ✓.
- (k): the estimate rows sum to 4.800 MNOK and 16 weeks, which equals bridge cause 2. The closeness differences 0.981, 1.034, 3.515 and 2.534 match the R14 table ✓.

**How the seed was re-run:** the generator is `rand()` in `git show v0.5:ByggAPP/src/engine/game.ts` (lines 129–136, state starts at `seed >>> 0`). The same four lines were run in `node -e` with state 115 for 17 draws.

**Fixes (every file touched):**

- `simulation-rules.md`, example (i): the generator path said `FraTomtTilTak/app/src/engine/game.ts` at tag `v0.5`. At that tag the file is `ByggAPP/src/engine/game.ts`. The re-run date was added.
- `simulation-rules.md` §5 item 20: R34 added, plus a note that R20, R22 and R23 are worked in examples (c) and (d) without their ids. `updated` was set to 2026-11-25. There is no revision entry, because no rule changed.
- `.memlog.md` (PRD folder): one change line.
- `epic-1-context.md`: refreshed, because it said R32–R34 were not yet written. Phase A was marked complete, and "1.13 also needs 1.5" was kept.
- `deferred-work.md`: two entries. One is the id mapping for R11, R20, R22 and R23 (story 1.11). The other is the closeness pair in R30 (group decision, before story 3.2).
- `G115_Changelog.md`: entry for story 1.5.
- `sprint-status.yaml`: 1-5 set to `review`. It becomes `done` when the pull request is merged, as with 1.1–1.4.

**Not changed:** `epics.md` keeps its pre-fire-rule figures (169 MNOK, 172.554). Its overview note already says `simulation-rules.md` holds the current figures, and the stories in it are history. The re-basing of (g) to 174.354 was done in story 1.3.

## Review Triage Log

One review layer was used (Blind Hunter), which gave 10 findings.

- **Sprint status unchanged while docs say done:** low, patched. The spec now says `review` until merge, and the sprint file is set to `review`.
- **Closeness pairs in example (k):** maybe-false, medium if true, deferred. R30 says "two options for a choice" but not which two. At 5 floors, precast and steel are within S42 in one band, yet the table compares precast with CLT. This needs a group decision before story 3.2.
- **R11 not named in §4:** low, patched in `deferred-work.md`. R11 appears only inside "R10–R12" in example (a).
- **No revision entry for the rules edit:** low, partly patched. A `.memlog.md` line was added. No revision entry, because revisions record rule changes and none happened.
- **Seed re-run not reproducible:** low, patched. The method is recorded under Implementation Notes.
- **"Example (d) now ends at 174.354" in the epic context:** low, patched. The figure is now stated against the epics file.
- **Spec Fixes list incomplete:** low, patched. Every touched file is listed.
- **`epics.md` lines 17 and 469 are stale:** low, rejected. The epics file is history with an overview note that points to `simulation-rules.md`, and the re-basing it promised was done in the rules.
- **Dependency facts dropped from the epic context:** low, patched. "1.13 also needs 1.5" is restored. Phase A reads correctly both before and after the merge.
- **§5 item 20 states a status:** false. Item 20 was already a status line before this change, and the AC asks that §5 list no rule gap.
