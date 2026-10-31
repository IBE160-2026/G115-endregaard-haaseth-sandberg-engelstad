---
title: "Simulation rules: Fra tomt til tak"
status: draft
created: 2026-10-31
updated: 2026-10-31
---

# Simulation rules: Fra tomt til tak

This document holds the rules of the building-block model and the stage 2 engine for the PRD (`prd.md`, FR-31). It is written for two readers:

- **The G115 group**, who must be able to check every number by hand with a calculator. The instructor asked for exactly this: write the rules yourselves, keep them simple and explicit, and give worked examples with answers.
- **Claude Code**, which implements the engine. Every rule is numbered (R1, R2 …) and names the FR it implements. Every worked example in §4 becomes an automated test.

Simplicity beats precision (PRD SM-C3). Every value is either sourced from the research or marked as an estimate, and every estimate can be changed in one data file without code changes.

Sources:
- **P1–P17**: parameter table in `../../research/research-fra-tomt-til-tak-2026-10-31/research.md`.
- **V1–V12, E1–E10, R1–R8 (projects)**: `../../research/research-referanseprosjekter-2026-10-31/research.md`.
- **v0.5**: the group's earlier game (`ByggAPP/G115_FinalPrompt.md` §4), reused for work modes, crowding, site overhead per week, forecast and seeds.

Flags: **[SOURCED]** means the value comes directly from a source. **[ESTIMATE]** means the group or the research chose it, anchored on sources where possible. Every [ESTIMATE] is listed in §5 for the group's approval.

---

## 0. Units and rounding

All examples follow these rules, and the engine must follow them too.

| Quantity | Unit | Rounding |
|---|---|---|
| Area | m² | Whole m², half up (1,916.5 → 1,917) |
| Duration | weeks | Whole weeks, half up (4.5 → 5, 4.4 → 4). One exception: a *halved* risk delay rounds **down** (R11). |
| Money | MNOK (million NOK), excl. VAT, 2026 prices | 3 decimals (nearest 1,000 NOK), half up, at the end of each rule. The interface shows 1 decimal. |
| Share / probability | % | Exact; no rounding |

- **Round once per rule**, at the end. Never round an intermediate value inside a rule. For example, R2 computes the plot area directly from BTA, not from a rounded footprint.
- **Implementation note:** compute money in whole NOK and durations in tenths of a week (integers), so that results like 4.5 or 6.5 round the same way as on a calculator. Floating point can turn 6.5 into 6.4999… and round it the wrong way.

---

## 1. State variables and inputs

### 1.1 Inputs chosen by the student (stage 1)

| Variable | Values | Set in |
|---|---|---|
| `plot` | A, B or C (§2.2) | FR-3 |
| `floors` | 3, 4, 5 or 7 (§2.3) | FR-4 |
| `system` | cast-in-place concrete, precast concrete, steel, CLT (§2.4) | FR-5 |
| `estimate[1..6]` | Whole weeks ≥ 1 for each main part | FR-8 |
| `response[risk]` | accept, reduce, transfer, avoid, for each known risk | FR-11 |
| `reserveWeeks` | Whole weeks ≥ 0 | FR-12 |
| `reserveCost` | MNOK ≥ 0 | FR-12 |
| `difficulty` | easy, medium, hard | FR-1 |

### 1.2 Fixed inputs (the order)

| Variable | Value | Source |
|---|---|---|
| Workplaces | 100 | PRD Glossary |
| Location | Oslo | PRD Glossary |
| Target week, target cost | Derived by R14 (62 weeks, 105 MNOK with the current parameters) | FR-1 |

### 1.3 Seed

`seed` is an integer. It drives one pseudo-random number stream (R15). Same seed + same plan + same decisions = same result (FR-30).

### 1.4 State during stage 2

For each main part: start week, **work weeks** (work that overtime or hiring can compress), **idle weeks** (waiting time that nothing compresses, such as a risk delay), work mode (normal, overtime, heavy overtime, hired), and extra cost so far. For the project: the current week, cost so far, reserve used, the decision log, and the events still to come.

---

## 2. Parameters and option sets

### 2.1 Parameter table

