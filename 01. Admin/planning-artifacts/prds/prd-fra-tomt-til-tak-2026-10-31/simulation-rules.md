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

Simplicity beats precision (PRD SM-C3). Every value is either sourced or marked as an estimate, and every estimate can be changed in one data file without code changes.

**Revision 2 (group decisions, 2026-10-31):**
- **One central Oslo site.** There is no choice between plots.
- **Time is the counterweight to cheap land.** More floors save land but cost frame weeks, a fire-class step and more wind risk, and the target week is tight.
- **The risk learning goal is judged on expected cost**, not on whether a risk occurred.
- **The risk catalogue uses the event IDs E1–E10** from `addendum.md`.

Sources:
- **P1–P17**: parameter table in `../../research/research-fra-tomt-til-tak-2026-10-31/research.md`.
- **V1–V12**: reference values in `../../research/research-referanseprosjekter-2026-10-31/research.md`.
- **E1–E10**: event catalogue in `addendum.md` §4, with evidence in the reference research §C.
- **TEK17**: DiBK's guidance pages for §§ 11-2, 11-3 and 11-4 (dibk.no, read 2026-10-31). These were read directly for this revision and are not in the research reports.
- **v0.5**: the group's earlier game (`ByggAPP/G115_FinalPrompt.md` §4), reused for work modes, crowding, site overhead per week, forecast and seeds.

Flags: **[SOURCED]** means the value comes directly from a source. **[ESTIMATE]** means the group or the research chose it, anchored on sources where possible. Every [ESTIMATE] is listed in §5 for the group's approval.

---

## 0. Units and rounding

| Quantity | Unit | Rounding |
|---|---|---|
| Area | m² | Whole m², half up (547.6 → 548) |
| Duration | weeks | Whole weeks, half up (8.5 → 9, 8.4 → 8). One exception: a *halved* risk delay rounds **down** (R11). |
| Money | MNOK (million NOK), excl. VAT, 2026 prices | 3 decimals (nearest 1,000 NOK), half up, at the end of each rule. The interface shows 1 decimal. |
| Probability | % | Exact; no rounding |

- **Round once per rule**, at the end, never in the middle of a rule.
- **Implementation note:** compute money in whole NOK, probabilities in whole percent and durations in tenths of a week (integers), so that values like 8.5 round the same way as on a calculator. Floating point can turn 8.5 into 8.4999… and round it the wrong way.

---

## 1. State variables and inputs

### 1.1 Inputs chosen by the student (stage 1)

| Variable | Values | Set in |
|---|---|---|
| `floors` | 3, 4, 5, 6, 7 or 8 (8 is offered but breaks the height limit, R4) | FR-4 |
| `system` | cast-in-place concrete, precast concrete, steel, CLT | FR-5 |
| `estimate[1..6]` | Whole weeks ≥ 1 for each main part | FR-8 |
| `response[risk]` | accept, reduce, transfer or avoid, for each known risk | FR-11 |
| `reserveWeeks` | Whole weeks ≥ 0 | FR-12 |
| `reserveCost` | MNOK ≥ 0 | FR-12 |
| `difficulty` | easy, medium, hard | FR-1 |

FR-3 (choose a plot) becomes a fixed site in v1. The PRD needs a matching edit (§5).

### 1.2 Fixed inputs

| Variable | Value | Source |
|---|---|---|
| Workplaces | 100 | PRD Glossary |
| Site | One central Oslo plot (Bjørvika type), §2.2 | Group decision |
| Target week, target cost | Derived by R14: **67 weeks, 169 MNOK** with the current parameters | FR-1 |

### 1.3 Seed

`seed` is an integer. It drives one pseudo-random number stream (R15). The same seed, plan and decisions always give the same result (FR-30).

### 1.4 State during stage 2

For each main part, the engine keeps:
- the start week;
- **work weeks**: work that overtime or hiring can compress;
- **idle weeks**: waiting that nothing compresses, such as a risk delay;
- the work mode: normal, overtime, heavy overtime or hired;
- the extra cost so far.

For the project it keeps the current week, the cost so far, the reserve used, the decision log and the events still to come.

---

## 2. Parameters and option sets

### 2.1 Parameter table

