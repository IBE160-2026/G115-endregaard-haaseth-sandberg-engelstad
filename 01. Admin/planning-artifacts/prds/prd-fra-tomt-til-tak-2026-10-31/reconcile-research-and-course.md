---
title: "Input reconciliation: PRD Fra tomt til tak vs research, instructor feedback, assignment, grading guide"
created: 2026-10-31
prd: prd.md (draft, 2026-10-31)
inputs:
  - ../../research/research-fra-tomt-til-tak-2026-10-31/research.md (P1-P17)
  - ../../../tilbakemelding-product-brief.md
  - Assignment text (AI-styrt simulering av prosjektledelse, byggeprosjekt)
  - Sensorveiledning del 1 (summary, 7 criteria)
---

# Input reconciliation

Read-only check of `prd.md` against four inputs. Deliberate decisions in `.memlog.md` are not counted as gaps: no login (decision log instead), FR-17 optional, ~80 h with full scope kept, crew decisions moved to stage 2, 20 % warning threshold.

Severity: **high** = the examiner or implementer will run into it, or it contradicts a source; **medium** = under-specified in a way that will force guessing in architecture/stories; **low** = wording, traceability or polish.

## Summary table

| # | Input | Gap | Severity |
|---|---|---|---|
| R1 | Research | §4.2 says fewer floors need "a more expensive plot", but with P4/P5 the large-footprint plot is the cheapest one | high |
| R2 | Research | Overtime premium (P16, at least 40 % by law) and overtime caps (P17, given as a warning rule) are not in any FR | high |
| R3 | Research | Zoning is defined as %BYA + height only; %BRA (P5) and the height check through floor-to-floor height (P3) are missing | medium |
| R4 | Research | FR-9/FR-15 need reference values per main part, but the research only gives total duration and frame time per floor | medium |
| R5 | Research | BTA/BRA not defined; FR-3 cites "P-parameters" without naming P2/P4 | low |
| R6 | Research | [ESTIMATE] figures are marked only in docs; the research recommends showing them to the player as "simplified assumption" | low |
| R7 | Research | Construction-cost dispute (28.6k vs 36.8k), VAT basis and the basement option (P10) are not reflected | low |
| R8 | Research | Single parameter data file with source IDs (research rec. 2) is not an NFR | low |
| F1 | Feedback | The stage-2 and risk rules have no explicit form or worked example in the PRD (only FR-31 says they will exist) | high |
| F2 | Feedback | "Right" in FR-28 and the difficulty mechanism in FR-1 are not defined, so the AI-path comparison cannot be checked | medium |
| F3 | Feedback | No ordered cut line inside must-have, although the minimal version was the second main point | medium |
| F4 | Feedback | Stage-1 suggestions are not required to be one of the student's own options | low |
| F5 | Feedback | Separate engine / AI layer / view is only partly stated (NFR-8 covers purity, not layering) | low |
| F6 | Feedback | Side-by-side comparison screen not handed to UX as a key screen | low |
| A1 | Assignment | **Milestones** (Data inn) appear nowhere in the PRD | high |
| A2 | Assignment | **Resource capacity** (Data inn) is not modelled; the "resources have limits" goal rests on one event's options | high |
| A3 | Assignment | **Cost forecast** (Data ut) during stage 2 has no FR (v0.5 forecast only mentioned in §10) | medium |
| A4 | Assignment | **Resource allocation** decision point is guaranteed only through the estimate-overrun event | medium |
| A5 | Assignment | Change approval options omit "reject" | low |
| A6 | Assignment | Risk exposure (Data ut) is shown only in stage 1, not updated in stage 2 | low |
| A7 | Assignment | Login "Ja" and "versjonskontroll" not explicitly answered in the PRD text (decision only in memlog) | low |
| G1 | Grading | No trace table from assignment items / decision points to FRs | medium |
| G2 | Grading | The brief is still out of date (crew in stage 1, ~120 h); warning sign "docs describe another app" | medium |
| G3 | Grading | No requirement for documented manual tests (3D view, UI, accessibility) | medium |
| G4 | Grading | No `.env.example` / README requirement beyond "runs without keys" | low |
| G5 | Grading | Design traces (sketches/UX descriptions) and "clear feedback" not required | low |

