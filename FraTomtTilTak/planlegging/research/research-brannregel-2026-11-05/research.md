---
title: "Source check: the fire-cost rule in Fra tomt til tak (S18, S19, R5, R14)"
status: draft for group review
created: 2026-11-05
---

# Source check: the fire-cost rule

Building: office, 2,300 m² BTA, 3–7 floors, central Oslo, risk class 2. Rule checked: `simulation-rules.md` S18, S19, R5, R14. That file has not been edited. §6 is a proposal for the group.

Pages on dibk.no were read on 2026-11-05. [S1] style references are listed in §8. Items marked "excerpt" were seen only in a search result and the page itself was not opened.

## Summary

- **S18 is correct.** Risk class 2 gives BKL 2 at 3–4 floors and BKL 3 at 5 or more. The preaccepted main load-bearing system is R 60 in BKL 2 and R 90 A2-s1,d0 in BKL 3.
- **The group's concern is partly right.** The rule charges CLT 2.000 MNOK for R 90 and charges steel nothing, although unprotected steel reaches 550 °C in about 10–15 minutes and cannot meet R 60 or R 90 without protection. Steel's protection has a usable published price; CLT's does not.
- **But timber's extra cost is not a mistake either.** CLT's cost comes from the requirement that the structure be non-combustible (A2-s1,d0), so it must go the analysis route. It is a documentation and encapsulation cost, not proof of worse fire performance. The literature DiBK commissioned also says timber's behaviour in a natural fire is less settled than the "predictable charring" argument suggests (§2.3).
- **Proposed change:** add +1.800 MNOK for steel at BKL 3 (fire cost 3.300) and optionally +1.000 at BKL 2. CLT stays at 3.500. Target cost rises from **169 to 171 MNOK**, target week stays 67, and the steel–CLT gap at each of 5–7 floors falls from 3.781 to **1.981 MNOK**.
- **Biggest open risk:** CLT's +5 % (S13) comes from Valle Wood, a 7-floor whole-building comparison, so it may already include fire costs. The +2.000 on top may partly double-count (§6.3, variant C).

---

## 1. TEK17 § 11-4 and VTEK

### 1.1 What is preaccepted

From DiBK's § 11-4 Table 1 [S1]:

| Building part | BKL 1 | BKL 2 | BKL 3 |
|---|---|---|---|
| Bærende hovedsystem | R 30 [B 30] | **R 60 [B 60]** | **R 90 A2-s1,d0 [A 90]** |
| Sekundære bærende bygningsdeler, etasjeskillere og takkonstruksjoner som ikke er del av hovedbæresystem eller stabiliserende | R 30 [B 30] | R 60 [B 60] | R 60 A2-s1,d0 [A 60] |
| Trappeløp | – | R 30 [B 30] | R 30 A2-s1,d0 [A 30] |
| Bærende bygningsdeler under øverste kjeller | R 60 A2-s1,d0 [A 60] | R 90 A2-s1,d0 [A 90] | R 120 A2-s1,d0 [A 120] |

Quoted requirements [S1]:

- § 11-4 (4): "Det bærende hovedsystemet i byggverk i brannklasse 3 og 4 skal dimensjoneres for å kunne opprettholde tilfredsstillende bæreevne og stabilitet gjennom et fullstendig brannforløp, slik dette kan modelleres."
- Guidance: "Bærende hovedsystem i byggverk i brannklasse 3 må ha brannmotstand i samsvar med tabell 1 med unntak som angitt i nr. 3."
- Guidance, no. 3: "Byggverk i brannklasse 3 med høyst 8 etasjer kan ha etasjeskillere med brannmotstand R 60 A2-s1,d0 [A 60]."
- Guidance on calculation: "For et bærende hovedsystem i byggverk i brannklasse 4 må det ved beregning dokumenteres tilfredsstillende bæreevne og stabilitet gjennom et fullstendig brannforløp." So a calculated full fire course is explicitly required in BKL 4, while in BKL 3 the table value is the preaccepted way to comply.

Fire class: § 11-3 Table 1 gives risk class 2 → BKL 1 for 1–2 floors, BKL 2 for 3–4, BKL 3 for 5 or more [S2]. This matches S18.

### 1.2 What timber needs in BKL 3