| ID | Parameter | Value | Source | Flag |
|---|---|---|---|---|
| S1 | Area per workplace | 23 m² BTA | P1 | [SOURCED] |
| S2 | Gross area BTA | 23 × 100 = **2,300 m²** | P1 | [SOURCED] |
| S3 | BRA share of BTA | 0.90 (BRA = 2,070 m²) | P2 | [ESTIMATE] |
| S4 | Floor-to-floor height | 4.0 m | P3 | [ESTIMATE] |
| S5 | Land price per m² BRA, central | 35,000 NOK | P4a | [ESTIMATE] |
| S6 | Typical utilisation (%BRA) of the zone | 400 % | P5a | [ESTIMATE] |
| S7 | **Land price per m² plot** | 35,000 × 4.00 = **140,000 NOK** | R3 | [ESTIMATE] (derived) |
| S8 | Maximum footprint (%BYA) | 60 % | Form of the limit: P5 / [18]. Value lowered from P5a's 80 % so that 7 floors stay within 400 % BRA | [ESTIMATE] |
| S9 | Maximum height | 28 m (7 floors) | P5a; heights [20][21] | [ESTIMATE] |
| S10 | Available plot area | 2,000 m² (more than any option needs) | Group decision | [ESTIMATE] |
| S11 | Construction cost, all-in | 35,000 NOK/m² BTA | P6 | [SOURCED] range, midpoint [ESTIMATE] |
| S12 | Work cost (construction cost excl. site overhead) | **29,000 NOK/m² BTA** (= 66.700 MNOK) | Derived from S11 and S14 (R5) | [ESTIMATE] |
| S13 | Structural-system cost factor (on S12) | cast-in-place 0.96 · precast 1.00 · steel 1.02 · CLT 1.05 | CLT +5 %: P7 / [9]. Others: none found | CLT [SOURCED], others [ESTIMATE] |
| S14 | Site overhead (rigg og drift) | **0.300 MNOK per construction week** | Derived from P6s (R7) | [ESTIMATE] |
| S15 | Lift requirement | Lifts always included (required from 2 floors) | P9 / TEK17 [30] | [SOURCED] |
| S16 | Number of lifts | 1 for ≤ 4 floors, 2 for ≥ 5 floors | none | [ESTIMATE] |
| S17 | Lift cost | 0.300 MNOK per lift per floor served | Anchored on P9 (~1.5 MNOK per lift at 5 floors) | [ESTIMATE] |
| S18 | Fire class (brannklasse) by floors | Offices are risk class 2. Risk class 2 gives BKL 1 for 1–2 floors, **BKL 2 for 3–4 floors** and **BKL 3 for 5 or more**. The preaccepted main load-bearing system is R 60 in BKL 2 and **R 90 A2-s1,d0 (non-combustible)** in BKL 3 | TEK17 § 11-2 Table 1 ("Kontor: 2"); § 11-3 Table 1; § 11-4 Table 1 (dibk.no, read 2026-10-31) | [SOURCED] (rule) |
| S19 | Fire-class cost step | BKL 3: **+1.500 MNOK** (all systems). CLT in BKL 3: **+2.000 MNOK more**, because a combustible main system is not preaccepted and needs a fire analysis plus encapsulation | none | [ESTIMATE] |
| S20 | Permit (rammetillatelse) processing time | 12 weeks | V8 / [14] | [SOURCED] |
| S21 | Reference construction period for phase shares | 52 weeks (12 months) | P11, V1 | [ESTIMATE] anchored |
| S22 | Phase shares of S21 | groundworks 25 % · envelope 20 % · technical and interior 20 % · handover 10 % | V3, V5, V6, V7 (Elvebredden [10]) | [ESTIMATE] (one project) |
| S23 | Frame time per floor | cast-in-place 2.0 · precast 1.5 · steel 1.2 · CLT 1.0 weeks | Cast-in-place: P12 / [10][16]. Steel: V9 (1.0–1.3). CLT: V10. Precast: in between | Precast [ESTIMATE]; others [ESTIMATE] anchored |
| S24 | Deviation list (actual vs reference) | −10 %, 0 %, +10 %, +20 %, +30 % (mean +10 %) | Skewed toward overrun, as in V11 / E1 (7 of 10 projects overrun) | [ESTIMATE] |
| S25 | Warning threshold, schedule estimate | 20 % from the reference | PRD FR-15; V11 supports 20–30 % | design choice |
| S26 | Normal working week | 37.5 h | v0.5 (Norwegian norm) | [SOURCED] |
| S27 | Planned crew per construction main part | 24 workers | v0.5 crews (30–34 for a larger building) | [ESTIMATE] |
| S28 | All-in labour rate | 650 NOK/h | P15 | [ESTIMATE] |
| S29 | Overtime premium | +40 % (factor 1.4 on overtime hours) | P16 / aml § 10-6 [26]: at least 40 % | [SOURCED] (legal minimum) |
| S30 | Overtime caps | 10 h per week, 25 h per 4 weeks, 200 h per 52 weeks | P17 / [26] | [SOURCED] |
| S31 | Overtime level | 6.25 h per worker per week (= 25 h per 4 weeks, exactly at the cap) | Derived from S30 | design choice |
| S32 | Hired workers | +50 % of crew = 12 workers | v0.5 | [ESTIMATE] |
| S33 | Crowding | Each hired worker gives 0.5 of a full worker's output and is paid in full | v0.5, PRD FR-20 | [ESTIMATE] |
| S34 | Change request (E8) | Now: +2.000 MNOK and +2 weeks. Later: +3.000 MNOK and 0 weeks | V12 / E8 (changes ~14 % of contract cost; later costs more) | [ESTIMATE] anchored |
| S35 | AI reliability by difficulty | easy 100 % · medium 80 % · hard 60 % | v0.5 | design choice |

### 2.2 The site (FR-3, now fixed)

| | Value |
|---|---|
| Location | Central Oslo (Bjørvika type, in the medieval town) |
| Price per m² plot | **140,000 NOK** (= 35,000 per m² BRA × 400 % utilisation) |
| Max footprint | 60 % BYA |
| Max height | 28 m |
| Available plot area | 2,000 m² |
| Always-present ground risks | E4 archaeology, E5 contaminated ground |

The utilisation (400 % BRA) is used **only to derive the price** (R3), and the model does not check it. Every allowed option stays within it anyway: 7 floors use 2,070 ÷ 548 = 378 %.

### 2.3 Floors (FR-4)

The options are **3, 4, 5, 6, 7 or 8 floors**:

| Floors | Height | Footprint | Plot area needed | Plot cost | Fire class | Allowed |
|---|---|---|---|---|---|---|
| 3 | 12 m | 767 m² | 1,278 m² | 178.920 | BKL 2 | ✓ |
| 4 | 16 m | 575 m² | 958 m² | 134.120 | BKL 2 | ✓ |
| 5 | 20 m | 460 m² | 767 m² | 107.380 | BKL 3 | ✓ |
| 6 | 24 m | 383 m² | 639 m² | 89.460 | BKL 3 | ✓ |
| 7 | 28 m | 329 m² | 548 m² | 76.720 | BKL 3 | ✓ |
| 8 | 32 m | 288 m² | 479 m² | 67.060 | BKL 3 | ✗ 32 m > 28 m |

Each extra floor saves 13–45 MNOK of land. The counterweights are all time and risk:
- frame weeks (R6), each charged with 0.300 MNOK of site overhead (R7);
- the fire-class step at 5 floors (R5);
- more lifts (R5);
- a higher chance of wind stopping the crane (E2, R10);
- a target week that only a fast frame meets at the top floor count (R14).

### 2.4 Structural systems (FR-5)

| System | Cost factor (S13) | Work cost | Frame weeks per floor (S23) | Extra in BKL 3 (S19) | System-specific known risk |
|---|---|---|---|---|---|
| Cast-in-place concrete | 0.96 | 64.032 MNOK | 2.0 | 1.500 | E9 frost |
| Precast concrete | 1.00 | 66.700 MNOK | 1.5 | 1.500 | E3 foreign supplier strike |
| Steel + hollow-core | 1.02 | 68.034 MNOK | 1.2 | 1.500 | E3 foreign supplier strike |
| CLT (massivtre) | 1.05 | 70.035 MNOK | 1.0 | 3.500 | E10 moisture |

---

## 3. Rules

### Stage 1: the building-block model

