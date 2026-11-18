# Reconciliation: PRD vs product brief

**PRD:** `prd.md` (draft, 2026-10-31) + `.memlog.md`
**Input:** `../../briefs/brief-G115-tre-stadier-2026-10-29/` — `brief.md` (B), `addendum.md` (A), `.memlog.md` (BM)
**Date:** 2026-10-31
**Method:** every claim in B, A and BM checked against the PRD. Deliberate departures (PRD §10 and PRD memlog: schedule estimate replaces crew/mode in stage 1; crew decisions moved to stage 2; capacity ~80 h; full scope kept; warning threshold 20 %; adviser intervenes only when far off) are not counted as gaps. Section D lists brief text that still contradicts them.

Line references: `B:78` = brief.md line 78, `A:43` = addendum.md line 43, `BM:15` = brief .memlog.md line 15, `PRD:214` = prd.md line 214.

---

## A. High severity

### G1. Plain language and explanations "at the moment they matter" are gone

- **Source:** B:78 "They need plain language, explanations at the moment they matter, and a session short enough to finish in one go." A:43 "the steps on the left tell a newcomer where they are". BM:13 primary user is "a newcomer with little PM knowledge".
- **PRD:** keeps the newcomer persona (PRD:17, UJ-1 Sara) and session length (NFR-3), but no FR or NFR asks for plain language or explanations in context. NFR-6 (PRD:361) covers only which language (Norwegian). The glossary itself uses expert terms (m² BRA/BTA, %BYA, CLT, critical path, WBS) that will reach the interface with no rule that they are explained. Only the adviser's reasons (PRD:214) come close, and they explain choices, not concepts.
- **Why it matters:** this is the brief's main promise to the primary user, and FR structures lose it most easily. Without it, UX and stories have no requirement to trace explanatory text to, and SM-1 (unaided completion) is at risk.
- **Suggested fix:** add an NFR, for example **NFR-9 Plain language:** "Every term from the building and PM domain shown in the interface (for example BRA, utnyttelsesgrad, kritisk linje, reserve) has a plain one-sentence explanation available where it appears. Each step opens with one or two sentences saying what the student decides and why it matters. Testable: a list of interface terms, each with its explanation text; reviewed by a tester outside the group." Optionally add a consequence to FR-14: "the suggestion's reason uses no unexplained terms".

### G2. The learning goals are reduced to names; two lose their mechanism

- **Source:** B:69–72 states each goal as a claim with a mechanism: "Every week of delay adds site overhead, so speeding up can pay for itself"; "More workers give less output per person, and overtime and hired crews cost more"; "the cheapest choice depends on whether it actually happens ... a change approved late costs more than one approved early"; "learns when the adviser's suggestion holds up and when their own judgement was better". A:69 critical path and slack "the adviser's warnings explain it".
- **PRD:** the glossary (PRD:81) lists only the four goal names. No section defines them. SM-2 (PRD:399) tests "one question per learning goal" and FR-27 names goals the student "touched", but neither has a definition to test against. Specifically:
  - *Time costs money:* no FR makes weekly site overhead (time-dependent cost) visible, in planning or in execution. Nothing shows that speeding up can pay for itself.
  - *Resources have limits:* now lives in stage 2 (deliberate), but FR-20 (PRD:279) only requires that overtime and hiring are *offered*. No consequence requires that diminishing output per worker (crowding) or the overtime premium is shown or explained. With only one estimate overrun per playthrough (FR-19), the goal rests on a single decision with no visible mechanism.
  - *Critical path:* FR-8 marks it on the Gantt chart, but the warning that taught it ("speeding up a task off the critical path gains no time", B:52, A:53) was removed together with crew in stage 1 and nothing replaces it.
- **Why it matters:** the assignment's three areas (scheduling, resources, risk) map onto these goals (B:74). FR-27 and SM-2 are not testable without definitions.
- **Suggested fix:** add a short **§2.4 Learning Goals** that copies B:69–72 (adjusted: resources goal met in stage 2) and maps each goal to the FRs that teach it. Add consequences: FR-20 "the hiring option shows the reduced output per added worker and the overtime cost premium (v0.5 crowding and mode rules)"; FR-6 or FR-22 "the cost of one week of delay (site overhead) is shown". Decide whether critical path is still explained (for example an FR-8 consequence: "shortening a main part off the critical path does not move the completion week, and the adviser says why").

---

## B. Medium severity

### G3. Warning rules for the risk and reserve step were dropped

- **Source:** A:53 lists example warning rules: "there is no reserve; more is paid to cover a risk than its expected cost" (alongside the zoning and critical-path rules). B:52 "When the student makes a choice it judges to be poor, it warns and says why."
- **PRD:** FR-15 (PRD:228–230) has only two concrete triggers: schedule estimate >20 % from reference, and zoning breach. FR-13 records a warning for a plan that misses targets. Nothing warns about a zero reserve or overpaying for a risk response. Step 3 therefore has suggestions (FR-14) but no testable warnings, so the "risk is managed" goal gets less adviser support than the schedule step.
- **Note:** "intervene only when far off" is a deliberate change (PRD memlog:14), but zero reserve and paying more than expected cost are clear-cut cases that fit it.
- **Suggested fix:** add FR-15 consequences: "a plan with no reserve triggers a warning"; "a response that costs more than the risk's expected cost (probability × impact) triggers a warning that states both figures".