---

## 1. Research (P1-P17)

**Correct uses (no action):** P1 23 m² BTA/workplace -> ~2,300 m² (§4.2); lift for 2+ floors (FR-4, P9); land priced per m² BRA (FR-3, P4); structural system mainly changes frame time, CLT slightly dearer (§4.2, FR-5, P7/P12); targets derived from the model (FR-1).

### R1. "Fewer floors need ... a more expensive plot" contradicts the parameter table — high
- **Source:** research P4a-c / P5a-c and "Cross-dimension insights": "Land dominates the cost difference between plots ... the plot drives budget and the system drives schedule." Land is priced per m² BRA, and BRA is fixed (~2,070 m²), so plot cost depends on the plot tier, not on the footprint. P5 gives the largest footprint (BYA ≤ 800 m², max 4 floors) to plot C, the **cheapest** one (8,000/m² BRA). With 2,300 m² BTA: 3 floors (~767 m²) fit only on C; 5+ floors fit only on A/B.
- **PRD:** §4.2 description: "Fewer floors need a larger footprint and a more expensive plot; more floors need lifts and a longer frame phase."
- **Fix:** Rewrite as: "Fewer floors need a larger footprint, which only the outer, cheaper plots allow; central plots are dearer per m² BRA and force more floors, which lengthens the frame phase." Also add to FR-4 that the floor set is chosen so each plot admits at least one valid floor count (see §11 Q3).

### R2. Overtime premium and caps missing — high
- **Source:** P16 "Overtime premium ≥ 40% of wage (law); use +50% in-game"; P17 "Overtime caps 10 h/week, 25 h/4 weeks, 200 h/year — warning rule"; aml § 10-6 [26].
- **PRD:** FR-20 offers "overtime" as an option; §4.7 says it reuses "the v0.5 rules for work modes, crowding and cost factors". No FR fixes the premium or the caps, and FR-15 has no overtime warning. If v0.5's overtime cost factor is below +40 %, the PRD contradicts the law-based research.
- **Fix:** Add consequences to FR-20: "Overtime costs at least +40 % per hour on wages (P16, +50 % in game)"; "Overtime beyond P17's caps is not offered, or triggers a rule-based warning naming the cap." State in §10 that the v0.5 overtime factor is checked against P16. Optionally add the hired-crew rate (P15, 650 NOK/h) as the source for the "hire more workers" cost.

### R3. Zoning definition incomplete: %BRA and height check — medium
- **Source:** research §5 / P5: zoning is "%BYA (footprint), %BRA or m² BRA (floor area), and height as kotehøyde or metres"; "The number of floors is not to be used as the height limit" [23]; P3 "height = floors × 4.0 (for checking max height)"; P5 formulas `BRA_max = plot × %BRA`, `floors ≤ floor(h_max / P3)`.
- **PRD:** Glossary "Zoning limits — the plot's maximum footprint (%BYA) and maximum height." FR-3 shows "maximum footprint and maximum height". No %BRA or plot size; no rule turning floors into metres.
- **Fix:** Glossary: "maximum footprint (%BYA), maximum floor area (%BRA) and maximum height in metres." FR-3: also show plot size and %BRA. FR-4: "A concept is valid when footprint ≤ plot × %BYA, BRA ≤ plot × %BRA, and floors × P3 ≤ max height in metres; the warning names the limit that is broken." (With the current P5 values %BRA never binds, but the check is cheap and matches how Oslo expresses zoning.)