**R1. Gross area** (FR-4, S1–S3)
`BTA = 23 × 100 = 2,300 m²`. `BRA = 0.9 × 2,300 = 2,070 m²`. BRA is used only in R3.

**R2. Footprint and plot area bought** (FR-3, FR-4)
- `footprint = BTA ÷ floors` (shown rounded to whole m²).
- `plotArea = BTA ÷ (floors × 0.60)`, rounded to whole m².

**R3. Plot cost** (FR-3)
- `pricePerM2Plot = 35,000 × 4.00 = 140,000 NOK` (0.140 MNOK). One m² of plot in a 400 % zone carries 4 m² of floor area, so it costs 4 × the price per m² BRA.
- `plotCost = plotArea × 0.140`. Fewer floors always mean a larger footprint, more plot area and a higher plot cost.

**R4. Zoning check** (FR-4, FR-13, FR-15)
A concept is allowed only if:
1. **Height:** `floors × 4.0 m ≤ 28 m`.
2. **Footprint:** `plotArea ≤ 2,000 m²`. No option breaks this in v1; the rule stays so the group can shrink the site.

A concept that breaks a limit cannot be approved. The adviser warns and names the limit: "8 floors make the building 32 m tall; the zoning plan allows at most 28 m."

**R5. Building cost** (FR-4, FR-5, FR-6)
- `workCost = 29,000 × 2,300 × systemFactor` (S12, S13).
- `lifts = 1 if floors ≤ 4, else 2`. `liftCost = lifts × 0.300 × floors`. That is 0.900 / 1.200 / 3.000 / 3.600 / 4.200 MNOK for 3 / 4 / 5 / 6 / 7 floors.
- `fireCost = 0` for 3–4 floors (BKL 2). For 5 floors or more (BKL 3), `fireCost = 1.500`, or `3.500` for CLT (S18, S19).
- `buildingCost = workCost + liftCost + fireCost`.
- *Why 29,000:* the all-in 35,000 NOK/m² (P6) includes site overhead. We take the site overhead out and charge it per week instead (R7), so that time costs money. (35,000 × 2,300 − 0.300 × 44 weeks) ÷ 2,300 = (80.5 − 13.2) ÷ 2,300 ≈ 29,260, rounded to 29,000.

**R6. Main parts and reference durations** (FR-7)
The six main parts always run in this order, one after the other, so the critical path is all six.

| # | Main part | Reference duration | Basis |
|---|---|---|---|
| 1 | Design and building permit | 12 weeks | S20 (statutory processing time) |
| 2 | Groundworks | 13 weeks | 25 % × 52 = 13.0 |
| 3 | Frame | `round(floors × weeks per floor)` | S23 |
| 4 | Weathertight envelope | 10 weeks | 20 % × 52 = 10.4 → 10 |
| 5 | Technical installations and interior | 10 weeks | 20 % × 52 = 10.4 → 10 |
| 6 | Handover | 5 weeks | 10 % × 52 = 5.2 → 5 |

- **Construction weeks** = parts 2 to 6. **Total weeks** = 12 + construction weeks.
- Construction takes 41–52 weeks (9.5–12 months). That fits V1's 11–12 months for a simple site. V2's longer central-site figure (18–21 months, planned) is not modelled (§5).
- The adviser's duration suggestion for each part (FR-9) is its reference duration.

**R7. Site overhead** (FR-6)
- 0.300 MNOK per week, charged for every construction week (parts 2 to 6), idle weeks included. The permit phase has none.
- *Derivation:* common costs are 12.6 % of contract cost (P6s). Half of the 16 % general costs is added as running costs during construction. That gives 20.6 % × (35,000 ÷ 1.16) × 2,300 = 14.3 MNOK over 44–48 weeks, or 0.30–0.33 per week. Rounded to **0.300**.

**R8. Cost and completion of a plan** (FR-6, FR-8, FR-13)
- `baseCost = plotCost + buildingCost + 0.300 × construction weeks`. On the concept step (FR-6) it uses reference durations; in the plan it uses the student's estimates.
- `planCostExclReserve = baseCost + Σ upfront cost of the chosen responses (R11)`.
- `planCost = planCostExclReserve + reserveCost`.
- `planWeek = Σ estimate[1..6] + reserveWeeks`.
- The plan meets the targets when `planWeek ≤ target week` and `planCost ≤ target cost`. A plan that misses can still be approved, with a warning (FR-13).

**R9. Schedule estimate warning** (FR-15)
The adviser warns when `|estimate − reference| > 0.20 × reference` (strictly greater). The warning states the reference value and may cite a project as the reference research's §D allows. For example, with a reference of 10, estimates of 8 and 12 do not warn, but 7 does.

**R10. Known risks** (FR-10)
Each concept has four known risks: two ground risks that always apply on the central site (E4, E5), wind (E2), and one tied to the structural system (E3, E9 or E10). IDs and evidence follow `addendum.md` §4. E1 is the estimate overrun (R18) and E8 the change request (R23). E6 (price rise) and E7 (bankruptcy) are not known risks in v1 (§5).

| ID | Risk | Applies to | p | Hits part | Delay | Cost | Alternative when it occurs (R22) | Evidence (addendum / [R2] §C) |
|---|---|---|---|---|---|---|---|---|
| E4 | Archaeological find | Always (central site in the medieval town) | 30 % | 2 Groundworks | 8 wk | 1.000 | Extra archaeologists: delay halved, +1.000 | Monitoring of all digging required; a Bjørvika dig took ~6 months [SOURCED]. p and impact [ESTIMATE] |
| E5 | Contaminated ground | Always (central site) | 40 % | 2 Groundworks | 4 wk | 2.000 | On-site sorting, second excavator: delay halved, +0.500 | Oslo PBE; +2–6 weeks, +1–5 % [partly sourced]. Values [ESTIMATE] |
| E2 | Wind stops crane lifts, HMS reacts | All; **p = 5 % × floors** (15 % at 3 floors, 35 % at 7) | see left | 3 Frame | 1 wk | 0.200 | Mobile crane / new lift plan: delay 0, +0.400 | Crane out of service at ~20 m/s [partly sourced]. Growth with floors [ESTIMATE] |
| E9 | Frost and winter concreting | Cast-in-place only | 40 % | 3 Frame | 2 wk | 0.800 | Heating and covers: delay halved, +0.300 | No Norwegian figure found [ESTIMATE, weak] |
| E3 | Strike at a foreign supplier | Precast, steel | 25 % | 3 Frame | 4 wk | 0.000 | Dearer local supplier: delay halved, +1.200 | Finnish port strikes Feb–Apr 2024 [partly sourced]. Values [ESTIMATE] |
| E10 | Moisture in timber | CLT only | 40 % | 3 Frame | 3 wk | 0.500 | Weather tent: delay halved, +0.600 | NTNU ZEB lab; Danish damage fund [SOURCED]. Values [ESTIMATE] |