- **Timber is allowed in BKL 2 without analysis.** The BKL 2 entry has no A2 requirement. SINTEF's approval of Nordisk Massivtre covers risk classes 1–6 in BKL 1 and 2 [S7].
- **Timber in BKL 3 is outside the preaccepted solution**, because R 90 is coupled to A2-s1,d0 and massive timber is D-s2,d0 [S7]. DiBK's 2016 presentation of the literature study says: "Ingen preakseptert løsning i brannklasse 3" [S6].
- **The route is analysis.** TEK17 § 2-2 (2) lets functional requirements be documented "ved bruk av preaksepterte ytelser" or "ved analyse som viser at ytelsene oppfyller funksjonskravene i forskriften". The guidance says: "Dersom det er valgt å ikke følge en eller flere av de preaksepterte ytelsene, må det gjøres en analyse." [S4]
- SINTEF's approval confirms this for CLT: "Ved bruk i brannklasse 3 må brannsikkerheten dokumenteres ved analytisk brannteknisk prosjektering." [S7]
- SP Fire Research (for DSB and DiBK, 2017): deviating with a combustible structure in BKL 3 makes documentation of the full fire course "vesentlig" [S5].
- **Encapsulation is not a stated requirement.** It does not appear in § 11-4. It is a common outcome of the analysis. So S19's wording ("needs a fire analysis plus encapsulation") is right on the analysis and overstated on the encapsulation.
- **Surfaces are a separate rule.** § 11-9 requires B-s1,d0 on walls and ceilings in fire cells over 200 m² in BKL 2 and 3, and allows D-s2,d0 up to 200 m² [S3]. At the simulator's floor plates (329–767 m²), open-plan CLT left exposed would not meet the preaccepted surface class, even in BKL 2. Even with analysis, surfaces must be at least D-s2,d0 [S3].

### 1.3 Does sprinkler change the requirement?

**No, not for the load-bearing requirement.**

- § 11-4 and its guidance do not mention sprinkler at all [S1].
- § 11-12 requires automatic extinguishing only in risk class 4 where a lift is required, and in risk class 6 [S10]. An ordinary office (risk class 2) has no general sprinkler requirement. The guidance adds a sprinkler requirement for open connections over several levels above 800 m² in risk classes 1, 2, 4 and 5 [S10].
- § 11-8 gives sprinkler credits on other items, such as windows and eaves, for example "vindu mot utvendig rømningsvei ha brannmotstand EW 30 i brannklasse 1 og EW 60 i brannklasse 2 og 3" [S11]. None of these reduce R 90.
- In practice sprinkler can be a compensating measure inside an analysis. A sprinkler conference slide lists "Bæresystem: Tillate brennbart og redusert brannmotstand" as an example of a deviation (excerpt, an illustration, not a rule) [S12].
- A Veidekke interview says an 8-storey CLT building in Norway "would need a sprinkler system, which is not the case for a concrete and steel building" [S13]. That is project experience; I found no such rule in TEK17.

---

## 2. Fire behaviour

All Eurocode values below are from secondary sources. NS-EN 1995-1-2 and NS-EN 1993-1-2 themselves are paywalled and were not read.

### 2.1 Timber (EN 1995-1-2)

| Value | Figure | Source |
|---|---|---|
| β0, one-dimensional, softwood ≥ 290 kg/m³ | 0.65 mm/min | [S20] Table 1, citing EN 1995-1-2 |
| βn, notional, glulam | 0.70 mm/min | [S20]; Moelven also gives 0.7 mm/min (excerpt) [S22] |
| βn, notional, solid timber | 0.80 mm/min | [S20] |
| Zero-strength layer d0 | 7 mm (k0 reaches 1 at 20 minutes) | [S21]; FIN EC help (excerpt) [S23] |

Worked depths per exposed face, `def = βn × t + d0`:

- **R 60, glulam:** 0.70 × 60 + 7 = **49 mm**
- **R 90, glulam:** 0.70 × 90 + 7 = **70 mm**
- **R 90, one-dimensional:** 0.65 × 90 + 7 = **65.5 mm**. This is my arithmetic, not a design value.

CLT caveats:

- Delamination can raise the rate, and whether layers fall off depends on the adhesive. In one set of tests in [S5], PU-glued samples charred at a mean of 0.78 mm/min (0.55–1.09) against 0.57 (0.53–0.61) for MUF.
- The 7 mm layer is disputed: a CLT study found it exceeded in almost all cases (excerpt) [S24].

### 2.2 Steel (EN 1993-1-2)

Effective yield strength factor ky,θ [S25], [S26]:

| °C | 400 | 500 | 600 | 700 | 800 |
|---|---|---|---|---|---|
| ky,θ | 1.00 | 0.78 | 0.47 | 0.23 | 0.11 |

- **Critical temperature:** Promat uses 550 °C for columns and 620 °C for beams as conservative limits [S25].
- From the EN 1993-1-2 formula quoted in [S26], `θcr = 39.19 × ln(1 / (0.9674 × μ0^3.833) − 1) + 482`, I get 585 °C at μ0 = 0.5, 554 °C at 0.6 and 540 °C at 0.65.

**Time to critical temperature, unprotected: no source found that states it in minutes.** I calculated it instead with the EN 1993-1-2 step method (ISO 834 fire, ε = 0.7, h = 25 W/m²K, ρ = 7,850 kg/m³, temperature-dependent specific heat, no shadow effect, 1 s step). This is **my calculation, not a sourced figure**:

| Section factor A/V (m⁻¹) | 500 °C | 550 °C | 600 °C | 700 °C |
|---|---|---|---|---|
| 100 | 12.9 min | 14.5 min | 16.4 min | 21.6 min |
| 150 | 10.2 min | 11.6 min | 13.2 min | 18.0 min |
| 200 | 8.7 min | 9.9 min | 11.4 min | 16.2 min |
| 300 | 7.0 min | 8.1 min | 9.5 min | 14.4 min |

Promat agrees on the order of size: only a limited number of fully stressed sections reach 30 minutes without protection [S25]. **So R 60 and R 90 both require protection for a normal steel frame.** That holds in BKL 2 as well as BKL 3.

### 2.3 What this means for the group's concern

The argument holds on standard-fire resistance. Under the design model, a timber member loses a known 49–70 mm per face and keeps working, while unprotected steel fails in 10–15 minutes.

It does not settle the regulatory question, for four reasons from the DiBK/DSB-commissioned literature study [S5]:

- It concludes that knowledge about massive timber in buildings is "mangelfull", especially on exposed timber, char rates, delamination and self-extinction.
- Measured char rates in fires varied from 0.31 to 1.1 mm/min, so the rate is not a constant in a natural fire [S5], [S8].
- Exposed timber adds fuel. Delamination or fallen boards can cause a second flashover [S5].
- Protected steel and concrete add no fuel. In BKL 3 a timber structure must be shown to survive a whole fire, not a 90-minute test (§ 11-4 (4)).

Mjøstårnet is the positive evidence: glulam columns in a 90-minute furnace test charred a little further after the burners stopped, and the fire was designed for burnout [S14].

---

## 3. Cost of fire protection for steel

### 3.1 Found

The best source is the Aecom/BCSA **Costing Steelwork** series (UK, £ per m² gross internal floor area, BCIS index 100). The floor area basis is the building, not the steel surface. The series says its rates are "for comparative purposes only".

| Item | Sept 2026 [S15] | Q4 2025 [S16] |
|---|---|---|
| Fire protection, 60 min, factory-applied intumescent | **£30–41/m²** | £29–40/m² |
| Fire protection, 90 min, factory-applied intumescent | **£47–78/m²** | £38–58/m² |
| Steel frame, low-rise | £180–210/m² | £159–191/m² |
| Composite floor, metal deck | £119–162/m² | £111–151/m² |
| Hollow-core floor with topping | £148–208/m² | £138–194/m² |

Share of frame cost: "around 10-15% of the overall steel frame cost in commercial multi-storey buildings" [S16].

### 3.2 Conversion to a 2,300 m² office

Exchange rate: **12.6 NOK/GBP**. October 2026 ranged about 12.39–12.91 (excerpt, not Norges Bank) [S17].

`MNOK = £/m² × 12.6 × 2,300 ÷ 1,000,000`

| Class | £/m² | NOK/m² | MNOK |
|---|---|---|---|
| R 60 low | 30 | 378 | 0.869 |
| **R 60 mid** | **35.5** | **447** | **1.029** |
| R 60 high | 41 | 517 | 1.188 |
| R 90 low | 47 | 592 | 1.362 |
| **R 90 mid** | **62.5** | **788** | **1.811** |
| R 90 high | 78 | 983 | 2.260 |

