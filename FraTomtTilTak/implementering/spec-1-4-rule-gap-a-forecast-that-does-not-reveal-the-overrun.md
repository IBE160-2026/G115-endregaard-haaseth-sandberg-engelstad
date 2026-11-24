---
title: 'Rule gap: a forecast that does not reveal the overrun'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'dispatch'
baseline_commit: '989613405956299d9032d6ec433485aacf218340'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** R24 forecasts unstarted parts at their actual durations. In example (c) the top bar would show the real overrun (168.154, week 65, against a plan of 163.354, week 49) from week 0 of stage 2, and then stand still between events. Spine Open Question 1 is open because of this.

**Approach:** Write the group's confirmed resolution (epics story 1.4, confirmed 2026-11-18) into the rules: two views of one replay. R24 stays as the full forecast. A new R34 is the visible forecast, with example (h). R13 says which forecast it uses, spine Open Question 1 is closed, and AD-6 notes R34. The epics figures for (h) predate the fire rule (target 169). They are re-based to the current example (c): every cost rises by 1.800, and the weeks and differences stay the same.

**Decisions (user, 2026-11-24):** (1) The branch `docs/1-4-visible-forecast` starts from the newest `main` (`9896134`), not from 1.3. Stories 1.1–1.3 are not merged yet, so R31–R33, revisions 5–7 and examples (e)–(g) are not in this base. (2) When "the reserve ran out" (R13) is judged for R28 is not stated in the rules; it goes to the pull request as a note for stories 4.2 and 5.2. (3) Subagents are used for implementation and review, as in story 1.3. (4) Keep the full spec, because it has one goal.

## Boundaries & Constraints

**Always:** Keep the confirmed content:
- In R34 an unstarted part counts at the student's estimate, and a started or finished part at its actual duration. Decided events apply, undecided ones do not.
- R34 drives everything shown in stage 2: top-bar cards, *Reserve igjen*, option deltas, path comparison and milestone status.
- R24 is used only for R25, R26, R27, R30 and the final AI path.
- The ranking and the difference between options are the same in both views.

Mark the re-basing in (h). Number the revision 8, because 1.1–1.3 hold 5–7.

**Never:** No change to the text of R24–R28 or R30, to examples (a)–(d) and (i)–(k), to spine OQ 2 and 3, to the PRD, `epics.md` or `EXPERIENCE.md`, to app code or to `02. Arkiv/`. No R31–R33 content. No new parameters. No commit, branch change, push or session log by the implementer; leave `epic-1-context.local-2026-11-23.md` untouched.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Week 0 | example (c) | visible 163.354, week 49; full 168.154, week 65 | N/A |
| Week 12, take / overtime / hire 12 | example (c) | visible 165.154 week 55 / 165.100 week 53 / 166.155 week 52; each 3.000 and 10 weeks below R24 | N/A |
| Permit estimate ≠ 12 | week 0 | the permit has started, so it counts at 12; only the week can differ from the plan | N/A |
| All parts finished | end of stage 2 | R34 = R24 = final cost and week | N/A |

</frozen-after-approval>

## Code Map

Under `FraTomtTilTak/planlegging/`, line numbers on `9896134`:

- `prds/prd-fra-tomt-til-tak-2026-10-31/simulation-rules.md`: frontmatter `updated` (l. 5); revision paragraphs (l. 26); R13 (l. 286), where `forecastCost` and `forecastWeek` do not name a forecast; R24 (l. 379), where R34 goes directly after; example (c) (l. 519) holds the figures; example (h) goes between (d) and (i) (l. 641).
- `architecture/architecture-fra-tomt-til-tak-2026-11-05/ARCHITECTURE-SPINE.md`: AD-6 (l. 90), sentence "The forecast (R24) is `replay` with …"; Open Question 1 (l. 299). Story 1.3's branch closes questions as `~~text~~ *Closed DATE:* …`; use the same form.
- `FraTomtTilTak/G115_Changelog.md`: new entry on top, at most four lines.
- `FraTomtTilTak/implementering/sprint-status.yaml`: key `1-4-…`.

When 1.1–1.3 are merged, expect text conflicts in the revision list, the point before example (i), spine OQ 1–2, the changelog and sprint-status. In all of them both sides are kept.

## Tasks & Acceptance

**Execution:**
- [x] `simulation-rules.md` -- `updated: 2026-11-24` and a **Revision 8** paragraph -- traceability
- [x] `simulation-rules.md` R13 -- `forecastCost` and `forecastWeek` are the visible forecast (R34) during stage 2; no wording on when the reserve has run out (decision 2) -- AC
- [x] `simulation-rules.md` R34 after R24 -- definition, where each view is used, when the forecast moves (each part start and each decision), why the ranking is unchanged (an option changes only the current part), and that a test asserts this over many seeds -- FR-22, FR-32, FR-34
- [x] `simulation-rules.md` §4 example (h) -- the four-row table re-based, plus the check that overtime still wins by 0.054 -- FR-31
- [x] `ARCHITECTURE-SPINE.md` -- close OQ 1; AD-6 notes that R34 is a `replay` with estimates for unstarted parts -- AC
- [x] `G115_Changelog.md`, `sprint-status.yaml` -- entry; 1-4 → review -- group process

**Acceptance Criteria:**
- Given example (h), when recomputed with a calculator, then every figure and difference holds.
- Given R13, when read, then it names the forecast it uses.
- Given the diff against `9896134`, when R24–R28, R30 and examples (a)–(d) and (i)–(k) are compared, then they are byte-identical.
- Given the spine, when read, then Open Question 1 is closed and AD-6 names R34.

## Implementation Notes