**R11. Responses and risk exposure** (FR-11, FR-21)
For a risk with probability p, delay d weeks and cost c, the **full impact** is `I = c + 0.300 × d`.

| Response | Upfront cost (in plan cost) | Impact if it occurs |
|---|---|---|
| Accept | 0 | d weeks, c |
| Reduce | 0.20 × I | ⌊d ÷ 2⌋ weeks (rounded **down**), c ÷ 2 |
| Transfer | 1.25 × p × c (an insurer's premium with a 25 % margin). Not offered when c = 0 | d weeks, 0 cost (the delay is not covered) |
| Avoid | 0.50 × I | Removed; the risk cannot occur |

- **Expected total** of a response = `upfront + p × (impact after the response, incl. site overhead)`.
- **Risk exposure** (FR-11) = Σ `p × impact after the response`. It is shown as expected cost incl. site overhead, expected delay in weeks, and expected cost excl. site overhead.
- When a risk occurs in stage 2, the impact of the chosen response applies (FR-21). Its delay counts as **idle weeks** on the part it hits.

**R12. Adviser suggestions in stage 1** (FR-9, FR-14)
- **Durations:** the reference durations (R6).
- **Response:** the one with the lowest expected total. On a tie, the one with the lower expected delay; if still tied, the first of accept, reduce, transfer, avoid.
- **Reserve:**
  - `reserveWeeks = round(0.10 × reference construction weeks + expected delay)`. The 0.10 is the mean of the deviation list (S24).
  - `reserveCost = 0.300 × reserveWeeks + expected cost excl. site overhead`.

**R13. Reserve during stage 2** (FR-12)
- Cost reserve used = `min(reserveCost, max(0, forecastCost − planCostExclReserve))`.
- Time reserve used = `min(reserveWeeks, max(0, forecastWeek − Σ estimates))`.
- The reserve **runs out** when either overrun is larger than its reserve. Unused reserve is not spent: the final cost is what was actually spent.

**R14. Targets** (FR-1)
- **The reference plan:** 7 floors, steel, reference durations, the suggested responses and the suggested reserve (R12).
- `target week = reference plan's planWeek`.
- `target cost = reference plan's planCost`, rounded **up** to whole MNOK.
- With the current parameters: **target week 67, target cost 169 MNOK** (worked example (a)). The engine derives them, so they follow any change in the parameters.

**The puzzle the targets create.** Plan week and plan cost with the suggested responses and reserve, against week 67 and 169 MNOK:

| Floors | Cast-in-place | Precast | Steel | CLT |
|---|---|---|---|---|
| 3 | 64 ✓ · 261.262 ✗ | 64 ✓ · 263.490 ✗ | 63 ✓ · 264.524 ✗ | 61 ✓ · 266.305 ✗ |
| 4 | 66 ✓ · 217.372 ✗ | 65 ✓ · 219.300 ✗ | 64 ✓ · 220.334 ✗ | 62 ✓ · 222.115 ✗ |
| 5 | **68 ✗** · 194.617 ✗ | 67 ✓ · 196.545 ✗ | 65 ✓ · 197.279 ✗ | 63 ✓ · 201.060 ✗ |
| 6 | 71 ✗ · 178.202 ✗ | **68 ✗** · 179.530 ✗ | 66 ✓ · 180.264 ✗ | 64 ✓ · 184.045 ✗ |
| 7 | 73 ✗ · 166.667 ✓ | 70 ✗ · 167.995 ✓ | **67 ✓ · 168.429 ✓** | 65 ✓ · 172.210 ✗ |

How to read it:
- **7 floors are the cheapest height**, but only steel (week 67) and CLT (week 65) meet the target week there. Cast-in-place (73) and precast (70) are cheaper but too slow.
- **Cast-in-place meets the target week only at 3 or 4 floors**, and there the land costs 57.400 (4 floors) or 102.200 (3 floors) more than at 7 floors. Precast needs 5 floors or fewer.
- **CLT at 7 floors** is fastest but misses the budget by 3.210 MNOK, because of its +5 % work cost and the CLT fire-class step.
- So the only plan that meets both targets is the reference plan. Nearby plans each miss one target, and the student must judge which miss to accept, or squeeze the estimates and reserve and see what stage 2 makes of it.

### Stage 2: execution

**R15. Seed stream** (FR-19, FR-30)
One pseudo-random stream gives numbers u in [0, 1); the architecture picks the generator (v0.5 has one). Numbers are drawn in this fixed order, which never depends on the student's choices:
1. Five draws, one each for main parts 2 to 6, for the deviation (R16).
2. One draw per known risk, in R10's table order, for occurrence (R17). An avoided risk still uses its draw, so the rest of the stream does not shift.
3. One draw per event, in event order, for the AI's reliability (R25).

**R16. Actual durations** (FR-19)
- For parts 2 to 6: `actual[i] = round(reference[i] × (1 + deviation[i]))`, with `deviation[i] = list[floor(u × 5)]` from S24.
- The permit (part 1) always takes 12 weeks (statutory processing time).
- Actual durations do not depend on the estimates. The estimates only set the plan and decide which part overruns.

**R17. External risk events** (FR-19, FR-21)
- A known risk occurs if `u < p` and the student did not avoid it. At most two occur; if more qualify, the two with the lowest u are kept.
- If none qualifies, the non-avoided risk with the lowest `u ÷ p` occurs, so there is always at least one external event while one is possible.
- If every risk is avoided, there is no external event, or an opportunity if FR-35 is approved.

**R18. Estimate overrun (E1)** (FR-19)
- `gap[i] = actual[i] − estimate[i]` for parts 2 to 6. Part 1 is left out because a permit cannot be sped up; an underestimated permit still shows in bridge step 2.
- The event hits the part with the largest positive gap; on a tie, the earlier part. Its size is the gap in weeks.
- If no gap is positive, one more external risk takes its place (the eligible risk with the next-lowest `u ÷ p`). If there is none, an opportunity (FR-35) or nothing.

**R19. Event timing and idle weeks** (FR-18)
- Every event fires at the **start** of the main part it concerns. The change request fires at the start of part 5.
- Within one part the order is: estimate overrun, then external risks, then the change request.
- A part's duration = work weeks + idle weeks. Overtime and hiring compress only work weeks. Risk delays and the change request's weeks are idle weeks.

**R20. Overtime** (FR-20)
- **Overtime:** 37.5 + 6.25 = 43.75 h a week, so output is ×7/6. `D = round(W × 6 ÷ 7)`, where W is the part's work weeks.
- Its extra cost is the premium only: `24 × 6.25 h × 650 × 0.4 = 39,000 NOK` = **0.039 MNOK per overtime week**, times D. The normal pay for the hours is already in the work cost, because the amount of work does not change.
- 6.25 h a week is exactly 25 h per 4 weeks, so this level stays within all caps for up to 32 weeks.
- **Heavy overtime:** choosing overtime a second time for the same part makes it 12.5 h a week. Output is ×4/3, so `D = round(W × 3 ÷ 4)`, and the premium is `24 × 12.5 × 650 × 0.4 = 0.078 MNOK per week`. This breaks the 10 h per week cap, so the adviser warns (FR-20), and the warning is logged.
- Caps are checked per main part. Overtime and hiring cannot be combined on one part in v1.

**R21. Hiring with crowding** (FR-20)
- +12 hired workers at 0.5 output each: the effective crew is 30, output ×1.25, `D = round(W × 0.8)`.
- Extra cost = the unproductive half of the hired hours: `12 × 37.5 × 650 × 0.5 = 146,250 NOK` = **0.14625 MNOK per week**, times D (rounded at the end).
- Overtime costs about 6 × 0.039 = 0.234 MNOK per week saved, less than the site overhead of 0.300, so it usually pays off. Hiring costs about 4 × 0.14625 = 0.585 MNOK per week saved: it is faster, but rarely pays off.

**R22. External risk event options** (FR-20, FR-21)
1. **Take the impact** under the chosen response (R11).
2. **The alternative** from R10, applied to the delay after the response. "Delay halved" means ⌊delay ÷ 2⌋, at the extra cost listed.
3. **Overtime on the affected part** (R20), if it is part 2 to 6. It compresses only the work weeks.

An avoided risk never fires (FR-21).

**R23. Change request (E8)** (FR-20)
One per playthrough, at the start of part 5:
- **Approve now:** +2.000 MNOK and +2 idle weeks on part 5.
- **Approve later** (a separate job after handover): +3.000 MNOK, no delay.

Approving now is usually cheaper (2.600 incl. site overhead against 3.000), but later protects the target week.

**R24. Forecast** (FR-22, FR-34)
The engine runs on from the current state with no new events (v0.5). Forecast final cost = cost so far + the remaining parts at their actual durations and current work modes + site overhead for every remaining construction week.

**R25. AI recommendation and difficulty** (FR-1, FR-22)
- The **best option** has the lowest forecast final cost. On a tie, the earlier forecast completion week wins; if still tied, the option listed first.
- The AI recommends the best option if `u < reliability` (easy 1.0, medium 0.8, hard 0.6). Otherwise it recommends the option with the second-lowest forecast final cost.
- The **AI path** after each decision (FR-22) is the forecast with the AI's option, from the same state.

### Stage 3: debrief

**R26. Budget bridge** (FR-24)

| Step | Run | Cause = |
|---|---|---|
| 1 The plan | — | `planCostExclReserve − target cost` |
| 2 The schedule estimate | Plan with actual durations, no events | `run2 − planCostExclReserve` |
| 3 Events | Run 2 + all events, each handled as the AI recommended in that run | `run3 − run2` |
| 4 The student's decisions | The real playthrough | `final cost − run3` |

- The four causes add up exactly to `final cost − target cost`.
- The reserve is a separate line showing how much of it was used (R13), not a cause.

**R27. "Right" recommendations** (FR-28)
- **Stage 2:** a recommendation is right when the final cost with it is **equal to or lower than** with the student's option. Only that one decision is swapped; the student's other decisions and all future events stay the same.
- **Stage 1:** a duration suggestion is right when `|actual − suggestion| ≤ 0.20 × suggestion`. It counts as followed when the estimate equals the suggestion.
- The debrief shows: the number of recommendations, the number followed, the number right, and the number of right ones not followed.

**R28. Missed learning goals** (§4.10, FR-27)

| Goal | Missed when (formal) |
|---|---|
| Time costs money | At some event, the student took the delay (the option with the latest completion), although a faster option had `extra cost < 0.300 × weeks it saves`. |
| Resources have limits | The student hired where overtime saved at least as many weeks for a lower extra cost, or kept heavy overtime after the cap warning. |
| Risk is managed | **At the time of the choice in stage 1**, the student accepted a known risk for which reduce or avoid had a strictly lower expected total (R11); or the cost or time reserve ran out (R13). Whether the risk occurred does not matter. |
| AI advice is worth weighing | In at least half of all recommendations (stage 1 durations and stage 2 events), the student followed one that was not right or ignored one that was right. |

**R29. Result bands** (FR-1, FR-26, FR-38)

The targets are a frame, not an exact answer. The final cost and the final week are each judged in one of three bands:

| Band | Cost | Week |
|---|---|---|
| Within the frame | final cost ≤ target cost | final week ≤ target week |
| Slightly over | up to 5 % over the target cost | up to 5 % over the target week (rounded up to whole weeks) |
| Clearly over | more than 5 % over | more than 5 % over |

The debrief shows the band, not a pass or fail on the exact figure. [ASSUMPTION: the 5 % band is a first proposal for the group to approve.]

**R30. Decision impact ranking** (FR-38, FR-14)
- For each of the student's decisions (floors, structural system, each main part's estimate, each risk response, the reserve, each stage 2 event), the impact is the change in final cost and final week if that one decision is replaced by the reference plan's choice (stage 1) or by the AI's recommendation (stage 2), with everything else unchanged.
- The debrief lists decisions from the largest to the smallest absolute cost impact, with the week impact beside it, and shows the top three. A decision whose impact is under 2 % of the target cost is labelled "small".
- In stage 1, when two options for a choice differ by less than 2 % of the target cost and the same week band, the adviser says so ("both work; the difference is about X MNOK") instead of recommending one firmly.