- **R 60 → R 90 step:** 1.811 − 1.029 = **0.782 MNOK**.
- **Older rates:** the Q4 2025 R 90 midpoint (£48) gives 48 × 12.6 × 2,300 = 1.391 MNOK. The two editions differ by about 0.4 MNOK.
- **Exchange-rate range:** 12.39–12.91 moves the R 90 midpoint only between 1.781 and 1.856 MNOK.
- **Per tonne (derived):** at 55 kg/m² for low-rise [S16], 2,300 × 55 = 126.5 t, so R 90 ≈ 1,811,000 ÷ 126.5 ≈ 14,300 NOK/t.
- **Cross-check on share:** with hollow-core floors, 62.5 ÷ (195 + 178 + 62.5) = 14.4 % of frame plus floor, which falls inside the 10–15 % range. The source's own R 60 example is 35.5 ÷ 371 = 9.6 %, just under the bottom of the range.

Limits:

- These are UK rates. No Oslo location factor exists in the source, and no adjustment has been applied.
- GIFA is not exactly BTA. BTA includes external walls, so using it slightly overstates the area. I found no conversion factor.

### 3.3 Not found

- Norwegian price per m² of steel surface, per tonne, or as a share of frame or building cost: **not found**. Byggforsk 520.315 *Brannbeskyttelse av stålkonstruksjoner* exists but is paywalled.
- Reliable cost per m² of steel surface from any country: **not found**. Only low-quality hits: a US aggregator at $40–120/m² installed (excerpt, method unknown) [S18] and a 2017 UK forum post at about £8/m² for paint alone (excerpt) [S19]. Neither is used.
- Board and spray costs: **not found**.

---

## 4. Cost of fire engineering for a CLT office

### 4.1 Cost figures

| Item | Result |
|---|---|
| Fire analysis / analysis-based documentation (fee) | **Not found** |
| Encapsulation (plasterboard), NOK or EUR per m² | **Not found** |
| Sprinkler in an office, Norway, per m² | **Not found.** TU's Norsk Prisbok 2017 breakdown gives VVS at 2,474 NOK/m² BTA with no sprinkler line [S27] |
| Whole-building premium, CLT against steel/concrete | **About 5 %.** Valle Wood: about 200 MNOK, an equivalent in steel and concrete "om lag fem prosent lavere" (TU, 2018, one project) [S28] |

**Qualitative evidence only:**

- COWI, Arkitema and Chalmers compared CLT and concrete residential cases in Norway and Sweden. Fire protection and measures "resulted in a higher cost in the CLT cases" [S13].
- Veidekke said in the same study that large amounts of fire gypsum board raise material cost, and that board material and labour were "a large part of the cost differences" between their timber and concrete buildings [S13]. No figure is given.
- The Chaudhary and Van Coile cost-benefit study covers sprinkler and encapsulation in mass timber, but I could not read its cost inputs. The publisher's page redirects to a login and the proxy mirror was blocked, so it was not used. A summary says every $1 invested in sprinklers saves $1.06 in the house and timber cases (excerpt) [S29]. That is a benefit ratio, not a unit cost.
- A 2024 full-scale study notes that encapsulation has trade-offs against exposed timber and that partial protection can be chosen [S30], but gives no costs.

### 4.2 Real examples

| Project | Floors, class | Fire solution stated in public sources | Not found |
|---|---|---|---|
| **Mjøstårnet** | 18 floors, so BKL 4 by § 11-3 [S2] | Main system **120 min**, floors **90 min**, by residual section after charring, so glulam stays visible [S14]. Whole building sprinklered, pumps on emergency power [S14], [S31]. Burnout design [S31]. Plasterboard on CLT walls in the escape stair [S14]. Gypsum under floors [S31]. Fire-retardant treatment on visible wood in escape routes [S14], [S32]. Steel in connections embedded in timber (85+ mm) [S14] | Cost of the fire solution |
| **Valle Wood** | 7 floors, so BKL 3 by § 11-3 (my inference) | Sweco designed the fire concept, building on Mjøstårnet, and part of the floors was left visible alongside the glulam [S33] | Fire class as stated, sprinkler, encapsulation, analysis cost |
| **HasleTre** | 4 floors [S34], so BKL 2 by § 11-3 (my inference), which means CLT is preaccepted here | Caption says there is room for sprinkler systems without holes in beams [S34] | Whether sprinklered in full, encapsulation. The article is paywalled |

HasleTre is a useful teaching point: at 4 floors it avoids the BKL 3 analysis problem altogether.

---

## 5. Hollow-core slabs and concrete

