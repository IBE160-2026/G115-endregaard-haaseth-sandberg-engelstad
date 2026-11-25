---
title: 'Rule gap: opportunities'
type: 'feature'
created: '2026-11-23'
status: 'done'
route: 'dispatch'
baseline_commit: 'dddc8add3d3a7773fa4f25300a8b95db9fcf4d25'
review_loop_iteration: 0
context:
  - '{project-root}/FraTomtTilTak/implementering/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** FR-35 (positive events) has no rule. R17 and R18 still say "if FR-35 is approved", R15 has no draws for an opportunity, and spine Open Question 2 still lists FR-35. Example (i) already uses slots 15–16 for R33, so the rules document refers to a rule it does not contain.

**Approach:** Write the group's confirmed resolution (epics story 1.3, confirmed 2026-11-18) into the rules document: R33 with O1 and O2, S38–S40, two new draws in R15, the opportunity in R19's order, and worked example (g). Close the FR-35 part of spine Open Question 2. Example (g) in the epics file uses the old targets (169 MNOK, before the fire rule). Following the epic context, it is re-based to 171 MNOK. The method and the weeks stay the same. Every cost figure from example (d) rises by 1.800 and the target by 2.000, so bridge cause 1 and the sum each fall by 0.200.

**Decisions (user, 2026-11-23):** (1) Stack on story 1.2: `docs/1-3-opportunities` is reset onto `origin/docs/1-2-site-capacity` (tip `dddc8ad`), which itself sits on 1.1. This is **Revision 7**. S38–S40 go after S37, example (g) goes after example (f), and §5 point 20 and spine OQ 2 build on 1.2's text. (2) Keep the full spec (~1,800 tokens), because it has one goal.

## Boundaries & Constraints

**Always:** Keep the confirmed content: the O1/O2 table, `n` counted after R17–R19 with the change request included, 4 → none, 3 → `u < 30 %`, < 3 → always, at most one opportunity, order overrun → external risks → change request → opportunity, slot 15 for occurrence and slot 16 for `floor(u × 2)`. State the accepted consequence (2 events when every risk is avoided and there is no overrun). Name parameters by S-id in the rule text. Mark the re-basing in example (g).

**Never:** No change to R25, R26, R27 or the bridge method. No edits to examples (c), (d), (i) or (k), the PRD, app code or `02. Arkiv/`. PRD FR-35 still says "R33 (proposed in epics story 1.3)". That goes to the user's `issues.md` for a separate PRD pull request. No R31, R32 or R34 content beyond what the chosen base already has.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| n = 4 | overrun + 2 risks + change request | no opportunity, slots 15–16 unused | N/A |
| n = 3, u ≥ 0.30 | example (i), slot 15 = 0.5104 | none | N/A |
| n = 3, u < 0.30 | example (d), slots 0.20 / 0.20 | O1, take 173.454 week 70; decline 174.354 week 69 | N/A |
| n < 3 | every risk avoided, no overrun | always one; 2 events in total (accepted) | N/A |

</frozen-after-approval>

## Code Map

All under `FraTomtTilTak/planlegging/`. Line numbers are approximate and refer to the 1.2 base:

- `prds/prd-fra-tomt-til-tak-2026-10-31/simulation-rules.md`: frontmatter `updated`; revision paragraphs, where Revision 7 goes after Revision 6; §2.1 parameter table, where S38–S40 go between S37 and S41; R15 (three numbered draw groups); R17 last bullet; R18 last bullet; R19 order bullet; R23 change request, where R33 goes after it; example (d) holds the figures for (g); example (i) row "15–16" already matches, so leave it as is; §5 point 10, and point 20 as 1.2 left it.
- `architecture/architecture-fra-tomt-til-tak-2026-11-05/ARCHITECTURE-SPINE.md`: Open Questions 2 (~l. 300). AD-2 already says "slots appended for later rules", so leave it unchanged.
- `FraTomtTilTak/G115_Changelog.md`: new entry on top, at most four lines, same style as 1.1/1.2.
- `FraTomtTilTak/implementering/sprint-status.yaml`: `1-3-rule-gap-opportunities`.