- The epic context file is not on `main`. This spec was written from `epics.md` story 1.4 and the rules on `main`, so no new `epic-1-context.md` is created here (it would collide with the one on the 1.2 branch).
- Implemented by a subagent from this spec and verified by the orchestrator against the diff from `9896134`. All tasks and ACs hold. Among the existing rules and examples only R13 changed; R34 and example (h) are new. The figures in (h) were recomputed with `node`.
- **Matrix coverage:** this is a document story, so no automated test ran. The week 0 and week 12 rows are worked example (h). The permit and end rows are stated in R34's text only. They become automated tests with the engine (stories 1.11 and 4.2).
- After review, four wording patches were made in R34: which parts of R24 the debrief uses, the permit estimate and R13's time reserve, the reason the ranking holds, and when a part has started.

## Spec Change Log

## Review Triage Log

Layers: Blind Hunter (15), Edge Case Hunter (10), Verification Gap (0 gaps, 3 other findings). No intent_gap or bad_spec, so no loopback. As in story 1.3, only the necessary patches are kept, and everything stays within the approved rules.

| # | Layer | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | Blind | "R24 is used only for R25, R26, R27, R30 and the final AI path" reads as no future events there | low | R24 says "no new events", but R26 run 3 and R27 include events. The intent is the actual durations. Example (d) still fixes the numbers | patch |
| 2 | Blind | Permit estimate other than 12: the time reserve is also used at week 0 | medium | R13 uses `forecastWeek`, so an estimate of 10 uses 2 reserve weeks at week 0. The approved matrix row settles the figure, but "only the week differs" hides the reserve | patch; PR note |
| 3 | Edge | Same, and milestones may start *I fare* | medium | Same root as 2 | patch (with 2) |
| 4 | Blind | PRD FR-34 says week 0 equals the plan's cost and week; R8's planCost and planWeek include the reserve | low | Real wording mismatch. The PRD is changed in its own pull request, as for FR-35 in 1.3 | issues.md + PR note |
| 5 | Edge | Same | low | Same root as 4 | issues.md + PR note |
| 6 | Verif. | Same | low | Same root as 4 | issues.md + PR note |
| 7 | Verif. | PRD FR-34 still says "proposed in epics story 1.4" | low | Real, same PRD pull request | issues.md |
| 8 | Blind | "An option changes only the current part" is false for E8 "approve later" | low | R23: a separate job after handover. The conclusion holds, because no option changes an unstarted part | patch |
| 9 | Blind | AD-6: `replay` signature has no view or cursor input | low | Real for the code, but the story asks only for a note. Story 4.2 owns the signature | reject (PR note) |
| 10 | Edge | Same, week 12 pre-decision would show week 0 figures | low | Same root as 9; R34 and (h) give the correct result | reject (with 9) |
| 11 | Blind | Playback, 3D and adviser text could leak actuals | false | "Everything shown in stage 2" covers them, and `timelineAt` shows progress up to the cursor only (AD-6) | reject |
| 12 | Blind | E1 counts before the decision; baseline for option deltas undefined | low | R34 states E1 explicitly. The delta baseline is not defined in any rule today, so it is not new | reject |
| 13 | Blind | Example (h) is too narrow (later parts, end row, permit, upfront cost) | low | The group confirmed the four rows; FR-31 asks for one example per rule | reject (PR note) |
| 14 | Blind | The upfront-cost `[ASSUMPTION]` is not in §5 | low | It is marked in the rule and comes from epics story 4.2. R8 includes it in `planCostExclReserve`, so it is needed for week 0 | reject (PR note) |
| 15 | Blind | When "the reserve ran out" is judged is not stated | medium | User decision 2, 2026-11-24 | reject (user; PR note + issues.md) |
| 16 | Edge | Same | medium | Same as 15 | reject (with 15) |
| 17 | Blind | R25's AI path does not name a view | low | R25 is locked; R34 names which view R25 and the shown AI path use | reject |
| 18 | Edge | Same | low | Same as 17 | reject (with 17) |
| 19 | Blind | `epics.md` story 4.2 criteria have the old figures | low | Planning history; the rules document is the source (as 1.3 finding 13) | PR note |
| 20 | Edge | Same for stories 4.2 and 4.5 | low | Same as 19 | PR note |
| 21 | Verif. | Same for story 4.2 | low | Same as 19 | PR note |
| 22 | Blind | Spine OQ 2 still lists R34, and the spine's `updated` is old | low | Story 1.3's branch closes OQ 2, so changing it here only creates a conflict. 1.1–1.3 do not touch `updated` either | reject |
| 23 | Edge | Same, OQ 2 | low | Same as 22 | reject (with 22) |
| 24 | Blind | Dangling R31; numbering jumps; FR tags incomplete | low | Resolved when 1.1–1.3 are merged; revision 8 says why | reject (PR note on merge order) |
| 25 | Edge | R31 and §5 point 20 | low | Same as 24 | reject (with 24) |
| 26 | Blind | "Started" has no boundary on the week | low | One phrase makes the rule exact: a part has started from its start week | patch |
| 27 | Edge | Same | low | Same as 26 | patch (with 26) |
| 28 | Edge | R29 bands in stage 2 could be computed from R24 | false | Everything shown in stage 2 uses R34, and epics story 4.8 says the band comes from the visible forecast | reject |

## Verification

**Commands:**
- `node -e` recomputation of example (h) -- expected: 163.354 / 165.154 / 165.100 / 166.155, all 3.000 and 10 weeks under R24 at week 12
- `git diff 9896134 -- FraTomtTilTak/planlegging` -- expected: only the hunks listed above