- **Regulation:** in BKL 3 with at most 8 storeys, floors may be R 60 A2-s1,d0, not R 90 [S1]. Hollow-core floors in the 5–7-floor concepts therefore need R 60 if they use this exception. The table's wording excludes floors that are part of the main or stabilising system, while note 3 is general. Whether hollow-core acting as a stabilising diaphragm uses the exception is **not clear from the text**.
- **What R 90 takes:** **the REI 90 row was not found** in any readable source. The closest is a 2024 fire note by AasJakobsen for Tromsø kommune. For REI 120 it gives 40 mm from NS-EN 1992-1-2 Table 5.8 plus 15 mm for prestressing (§ 5.2(5)), so 55 mm in Betongelementboka Table D 4.1, unless further checks are done. HD265 with 45 mm cover was accepted at REI 120 by calculation, at up to 90 % utilisation [S35].
- **How class is raised:** a UK precast supplier states that cover can be increased for greater fire resistance [S36]. Fire class is bought with cover or checks. Hollow-core does not need paint or boards.
- **Caution:** a Spanish test study found that Eurocode verification tends to overestimate resistance when strands sit further from the exposed surface (excerpt) [S37].
- **Cost:** **no source prices extra hollow-core fire class.**
- **Steel + hollow-core against steel alone:** the Aecom table adds the fire protection line on top of either floor type [S15]. Hollow-core costs more than metal deck (£148–208 against £119–162), but that is a floor choice and belongs in S13. I found **no evidence that hollow-core changes the fire step**. It covers the top flange of a beam, which may cut paint on that face, but I found no cost figure for this.

---

## 6. Proposed corrected rule

### 6.1 Proposed values (MNOK)

The rule is split into a shared BKL 3 step and a system-specific cost for reaching the class.

| System | BKL 2 total (optional) | BKL 3 shared | BKL 3 system extra | **BKL 3 total** | Today |
|---|---|---|---|---|---|
| Cast-in-place | 0 [ESTIMATE] | 1.500 [ESTIMATE] | 0 [ESTIMATE] | **1.500** | 1.500 |
| Precast | 0 [ESTIMATE] | 1.500 [ESTIMATE] | 0 [ESTIMATE] | **1.500** | 1.500 |
| Steel + hollow-core | **1.000** [SOURCED, UK rate] | 1.500 [ESTIMATE] | **1.800** [SOURCED, UK rate] | **3.300** | 1.500 |
| CLT | 0 [ESTIMATE] | 1.500 [ESTIMATE] | 2.000 [ESTIMATE] | **3.500** | 3.500 |

"[SOURCED, UK rate]" means a published UK rate × exchange rate × 2,300 m², rounded. It is not a Norwegian price, and no Oslo adjustment has been made.

Reasoning:

- **Shared 1.500:** kept because nothing better exists. No source supports it, and because all four systems pay it, it does not affect the comparison between them.
- **Cast-in-place, extra 0:** concrete is non-combustible and reaches R 90 through section size and cover, not an added product; no source prices this.
- **Precast, extra 0:** same as cast-in-place, and hollow-core may use the R 60 floor exception up to 8 storeys, though joints and cover still need design.
- **Steel, extra 1.800:** steel is non-combustible but needs protection to reach R 90, priced at the Aecom 90-minute midpoint of 1.811 MNOK, rounded.
- **Steel, BKL 2 at 1.000:** R 60 is a requirement too, and unprotected steel does not reach it, priced at the 60-minute midpoint of 1.029 MNOK, rounded.
- **CLT, extra 2.000:** kept as an estimate for the analysis and encapsulation, since no figure was found; this is the cost of documenting a combustible structure outside the preaccepted solution, not a statement that timber performs worse.
- **CLT, BKL 2 at 0:** R 60 is preaccepted without A2 and can be met by charring depth, but exposed surfaces in large cells may still need lining (§1.2).

Suggested text for R5:

```
fireCost at BKL 2: steel 1.000, others 0  (optional)
fireCost at BKL 3: 1.500 + extra, where extra = cast-in-place 0, precast 0, steel 1.800, CLT 2.000
```

Suggested adviser wording: "Steel is non-combustible but must be protected to reach R 90. CLT reaches R 90 by charring depth, but as a combustible structure it needs a fire analysis, and usually lining."

### 6.2 Effect on R14 (recommended version)

Responses, reserve and durations do not depend on `fireCost`, so a plan changes only by the difference in fire step. Steel: 3.300 − 1.500 = +1.800. CLT: 3.500 − 3.500 = 0.

**Reference plan (7 floors, steel):**