### G4. "Opportunities" dropped from stage 2 events

- **Source:** B:59 "Three or four unforeseen events hit (risks, opportunities, change requests)".
- **PRD:** FR-19 (PRD:267) fixes the mix as one estimate overrun, 1–2 external risks and one change request. The event catalogue in the PRD memlog:18 has no opportunities either. The glossary defines "Event" neutrally, but every event in the PRD is negative.
- **Why it matters:** with only bad events, the student learns that plans only break, not that a plan with slack can take advantage of good news. It also changes the tone from "test" to "punishment".
- **Suggested fix:** either add an opportunity to the event mix (for example an early material delivery or a cheaper supplier, with a decision to take it or not), or record the removal as a deliberate departure in §10.

### G5. Stage 1 gives the student no real chance to be right against the adviser, and "accept all" makes ownership hollow

- **Source:** B:72 "learns when the adviser's suggestion holds up and when their own judgement was better." B:18 "the student has the final say." B:86 "every consequence in stage 2 follows from their own choices ... it is hard to shrug off a delay you planned yourself." BM:36 ownership named as the most exciting part.
- **PRD:** stage 1 suggestions are reference values and always "correct" (FR-14, FR-15). FR-9 (PRD:169) lets the student accept a suggestion that fills in the duration. FR-19 (PRD:270) targets the estimate overrun at "a main part where the student's schedule estimate is below the reference value". The PRD leaves two things undefined:
  1. If the student accepts every suggestion, what is the overrun event (no estimate is below the reference)?
  2. FR-28 (PRD:326) counts how often the adviser was "right". For stage 1 suggestions, what counts as right? The difficulty setting (FR-1) only affects stage 2.
- **Suggested fix:** add an FR-19 consequence for the case where no estimate is below the reference (for example the overrun hits the critical-path part with the smallest margin). Define "right" for stage 1 in FR-28, or limit FR-28 to stage 2 recommendations. Consider a consequence on FR-9 or FR-13 that shows how many durations were accepted unchanged, so the debrief can point out ownership ("you accepted 5 of 6 suggestions").

### G6. The addendum is never referenced; the planning-view principles are lost

- **Source:** A:26–43 layout sketch and principles: "the targets are always visible at the top; the steps on the left tell a newcomer where they are; the form sits in the middle with an immediate consequence box; the 3D view and the adviser each have their own panel." B:45 "The planning view always shows the targets (budget, completion week, risk exposure)." A:30–31 also shows a warning count in the header.
- **PRD:** PRD:13 cites only `brief.md` as input. FR-6 shows consequences *after every choice*, but nothing requires targets and risk exposure to be visible *at all times*, a step indicator, or a visible count of open warnings. A:12–22 (time budget per step) and A:72–77 (model and research needs) are also used without citation.
- **Suggested fix:** cite `addendum.md` in §0 and point UX to A §2. Add an NFR or an FR-6 consequence: "budget, completion week and risk exposure against the targets, plus the number of open warnings, stay visible throughout stage 1"; "the student always sees which of the four steps they are on".

### G7. The adviser's overall assessment at "Present the plan" is not a requirement

- **Source:** B:43 "presents the plan to the client against the targets, sees the adviser's overall assessment, and approves it."
- **PRD:** the §4.5 description (PRD:200) repeats it, but FR-13 (PRD:204–210) has no consequence for it, so no story will trace to it. This is the coaching moment where the adviser sums up before the student commits.
- **Suggested fix:** add an FR-13 consequence: "before approval the adviser gives a short overall assessment of the plan (strongest and weakest point against the targets), computed by rules".

---

## C. Low severity

### G8. The AI recommendation in stage 2 has no stated reason
- **Source:** B:89 "here the benchmark is a reasoned recommendation." BM:15/PRD memlog:24 "guides with reasons".
- **PRD:** FR-22 (PRD:295) has the AI recommendation chosen by rules but does not require its reason to be shown. Stage 1 suggestions have reasons (FR-14); stage 2 recommendations do not.
- **Fix:** FR-22 consequence: "the AI's recommendation is shown with a one-sentence reason".

### G9. The planning preview is not tied to the stage 2 engine
- **Source:** B:45 "calculated by the same engine that runs stage 2."
- **PRD:** FR-6 requires equality with the building-block model only. If the planning forecast and the execution engine diverge, the student's plan is "tested" against different rules, which undermines ownership.
- **Fix:** FR-6 or FR-30 consequence: "with no events, executing the plan gives exactly the completion week and cost shown at approval".