| ID | Parameter | Value | Source | Flag |
|---|---|---|---|---|
| S1 | Area per workplace | 23 m² BTA | P1 | [SOURCED] |
| S2 | Gross area BTA | 23 × 100 = **2,300 m²** | P1 | [SOURCED] |
| S3 | BRA share of BTA | 0.90 (BRA = 2,070 m²) | P2 | [ESTIMATE] |
| S4 | Floor-to-floor height | 4.0 m | P3 | [ESTIMATE] |
| S5 | Land price per m² BRA | A 35,000 · B 20,000 · C 8,000 NOK | P4a–c | [ESTIMATE] |
| S6 | Typical utilisation (%BRA) of the plot's zone | A 400 % · B 200 % · C 125 % | P5a–c | [ESTIMATE] |
| S7 | Maximum footprint (%BYA) | A 60 % · B 40 % · C 30 % | Form of the limit: P5 / [18]. Values adjusted from P5 (see §5) | [ESTIMATE] |
| S8 | Maximum height | A 28 m · B 22 m · C 16 m | P5a–c, heights from [20][21] | [ESTIMATE] |
| S9 | Available plot area | A 1,000 m² · B 2,000 m² · C 3,000 m² | none | [ESTIMATE] |
| S10 | Construction cost, all-in | 35,000 NOK/m² BTA | P6 | [SOURCED] range, midpoint [ESTIMATE] |
| S11 | Work cost (construction cost excl. site overhead) | **29,000 NOK/m² BTA** (= 66.700 MNOK) | Derived from S10 and S13 (R5) | [ESTIMATE] |
| S12 | Structural-system cost factor (on S11) | cast-in-place 0.96 · precast 1.00 · steel 1.02 · CLT 1.05 | CLT +5 %: P7 / [9]. Others: none found | CLT [SOURCED], others [ESTIMATE] |
| S13 | Site overhead (rigg og drift) | **0.300 MNOK per construction week** | Derived from P6s (R7) | [ESTIMATE] |
| S14 | Lift requirement | Lifts always included (required from 2 floors) | P9 / TEK17 [30] | [SOURCED] |
| S15 | Number of lifts | 1 for ≤ 4 floors, 2 for ≥ 5 floors | none | [ESTIMATE] |
| S16 | Lift cost | 0.300 MNOK per lift per floor served | Anchored on P9 (~1.5 MNOK per lift at 5 floors) | [ESTIMATE] |
| S17 | Permit (rammetillatelse) processing time | 12 weeks | V8 / [14] | [SOURCED] |
| S18 | Reference construction period for phase shares | 52 weeks (12 months) | P11, V1 | [ESTIMATE] anchored |
| S19 | Phase shares of S18 | groundworks 25 % · envelope 20 % · technical and interior 20 % · handover 10 % | V3, V5, V6, V7 (Elvebredden [10]) | [ESTIMATE] (one project) |
| S20 | Frame time per floor | cast-in-place 2.0 · precast 1.5 · steel 1.2 · CLT 1.0 weeks | Cast-in-place: P12 / [10][16]. Steel: V9 (1.0–1.3). CLT: V10. Precast: between the two | cast-in-place, steel, CLT [ESTIMATE] anchored; precast [ESTIMATE] |
| S21 | Deviation list (actual vs reference) | −10 %, 0 %, +10 %, +20 %, +30 % (mean +10 %) | Skewed toward overrun, as in V11 / E1 (7 of 10 projects overrun) | [ESTIMATE] |
| S22 | Warning threshold, schedule estimate | 20 % from the reference | PRD FR-15; V11 supports 20–30 % | [SOURCED] (design choice) |
| S23 | Normal working week | 37.5 h | v0.5 | [SOURCED] (Norwegian norm) |
| S24 | Planned crew per construction main part | 24 workers | v0.5 crews (30–34 for a larger building) | [ESTIMATE] |
| S25 | All-in labour rate | 650 NOK/h | P15 | [ESTIMATE] |
| S26 | Overtime premium | +40 % (factor 1.4 on overtime hours) | P16 / aml § 10-6 [26]: at least 40 % | [SOURCED] (legal minimum) |
| S27 | Overtime caps | 10 h per week, 25 h per 4 weeks, 200 h per 52 weeks | P17 / [26] | [SOURCED] |
| S28 | Overtime level | 6.25 h per worker per week (= 25 h per 4 weeks, exactly at the cap) | Derived from S27 | [ESTIMATE] (design choice) |
| S29 | Hired workers | +50 % of crew = 12 workers | v0.5 | [ESTIMATE] |
| S30 | Crowding | each hired worker gives 0.5 of a full worker's output, paid in full | v0.5, PRD FR-20 | [ESTIMATE] |
| S31 | Change request | now: +2.000 MNOK and +2 weeks; later: +3.000 MNOK and 0 weeks | V12 / E8 (changes ~14 % of contract cost; later costs more) | [ESTIMATE] anchored |
| S32 | AI reliability by difficulty | easy 100 % · medium 80 % · hard 60 % | v0.5 | [ESTIMATE] (design choice) |

### 2.2 Plots (FR-3)

| Plot | Type (research tier) | Price per m² BRA (S5) | Utilisation (S6) | **Price per m² plot** (R3) | Max %BYA (S7) | Max height (S8) | Max floors at 4.0 m | Available plot area (S9) |
|---|---|---|---|---|---|---|---|---|
| **A** | Central (Bjørvika type) | 35,000 | 400 % | **140,000 NOK** | 60 % | 28 m | 7 | 1,000 m² |
| **B** | Inner city (Nydalen/Bryn type) | 20,000 | 200 % | **40,000 NOK** | 40 % | 22 m | 5 | 2,000 m² |
| **C** | Outer (Økern/Groruddalen type) | 8,000 | 125 % | **10,000 NOK** | 30 % | 16 m | 4 | 3,000 m² |

The utilisation (%BRA) is used **only to derive the price** (R3). The model does not check %BRA. The values are chosen so that every allowed concept stays within its plot's %BRA anyway. For example, plot A with 7 floors uses 2,070 ÷ 548 = 378 % ≤ 400 %.

### 2.3 Floors (FR-4)

The options are **3, 4, 5 or 7 floors**, giving heights of 12, 16, 20 and 28 m and footprints of 767, 575, 460 and 329 m². Six floors is left out to keep the set at four.

Allowed concepts after the zoning check (R4):

| | 3 floors | 4 floors | 5 floors | 7 floors |
|---|---|---|---|---|
| Plot A | ✗ needs 1,278 m² of plot, 1,000 available | ✓ | ✓ | ✓ |
| Plot B | ✓ | ✓ | ✓ | ✗ 28 m > 22 m |
| Plot C | ✓ | ✓ | ✗ 20 m > 16 m | ✗ 28 m > 16 m |

### 2.4 Structural systems (FR-5)

| System | Cost factor (S12) | Work cost | Frame weeks per floor (S20) | System-specific known risk |
|---|---|---|---|---|
| Cast-in-place concrete | 0.96 | 64.032 MNOK | 2.0 | K5 frost |
| Precast concrete | 1.00 | 66.700 MNOK | 1.5 | K7 foreign supplier strike |
| Steel + hollow-core | 1.02 | 68.034 MNOK | 1.2 | K7 foreign supplier strike |
| CLT (massivtre) | 1.05 | 70.035 MNOK | 1.0 | K6 moisture |

The faster the frame, the higher the cost. This is the trade-off the student weighs against the target week.

---

## 3. Rules

### Stage 1: the building-block model

**R1. Gross area** (FR-4, S1–S3)
`BTA = 23 × 100 = 2,300 m²`. `BRA = 0.9 × 2,300 = 2,070 m²`. BRA is used only in R3.

**R2. Footprint and plot area needed** (FR-3, FR-4)
- `footprint = BTA ÷ floors` (shown rounded to whole m²).
- `plotArea = BTA ÷ (floors × %BYA)`, rounded to whole m².