- Building cost = 68.034 + 4.200 + 3.300 = 75.534
- Base cost = 76.720 + 75.534 + 13.800 = 166.054
- Plan cost = 166.054 + 0.740 + 3.435 = **170.229**
- **Target cost = 170.229 rounded up = 171 MNOK** (was 169). Target week stays **67**.

| Floors | Steel old | + 1.800 | **Steel new** | **CLT (unchanged)** | CLT − steel old | **CLT − steel new** |
|---|---|---|---|---|---|---|
| 5 | 197.279 | 197.279 + 1.800 | **199.079** ✗ | 201.060 ✗ | 3.781 | **1.981** |
| 6 | 180.264 | 180.264 + 1.800 | **182.064** ✗ | 184.045 ✗ | 3.781 | **1.981** |
| 7 | 168.429 | 168.429 + 1.800 | **170.229** ✓ | 172.210 ✗ | 3.781 | **1.981** |

✓ and ✗ are against the new 171 MNOK target. Plan weeks do not change: steel 65/66/67, CLT 63/64/65.

What changes:

- **The puzzle survives.** Steel at 7 floors is still the only plan that meets both targets (margin 171.000 − 170.229 = 0.771). Cast-in-place (166.667) and precast (167.995) at 7 floors still meet cost but miss the week.
- **CLT at 7 floors** misses by 172.210 − 171 = **1.210**, down from 3.210.
- **R30 adviser wording changes.** The threshold is 2 % × 171 = 3.420. At 7 floors, the steel–CLT gap of 1.981 is now below it, and both land on target for week, so the adviser would say "both work" and stop recommending firmly. Before, 3.781 was above 2 % × 169 = 3.380.
- **BKL 2 option:** steel at 3 and 4 floors becomes 264.524 + 1.000 = 265.524 and 220.334 + 1.000 = 221.334. The target is unaffected.

### 6.3 Variants the group should decide between

| Variant | Steel total | CLT total | Steel 5 / 6 / 7 | CLT 5 / 6 / 7 | Target | CLT 7 floors miss | Gap |
|---|---|---|---|---|---|---|---|
| **A: recommended** | 3.300 | 3.500 | 199.079 / 182.064 / 170.229 | 201.060 / 184.045 / 172.210 | **171** | 1.210 | 1.981 |
| B: S13's 1.02 already holds R 60 | 2.300 | 3.500 | 198.079 / 181.064 / 169.229 | 201.060 / 184.045 / 172.210 | **170** | 2.210 | 2.981 |
| C: A, plus CLT extra cut to 1.000 | 3.300 | 2.500 | 199.079 / 182.064 / 170.229 | 200.060 / 183.045 / 171.210 | **171** | 0.210 | 0.981 |

- **Variant B** (steel extra 0.800, the R 60 → R 90 step of 0.782 rounded) is right if the group reads steel's 1.02 as including basic protection. S13 marks 1.02 as an estimate with no source, so neither reading can be proved. In the Aecom tables fire protection is listed separately from the frame, which is why A is recommended.
- **Variant C** answers the double-count risk. S13's CLT factor of 1.05 comes from Valle Wood [S28], a 7-floor whole-building comparison, so it most likely already contains that building's fire costs. On top of that factor the rule adds 2.000. The size of the cut (1.000) is an [ESTIMATE]. An extra of 0.790 or less would let CLT at 7 floors meet 171 as well, ending the single-solution puzzle; that is a design decision.

### 6.4 Files and values that would change if adopted

Nothing has been edited. If variant A is adopted, in `simulation-rules.md`:

- S18/S19 text (encapsulation is an outcome, not a requirement) and §2.3, §2.4, R5, R14 and its table, Appendix A, §5 items 2 and 12, and §1.2.
- Worked example (a): fire 3.300, plan 170.229, target 171.
- Worked example (b): 7-floor base 166.054. 4 floors cost 216.254 − 166.054 = 50.200 more (or 51.200 with the BKL 2 option, base 217.254), not 52.000. The fire-class saving line changes too.
- Worked example (c): plan excl. reserve 161.554 + 1.800 = 163.354, plan cost 166.354, each forecast +1.800. The recommendation and ranking do not change.
- Worked example (d): all four runs +1.800. Bridge step 1 becomes 163.354 − 171.000 = −7.646. Check: −7.646 + 4.800 + 5.646 + 0.554 = +3.354, and final 174.354 − 171.000 = +3.354.
- `research-fra-tomt-til-tak` has no fire-rule entry. §5 item 2 asked for one; this file can serve as that source.

---

## 7. What would improve confidence