### G10. "Answer for it" in stage 2
- **Source:** B:19 "choose a response to each and answer for it"; BM:7 "accountable choices".
- **PRD:** the effects are shown (FR-20, FR-22), but nothing asks the student to justify a choice. Probably intended as "live with the consequences", which the PRD covers. **Fix:** confirm the meaning; if a short justification (for example picking a reason) was intended, add it to FR-20 and the decision log.

### G11. Brief open question on v0.5 meetings is not carried over
- **Source:** B:134 "Do the meetings around a 3D model of each challenge still fit in about 6 minutes?"
- **PRD:** §10 reuses the site office and the 3D site, and UJ-1 has "HMS reacts", but §11 does not carry over the question of whether v0.5's per-event meetings stay. HMS is also ambiguous: §8.2 puts the "HMS check" out of the MVP, while UJ-1 step 5 has HMS reacting to the wind event.
- **Fix:** add to §11, and state whether the HMS reaction in events is in the MVP.

### G12. Rationale for the decision log as the audit log is missing
- **Source:** B:102 "This is how the simulator meets the assignment's recommendation of an audit log"; A §4.
- **PRD:** FR-29 and §6 Privacy/Openness cover the behaviour but not the link to the assignment requirement, which the examiner will look for.
- **Fix:** one sentence in FR-29 or §7: "covers the assignment's audit-log recommendation; no login (see addendum §4)".

### G13. Success criterion slightly loosened
- **Source:** B:124 "completes all three stages in about 20 minutes without help. Tested with 3–5 people."
- **PRD:** SM-1 allows 25 minutes and 4 of 5 testers. This is reasonable as a pass threshold, but it is a quiet loosening. **Fix:** keep it, and note in §10 that 25 min is the pass threshold for a 20-minute target.

### G14. Capacity and scope-tier principle not stated in the PRD
- **Source:** B:93 "Scope is set in tiers so that a complete version is guaranteed first."
- **PRD:** the decision to keep full scope at ~80 h and reassess later (PRD memlog:28–29) appears only in the memlog. The PRD body never mentions capacity or the order in which must-haves would be cut. **Fix:** one line in §8: capacity ~80 h, full must-have kept, scope reassessed once the pace is known, with a proposed order for cuts.

---

## D. Brief text that still contradicts deliberate PRD decisions (update the brief)

| Location | Current text | Conflicts with | Suggested update |
|---|---|---|---|
| B:18 | "plot, number of floors, structural system, schedule, crews, risks and reserve" | crew moved to stage 2 | "...schedule estimate, risks and reserve" |
| B:41 | "**Schedule and resources.** ... The student sets crew and work mode for the key disciplines" | schedule estimate replaces crew/mode | "**Schedule estimate.** The student estimates the duration of each main part; the adviser suggests shares from reference projects" |
| B:52 | warning example "speeding up a task off the critical path gains no time" | no crew acceleration in stage 1; warnings now reference-class, >20 % | replace with "your frame estimate is far below comparable projects" |
| B:52 | "When the student makes a choice it judges to be poor, it warns" | adviser intervenes only when far outside bounds (PRD memlog:14, 20 %) | "When a choice is far outside what comparable projects did, or breaks a limit, it warns and cites the reference" |
| B:70 | resources goal (implicitly met by stage 1 crew choices) | resources goal now lives in stage 2 | add "met through overtime and hiring decisions in stage 2" |
| B:93 | "about 120 hours in total" | capacity ~80 h | "about 80 hours"; note full must-have kept, to be reassessed |
| A:18 | step 2 "crew and mode for key disciplines" | schedule estimate | "duration estimate per main part" |
| A:53 | warning "a task off the critical path is sped up" | as above | remove or move to stage 2 |
| A:77 | "week-by-week engine (crowding, work modes, events)" | still right, but now only for stage 2 | add "(stage 2 only)" |
| BM:9 | capacity ~120 h | ~80 h | add a (change) entry rather than editing history |
| BM:20/22 | free choice covers "crew, work mode, method, reserve, risk responses" | crew/mode out of stage 1 | add a (change) entry |

The brief also has "status: final". Since the PRD memlog:20 and :28 say "brief to be updated afterwards", either re-open the brief for these edits or add a short "Superseded by PRD §10" note at the top.

---

## E. Checked and carried over correctly (no action)

Three stages and time split (NFR-3); site office opening and return (FR-2, §4.5); 100 workplaces, Oslo, fictional client; three plots with price and zoning; floors against footprint; structural system options; 3D view to look at, not walk through (§7); adviser in its own window, never changes choices; adviser option C (FR-16/17, with FR-17 as should-have); LLM explains only, within approved facts (FR-17, §6); runs without keys (NFR-1); decision log viewable and downloadable (FR-29); AI path from the same state (FR-22); AI's own plan as should-have (§8.2); HMS check and save/resume as could-have; non-goals (own WBS, login, multiplayer, file formats); known risks depend on concept (FR-10); four responses (FR-11); reserve (FR-12); change request costs more later (FR-20); debrief with conclusion tied to goals (FR-27); worked examples with answers (FR-31); "safe place to try" (JTBD); coaching tone (§4.6 "a coach the student can discuss with").