### R4. Reference values per main part have no data source yet — medium
- **Source:** research gives total duration (P11, 12 months, range 9-14, [ESTIMATE]) and frame time per floor (P12); reference projects Stamas [11], Norva24 [12], Lagårdsveien [15], Moholt [10]. It gives no phase shares by main part. Open question in PRD §11 Q1/Q4.
- **PRD:** FR-9 (shares "based on reference values"), FR-15 (20 % threshold "states the reference value", "names at least one real comparable project, with its figure and the year"), FR-19 (overrun hits a part "below the reference value").
- **Fix:** Mark FR-9, FR-15 and FR-19 as blocked by §11 Q1/Q4, and add a fallback: if no sourced phase shares are found, reference values for non-frame parts are [ESTIMATE]s derived from P6s cost shares and P11, flagged as such, and FR-15 cites a project only for the frame and the total (where the research has sourced projects).

### R5. BTA/BRA undefined; vague parameter references — low
- **Source:** P1 (BTA), P2 "BRA = 0.9 × BTA" [ESTIMATE], P4 "land = P4 × BRA".
- **PRD:** §4.2 uses BTA, FR-3 uses BRA, glossary defines neither; FR-3 says "(P-parameters in the research)".
- **Fix:** Add BTA, BRA, BYA to the glossary; FR-3: "Plot cost = P4 (plot price per m² BRA) × BRA, with BRA = P2 × BTA."

### R6. Estimates not shown to the player — low
- **Source:** Recommendation 1: "Show [ESTIMATE] items to the player as 'simplified assumption'."
- **PRD:** FR-31 marks estimates "in the documentation" only. §2.2 says figures are "partly estimated", but no FR tells the student which.
- **Fix:** FR-6 or FR-31 consequence: "Figures based on [ESTIMATE] parameters are labelled 'forenklet antakelse' in the interface."

### R7. Cost-level dispute, VAT and basement not reflected — low
- **Source:** §3 "the Prisbok-2017-indexed level and the Bygganalyse-2023 level disagree (≈28.6k vs ≈36.8k)"; "All prices are NOK, excl. VAT"; P10 basement 0.55 × P6.
- **PRD:** §11 Q6 lists land prices and structural factors as weak, not the construction cost level; no VAT basis; no basement mentioned anywhere.
- **Fix:** Add P6 to §11 Q6; state "all figures excl. VAT" in §4.9; add "basement/parking" to §7 Non-Goals (or decide to model it with P10).

### R8. Parameter file with source IDs — low
- **Source:** Recommendation 2: "keep all parameters in one data file with source IDs, so the group can swap in better figures without code changes."
- **PRD:** FR-31 requires sources but not where they live.
- **Fix:** Add to FR-31 or NFR-8: "All parameters live in one data file, each with its P-number and source ID." (Can also be left to architecture; mention as a handoff note.)

## 2. Instructor feedback (tilbakemelding-product-brief.md)

**Covered:** demo mode without key (NFR-1, FR-16 prepared answers = "lagrede KI-svar"); key outside Git and out of the browser (NFR-2); determinism (FR-30); AI chooses among the student's options in stage 2 (FR-22); LLM-generated scenario dropped (fixed scenario); LLM provider/cost (§11 Q5 and §6 cap; acceptable because FR-17 is optional).

### F1. Simulation rules still not written down — high
- **Source:** "Simuleringsmodellen er ikke beskrevet ... Uten konkrete regler (f.eks. «å sette inn ekstra mannskap ... forkorter varigheten med X % og øker kostnaden med Y») ... Dette er kjernen i appen og må på plass før PRD." Next step 1: "hvilke tilstandsvariabler som finnes, hvordan hver beslutningstype endrer dem, og 2-3 regneeksempler med fasit."
- **PRD:** FR-31 requires rules with worked examples later; the only worked example anywhere is the research's concept cost (plot B, steel, 5 floors, ≈123 MNOK). Undefined in the PRD: the state variables; the effect of overtime and hiring (duration -X %, cost +Y); risk response effects (accept/reduce/transfer/avoid: cost and change in probability/impact); how the reserve is drawn down (FR-12); how large an estimate overrun is (FR-19: e.g. actual = reference value, or a share of the gap); change request "now vs later" cost growth (FR-20); how the AI recommendation is chosen (FR-22); how the budget bridge assigns cost to causes (FR-24).
- **Fix:** Add a short §4.9 subsection (or an addendum the PRD links to) listing the state variables and one rule line per decision type, each with one worked example and answer: (1) concept cost and duration (reuse the research example); (2) overtime vs hiring on an estimate overrun; (3) one risk response applied in stage 2; (4) the budget bridge for a sample playthrough. Values may be [ESTIMATE]. This is what the examiner will look for first, since the feedback asked for it explicitly.