---

## 4. Worked examples (with answers)

All amounts are in MNOK and all durations in weeks, rounded as in §0. Each example is an automated test (FR-31).

### Example (a): the reference plan end to end, and the targets

**Concept:** 7 floors, steel.

**Step 1. Area and plot (R1–R4)**
- Height = 7 × 4.0 = **28 m** ≤ 28 ✓. Footprint = 2,300 ÷ 7 = 328.57 → **329 m²**.
- Plot area = 2,300 ÷ (7 × 0.60) = 2,300 ÷ 4.2 = 547.62 → **548 m²** ≤ 2,000 ✓.
- Plot cost = 548 × 0.140 = **76.720**.

**Step 2. Building cost (R5)**
- Work cost = 66.700 × 1.02 = **68.034**.
- Lifts: 7 floors → 2 lifts. Lift cost = 2 × 0.300 × 7 = **4.200**.
- Fire class: 7 floors ≥ 5 → BKL 3 → **1.500** (steel).
- Building cost = 68.034 + 4.200 + 1.500 = **73.734**.

**Step 3. Reference durations (R6)**
- Frame = round(7 × 1.2) = round(8.4) = **8**.
- Construction weeks = 13 + 8 + 10 + 10 + 5 = **46**. Total = 12 + 46 = **58**.