1. One Norwegian quote or price for intumescent R 90 on a steel office frame, or Norsk Prisbok lines.
2. One real fire consultant's fee and gypsum quantity for a 5–7-floor CLT office. Sweco or NCC could answer for Valle Wood.
3. Whether Valle Wood's 5 % includes the fire solution. That decides variant C.
4. Betongelementboka Bind D Table D 4.1 for the REI 60 and REI 90 rows.
5. The current EN 1995-1-2 revision. A draft second-generation text changes the zero-strength layer rules (excerpt) [S38]. Its status was not verified.

---

## 8. Sources

"Read" means the text was opened and read. "Excerpt" means seen only as a search result.

**Regulation (DiBK, read 2026-11-05)**

- [S1] DiBK, TEK17 § 11-4 with guidance (guidance last changed 2017-12-01). https://www.dibk.no/regelverk/byggteknisk-forskrift-tek17/11/ii/11-4
- [S2] DiBK, TEK17 § 11-3. https://www.dibk.no/regelverk/byggteknisk-forskrift-tek17/11/i/11-3
- [S3] DiBK, TEK17 § 11-9. https://www.dibk.no/regelverk/byggteknisk-forskrift-tek17/11/iii/11-9
- [S4] DiBK, TEK17 § 2-2. https://www.dibk.no/regelverk/byggteknisk-forskrift-tek17/2/2-2
- [S10] DiBK, TEK17 § 11-12. https://www.dibk.no/regelverk/byggteknisk-forskrift-tek17/11/iv/11-12
- [S11] DiBK, TEK17 § 11-8. https://www.dibk.no/regelverk/byggteknisk-forskrift-tek17/11/iii/11-8

**Massive timber and fire**

- [S5] Wormdahl, Hox, Steen-Hansen, Baker, Ulfsnes, *Brannsikkerhet i bygg med massivtre*, SP Fire Research for DSB and DiBK, 2017. Read. It cites TEK10; the A2 requirement is unchanged in TEK17. https://dibk-xp7prod.enonic.cloud/globalassets/02.-om-oss/rapporter-og-publikasjoner/spfr-a16-20229-brannsikkerhet-i-bygg-med-massivtre_spfr-_2017.pdf
- [S6] SP Fire Research, presentation at DiBK fagdag, 2016-10-21. Read. https://dibk-xp7prod.enonic.cloud/globalassets/2.-verktoy-og-veivisere/brannsikkerhet/fagdag-brann-2016/brannsikkerhet-i-bygg-med-massivtre---litteraturstudium_fagdag-dibk-21-oktober-2016.pdf
- [S7] SINTEF Certification no. 20604, Nordisk Massivtre. Read; the validity date could not be read from the extracted text, so check that it is current. https://sintefcertification.no/Product/Download/10360
- [S8] Firesafe, A. Killerud, *Branntetting i massivtre*, 2019. Excerpt. https://www.firesafe.no/wp-content/uploads/2019/10/11_firesafe_atle_killerud_branntetting_i_massivtre.pdf
- [S12] FG, Sprinklerkonferansen 2024, L. R. Skarsbø. Excerpt. https://www.fgsikring.no/siteassets/brann/sprinkler/sprinklerkonferansen-2024/presentasjoner-2024/dag-2/13-ny-lars-roar-skarsbo---viktigheten-av-et-fungerende-anlegg.pdf
- [S13] Arkitema, COWI, Chalmers, *Construction cost of timber buildings*, 2022. Read. https://research.chalmers.se/publication/532727/file/532727_Fulltext.pdf
- [S29] Chaudhary and Van Coile, *Fire Technology*, 2023, DOI 10.1007/s10694-023-01419-2. Full text not read; ratio seen in a repository excerpt. https://dirros.openscience.si/IzpisGradiva.php?id=17371
- [S30] Hopkin et al., *Fire Technology* 60, 2024. Open access; read in part. https://doi.org/10.1007/s10694-024-01581-1

**Projects**