### F2. "Right" (FR-28) and difficulty (FR-1) undefined — medium
- **Source:** "Success Criteria ... «Update correctly» og «internally coherent» krever at dere definerer hva som er riktig." "Gjør KI-rådgiveren til en som velger blant de samme beslutningsalternativene."
- **PRD:** FR-28 "how often those were right"; FR-1 difficulty "sets how often the AI's stage 2 recommendation is the best one"; FR-22 "chosen by rules". "Best" and "right" have no metric (lowest cost? earliest week? a weighted score against the targets?). On harder levels the AI is deliberately wrong sometimes; the PRD should say so, since §4.6 calls the adviser "correct and testable".
- **Fix:** Define one score (e.g. the weighted deviation from target week and target cost) used for "best" in FR-1, "right" in FR-28 and the AI's choice in FR-22. State that difficulty affects only stage-2 recommendations, not stage-1 warnings.

### F3. No cut line inside the must-have scope — medium
- **Source:** "Definer en minimal versjon som sikkert kan bli ferdig, og legg resten i tydelige trinn." Minimal version: "én komplett gjennomspilling av ett fast scenario med forking og side-om-side-sammenligning."
- **PRD:** §8.1 is FR-1..FR-31 except FR-17. Keeping the scope is a deliberate memlog decision (not a gap), but the memlog also says "reassess scope once development is under way" and the PRD gives no order to cut in.
- **Fix:** Add one line to §8: an ordered list of what goes first if time runs out (for example: FR-2 meeting -> FR-16 suggested questions -> FR-23 plan vs actual overlay -> FR-28 AI trust), and name the core loop that must never be cut (concept -> estimate -> approve -> events with AI path -> budget bridge). This answers the feedback without changing scope.

### F4. Stage-1 suggestions not bound to the student's options — low
- **Source:** "KI-rådgiveren ... velger blant de samme beslutningsalternativene som studenten."
- **PRD:** FR-14 "a suggestion with a short reason"; FR-9 suggests durations. Nothing says the suggestion must be a choosable value (a plot from the three, a floor count from the fixed set, a valid response).
- **Fix:** FR-14 consequence: "Every suggestion is one of the options the student can choose at that step."

### F5. Layering only partly stated — low
- **Source:** "Skill tydelig mellom simuleringsmotor (ren, testbar kode), KI-lag og visning i arkitekturen."
- **PRD:** NFR-8 requires the engine, model, adviser rules and event selection to be pure; NFR-2 puts the LLM call server-side. No statement that the LLM layer and the view only read from the engine.
- **Fix:** Add to NFR-8: "The view and the language model layer never compute simulation figures; they read them from the engine." Mainly an architecture handoff.

### F6. Side-by-side screen not flagged for UX — low
- **Source:** "Side-om-side-sammenligningen er det viktigste skjermbildet. Skisser hvordan to Gantt-diagrammer og kostnadstall vises sammen."
- **PRD:** FR-22 and FR-26 specify completion week and cost only.
- **Fix:** Note in FR-22 that this is the key screen for the UX step, and that it shows both paths' week and cost against targets (and optionally both Gantt bars).

## 3. Assignment text

Coverage of each item:

| Assignment item | PRD coverage | Status |
|---|---|---|
| Data inn: Prosjektomfang/WBS | FR-7 (generated from concept; own WBS is a non-goal) | covered (generated, not entered) |
| Data inn: Ressurskapasitet | none | **gap A2** |
| Data inn: Kost/tempo-parametre | FR-31, research P1-P17 | covered |
| Data inn: Risikoer/hendelser | FR-10, FR-19 | covered |
| Data inn: Milepæler | none | **gap A1** |
| Data inn: Endringsforespørsler | FR-19, FR-20 | covered (one per playthrough) |
| Data ut: Tidsplaner (Gantt) | FR-8, FR-23 | covered |
| Data ut: Kostprognoser | FR-6 (stage 1); stage 2 none | **gap A3** |
| Data ut: Risikoeksponering | FR-11 (stage 1 only) | partial, A6 |
| Data ut: Scenarioresultater | FR-22, FR-26 | covered |
| Data ut: Anbefalte tiltak | FR-14, FR-22, FR-27 | covered |
| Beslutning: Planstrategi | FR-3..FR-9, FR-12 (concept, estimate, reserve) | covered, but not named as such (G1) |
| Beslutning: Risikorespons | FR-11, FR-20 | covered |
| Beslutning: Ressursallokering | FR-20 (estimate-overrun options only) | weak, **A4** |
| Beslutning: Endringsgodkjenning | FR-20 | covered, A5 |
| Sikkerhet/innlogging: Ja | decision log instead (memlog, deliberate) | not a gap; A7 for wording |
| Versjonskontroll og audit-logg | FR-29 decision log; FR-13 baseline lock | covered |

### A1. Milestones missing — high
- **Source:** "Data inn: ... milepæler".
- **PRD:** Not in the glossary or any FR. The only time target is the final target week.
- **Fix:** Add "Milestone" to the glossary (e.g. frame complete / "tett bygg" / handover, each with a target week from the model) and a consequence on FR-8 ("the Gantt chart shows the milestones and their target weeks"), FR-18 ("passing or missing a milestone is shown") and FR-23 ("milestones planned vs actual"). Cheap to add and closes an explicit assignment input.

### A2. Resource capacity not modelled — high
- **Source:** "Data inn: ... ressurskapasitet"; learning goal "resources have limits" (PRD §3); decision point "ressursallokering".
- **PRD:** No capacity concept. §7 excludes detailed crew planning; §10 says the goal "is met" in stage 2, but FR-20 only lists "overtime" and "hiring more workers" as options without any limit. The v0.5 crowding rule is mentioned in §4.7 but not required.
- **Fix:** Without reintroducing crew planning, add a simple capacity to FR-20 or a new FR: each main part has a crew capacity (from the model) and a maximum useful crew (crowding: more workers beyond this give less speed-up, per v0.5); overtime is capped by P17. State the rule with a worked example (ties to F1). This gives the "limits" in the learning goal something to bite on.

### A3. No cost forecast during execution — medium
- **Source:** "Data ut: ... kostprognoser".
- **PRD:** FR-6 shows cost in planning; FR-22 shows cost "after every decision"; §10 lists the v0.5 "forecast" as reused, but no FR requires a running forecast in stage 2.
- **Fix:** Add a consequence to FR-18: "During execution the student sees the forecast completion week and final cost against the targets and the remaining reserve, updated each week."

### A4. Resource allocation is guaranteed only via one event — medium
- **Source:** "Beslutningspunkter: ... ressursallokering".
- **PRD:** FR-19 guarantees one estimate overrun; FR-20 gives overtime/hiring options for that event only. Other events (strike, wind) have no resource option required.
- **Fix:** Either state in FR-20 that external-risk events also include at least one resource option where it makes sense (e.g. extra crew to recover after a strike), or state explicitly in §10 that the single guaranteed overrun event is the resource-allocation decision point.

### A5. Change approval lacks "reject" — low
- **Source:** "Beslutningspunkter: ... endringsgodkjenning".
- **PRD:** FR-20: "the options include approving now and approving later at a higher cost."
- **Fix:** Add "reject" (with its effect, e.g. lower client satisfaction or none) so it is a real approval decision.