**Step 4. Base cost (R7, R8)**
- Site overhead = 0.300 × 46 = **13.800**.
- Base cost = 76.720 + 73.734 + 13.800 = **164.254**.

**Step 5. Known risks and suggested responses (R10–R12)**
The risks are E4 (p 30 %), E5 (40 %), E2 (5 % × 7 = 35 %) and E3 (25 %). Each cell shows the expected total = upfront + p × impact after the response.

| Risk | I = c + 0.3d | Accept | Reduce | Transfer | Avoid | Suggested |
|---|---|---|---|---|---|---|
| E4 (d 8, c 1.000) | 1.000 + 2.400 = 3.400 | 0.3 × 3.400 = **1.020** | 0.680 + 0.3 × (0.500 + 4 × 0.3) = 0.680 + 0.510 = **1.190** | 0.375 + 0.3 × 2.400 = **1.095** | **1.700** | **Accept** |
| E5 (d 4, c 2.000) | 2.000 + 1.200 = 3.200 | 0.4 × 3.200 = **1.280** | 0.640 + 0.4 × (1.000 + 0.600) = **1.280** | 1.000 + 0.4 × 1.200 = **1.480** | **1.600** | **Reduce** (tie with accept; lower expected delay 0.8 < 1.6) |
| E2 (d 1, c 0.200) | 0.200 + 0.300 = 0.500 | 0.35 × 0.500 = **0.175** | 0.100 + 0.35 × (0.100 + 0) = **0.135** | 0.0875 → 0.088, + 0.35 × 0.300 = **0.193** | **0.250** | **Reduce** |
| E3 (d 4, c 0) | 1.200 | 0.25 × 1.200 = **0.300** | 0.240 + 0.25 × 0.600 = **0.390** | not offered | **0.600** | **Accept** |

- Upfront cost = 0.640 (E5) + 0.100 (E2) = **0.740**.
- Expected delay = E4 0.3 × 8 + E5 0.4 × 2 + E2 0.35 × 0 + E3 0.25 × 4 = 2.4 + 0.8 + 0 + 1.0 = **4.2 weeks**.
- Expected cost excl. site overhead = E4 0.3 × 1.000 + E5 0.4 × 1.000 + E2 0.35 × 0.100 + E3 0 = 0.300 + 0.400 + 0.035 = **0.735**.

**Step 6. Suggested reserve (R12)**
- Reserve weeks = round(0.10 × 46 + 4.2) = round(4.6 + 4.2) = round(8.8) = **9**.
- Reserve cost = 0.300 × 9 + 0.735 = 2.700 + 0.735 = **3.435**.

**Step 7. Plan and targets (R8, R14)**
- Plan week = 58 + 9 = **67**.
- Plan cost = 164.254 + 0.740 + 3.435 = **168.429**.
- **Target week = 67. Target cost = 168.429 rounded up = 169 MNOK.**

### Example (b): fewer or more floors on the same site

Steel. Compare 4 floors with 7, then try 8.

| Step | 4 floors | 7 floors |
|---|---|---|
| Height (R4) | 16 m ✓ | 28 m ✓ |
| Plot area (R2) | 2,300 ÷ (4 × 0.60) = 2,300 ÷ 2.4 = 958.33 → **958 m²** | 2,300 ÷ 4.2 = 547.62 → **548 m²** |
| **Plot cost** (R3) | 958 × 0.140 = **134.120** | 548 × 0.140 = **76.720** |
| Work cost | 68.034 | 68.034 |
| Lifts | 1 × 0.300 × 4 = **1.200** | 2 × 0.300 × 7 = **4.200** |
| Fire class (S18, S19) | BKL 2 → **0** | BKL 3 → **1.500** |
| Frame | round(4 × 1.2) = round(4.8) = **5** | round(8.4) = **8** |
| Construction weeks | 13 + 5 + 10 + 10 + 5 = **43** | 13 + 8 + 10 + 10 + 5 = **46** |
| Site overhead | 0.300 × 43 = 12.900 | 0.300 × 46 = 13.800 |
| **Base cost** | 134.120 + 68.034 + 1.200 + 0 + 12.900 = **216.254** | 76.720 + 68.034 + 4.200 + 1.500 + 13.800 = **164.254** |
| Total weeks | 12 + 43 = **55** | 12 + 46 = **58** |

**Answer:**
- 4 floors cost 216.254 − 164.254 = **52.000 MNOK more**. The land costs 57.400 more. Against that, 4 floors save 3.000 on lifts, 1.500 on fire class and 0.900 of site overhead.
- 7 floors take **3 weeks longer**. That is the time the target week has to absorb (R14).
- **8 floors:** 8 × 4.0 = 32 m > 28 m → **not allowed**. The adviser names the height limit.

### Example (c): an estimate overrun with three options