**R3. Plot cost** (FR-3)
- `pricePerM2Plot = pricePerM2BRA × utilisation` (S5 × S6). The price per m² BRA is what land costs per m² of floor area the zone allows; one m² of plot in a 400 % zone carries 4 m² BRA, so it costs 4 × the BRA price.
- `plotCost = plotArea × pricePerM2Plot`.
- Fewer floors give a larger footprint, so more plot area and a higher plot cost on the same plot. This holds for every plot, because plot area is BTA ÷ (floors × %BYA).

**R4. Zoning check** (FR-4, FR-13, FR-15)
A concept is allowed only if both hold:
1. **Height:** `floors × 4.0 m ≤ max height`.
2. **Footprint:** `plotArea ≤ available plot area`. (This is the same as `footprint ≤ %BYA × available plot area`.)

A concept that breaks either limit cannot be approved. The adviser warns and names the limit, for example "28 m is higher than the 22 m allowed on plot B".

**R5. Building cost** (FR-5, FR-6)
- `workCost = 29,000 × 2,300 × systemFactor` (S11, S12).
- `lifts = 1 if floors ≤ 4, else 2`. `liftCost = lifts × 0.300 × floors` (S15, S16). So 3 floors cost 0.900, 4 floors 1.200, 5 floors 3.000 and 7 floors 4.200 MNOK.
- `buildingCost = workCost + liftCost`.
- *Why 29,000:* the all-in figure of 35,000 NOK/m² (P6) includes site overhead. We take the site overhead out and charge it per week instead (R7), so that time costs money. Reference project: (35,000 × 2,300 − 0.300 × 44 weeks) ÷ 2,300 = (80.5 − 13.2) ÷ 2,300 ≈ 29,260, rounded to 29,000.

**R6. Main parts and reference durations** (FR-7)
The six main parts always run in this order, one after the other. The critical path is therefore all six.

| # | Main part | Reference duration | Basis |
|---|---|---|---|
| 1 | Design and building permit | 12 weeks | S17 (statutory processing time) |
| 2 | Groundworks | 13 weeks | 25 % × 52 = 13.0 |
| 3 | Frame | `round(floors × weeks per floor)` | S20 |
| 4 | Weathertight envelope | 10 weeks | 20 % × 52 = 10.4 → 10 |
| 5 | Technical installations and interior | 10 weeks | 20 % × 52 = 10.4 → 10 |
| 6 | Handover | 5 weeks | 10 % × 52 = 5.2 → 5 |

- **Construction weeks** = parts 2 to 6. **Total weeks** = 12 + construction weeks.
- The frame's share of S18 (25 %, V4) is not used, because frame time must depend on floors and system. With the allowed concepts, construction takes 41–52 weeks (9.5–12 months), within V1's 11–12 months and the 9–11 months of Stamas and Norva24.
- The adviser's duration suggestion for each part (FR-9) is its reference duration.

**R7. Site overhead** (FR-6)
- 0.300 MNOK per week, charged for every construction week (parts 2 to 6), including idle weeks. The permit phase has no site overhead.
- *Derivation:* common costs are 12.6 % of contract cost (P6s), and general costs are a further 16 %; half of these are taken as running costs during construction. That gives 12.6 % + 8 % = 20.6 % of contract cost. Contract cost = 35,000 ÷ 1.16 = 30,172 NOK/m². So 0.206 × 30,172 × 2,300 = 14.3 MNOK over 44–48 construction weeks, or 0.30–0.33 MNOK per week. Rounded to **0.300**.

**R8. Cost and completion of a plan** (FR-6, FR-8, FR-13)
- `baseCost = plotCost + buildingCost + 0.300 × construction weeks`. On the concept step (FR-6) it uses reference durations; in the plan it uses the student's estimates.
- `planCostExclReserve = baseCost + Σ upfront cost of the chosen responses (R11)`.
- `planCost = planCostExclReserve + reserveCost`.
- `planWeek = Σ estimate[1..6] + reserveWeeks`.
- The plan "meets the targets" when `planWeek ≤ target week` and `planCost ≤ target cost`. A plan that misses can still be approved, with a warning (FR-13).

**R9. Schedule estimate warning** (FR-15)
The adviser warns when `|estimate − reference| > 0.20 × reference` (strictly greater). The warning states the reference value and cites a comparable project as the reference research's §D allows. For example, with a reference of 10 weeks, an estimate of 8 or 12 does not warn, but 7 does.

**R10. Known risks** (FR-10)
Each concept has four known risks: one tied to the plot, one to the system, wind (K4) and price rise (K8). All values are [ESTIMATE]s anchored on the event table in the reference research. The event catalogue in `addendum.md` may replace them when it is written.

| ID | Risk | Applies to | p | Hits part | Delay | Cost | Alternative when it occurs (R22) | Basis |
|---|---|---|---|---|---|---|---|---|
| K1 | Contaminated ground | C: 50 %; A, B: 25 % | see left | 2 Groundworks | 4 wk | 2.000 | On-site sorting, second excavator: delay halved, +0.500 | E5 |
| K2 | Archaeological find | A only | 40 % | 2 Groundworks | 8 wk | 1.000 | Extra archaeologists: delay halved, +1.000 | E4 |
| K3 | Weathered rock | B only | 30 % | 2 Groundworks | 3 wk | 2.000 | Redesign to point foundations: delay halved, +0.400 | E+ (Høyblokka) |
| K4 | Wind stops crane lifts | all; 20 % (≤ 4 floors), 40 % (≥ 5 floors) | see left | 3 Frame | 1 wk | 0.200 | Night lifts on overtime: delay 0, +0.400 | E2 |
| K5 | Frost in fresh concrete | cast-in-place only | 40 % | 3 Frame | 2 wk | 0.800 | Heating and covers: delay halved, +0.300 | E9 (weak) |
| K6 | Moisture in CLT | CLT only | 40 % | 3 Frame | 3 wk | 0.500 | Weather tent: delay halved, +0.600 | E10 |
| K7 | Strike at a foreign supplier | precast, steel | 25 % | 3 Frame | 4 wk | 0.000 | Local supplier: delay halved, +1.200 | E3 |
| K8 | Material price rise | all | 20 % | 3 Frame (fires at frame start) | 0 wk | 2.000 | Switch supplier: cost 1.500 instead of 2.000, +1 week | E6 |

