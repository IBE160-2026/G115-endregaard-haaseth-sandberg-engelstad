# PRD Quality Review — ByggAPP PRD (draft 2026-11-03)

## Overall verdict

The R1 core holds up: the rules, the worked examples, the fork and the comparison are concrete enough to build stories and tests from, and the R1/R2/R3 split follows the instructor's advice. The weak point is done-ness for R2 and R3. Several FRs describe what v0.5 does but have no testable consequence, and the advisor's scoring rule is vague, although the group has already decided it. Fixing that, and updating the brief, would make the PRD ready for architecture and stories.

## Decision-readiness — adequate

The decisions are visible: 16 proposals are indexed with a reference to where each is used, and P-2 (overtime factor) names the trade-off and its effect on the tests. But P-6 is presented as open, although the v0.2 spec change log shows the group decided it on 2026-10-22. And §7's "what is left to build" lists the work without saying which items block the portfolio submission.

### Findings
- **high** P-6 is already decided (§4.2 FR-12, §10) — The group's decision (sum of the relative overruns in MNOK and weeks) is recorded in `spec-v0-2-interactive-simulator.md`. *Fix:* write the formula into FR-12; mark P-6 "team decision 2026-10-22, confirm in PRD".
- **medium** No blocking order in §7 — *Fix:* mark which remaining items must be done before submission.

## Substance over theater — strong

No persona theatre: three UJs, and each drives FRs. The NFRs are specific to this product (determinism, separation, no secrets). The Vision names a concrete teaching insight (site overhead, slack, insurance versus time), not generic claims.

## Strategic coherence — strong

The thesis is clear: the comparison against a reasoned benchmark is the teaching mechanic, and it has to be checkable by hand. The R1 scope follows that thesis. The counter-metrics (agreement with the advisor, the amount of 3D) protect it.

## Done-ness clarity — thin

R1 is good: FR-1, FR-3, FR-7, FR-8 and FR-16 have precise, testable consequences with numbers. R2 and R3 are not:

### Findings
- **high** FRs without testable consequences — FR-10, FR-11, FR-13, FR-18, FR-19, FR-20, FR-21, FR-27, FR-28 and FR-29 have no "Consequences (testable)" section. *Fix:* at least one testable condition each. For example, FR-11: "deferring change X costs Y more after Z weeks"; FR-19/20: "equals the current forecast after every decision".
- **high** FR-12 "closest to both targets" cannot be tested — see Decision-readiness. Also state that the advisor does not know the seed (it scores on the forecast without new events).
- **medium** FR-14 "about 8 in 10" — not testable as written. *Fix:* define it, for example "over N seeds, the share of recommendations equal to the best option is within X of 0.8", or describe the mechanism (seeded draw per recommendation).
- **medium** Rounding is undefined (FR-7, FR-17) — Appendix A gives 282.515 MNOK, while v0.5 shows and tests 282.52. *Fix:* state that the engine computes with full precision and the UI shows 2 decimals; the tests compare with a tolerance of 0.005.
- **low** SM-5 is soft — acceptable for a course project and marked P-16.

## Scope honesty — strong

§6 Non-Goals does real work (no LLM, no generated scenarios, construction only). All unresolved decisions are tagged and indexed. Open items: 5 open questions and 16 proposals. That is high, but expected for a draft waiting for group approval. Phase-blockers before architecture: P-2, P-6 and P-7.

### Findings
- **medium** The brief has to be updated — see `reconcile-brief.md` gap 1.

## Downstream usability — adequate

The Glossary is good and the IDs run without gaps (FR-1–31, NFR-1–7, SM-1–5, SM-C1–2, P-1–16, UJ-1–3). There is some glossary drift:

### Findings
- **medium** Words not in the Glossary — "challenge" (UJ-1, FR-27–29), "chapter" (FR-28), "foreman" (FR-13, FR-28), "base crew" (FR-4), "meeting" (FR-28). "Challenge" is a synonym for event / decision point. *Fix:* add *chapter*, *foreman*, *base crew* and *meeting* to the Glossary; replace "challenge" with "event", or define it as the in-game name of a decision point.
- **low** "Student" vs "player" — §4.6 uses the same role as the rest of the PRD, but v0.5 and the addendum say "player". Keep "student" in the PRD.

## Shape fit — strong

A course project feeding UX → architecture → stories, with an existing build: UJs with named protagonists, FRs with v0.5 status, and the technology kept in the addendum. The brownfield status (✅/◐/○) is checked against the code (no save/resume, no risk exposure, fork records and `aiPath` exist).

## Mechanical notes

- The template's "Assumptions Index" is replaced by §10 "Proposals for Group Approval". Round trip OK: every inline `[PROPOSAL P-n]` is in §10, and every §10 entry appears inline.
- §7 table: R1 lists FR-26 (3D only reads) while the 3D view itself is R3. That is consistent, but worth a word in FR-26.
- UJ-1 says the advisor recommends *avoid* at DP1. Whether it does depends on the scoring rule (FR-12) and on the advisor not knowing about R1. Check against v0.5 before final.