**The student's plan.**
- Concept: 7 floors, steel.
- Estimates: permit 12, groundworks 10, frame 7, envelope 8, technical and interior 8, handover 4 (total 49).
- Responses: all four risks accepted (upfront 0).
- Reserve: 4 weeks and 3.000.

**Stage 1 warnings (R9):**
- Groundworks: |10 − 13| = 3 > 2.6 → **warning** ("comparable projects: about 13 weeks").
- Frame: |7 − 8| = 1, not > 1.6 → no warning.
- Envelope and technical/interior: |8 − 10| = 2, not > 2.0 → no warning.
- Handover: |4 − 5| = 1, not > 1.0 → no warning.

**Plan (R8):**
- Estimated construction weeks = 10 + 7 + 8 + 8 + 4 = 37.
- Plan cost excl. reserve = 76.720 + 73.734 + 0.300 × 37 = 150.454 + 11.100 = **161.554**.
- Plan cost = 161.554 + 3.000 = **164.554** ≤ 169 ✓. Plan week = 49 + 4 = **53** ≤ 67 ✓. The plan looks comfortable.

**Actual durations (R16).** The seed gives groundworks +20 %, frame +10 %, envelope 0 %, technical and interior +30 %, handover −10 %.

| Part | Reference | Calculation | Actual | Estimate | Gap |
|---|---|---|---|---|---|
| Permit | 12 | fixed | 12 | 12 | 0 |
| Groundworks | 13 | 13 × 1.2 = 15.6 | **16** | 10 | **6** |
| Frame | 8 | 8 × 1.1 = 8.8 | **9** | 7 | 2 |
| Envelope | 10 | 10 × 1.0 | **10** | 8 | 2 |
| Technical and interior | 10 | 10 × 1.3 = 13.0 | **13** | 8 | 5 |
| Handover | 5 | 5 × 0.9 = 4.5 | **5** | 4 | 1 |

**The event (R18, E1):** the largest gap is groundworks, 6 weeks. At its start the foreman reports 16 weeks instead of 10.

**Options, forecast with no further events (R24).** Fixed costs = 76.720 + 73.734 = 150.454. The later parts take 9 + 10 + 13 + 5 = 37 weeks.

| Option | Groundworks | Extra cost | Construction weeks | Site overhead | **Forecast final cost** | **Week** |
|---|---|---|---|---|---|---|
| Take the delay | 16 | 0 | 16 + 37 = 53 | 15.900 | 150.454 + 15.900 = **166.354** | 12 + 53 = **65** |
| Overtime | round(16 × 6 ÷ 7) = round(13.71) = **14** | 14 × 0.039 = **0.546** | 51 | 15.300 | 150.454 + 15.300 + 0.546 = **166.300** | **63** |
| Hire 12 | round(16 × 0.8) = round(12.8) = **13** | 13 × 0.14625 = 1.90125 → **1.901** | 50 | 15.000 | 150.454 + 15.000 + 1.901 = **167.355** | **62** |

**Answer:**
- **The AI recommends overtime** (166.300, the lowest). It saves 2 weeks, worth 0.600 in site overhead, for 0.546.
- Hiring is fastest (week 62) but costs 1.001 more than taking the delay.
- Overtime is 6.25 h a week, within the caps → no warning.
- If the student takes the delay, "time costs money" is missed: 0.546 < 0.300 × 2.

### Example (d): the budget bridge for the same playthrough

**Events (R17–R19):**
1. The estimate overrun on groundworks.
2. **E5 contaminated ground** occurs. It was accepted, so the impact is 4 idle weeks and 2.000. It fires at the start of groundworks, after the overrun. E4, E2 and E3 do not occur.
3. **E8 change request** at the start of technical and interior.

Difficulty: easy.