- [S14] R. Abrahamsen, *Mjøstårnet: Construction of an 81 m tall timber building*, Internationales Holzbau-Forum, 2017. Read. https://www.moelven.com/globalassets/moelven-limtre/mjostarnet/mjostarnet---construction-of-an-81-m-tall-timber-building.pdf
- [S31] WoodSolutions, Mjøstårnet webinar Q&A, 2020. Read. https://www.woodsolutions.com.au/webinars/woodsolutions-webinars/mjostarnet-18-storey-mixed-use-full-timber-building-insights-design
- [S32] CFPA Europe, *The world's tallest and safest timber building*, 2019. Read. https://cfpa-e.eu/the-worlds-tallest-and-safest-timber-building/
- [S33] Sweco, Valle Wood project page, undated. Read. https://www.sweco.no/vare-tjenester/bygninger/konstruksjoner/timber/fire-safety-and-acoustics/valle-wood/
- [S34] J. Seehusen, TU, 2022-03-30. Free preview only. https://www.tu.no/artikler/en-helt-fabelaktig-morsom-mate-a-bygge-pa-br/518399
- [S28] K. Bjørheim, TU, 2018-10-13. Read. https://www.tu.no/artikler/ncc-er-snart-ferdig-med-norges-storste-kontorbygg-i-massivtre-se-bildene-br/448460

**Eurocode values (secondary)**

- [S20] Yasir et al., WCTE 2023, Table 1 citing EN 1995-1-2. Read. https://ucg.ie/media/timberengineeringresearchgroup/WCTE-2023---yasir-Fire.pdf
- [S21] *Engineering Structures and Technologies* 1(3), 2009, citing EN 1995-1-2:2004. Read. https://journals.vilniustech.lt/index.php/EST/article/download/7545/6517
- [S22] Moelven technical data via Cobuilder, undated. Excerpt. https://app10.cobuilder.com/api/shared/products/72685/documents/1089897?culture=en
- [S23] FIN EC help, undated. Excerpt. https://finesoftware.eu/help/finec/en/methods-for-fire-resistance-analysis-02
- [S24] ETH Research Collection, *Simulation of Cross Laminated Timber Boards under Fire Exposure*. Excerpt. https://www.research-collection.ethz.ch/items/0e91d391-8f0c-4f09-b089-c8218ba33779
- [S25] Promat, *Structural Steel Fire Protection*, Asia Pacific, May 2015. Read. https://media.promat.com/pi10301/original/288272370/promat-paph-02-steelwork-en.pdf
- [S26] Steel Calculator reference pages, undated, secondary and with some inconsistent figures. Used only for the table (which matches [S25]) and the θcr formula (excerpt). https://steelcalculator.pages.dev/reference/fire-resistance
- [S38] Dansk Standard, webinar slides on prEN 1995-1-2, 2023. Excerpt. https://www.ds.dk/media/tvklqobl/slides-samlet-webinar-2023-10-27-pren-1995-1-2.pdf

**Cost**

- [S15] Sansom (BCSA), Cristi Worm (Aecom), *Costing Steelwork #37*, September 2026. Read. https://steelconstruction.info/upload/Costing%20Steelwork%20Sept%202026%20with%20cover.pdf
- [S16] SteelConstruction.info, *Cost planning: multi-storey offices*, cost table Q4 2025. Read. https://steelconstruction.info/topics/cost-of-structural-steelwork/cost-planning-multi-storey-offices
- [S17] Pound Sterling Live, GBP/NOK history 2026. Excerpt, not an official rate. https://www.poundsterlinglive.com/history/GBP-NOK-2026
- [S18] Latestcost, undated. Excerpt, not used. https://latestcost.com/intumescent-paint-cost-per-m2-u-s/
- [S19] BuildHub forum, 2017. Excerpt, not used. https://forum.buildhub.org.uk/topic/3328-how-much-should-fire-protection-intumescent-painting-cost-for-steel
- [S27] J. Revfem, TU, 2018-06-30, based on Norsk prisbok 2017. Read. https://www.tu.no/artikler/hva-koster-det-a-oppfore-et-typisk-kontorbygg-br/441201

**Hollow-core**

- [S35] AasJakobsen, Brannteknisk notat 01, for Tromsø kommune, 2024-04-24. Read. https://tromso.kommune.no/sites/default/files/2024-05/Brannteknisk%20notat-01-AasJakobsen-Vurdering-av-brannmotstand-av-konstruksjoner-tilh%C3%B8rende-seksjoneringsveggene.pdf
- [S36] Milbank, *Fire Resistance of Milbank Precast Units*, v5, November 2015, based on BS 8110. Read in part. https://www.milbank.co.uk/app/uploads/2023/12/Fire-Resistance-of-Milbank-Precast-Units-v5-Nov-15.pdf
- [S37] Universitat Politècnica de València, publication record. Excerpt. https://aplicat.upv.es/exploraupv/ficha-publicacion/publicacion/223796