## Tasks & Acceptance

**Execution:**
- [x] `simulation-rules.md` -- `updated: 2026-11-23`, and a **Revision 7** paragraph for R33 -- traceability
- [x] `simulation-rules.md` §2.1 -- S38 opportunity chance at n = 3, 30 %, [ESTIMATE]; S39 O1 −1.200 MNOK and +1 idle week, v0.5, [ESTIMATE]; S40 O2 −0.800 and +1 idle week, v0.5, [ESTIMATE] -- one data file
- [x] `simulation-rules.md` R15 -- add a fourth group: two draws for the opportunity (R33), slot 15 occurrence and slot 16 which one, after the reliability draws and always drawn. Also state that group 3 is always six slots (9–14, AD-2), used in event order, which is enough for the at most 5 events -- AD-2, so slot 15 is a fixed index
- [x] `simulation-rules.md` R17/R18 -- replace the "if FR-35 is approved" wording with a pointer to R33 -- AC
- [x] `simulation-rules.md` R19 -- order within a part ends with the opportunity; its +1 week is idle -- confirmed order
- [x] `simulation-rules.md` new R33 after R23 -- table, `n` rule, options take/decline, "treated as any event by all other rules", accepted consequence -- FR-35
- [x] `simulation-rules.md` §4 -- example (g) after example (f), re-based: n = 3, 0.20 < 0.30, floor(0.40) = 0 → O1. Take: 174.354 − 1.200 + 0.300 = 173.454, week 70. Decline: 174.354, week 69. AI forecast at the event: take 170.454, decline 171.354, so it recommends take (lowest cost, R25). Run 3: 173.800 − 0.900 = 172.900, week 68. The bridge is for the student taking it: −7.646 + 4.800 + 4.746 + 0.554 = +2.454 = 173.454 − 171.000 ✓. Note that (d), and the examples built on it ((e), (k)), read slot 15 ≥ 0.30, so no opportunity occurs; (c) and (f) stop before any opportunity -- FR-31
- [x] `simulation-rules.md` §5 -- point 10 adds the opportunity values (S38–S40); point 15 no longer says E6/E7 could come back "with FR-35", only as R18 fallback events (R33 uses only O1/O2); point 20 no longer lists opportunities -- open-points hygiene
- [x] `ARCHITECTURE-SPINE.md` OQ 2 -- dated update: FR-35 closed by R33 and example (g) -- AC
- [x] `G115_Changelog.md`, `sprint-status.yaml` -- entry; 1-3 → review -- group process

**Acceptance Criteria:**
- Given the edited rules, when searching for "if FR-35 is approved" or "(FR-35) or nothing", then there are no hits in R17/R18.
- Given example (g), when recomputed with a calculator, then every figure and the bridge check hold.
- Given examples (c), (d), (i) and (k), when diffed against the base, then they are byte-identical.
- Given spine OQ 2, when read, then FR-35 is not listed as open.

## Implementation Notes

- Implemented by a subagent from this spec and verified by the orchestrator against the diff from `dddc8ad`. All tasks and ACs hold. Examples (c), (d), (i) and (k) are byte-identical. There are no hits for the old FR-35 wording. The example (g) arithmetic was recomputed: forecast at the event 170.454/week 70 (take) and 171.354/week 69 (decline).
- **Deviation from the task text:** the R15 task said "at most 5 events". That is wrong. Overrun 1 + external risks ≤ 2 + change request 1 = 4, and R33 adds one only when n < 4, so the maximum is 4. R15 says 4.
- **Matrix coverage:** this is a document story, so there is no app code or test run. Rows n = 3 are covered by worked examples (i) (none) and (g) (O1). Rows n = 4 and n < 3 are stated in R33's text and its accepted consequence. They become automated tests in story 1.11 (`worked-examples.test.ts`).
- Files: `simulation-rules.md`, `ARCHITECTURE-SPINE.md`, `G115_Changelog.md`, `sprint-status.yaml`.
- The subagent also wrote a session log, `.logs/hedda-endregaard/998-…-story-1-3-muligheter.md`, before review. Its commit was stopped. The orchestrator handles the session log at the end.