| Decision | Student chose | AI recommended (forecast from the student's state) |
|---|---|---|
| E1 overrun | Take the delay (16 weeks) | Overtime: 166.300 vs 166.354 |
| E5 occurs | Take the impact: +4 weeks, +2.000 | Alternative: ⌊4 ÷ 2⌋ = 2 weeks, 2.000 + 0.500 = 2.500. Forecast 169.454 (week 67) vs 169.554 (week 69) |
| E8 change | Later: +3.000, 0 weeks | Now: +2.000, +2 weeks. Forecast 172.154 (week 71) vs 172.554 (week 69) |

**The four runs (R26)**, with fixed costs 150.454 in every run:

| Run | Construction weeks | Site overhead | Event costs | Final cost | Week |
|---|---|---|---|---|---|
| Plan excl. reserve | 37 (estimates) | 11.100 | 0 | **161.554** | 49 |
| Run 2: actual durations, no events | 16 + 9 + 10 + 13 + 5 = 53 | 15.900 | 0 | **166.354** | 65 |
| Run 3: events, AI choices | (14 + 2) + 9 + 10 + (13 + 2) + 5 = 55 | 16.500 | 0.546 + 2.500 + 2.000 = 5.046 | **172.000** | 67 |
| Run 4: student's choices | (16 + 4) + 9 + 10 + 13 + 5 = 57 | 17.100 | 2.000 + 3.000 = 5.000 | **172.554** | 69 |

**The bridge (target cost 169.000):**

| Cause | Calculation | MNOK |
|---|---|---|
| 1 The plan | 161.554 − 169.000 | **−7.446** |
| 2 The schedule estimate | 166.354 − 161.554 | **+4.800** |
| 3 Events | 172.000 − 166.354 | **+5.646** |
| 4 The student's decisions | 172.554 − 172.000 | **+0.554** |
| **Sum** | −7.446 + 4.800 + 5.646 + 0.554 | **+3.554** |
| Check: final − target | 172.554 − 169.000 | **+3.554** ✓ |

**Reserve line (R13):**
- Cost: 172.554 − 161.554 = 11.000 > 3.000, so all **3.000** is used.
- Time: 69 − 49 = 20 weeks > 4 weeks of reserve.
- The reserve ran out.

**Final result:** week 69 against target 67, and 172.554 against target 169. The AI path (FR-26) ends at week 67 and 172.000.

**AI trust (R27):**
- **Stage 2** (one decision swapped at a time in the student's playthrough):
  - Overtime: 0.054 lower → right.
  - E5 alternative: 0.100 lower → right.
  - Change now: 0.400 lower → right.
  - So 3 recommendations, 0 followed, 3 right.
- **Stage 1** (suggestion vs actual, within 20 %):
  - Permit 12 vs 12: right, followed.
  - Groundworks 13 vs 16: 3 > 2.6, not right.
  - Frame 8 vs 9: 1 ≤ 1.6, right.
  - Envelope 10 vs 10: right.
  - Technical and interior 10 vs 13: 3 > 2.0, not right.
  - Handover 5 vs 5: right.
  - So 6 suggestions, 1 followed, 4 right.
- **Totals:** 9 recommendations, 1 followed, 7 right, 6 right ones not followed.

**Missed learning goals (R28):**
- **Time costs money:** missed. At the overrun, 0.546 < 0.600. At E5, 0.500 < 0.300 × 2.
- **Resources have limits:** not missed.
- **Risk is managed:** missed, judged on expected cost at the time of the choice.
  - **E2** was accepted at an expected total of 0.175, while reduce was 0.135.
  - **E5**, the risk that actually occurred, does **not** count: accept and reduce were tied at 1.280.
  - **E4** and **E3**: accept was the cheapest.
  - The reserve also ran out.
- **AI advice is worth weighing:** missed. 6 of 9 recommendations were right and ignored (6 ≥ 4.5).

---

## 5. Open points for the group

**Values to approve** (all [ESTIMATE]):
1. **The site:** 140,000 NOK/m² plot (P4a × P5a), 60 % BYA (lowered from P5a's 80 %), 28 m, 2,000 m² available. Land dominates the budget: 77–179 MNOK against about 74 for the building.
2. **Fire-class cost step:** +1.500 at BKL 3, +2.000 more for CLT. The rule itself (offices are risk class 2, 5+ floors are BKL 3, with R 90 non-combustible as the preaccepted main system) is **verified on dibk.no**, but it is not in the research reports. Add it to the research appendix. No source gives the cost.
3. **E2 wind: p = 5 % × floors.** The growth with floors is a design choice. Impact is 1 week and 0.200.
4. **Site overhead 0.300 per week** and **work cost 29,000 NOK/m²** (R5, R7). These decide whether overtime pays off.
5. **System factors** 0.96 / 1.00 / 1.02 (only CLT's 1.05 is sourced), and **precast frame 1.5 weeks per floor**. P12 said 1.0, which would make precast identical to steel in speed and cheaper.
6. **Lift rule** (1 or 2 lifts, 0.300 per lift per floor). No source gives a lift cost.
7. **Deviation list** −10 % to +30 %. **Permit fixed at 12 weeks.**
8. **Labour:** crew 24, 650 NOK/h, overtime level 6.25 h a week, +12 hired at 0.5 output.
9. **Risk values** (R10) and **response prices** (reduce 20 % of I, transfer 125 % of p × c, avoid 50 % of I).
10. **Change request** sizes (2.000 + 2 weeks now, 3.000 later).
11. **AI reliability** 100 / 80 / 60 %.

**Design decisions to confirm:**

12. **The targets leave exactly one plan that meets both** (7 floors, steel, suggested reserve). Every nearby plan misses one target narrowly (R14 table). If the group wants CLT at 7 floors to meet the budget as well, round the target cost up to the nearest 5 MNOK (170), or lower CLT's fire-class step.
13. **The PRD needs edits** to match the single site:
    - FR-3 ("choose one of three plots") becomes a fixed site that only shows its land price and limits.
    - FR-10 ("risks depend on the plot") becomes "depend on floors and structural system".
    - FR-4 should mention the fire-class step.
    - §4.10's risk condition should say "expected cost at the time of the choice".
14. **The risk goal compares only accept with reduce/avoid**, following §4.10's wording. A stricter version would also flag over-paying (avoiding a risk whose expected cost is lower than the avoid price, as FR-36 proposes). Ties do not count as missed (E5 in example (d)).
15. **Known risks per concept are fixed at four** (E4, E5, E2 and one system risk). E6 (price rise) and E7 (bankruptcy) from the addendum are not used. They could come back as fallback events (R18) or with FR-35.
16. **V2** (central infill sites take 18–21 months, planned) is not modelled. Adding it would lengthen every concept equally and does not change the puzzle.
17. The warning threshold is 20 % (±30 % is the alternative). Target cost is rounded up to whole MNOK.
18. The "AI advice" goal counts stage 1 suggestions, and "followed" in stage 1 means the estimate equals the suggestion exactly.
19. All main parts run in sequence, so the critical path is always all six.
20. Opportunities (FR-35) and milestones (FR-32) are not specified until they are approved.

---

## Appendix A: All concepts at reference durations

Base cost (R8) with reference durations, before responses and reserve. Total weeks in brackets. Lift and fire-class costs are included.

| Floors | Plot area | Plot cost | Lifts | Fire class | Cast-in-place | Precast | Steel | CLT |
|---|---|---|---|---|---|---|---|---|
| 3 | 1,278 | 178.920 | 0.900 | BKL 2: 0 | 257.052 (56) | 259.420 (55) | 260.454 (54) | 262.155 (53) |
| 4 | 958 | 134.120 | 1.200 | BKL 2: 0 | 213.152 (58) | 215.220 (56) | 216.254 (55) | 217.955 (54) |
| 5 | 767 | 107.380 | 3.000 | BKL 3: 1.5 / CLT 3.5 | 190.312 (60) | 192.380 (58) | 193.114 (56) | 196.815 (55) |
| 6 | 639 | 89.460 | 3.600 | BKL 3: 1.5 / CLT 3.5 | 173.592 (62) | 175.360 (59) | 176.094 (57) | 179.795 (56) |
| 7 | 548 | 76.720 | 4.200 | BKL 3: 1.5 / CLT 3.5 | 162.052 (64) | 163.820 (61) | **164.254 (58)** | 167.955 (57) |
| 8 | 479 | 67.060 | — | — | not allowed (32 m > 28 m) | | | |

The suggested responses (R12) are the same in every concept:
- **E4 accept** and **E5 reduce** (a tie, broken by lower expected delay).
- **E2:** reduce at 5 floors or more (p ≥ 25 %; at 25 % it is a tie broken by lower expected delay), accept at 3–4 floors.
- **System risk:** E3 accept; E9 reduce (a tie broken by lower expected delay); E10 reduce.

These choices, plus the reserve rule, give the plan weeks and costs in R14's puzzle table.