**R11. Responses and risk exposure** (FR-11, FR-21)
For a risk with probability p, delay d weeks and cost c, its **full impact** is `I = c + 0.300 × d`.

| Response | Upfront cost (in plan cost) | Impact if it occurs |
|---|---|---|
| Accept | 0 | d weeks, c |
| Reduce | 0.20 × I | ⌊d ÷ 2⌋ weeks (rounded **down**), c ÷ 2 |
| Transfer | 1.25 × p × c (insurer's premium with 25 % margin). Not offered when c = 0 | d weeks, 0 cost (the delay is not covered) |
| Avoid | 0.50 × I | Removed; the risk cannot occur |

- **Risk exposure** (shown after every choice) = Σ over risks of `p × impact after the response`. It is shown as expected cost incl. site overhead, expected delay in weeks, and expected cost excl. site overhead.
- A risk that occurs in stage 2 applies the impact of the chosen response (FR-21). Its delay is added as **idle weeks** on the part it hits.

**R12. Adviser suggestions in stage 1** (FR-9, FR-14)
- **Durations:** the reference durations (R6).
- **Response:** the one with the lowest `upfront + exposure`. If two tie, the one with the lower expected delay; if still tied, the first in the table order accept, reduce, transfer, avoid.
- **Reserve:** `reserveWeeks = round(0.10 × reference construction weeks + expected delay of the risks)`. The 0.10 is the mean of the deviation list (S21). `reserveCost = 0.300 × reserveWeeks + expected risk cost excl. site overhead`.

**R13. Reserve during stage 2** (FR-12)
- Cost reserve used = `min(reserveCost, max(0, forecastCost − planCostExclReserve))`.
- Time reserve used = `min(reserveWeeks, max(0, forecastWeek − Σ estimates))`.
- The reserve "runs out" when either overrun is larger than its reserve. Reserve that is not used is not spent: the final cost is what was actually spent.

**R14. Targets** (FR-1)
The targets come from a **reference plan**: plot C, 4 floors, steel, reference durations, the suggested responses and the suggested reserve (R12).
- `target week = reference plan's planWeek`.
- `target cost = reference plan's planCost`, rounded **up** to whole MNOK (a client states a round budget).
- With the current parameters this gives **62 weeks and 105 MNOK** (worked example (a)). The engine computes them from the parameters, so they follow if the group changes a value.
- The other systems on plot C each miss one target narrowly (precast 1 week late, cast-in-place 2 weeks late, CLT 1.765 MNOK over), so the student has a real trade-off (Appendix A).

### Stage 2: execution

**R15. Seed stream** (FR-19, FR-30)
One pseudo-random stream gives numbers u in [0, 1). The architecture picks the generator (v0.5 has one). Numbers are drawn in this fixed order, which never depends on the student's choices:
1. Five draws, one per main part 2 to 6, for the deviation (R16).
2. One draw per known risk for the concept, in K-number order, for occurrence (R17). An avoided risk still uses its draw, so the rest of the stream does not shift.
3. One draw per event, in event order, for AI reliability (R25).

**R16. Actual durations** (FR-19)
- `actual[i] = round(reference[i] × (1 + deviation[i]))` for parts 2 to 6, with `deviation[i] = list[floor(u × 5)]` from S21.
- The permit (part 1) always takes 12 weeks, because it is a statutory processing time.
- Actual durations do **not** depend on the student's estimates. The estimates only set the plan and decide which part overruns.

**R17. External risk events** (FR-19, FR-21)
- A known risk occurs if `u < p` and its response is not avoid. At most two occur; if more qualify, the two with the lowest u are kept.
- If none qualifies, the non-avoided risk with the lowest `u ÷ p` occurs, so there is always at least one external event while one is possible.
- If every risk is avoided, there is no external event (or an opportunity, if FR-35 is approved).

**R18. Estimate overrun** (FR-19)
- `gap[i] = actual[i] − estimate[i]` for parts 2 to 6. Overtime and hiring cannot speed up a permit, so part 1 is left out; an underestimated permit still shows up in the budget bridge, step 2.
- The event hits the part with the largest positive gap. On a tie, the earlier part wins. Its size is the gap in weeks.
- If no gap is positive, there is no estimate overrun. One more external risk takes its place: the eligible risk with the next-lowest `u ÷ p` that has not already occurred. If there is none, an opportunity (FR-35) or nothing.

**R19. Event timing and idle weeks** (FR-18)
- Every event fires at the **start** of the main part it concerns. The change request fires at the start of part 5. Within one part the order is: estimate overrun, then external risks, then the change request.
- A part's duration = work weeks + idle weeks. Overtime and hiring compress only work weeks; risk delays and the change request's weeks are idle weeks.

**R20. Overtime** (FR-20)
- **Overtime:** the crew works 37.5 + 6.25 = 43.75 h a week, so output is ×7/6. `D = round(W × 6 ÷ 7)` where W is the part's work weeks.
  Extra cost = premium only = `24 workers × 6.25 h × 650 × 0.4 = 39,000 NOK` = **0.039 MNOK per overtime week**, times D. The normal-rate pay for the overtime hours is already in the work cost, because the amount of work does not change.
- 6.25 h a week is exactly 25 h per 4 weeks, so normal overtime stays within the caps for up to 32 weeks (200 h ÷ 6.25).
- **Heavy overtime:** if overtime is chosen a second time for the same part (for example at an external event after an estimate overrun), it becomes 12.5 h a week. Output is ×50/37.5 = ×4/3, so `D = round(W × 3 ÷ 4)`, and the premium is `24 × 12.5 × 650 × 0.4 = 0.078 MNOK per week`. This breaks the 10 h per week cap, so the adviser warns (FR-20), and the warning goes in the decision log.
- Caps are checked per main part (each part has its own crew). Overtime and hiring cannot be combined on one part in v1.

**R21. Hiring with crowding** (FR-20)
- +12 hired workers, each giving 0.5 of a full worker's output: the effective crew is 24 + 6 = 30, so output is ×1.25. `D = round(W × 0.8)`.
- Extra cost = the unproductive half of the hired hours = `12 × 37.5 h × 650 × 0.5 = 146,250 NOK` = **0.14625 MNOK per hired week**, times D (rounded at the end to 3 decimals).
- Effect of the parameters: overtime costs about 6 × 0.039 = 0.234 MNOK per week saved, which is less than 0.300 of site overhead, so it usually pays off. Hiring costs about 4 × 0.14625 = 0.585 MNOK per week saved; it is faster but rarely pays off. Rounding of D decides close cases.

**R22. External risk event options** (FR-20, FR-21)
When a known risk occurs, the student picks one option:
1. **Take the impact** under the chosen response (R11).
2. **The alternative** from R10's table, applied to the delay after the response. "Delay halved" means ⌊delay ÷ 2⌋ (rounded down), at the extra cost listed.
3. **Overtime on the affected part** (R20), if it is part 2 to 6. It compresses only the work weeks.

A risk that was avoided never fires (FR-21).

**R23. Change request** (FR-20)
One change request per playthrough, at the start of part 5:
- **Approve now:** +2.000 MNOK, +2 idle weeks on part 5.
- **Approve later** (as a separate job after handover): +3.000 MNOK, no delay.

Now is usually cheaper (2.000 + 2 × 0.300 = 2.600 < 3.000), but later protects the target week. This is a real conflict between cost and time.

**R24. Forecast** (FR-22, FR-34)
The forecast runs the engine on from the current state with no new events, as in v0.5. Forecast final cost = cost so far + the remaining parts at their actual durations and current work modes, + site overhead for every remaining construction week.

**R25. AI recommendation and difficulty** (FR-1, FR-22)
- For each option, compute the forecast final cost (R24). The **best option** has the lowest forecast final cost. If two tie, the earlier forecast completion week wins; if still tied, the first option listed.
- The AI recommends the best option if `u < reliability` (S32: easy 1.0, medium 0.8, hard 0.6). Otherwise it recommends the option with the second-lowest forecast final cost.
- The **AI path** after each decision (FR-22) is the forecast with the AI's option, from the same state.

### Stage 3: debrief

**R26. Budget bridge** (FR-24)
Four runs of the deterministic engine, with the same seed:

| Step | Run | Cause = |
|---|---|---|
| 1 The plan | — | `planCostExclReserve − target cost` |
| 2 The schedule estimate | Plan with actual durations, no events | `run2 − planCostExclReserve` |
| 3 Events | Run 2 + all events, each handled as the AI recommended in that run | `run3 − run2` |
| 4 The student's decisions | The real playthrough | `final cost − run3` |

- The four causes add up exactly to `final cost − target cost`, because each step starts where the previous one ended.
- The reserve is a separate line: how much of `reserveCost` was used (R13). It is not a cause.

**R27. "Right" recommendations** (FR-28)
- **Stage 2:** a recommendation is right when the playthrough's final cost with that option is **equal to or lower than** the final cost with the student's option. Only this one decision is swapped; every other decision stays as the student made it, and future events are included.
- **Stage 1:** a duration suggestion is right when `|actual − suggestion| ≤ 0.20 × suggestion`.
- A stage 1 suggestion counts as **followed** when the student's estimate equals it.
- Shown: the number of recommendations, the number followed, the number right, and the number of right ones not followed.

**R28. Missed learning goals** (§4.10, FR-27)

| Goal | Missed when (formal) |
|---|---|
| Time costs money | At some event, the student chose the option with the latest completion (took the delay), and some faster option had `extra cost < 0.300 × weeks it saves`. |
| Resources have limits | The student chose hiring where overtime saved at least as many weeks for a lower extra cost; or the student kept heavy overtime after the cap warning. |
| Risk is managed | A risk the student accepted occurred, and reduce or avoid would have cost less in hindsight (`upfront + impact incl. site overhead`); or the cost reserve or the time reserve ran out (R13). |
| AI advice is worth weighing | In at least half of all recommendations (stage 1 durations and stage 2 events), the student followed one that was not right or ignored one that was right. |

---

## 4. Worked examples (with answers)

All amounts in MNOK, all durations in weeks. Rounding as in §0. Each example is an automated test (FR-31).

### Example (a): the reference concept end to end, and the targets

**Concept:** plot C, 4 floors, steel.

**Step 1. Area and plot (R1–R4)**
- Footprint = 2,300 ÷ 4 = **575 m²**. Height = 4 × 4.0 = **16 m** ≤ 16 m ✓.
- Plot area = 2,300 ÷ (4 × 0.30) = 2,300 ÷ 1.2 = 1,916.67 → **1,917 m²** ≤ 3,000 m² ✓.
- Price per m² plot = 8,000 × 1.25 = **10,000 NOK** = 0.010 MNOK.
- Plot cost = 1,917 × 0.010 = **19.170**.

**Step 2. Building cost (R5)**
- Work cost = 29,000 × 2,300 × 1.02 = 66,700,000 × 1.02 = **68.034**.
- Lifts: 4 floors → 1 lift. Lift cost = 1 × 0.300 × 4 = **1.200**.
- Building cost = 68.034 + 1.200 = **69.234**.

**Step 3. Reference durations (R6)**
- Frame = round(4 × 1.2) = round(4.8) = **5**.
- Permit 12 · groundworks 13 · frame 5 · envelope 10 · technical and interior 10 · handover 5.
- Construction weeks = 13 + 5 + 10 + 10 + 5 = **43**. Total = 12 + 43 = **55 weeks**.

**Step 4. Base cost (R7, R8)**
- Site overhead = 0.300 × 43 = **12.900**.
- Base cost = 19.170 + 69.234 + 12.900 = **101.304**.

**Step 5. Known risks and suggested responses (R10–R12)**
Plot C + steel + 4 floors gives K1 (p 50 %), K7 (25 %), K4 (20 %), K8 (20 %).

| Risk | I = c + 0.3d | Accept: upfront + exposure | Reduce | Transfer | Avoid | Suggested |
|---|---|---|---|---|---|---|
| K1 (d 4, c 2.000) | 2.000 + 1.200 = 3.200 | 0 + 0.5 × 3.200 = **1.600** | 0.640 + 0.5 × (1.000 + 2 × 0.3) = 0.640 + 0.800 = **1.440** | 1.250 + 0.5 × 1.200 = **1.850** | **1.600** + 0 | **Reduce** |
| K7 (d 4, c 0) | 1.200 | **0.300** | 0.240 + 0.25 × 0.600 = **0.390** | not offered | **0.600** | **Accept** |
| K4 (d 1, c 0.200) | 0.500 | **0.100** | 0.100 + 0.2 × (0.100 + 0) = **0.120** | 0.050 + 0.2 × 0.300 = **0.110** | **0.250** | **Accept** |
| K8 (d 0, c 2.000) | 2.000 | **0.400** | 0.400 + 0.2 × 1.000 = **0.600** | 0.500 + 0 = **0.500** | **1.000** | **Accept** |

- Upfront cost of the suggested responses = **0.640** (K1 reduce).
- Expected delay = K1 0.5 × 2 + K7 0.25 × 4 + K4 0.2 × 1 + K8 0 = 1.0 + 1.0 + 0.2 = **2.2 weeks**.
- Expected cost excl. site overhead = K1 0.5 × 1.000 + K7 0 + K4 0.2 × 0.200 + K8 0.2 × 2.000 = 0.500 + 0.040 + 0.400 = **0.940**.

**Step 6. Suggested reserve (R12)**
- Reserve weeks = round(0.10 × 43 + 2.2) = round(4.3 + 2.2) = round(6.5) = **7**.
- Reserve cost = 0.300 × 7 + 0.940 = 2.100 + 0.940 = **3.040**.

**Step 7. The reference plan and the targets (R8, R14)**
- Plan week = 55 + 7 = **62**.
- Plan cost = 101.304 + 0.640 + 3.040 = **104.984**.
- **Target week = 62. Target cost = 104.984 rounded up = 105 MNOK.**

### Example (b): the same plot with fewer or more floors

**Plot B, steel.** Compare 3 floors with 5 floors, then try 7.

| Step | 3 floors | 5 floors |
|---|---|---|
| Height (R4) | 3 × 4 = 12 m ≤ 22 ✓ | 5 × 4 = 20 m ≤ 22 ✓ |
| Plot area (R2) | 2,300 ÷ (3 × 0.40) = 2,300 ÷ 1.2 = 1,916.67 → **1,917 m²** ≤ 2,000 ✓ | 2,300 ÷ (5 × 0.40) = 2,300 ÷ 2.0 = **1,150 m²** ≤ 2,000 ✓ |
| Price per m² plot (R3) | 20,000 × 2.00 = 40,000 NOK = 0.040 | same |
| **Plot cost** | 1,917 × 0.040 = **76.680** | 1,150 × 0.040 = **46.000** |
| Work cost (R5) | 68.034 | 68.034 |
| Lifts (R5) | 1 × 0.300 × 3 = **0.900** | 2 × 0.300 × 5 = **3.000** |
| Frame (R6) | round(3 × 1.2) = round(3.6) = **4** | round(5 × 1.2) = **6** |
| Construction weeks | 13 + 4 + 10 + 10 + 5 = **42** | 13 + 6 + 10 + 10 + 5 = **44** |
| Site overhead | 0.300 × 42 = 12.600 | 0.300 × 44 = 13.200 |
| **Base cost** | 76.680 + 68.034 + 0.900 + 12.600 = **158.214** | 46.000 + 68.034 + 3.000 + 13.200 = **130.234** |
| Total weeks | 12 + 42 = **54** | 12 + 44 = **56** |

**Answer:** 3 floors cost 158.214 − 130.234 = **27.980 MNOK more**. The land costs 30.680 more; this is only partly offset by 2.100 less for lifts and 0.600 less site overhead. The 3-floor building is 2 weeks faster.

**7 floors on plot B:** 7 × 4.0 = 28 m > 22 m → **not allowed**. The adviser says: "7 floors make the building 28 m tall; plot B allows at most 22 m."

**3 floors on plot A:** plot area = 2,300 ÷ (3 × 0.60) = 2,300 ÷ 1.8 = 1,277.78 → 1,278 m² > 1,000 m² available → **not allowed**. The adviser names the footprint limit: footprint 767 m² > 60 % × 1,000 = 600 m².

### Example (c): an estimate overrun with three options

**The student's plan.** Plot C, 4 floors, steel (as in (a)). Estimates: permit 12, groundworks 10, frame 4, envelope 8, technical and interior 8, handover 4 (total 46). All four risks accepted (upfront 0). Reserve 4 weeks and 2.000.

**Stage 1 warnings (R9):**
- Groundworks: |10 − 13| = 3 > 0.2 × 13 = 2.6 → **warning**, stating "comparable projects: about 13 weeks".
- Frame: |4 − 5| = 1, not > 1.0 → no warning. Envelope: |8 − 10| = 2, not > 2.0 → no warning. Technical and interior: same → no warning. Handover: |4 − 5| = 1, not > 1.0 → no warning.

**Plan (R8):**
- Construction weeks estimated = 10 + 4 + 8 + 8 + 4 = 34.
- Plan cost excl. reserve = 19.170 + 69.234 + 0.300 × 34 = 88.404 + 10.200 = **98.604**.
- Plan cost = 98.604 + 2.000 = **100.604** ≤ 105 ✓. Plan week = 46 + 4 = **50** ≤ 62 ✓. The plan looks comfortably within the targets.

**Actual durations (R16).** The seed gives the deviations: groundworks +20 %, frame +10 %, envelope 0 %, technical and interior +30 %, handover −10 %.

| Part | Reference | Calculation | Actual | Estimate | Gap |
|---|---|---|---|---|---|
| Permit | 12 | fixed | 12 | 12 | 0 |
| Groundworks | 13 | 13 × 1.2 = 15.6 | **16** | 10 | **6** |
| Frame | 5 | 5 × 1.1 = 5.5 | **6** | 4 | 2 |
| Envelope | 10 | 10 × 1.0 | **10** | 8 | 2 |
| Technical and interior | 10 | 10 × 1.3 = 13.0 | **13** | 8 | 5 |
| Handover | 5 | 5 × 0.9 = 4.5 | **5** | 4 | 1 |

**The event (R18):** the largest gap is groundworks, 6 weeks. At the start of groundworks the foreman reports: "Groundworks will take 16 weeks, not 10."

**The options (R20, R21), forecast with no further events (R24).** Fixed costs = plot 19.170 + building 69.234 = 88.404. The other parts take 6 + 10 + 13 + 5 = 34 weeks.

| Option | Groundworks | Extra cost | Construction weeks | Site overhead | **Forecast final cost** | **Week** |
|---|---|---|---|---|---|---|
| Take the delay | 16 | 0 | 16 + 34 = 50 | 15.000 | 88.404 + 15.000 = **103.404** | 12 + 50 = **62** |
| Overtime | round(16 × 6 ÷ 7) = round(13.71) = **14** | 14 × 0.039 = **0.546** | 14 + 34 = 48 | 14.400 | 88.404 + 14.400 + 0.546 = **103.350** | **60** |
| Hire 12 | round(16 × 0.8) = round(12.8) = **13** | 13 × 0.14625 = 1.90125 → **1.901** | 13 + 34 = 47 | 14.100 | 88.404 + 14.100 + 1.901 = **104.405** | **59** |

**Answer:**
- **The AI recommends overtime** (lowest forecast final cost, 103.350).
- Overtime saves 2 weeks, worth 0.600 in site overhead, for 0.546. It pays off by 0.054.
- Hiring is fastest (week 59) but costs 1.001 more than taking the delay.
- Overtime is 6.25 h a week, within the caps → no warning.
- If the student takes the delay, "time costs money" is missed (R28): overtime's extra cost of 0.546 < 0.300 × 2 = 0.600.

### Example (d): the budget bridge for the same playthrough

**Events in this playthrough** (seed, R17–R19):
1. The estimate overrun on groundworks (example (c)).
2. K1 contaminated ground occurs (accepted in the plan: 4 idle weeks and 2.000). It also fires at the start of groundworks, after the overrun. K4, K7 and K8 do not occur.
3. The change request at the start of technical and interior.

Difficulty is easy, so the AI always recommends the best option.

| Decision | Student chose | AI recommended (forecast) |
|---|---|---|
| Estimate overrun | Take the delay (16 weeks) | Overtime (103.350 vs 103.404) |
| K1 occurs | Take the impact: +4 weeks, +2.000 | Alternative: 4 ÷ 2 = 2 weeks, 2.000 + 0.500 = 2.500. From the student's state the forecast is 106.504 vs 106.604 |
| Change request | Later: +3.000, 0 weeks | Now: +2.000, +2 weeks. Forecast 109.204 vs 109.604 |

**The four runs (R26)**, with fixed costs 88.404 in every run:

| Run | Construction weeks | Site overhead | Event costs | Final cost | Week |
|---|---|---|---|---|---|
| Plan excl. reserve | 34 (estimates) | 10.200 | 0 | **98.604** | 46 |
| Run 2: actual durations, no events | 16 + 6 + 10 + 13 + 5 = 50 | 15.000 | 0 | **103.404** | 62 |
| Run 3: events, AI choices | (14 + 2) + 6 + 10 + (13 + 2) + 5 = 52 | 15.600 | 0.546 + 2.500 + 2.000 = 5.046 | **109.050** | 64 |
| Run 4: the student's choices | (16 + 4) + 6 + 10 + 13 + 5 = 54 | 16.200 | 2.000 + 3.000 = 5.000 | **109.604** | 66 |

**The bridge (target cost 105.000):**

| Cause | Calculation | MNOK |
|---|---|---|
| 1 The plan | 98.604 − 105.000 | **−6.396** |
| 2 The schedule estimate | 103.404 − 98.604 | **+4.800** |
| 3 Events | 109.050 − 103.404 | **+5.646** |
| 4 The student's decisions | 109.604 − 109.050 | **+0.554** |
| **Sum** | −6.396 + 4.800 + 5.646 + 0.554 | **+4.604** |
| Check: final − target | 109.604 − 105.000 | **+4.604** ✓ |

**Reserve line (R13):** overrun against the plan = 109.604 − 98.604 = 11.000 > 2.000, so all **2.000** of the cost reserve is used. The time reserve is also used up: 66 − 46 = 20 weeks late, with 4 weeks of reserve. The reserve ran out.

**Final result:** week 66 against target 62. Cost 109.604 against target 105. The AI path (FR-26) ends at week 64 and 109.050.

**AI trust (R27):**
- Stage 2, swapping one decision at a time in the student's playthrough:
  - Overtime instead of taking the delay: 109.550, which is 0.054 lower → right.
  - K1 alternative: 109.504, 0.100 lower → right.
  - Change request now: 109.204, 0.400 lower → right.
  - So 3 recommendations, 0 followed, 3 right, 3 right ones not followed.
- Stage 1, duration suggestion against actual, within 20 %:
  - Permit 12 vs 12 → right, followed.
  - Groundworks 13 vs 16 → |3| > 2.6, not right.
  - Frame 5 vs 6 → |1| ≤ 1.0, right.
  - Envelope 10 vs 10 → right.
  - Technical and interior 10 vs 13 → |3| > 2.0, not right.
  - Handover 5 vs 5 → right.
  - So 6 suggestions, 1 followed, 4 right, 3 right ones not followed.
- Totals: **9 recommendations, 1 followed, 7 right, 6 right ones not followed.**

**Missed learning goals (R28):**
- **Time costs money:** missed. At the overrun, overtime cost 0.546 < 0.600. At K1, the alternative cost 0.500 < 0.300 × 2 = 0.600.
- **Resources have limits:** not missed (no hiring, no heavy overtime).
- **Risk is managed:** missed. K1 was accepted and occurred. Accept cost 2.000 + 4 × 0.300 = 3.200, while reduce would have cost 0.640 + 1.000 + 2 × 0.300 = 2.240. The reserve also ran out.
- **AI advice is worth weighing:** missed. 6 of 9 recommendations were right and ignored (6 ≥ 4.5).

The conclusion names three missed goals, each with one piece of next-time advice (FR-27).

---

## 5. Open points for the group

**Values to approve** (all [ESTIMATE]):
1. **Plot C dominates on cost.** Land drives the budget: the cheapest allowed concept on plot A costs about 160 MNOK, on B about 127, and on C about 98 (Appendix A). The research's land prices make this unavoidable, and the targets are therefore set from plot C. Plots A and B teach that "land drives the budget" but are never a good choice. Decide whether this is acceptable, or add a counterweight. One option is an infrastructure contribution (rekkefølgekrav) on plot C; another is the longer central-site duration from V2, which is not modelled.
2. **More floors almost always pay off** up to the height limit, because land savings (6–30 MNOK) dwarf extra lifts and frame weeks (1–3 MNOK). The floor choice therefore mostly teaches the zoning limits. Accept, or make lifts and cores cost more per floor.
3. **Zoning values changed from P5.** %BYA is lowered (A 60, B 40, C 30 %) and available plot areas are added (1,000 / 2,000 / 3,000 m²). Without the change, the allowed concepts would break their plot's %BRA. Approve the new values.
4. **Site overhead 0.300 MNOK per week** and **work cost 29,000 NOK/m²**, both derived from P6/P6s (R5, R7). These two decide whether overtime pays off (R21), so they matter more than their precision suggests.
5. **Structural-system factors** 0.96 / 1.00 / 1.02 (only CLT's 1.05 is sourced), and **precast frame 1.5 weeks per floor**. P12 said 1.0 for precast, which would make precast identical to steel in speed and cheaper, so steel would never be chosen.
6. **Lift rule:** 1 lift up to 4 floors, 2 from 5 floors, 0.300 MNOK per lift per floor. No source gives lift costs.
7. **Deviation list** −10 % to +30 % (mean +10 %), and **permit fixed at 12 weeks** with no deviation. Design work beyond the application is assumed to run within the 12 weeks.
8. **Labour:** crew 24 per part, 650 NOK/h, overtime level 6.25 h a week, +12 hired at 0.5 output.
9. **Risk catalogue** (R10), including the probabilities, impacts and alternatives, and the **response prices** (reduce 20 % of I, transfer 125 % of p × c, avoid 50 % of I). Note: with these prices, reduce always beats accept in hindsight when a risk occurs, so "accepted and it occurred" always counts as a missed goal (R28). Decide whether that is fair for low-probability risks.
10. **Change request** sizes (2.000 now + 2 weeks, 3.000 later).
11. **AI reliability** 100 / 80 / 60 % (from v0.5).

**Design decisions to confirm:**

12. Target cost is rounded **up** to whole MNOK. Target week is exact.
13. The warning threshold is 20 % (the PRD); the reference research notes ±30 % as an alternative.
14. The "AI advice" goal counts stage 1 duration suggestions as well as stage 2 recommendations, and "followed" in stage 1 means the estimate equals the suggestion exactly.
15. "Time costs money" compares an acceleration option's extra cost with the site overhead of the weeks it **saves**, not with the whole delay (R28). The PRD wording allows both readings; this one agrees with the AI's cost rule.
16. All main parts run in sequence, so the Gantt chart's critical path is always all six parts. Real phases overlap (reference research §A3).
17. Opportunities (FR-35) and milestones (FR-32) are not specified here until they are approved.
18. `addendum.md` (the event catalogue) does not exist yet. R10's table is the proposal it should start from.

---

## Appendix A: All allowed concepts at reference durations

Base cost (R8) with reference durations, before risk responses and reserve. Total weeks in brackets. The fixed costs are plot cost and lift cost; the work cost varies by system.

| Plot, floors | Plot area | Plot cost | Lifts | Cast-in-place | Precast | Steel | CLT |
|---|---|---|---|---|---|---|---|
| A, 4 | 958 | 134.120 | 1.200 | 213.152 (58) | 215.220 (56) | 216.254 (55) | 217.955 (54) |
| A, 5 | 767 | 107.380 | 3.000 | 188.812 (60) | 190.880 (58) | 191.614 (56) | 193.315 (55) |
| A, 7 | 548 | 76.720 | 4.200 | 160.552 (64) | 162.320 (61) | 162.754 (58) | 164.455 (57) |
| B, 3 | 1,917 | 76.680 | 0.900 | 154.812 (56) | 157.180 (55) | 158.214 (54) | 159.915 (53) |
| B, 4 | 1,438 | 57.520 | 1.200 | 136.552 (58) | 138.620 (56) | 139.654 (55) | 141.355 (54) |
| B, 5 | 1,150 | 46.000 | 3.000 | 127.432 (60) | 129.500 (58) | 130.234 (56) | 131.935 (55) |
| C, 3 | 2,556 | 25.560 | 0.900 | 103.692 (56) | 106.060 (55) | 107.094 (54) | 108.795 (53) |
| C, 4 | 1,917 | 19.170 | 1.200 | 98.202 (58) | 100.270 (56) | **101.304 (55)** | 103.005 (54) |

**Bold** marks the reference concept (R14). With suggested responses and reserve:
- **Steel** reaches week 62 and 104.984, which meets both targets.
- **Precast** reaches week 63 and 103.950, one week late. Reserve: round(4.4 + 2.2) = 7.
- **CLT** reaches week 60 and 106.765, over budget. Upfront 0.920 (K1 and K6 reduced); reserve 6 weeks and 2.840.
- **Cast-in-place** reaches week 64 and 102.022: the cheapest, but 2 weeks late. Upfront 0.920 (K1 and K5 reduced; K5 is a tie broken by lower expected delay); reserve round(4.6 + 1.6) = 6 weeks and 2.900.