## Spec Change Log

## Review Triage Log

Layers: Blind Hunter (10), Edge Case Hunter (6), Verification Gap (0). No intent_gap or bad_spec, so no loopback. User, 2026-11-23: stay within stories 1.1–1.4 and the approved rules, add no new tasks, and mention later-testing findings briefly in the PR. So only the necessary patches were kept.

| # | Layer | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | Edge | R28 "Time costs money" flags taking an opportunity: Decline's extra cost 0 < 0.300 | medium | R28 compares the slower option with a faster option's "extra cost". Read literally, Decline's 0 qualifies. R33 also said "None of them changes", but the group confirmed only bridge/R25/R27 | patch |
| 2 | Blind | (g) does not work out R28/R30 for the opportunity | low | Same root as 1. The R28 sentence in R33 covers it; no extra (g) line (user: approved rules only) | reject (covered by 1) |
| 3 | Edge | Reliability slots shift when an opportunity is inserted before E8 | low | Not a new defect: R15 has used event order since before this change, and avoiding a risk already shifts it. The rule text is unambiguous (event order includes O1) | reject (user: approved rules only) |
| 4 | Blind | Same: reliability shift contradicts "fixed slot indices" | low | Same root as 3. "Fixed index" in R15 refers to slot 15, which stays fixed | reject (with 3) |
| 5 | Edge | R13/R31 not listed among rules that count the opportunity | low | Finish weeks include idle weeks, so it follows from "treated as any event" | reject (user: approved rules only) |
| 6 | Blind | (g) leaves out the milestone effect (R31) | low | Same root as 5. Mention briefly in the PR | reject (with 5) |
| 7 | Edge | Spine OQ 2 resolved but not marked closed | low | OQ 3 uses strikethrough + "Closed". OQ 2's first sentence still lists FR-35 | patch |
| 8 | Edge | Same: AC "FR-35 not listed as open" weak | low | Same root as 7 | patch (with 7) |
| 9 | Blind | Same: OQ 2 should be closed like OQ 3 | low | Same root as 7 | patch (with 7) |
| 10 | Edge | R33 writes 0.300 without naming S14 | low | Spec Always: name parameters by S-id | patch |
| 11 | Blind | Decline column "0" ambiguous | low | Direct correction to "No change". The "part already started" half is false: events are selected at approval | patch |
| 12 | Blind | Only one of four R33 cases has a worked example (no O2, n < 3, n = 4) | low | FR-31 asks one example per rule, and R33 has (g). The user chose to mention it briefly in the PR for later testing, not as new work | reject (PR note) |
| 13 | Blind | PRD FR-35 follow-up not logged; epics (g) still at 169 MNOK | low | Planned for `issues.md` at session end (sesjonslogg). Epics is planning history; the rules doc is the source (epic context) | issues.md + PR note |
| 14 | Blind | Spec task still says "at most 5 events" | low | Fix edits this build's spec. Already recorded in Implementation Notes | reject |
| 15 | Blind | R19 order "change request, then opportunity" never applies | false | The order line is the group's confirmed text and is correct, just never binding for E8. Not a defect | reject |
| 16 | Blind | Avoiding risks lowers n and steers an opportunity | maybe-false | Avoid costs 50 % of I per risk, against at most 0.900 net. Would only be low. Settle by comparing avoid prices in R10 with O1's 0.900 | reject (note for the group in the PR) |

## Verification

**Commands:**
- `node -e` recomputation of example (g) -- expected: 173.454, 172.900, bridge +2.454
- `git diff <base> -- …/simulation-rules.md` -- expected: only the hunks listed above

**Manual checks (if no CLI):**
- No `R33`, `S38` or `S40` reference left dangling, and no FR-35 "if approved" wording in R17/R18.