### A6. Risk exposure not shown in stage 2 — low
- **Source:** "Data ut: ... risikoeksponering".
- **PRD:** FR-11 updates exposure in stage 1; FR-25 lists prepared vs occurred risks in the debrief.
- **Fix:** Optional consequence on FR-18: remaining risk exposure shown and reduced as risks pass or occur.

### A7. Login and version control not answered in the PRD text — low
- **Source:** "Sikkerhet/innlogging: Ja, prosjektdata kan være konfidensielle. Versjonskontroll og audit-logg anbefales."
- **PRD:** §7 lists "accounts, login" as a non-goal and §6 Privacy says no personal data is collected, but the PRD never says why the assignment's "Ja" does not apply. The decision itself is deliberate.
- **Fix:** One sentence in §6 or §10: "The assignment recommends login because project data can be confidential; this simulator uses only a fictional public scenario and stores nothing server-side, so the decision log (FR-29) and the locked baseline (FR-13) serve as audit log and version control."

## 4. Grading guide part 1

### G1. No trace table assignment -> FR — medium (process & AI steering, 30 %)
- **Source:** "traceable plan -> code"; functionality "omissions vs proposal explained".
- **PRD:** FRs say "Realizes UJ-1" but never point to assignment items; omissions (milestones, capacity) are not explained.
- **Fix:** Add a short appendix with the table in §3 above (assignment item -> FR, or "not covered, because ..."). It costs little and is exactly what the examiner checks.

### G2. Brief out of date — medium (process; warning sign)
- **Source:** "Warning sign: planning docs describing another app than delivered"; "BMAD docs used and updated, deviations explained".
- **PRD:** §10 records the deviation; memlog says "brief to be updated afterwards" and "Brief scope section must be updated to match" (~80 h). Neither is done yet.
- **Fix:** Update the brief (stage 1 step 2, capacity ~80 h) or add a dated note at its top pointing to PRD §10. Track as an open item.

### G3. No documented manual tests — medium (QA, 15 %)
- **Source:** "meaningful automated tests, documented manual tests".
- **PRD:** NFR-8 and FR-31 cover automated tests; SM-1/SM-2 are user tests. Nothing requires manual test scripts for the 3D view, keyboard use, prepared answers without key, or the download in FR-29.
- **Fix:** Add NFR-9 "Manual test checklist": a written checklist for parts not covered by automated tests (3D view, NFR-5 keyboard/contrast, FR-29 download, no-key run), run and recorded before delivery.

### G4. `.env.example` and README not required — low (README & runnability, 10 %)
- **Source:** "runs from README without the group's keys; .env.example".
- **PRD:** NFR-1 "runs from the README with no keys"; NFR-2 key in an environment variable.
- **Fix:** Add to NFR-2: "The repo has a `.env.example` naming the optional key; the README explains the no-key run and how to enable FR-17."

### G5. Design traces and feedback — low (design/UX, 10 %)
- **Source:** "consistency, clear feedback, basic accessibility: contrast, keyboard, alt text; design traces such as sketches/UX descriptions."
- **PRD:** NFR-5 covers keyboard, contrast and a text alternative for 3D. No requirement for visible feedback on actions (e.g. why "Approve" is disabled) or for UX sketches.
- **Fix:** Add to NFR-5: "Disabled actions say why (e.g. which zoning limit is broken)." Point to the coming UX step (bmad-ux) for sketches, with the side-by-side screen (F6) as a must.

## Not gaps (checked)

- No login / decision log as audit log, FR-17 optional, ~80 h with scope kept: deliberate (memlog).
- Lift requirement for 2+ floors: FR-4 matches P9 [30].
- 23 m² BTA per workplace: §4.2 matches P1.
- Land per m² BRA: FR-3 matches P4.
- Structural system mainly changes time: §4.2/FR-5 match P7/P12.
- LLM provider and cost left open: acceptable while FR-17 is outside MVP (§11 Q5).
