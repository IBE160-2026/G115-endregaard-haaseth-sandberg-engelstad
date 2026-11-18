---
title: 'domain/technical research: Fra tomt til tak – sourced parameters for the office-building simulator (Oslo)'
type: 'domain/technical'
topic: 'Floor area, Oslo land prices, construction cost and duration by structural system, Oslo zoning, price index and labour rates for a 100-workplace office building'
decision: 'Which simplified, sourced figures the G115 simulator rules should use for area, plot, cost, duration, zoning, indexation and labour'
source: 'native run (web search, lead-only, headless)'
status: complete
preset: 'standard'
validation: 'normal'
created: '2026-10-31'
updated: '2026-10-31'
claims_verified: 12
claims_unverified: 7
claims_disputed: 1
---

# Domain/technical research: Fra tomt til tak

**Decision this research serves:** which simple numbers the G115 "building-block model" should use to turn a plot, floors × footprint and a structural system into area, land cost, WBS cost and duration. Each number needs a source or an explicit [ESTIMATE] flag.

All figures are in NOK and exclude VAT unless stated otherwise. "Today" means October 2026. All sources were accessed on 2026-10-31.

## Executive summary

- **Area is the best-sourced number.** The state area norm is **23 m² BTA per employee**, and it is an upper limit [1][2]. For 100 workplaces that gives **2,300 m² BTA**. The actual state average is 25.5 m², and leases negotiated through Statsbygg average 19.7 m² [2]. That gives a defensible range of 2,000–2,550 m².
- **Construction cost: use ~35,000 NOK/m² BTA (2026, excl. VAT) as the all-in construction cost.** This is a mid-value between two sourced anchors that disagree:
  - Norsk Prisbok 2017, indexed to 2026, gives ~28,600 [4][24][25].
  - Bygganalyse's 2023 office calculation, indexed, gives ~36,800 including parking basement [5].
  - A 2024 office project cost ~34,700/m² [13].

  The cost split by building part comes from Norsk Prisbok [4].
- **Structural system mostly changes time, not cost.** The only Norwegian office cost comparison found puts CLT (massivtre) at **about +5%** over steel/concrete [9]. Prefab, steel and CLT erect faster than cast-in-place concrete: a 9-storey CLT frame went up in 5 weeks, about half the concrete time [10]. Per-floor frame times are therefore **[ESTIMATE]s anchored on these sources**.
- **Duration:** recent Norwegian prefab or steel office/hall buildings of 4,900–7,000 m² were built in **9–11 months** [11][12]. An 8-floor office of 4,500 m² is planned at about 20 months [15]. For ~2,300 m², **12 months** of construction is a reasonable base [ESTIMATE].
- **Land prices are the weakest area.** No open, current price per m² BRA for office plots by Oslo zone was found. Three tiers are proposed as [ESTIMATE]s anchored on broker and trade-press figures [4][6][7]: central **35,000**, inner city **20,000**, outer **8,000 NOK per m² BRA**. Per m² of plot, the price is the BRA price × %BRA.
- **Zoning in Oslo** is expressed as %BYA (footprint), %BRA or m² BRA (floor area), and height as kotehøyde or metres [18][23]. Oslo's proposed plan uses heights of 22 / 28 / 42–70 m and a guideline area utilisation of 100–125% for development areas [20]. Actual plans go far higher: Økern syd is at 278–800% BRA [22].
- **Indexation:** use SSB's residential building cost index. The factor from 2017 (annual average) to September 2026 is **×1.524** [24][25]. SSB has no general office cost index.
- **Labour:** the average carpenter earned 48,020 NOK/month in 2025, about 295 NOK/h [27]. The overtime supplement in aml § 10-6 is **at least 40%** [26]. An all-in contractor rate of **~650 NOK/h** is an [ESTIMATE].
- **Biggest caveat:** treat the cost and land values as teaching-grade orders of magnitude, not quotes. Two of the anchors are 2017–2019 data, and both are flagged in the staleness map.

## 1. Floor area per workplace

**Findings**
- The rundskriv H-2/16 (KMD, 17 Dec 2015) sets "en arealnorm på 23 kvm BTA per ansatt" for future state office premises and for the office part of buildings with other primary uses [1].
  - The norm is "å anse som en øvre grense" (an upper limit), and exceeding it requires justification.
  - Ministry offices are exempt [1].
- Statens lokaler 2024 confirms the "maksimale arealnormen på 23 m² BTA for kontordelen" [2]. It also reports:
  - The state average is **25.5 m² per office employee** in 2024.
  - Leases negotiated through Statsbygg's advisory service average **19.7 m²**, "godt ned mot 18–19 m²".
  - Statsbygg was asked to assess changes to the norm, with the work due in October 2025 [2].
- Altinget (2024) reports a state average of 27.8 m² in 2023, down from 30 m² in 2019. Statsbygg's goal is 18 m² [3]. The article does not say whether this is BTA or BRA.

**Result for 100 workplaces:** 100 × 23 = **2,300 m² BTA**. The range 100 × 19.7 to 100 × 25.5 gives **1,970–2,550 m² BTA**.

**Confidence:** high for the 23 m² BTA norm (verified by two publishers, [1] and [2]); medium for the averages.

**Uncertainty:**
- The norm assumes activity-based, open-plan offices. Statsbygg puts cell offices at ~29 m² (TU snippet; not fetched, not used).
- Whether the norm changed after the October 2025 review was not confirmed.
- No sourced BRA/BTA ratio was found. Treat BRA ≈ 0.9 × BTA as an [ESTIMATE].

## 2. Land and plot prices in Oslo

**Findings**
- TU (2018), on a Norsk Prisbok-based office calculation, says land burden (*tomtebelastning*) per m² "ligger fra noen få tusen kroner til over 20.000 i Oslo sentrum vest og i Bjørvika" [4]. It also says:
  - Standard offices cost "opp mot 50.000 kr/m² i tomtebelastning og oppføring".
  - In the outskirts, sale prices are about half, and land costs are "langt lavere" [4].
  - Basis: land burden per m² of building floor area. The article does not say BTA or BRA, but land burden is normally stated per m² of floor area.
- Akershus Eiendom (broker, March 2019) gives **residential** land values per m² of floor area [6]:
  - Bjørvika **35,000–40,000**.
  - Nydalen 16,000 (2012), then 24,000 (December 2016), then flat.
  - Average for new housing in Oslo 26,000.
  - An Entra purchase at Bryn (mixed housing/office potential) worked out at **11,000 kr/m²** of potential floor area.
- Mariakvartalet (Bjørvika area, 2024 sales document): the document duty is ~715 NOK per m² BRA on the land value. At 2.5% duty, that implies ~28,600 NOK/m² BRA (derived by me; search snippet only) [7].
- Oslo's average plot price is 13,375 NOK per m² of **plot**, but this covers **single-family plots only** and does not apply to office plots [8].

**Proposed tiers (2026, per m² BRA, [ESTIMATE] anchored on [4][6][7]):**

| Tier | Example area | Price per m² BRA |
|---|---|---|
| Central | Bjørvika / sentrum | 35,000 |
| Inner city / near centre | Nydalen, Bryn type | 20,000 |
| Outer | Økern / Groruddalen | 8,000 |

To convert to price per m² of plot: plot price/m² = BRA price × (%BRA ÷ 100).

**Confidence:** low to medium.
- Only one source is office-specific [4], and it is from 2018.
- The other anchors are residential land values from 2016–2019 or a derived single project.

**Uncertainty:**
- Office land is usually valued below residential land in Oslo, and the market has fallen since 2022 (not researched).
- Current values would need a broker report (Akershus Eiendom, Newsec, Malling) or a transaction database. These were not openly available.

## 3. Construction cost per m² BTA and the structural system

**Findings: cost level**

Norsk Prisbok 2017 standard calculation, office of 15,000 m² BTA with basement, NOK/m² BTA excl. VAT [4]:

| Item | NOK/m² | Share of contract cost |
|---|---|---|
| Common costs (felleskostnader) | 2,038 | 12.6% |
| Building (bygning) | 8,618 | 53.3% |
| HVAC/plumbing (VVS) | 2,474 | 15.3% |
| Electrical power | 1,741 | 10.8% |
| Telecom and automation | 867 | 5.4% |
| Other installations | 440 | 2.7% |
| **Contract cost (entreprisekostnad)** | **16,178** | 100% |
| General costs (design, administration) | 2,610 | +16% |
| **Construction cost (byggekostnad)** | **18,788** | |

- Including VAT, expected additions and contingency, the cost frame is 26,303 incl. VAT. The article prints the expected addition as "16,144", but the arithmetic implies 1,644.
- Land and outdoor works are excluded [4].
- Indexed ×1.524 [24][25], this gives a contract cost of ~24,700 and a construction cost of **~28,600 NOK/m²** at the 2026 level.

Bygganalyse for Estate Nyheter (November 2023) [5]:
- Office of 15,000 m² BTA plus a 7,600 m² parking basement: **733 MNOK excl. VAT** (892 MNOK incl.).
- That is ~32,400 NOK per m² of total BTA (my arithmetic), or ~36,800 indexed to 2026.
- "Selve kontordelen koster over 48.000 kr/m²". The VAT basis is not stated; it is probably incl. VAT, which would be ~38,400 excl.
- The building body (*bygningskropp*) is ~44% of construction cost.
- Towers of **more than 15 floors cost ~10% more per m²**.
- A parking basement strongly affects cost per m² [5].

Reality checks from recent projects:
- Kongsberg Maritime office (5,563 m², 2024): ~193 MNOK, **≈34,700/m²**. It partly reuses an existing structure [13].
- Stamas (≈7,000 m², mostly hall): 125 MNOK, ≈17,900/m². This is a hall-dominated building and not comparable [11].

**Status:** the Prisbok-2017-indexed level and the Bygganalyse-2023 level **disagree** (≈28.6k vs ≈36.8k). Both are reported, not averaged. The residential index probably understates office cost growth (TEK17, BREEAM, technical installations). The 2024 project data [13] supports the higher end. A base of **35,000** is proposed.

**Findings: by structural system**
- **CLT/glulam:** Valle Wood (Oslo, 6,700 m², 7 floors, 2019) was built within budget and time. A steel/concrete equivalent "would have cost about 5% less", according to a cost estimate seen by TU [9] (snippet; single project).
- **Cast-in-place vs CLT:** an NTNU bachelor thesis (14 storeys) found cast-in-place concrete substantially cheaper for the raw building (snippet; low confidence).
- **Precast and steel with hollow-core slabs:** no Norwegian office cost comparison was found. Precast is chosen mainly for speed. Cast-in-place gives "noe lengre byggetid" but lower floor heights and less transport [17].
- **Taller buildings:**
  - Lifts are mandatory in work buildings with **2 or more floors**, so every multi-storey option needs one. A lifting platform is allowed up to 3 floors with low traffic [30].
  - The only quantified height premium is ~+10% for buildings over 15 floors [5].
- **Basement / parking:** derived from [5] (office part ~48,000 incl. VAT × 15,000 m², remainder spread over 7,600 m² of parking), parking basement costs about **0.5–0.6 × the office cost per m²** [ESTIMATE, derived].

**Confidence:** medium for the cost level (two publishers, same order of magnitude, but disputed in detail); low for system differences.

**Uncertainty:**
- No open 2025–26 edition of Norsk Prisbok or Holte figures was available.
- No source gives a lift cost [ESTIMATE].

## 4. Construction duration and time per floor

**Findings**

| Project | Size and type | Frame | Duration |
|---|---|---|---|
| Stamas, Forus (Byggeindustrien 13-2025) [11] | ≈7,000 m² BTA, 3 floors, office + hall | Precast concrete + hollow-core (office), steel hall | Groundworks September 2024 to handover June 2025: "snaut ni måneders byggetid" |
| Norva24, Øygarden (Byggeindustrien 9-2026) [12] | 4,911 m² BTA, office 2 × ~600 m² + vehicle hall | Steel + hollow-core | May 2025 to April 2026 (~11 months) |
| Lagårdsveien 100, Stavanger [15] (snippet) | 4,500 m², 8 floors, office | n/a | ~20 months |
| Elvebredden, Kongsvinger [14] (snippet) | 11,000 m² BTA, office | n/a | ~2 years |

Per-floor frame speed:
- **CLT:** at Moholt 50|50 (Trondheim, 9-storey CLT, Veidekke), the frame was erected in **5 weeks** (~4 working days per floor). Veidekke uses about **half** the time of a concrete building; the neighbouring concrete building took about twice as long [10].
- **Cast-in-place concrete:** US industry reporting says forming and pouring typically limit concrete to **about 1 floor per 7 days**, against up to 1 floor per day for mass timber [16]. This has a marketing register, so confidence is low.
- **Prefab:** chosen in Norway because cast-in-place is slower [17].

**Proposed (for ~600 m² floor plates):** frame time per floor of 2.0 weeks for cast-in-place, 1.0 week for precast, 1.0 week for steel + hollow-core, and 0.6 week for CLT. Total construction ~12 months for 2,300 m² [ESTIMATE anchored on the table above].

**Confidence:** medium for total duration (two recent primary trade-press projects agree on 9–11 months at a larger size); low to medium for per-floor rates.

**Uncertainty:** the 2,000–3,000 m² office examples found are mixed-use with halls. Multi-storey offices in cities take longer (Lagårdsveien: 20 months for 8 floors). No Norwegian table of weeks per floor by system exists in open sources.

## 5. How zoning limits are expressed in Oslo

**Findings**
- **Measures:** degree of utilisation (*grad av utnytting*) follows the guide H-2300 (KMD, 2014) and TEK17 chapters 5–6 [18].
  - **BYA / %-BYA:** footprint, including exterior walls.
  - **BRA / %-BRA:** usable floor area, excluding exterior walls. It can also be given as an absolute **m² BRA**.
- **Height:** set as **kotehøyde** (elevation above sea level) or metres above planned terrain. The number of floors is not to be used as the height limit [23].
- **Plan status:** Oslo's municipal land-use plan (KPA) from **2015 is in force**. The revision ("Oslo mot 2040") was on hearing until August 2026 and is not adopted (~650 submissions, including state objections) [19].
- **Proposed development areas** [20]:
  - **U2** (urban hubs / regional workplaces): heights up to **28 m**, exceptionally 42 m, up to 70 m; guideline area utilisation **125%**.
  - **U3** (new neighbourhoods): up to **22 m**; 100%.
  - **U6** (space-demanding business): 22 m.
  - **Inner city:** follow existing heights, up to 70 m at Sentrumsringen.
  - **Station-near outer city:** up to ~22 m within 250 m of a stop.
- **High-rise strategy** (bystyret, 27 Sep 2023) [21]:
  - A high-rise is a building over 42 m.
  - 42–70 m may be considered at Økern, Helsfyr, Bryn, Nydalen, Storo and other listed areas.
  - 42–125 m around Oslo S.
- **Real plans exceed the guideline:** at Økern syd, PBE calculated **>800% BRA** (fields 1–4), ~600% (field 5) and 278% (field 6), against a 125% guideline. The plan allows commercial buildings of 40–80 m [22].
- **Outer-city low-rise housing** (småhusplan) is around 22–24% BYA (snippet). This is a contrast only.

**Confidence:** high for the measures and plan status; medium for the area values (proposal, not adopted).

**Uncertainty:** an Oslo-wide table of typical office %BRA by zone does not exist. Real limits are set plan by plan.

## 6. Price index, labour rates and overtime

**Findings: price index**

SSB table 08650, building cost index for housing (*byggekostnadsindeks for boliger*), 2015 = 100 [24][25]:

| Period | Total | Labour | Materials |
|---|---|---|---|
| 2017 (annual average) | 105.2 | 104.0 | 106.2 |
| Year 2023 | 141.1 | | |
| Year 2024 | 146.4 | | |
| Year 2025 | 152.7 | 133.6 | 181.8 |
| September 2026 (+4.1% y/y) | 160.3 | | |

- **Factor 2017 → September 2026 = 160.3 / 105.2 = 1.524.**
- Factor 2023 → September 2026 = 1.136.
- SSB has **no** general index for office or commercial buildings. The only related series are plumbing in office and commercial buildings (08649) and roads (08662). The housing index is the standard proxy.

**Findings: labour rates**
- SSB table 11418, average monthly earnings in 2025 [27]:
  - Carpenters 48,020 NOK.
  - Building workers 49,140 NOK.
  - Electricians 54,460 NOK.
  - At 1,950 h/year, the carpenter figure is **≈295 NOK/h** in wages.
- Employer's social security contribution (zone I, 2026) is **14.1%** [28].
- The tariff minimum for a skilled worker in the building trades from 1 April 2025 is 264.32 NOK/h [29]. This comes from a search snippet; the PDF is a scan.
- No authoritative all-in contractor rate was found.
  - Employer cost ≈ wage × ~1.4 (social security contribution, holiday pay, pension, insurance) ≈ 415 NOK/h [ESTIMATE].
  - Charge-out rate including overheads and margin ≈ **650 NOK/h excl. VAT** [ESTIMATE]. Consumer-market figures of 450–850 NOK/h are low confidence.

**Findings: overtime**
- **aml § 10-6 (11): "Tillegget skal være minst 40 prosent."** [26]
- Caps: 10 h per 7 days, 25 h per 4 weeks, 200 h per 52 weeks (§ 10-6 (4)) [26].
- Tariffs commonly pay 50% / 100% [31].
- **Confirmed: the statutory minimum is 40%.**

**Confidence:** high for the index, wages, social security contribution and overtime law; low for the all-in rate.

## Cross-dimension insights

- **Plot zoning and the structural system interact through floors.** A central plot with a small footprint forces more floors. More floors make frame speed matter more (CLT or prefab saves 1 to 1.5 weeks per floor against cast-in-place) and make lifts and crane-wind risk relevant. That gives the game a real trade-off without needing precise costs.
- **Land dominates the cost difference between plots.** At 2,070 m² BRA, land costs ~72 MNOK centrally, ~41 MNOK in the inner city and ~17 MNOK in the outer tier. The building itself costs ~80 MNOK. The choice of structural system moves cost by only ~0–5% (≈0–4 MNOK). So the plot drives budget and the system drives schedule, which is a clean teaching message.

## Recommendations

1. **PRD (model rules):** use the parameter table below as the single source of numbers. Show [ESTIMATE] items to the player as "simplified assumption". Confidence: mixed, as flagged per row.
2. **Architecture:** keep all parameters in one data file with source IDs, so the group can swap in better figures (for example a current Norsk Prisbok) without code changes.
3. **Before release:** try to get one current broker land-value report or a Norsk Prisbok 2025/26 extract through the school library or a supervisor. These are the two weakest links (low confidence).

## Open questions

- Current office land values per m² BRA by Oslo zone. Needs broker reports (Akershus Eiendom, Newsec, Malling) or Eiendomsverdi.
- Current Norsk Prisbok / Holte office cost per m², and any split by structural system. Needs a paid source.
- Whether the 23 m² norm was revised after Statsbygg's October 2025 review. Check regjeringen.no or Statsbygg.
- Lift cost, and a sourced BRA/BTA ratio and floor-to-floor height for offices.
- The fellesoverenskomst rate [29] comes from a snippet only. Read the protocol text.

## Suggested parameter table for the model

All prices are NOK, excl. VAT (add 25% VAT if a gross figure is needed), at the 2026 level.

| # | Parameter | Value | Formula use | Source | Flag |
|---|---|---|---|---|---|
| P1 | Area per workplace | 23 m² BTA (range 20–25.5) | `BTA = 23 × workplaces` gives 2,300 m² | [1][2] | [SOURCED] |
| P2 | BRA share of BTA | 0.90 | `BRA = 0.9 × BTA` gives ≈2,070 m² | none found | [ESTIMATE] |
| P3 | Floor-to-floor height | 4.0 m | `height = floors × 4.0` (for checking max height) | none found | [ESTIMATE] |
| P4a | Land, plot A central (Bjørvika-type) | 35,000 per m² BRA | `land = P4 × BRA` gives ≈72 MNOK | [4][6][7] | [ESTIMATE] |
| P4b | Land, plot B inner city | 20,000 per m² BRA | gives ≈41 MNOK | [4][6] | [ESTIMATE] |
| P4c | Land, plot C outer (Økern/Groruddalen) | 8,000 per m² BRA | gives ≈17 MNOK | [4][6] | [ESTIMATE] |
| P5a | Zoning A | 400% BRA; max 28 m (7 floors); plot 600 m²; BYA ≤ 80% (≤480 m² footprint) | `BRA_max = plot × %BRA`; `floors ≤ floor(h_max / P3)` | form [18]; heights [20][21] | [ESTIMATE] (values), [SOURCED] (form) |
| P5b | Zoning B | 200% BRA; max 22 m (5 floors); plot 1,200 m²; BYA ≤ 50% (≤600 m²) | as above | [20] | [ESTIMATE] |
| P5c | Zoning C | 125% BRA; max 16 m (4 floors); plot 2,000 m²; BYA ≤ 40% (≤800 m²) | as above; 125% = KPA guideline | [20][22] | [ESTIMATE] |
| P6 | Construction cost (byggekostnad) | 35,000 per m² BTA (range 28,600–38,000) | `build = P6 × BTA × P7` gives ≈80 MNOK | [4][5][13][25] | [SOURCED] range, midpoint [ESTIMATE] |
| P6s | Cost split of contract cost | Common 13%, building 53%, HVAC 15%, electrical 11%, telecom 5%, other 3%; plus general costs +16% | distribute cost over WBS items | [4] | [SOURCED] (2017 shares) |
| P7 | Structural-system cost factor | Cast-in-place concrete 1.00 · precast/hollow-core 1.00 · steel + hollow-core 1.00 · CLT 1.05 | multiplies P6 | CLT +5% [9]; others none found | [ESTIMATE] |
| P8 | Height premium | 0% up to 15 floors; +10% above 15 floors | n/a in this game | [5] | [SOURCED] |
| P9 | Lift | Required if floors ≥ 2; ~1.5 MNOK per lift | add fixed cost | requirement [30]; cost none found | [SOURCED] requirement / [ESTIMATE] cost |
| P10 | Basement / parking per m² | 0.55 × P6 | `basement = 0.55 × P6 × m²` | derived from [5] | [ESTIMATE] |
| P11 | Total construction time (~2,300 m²) | 12 months (range 9–14) | base for the Gantt | [11][12][15] | [ESTIMATE] (anchored) |
| P12 | Frame time per floor (~600 m² plate) | Cast-in-place 2.0 wk · precast 1.0 wk · steel + hollow-core 1.0 wk · CLT 0.6 wk | `frame_weeks = floors × P12` | [10][16][17] | [ESTIMATE] (anchored) |
| P13 | Index 2017 to 2026 | × 1.524 (SSB 08650/08651, housing) | `price_2026 = price_2017 × 1.524` | [24][25] | [SOURCED] |
| P14 | Wage, carpenter | ≈295 NOK/h (48,020 per month) | base for overtime | [27] | [SOURCED] |
| P15 | All-in labour rate (charge-out) | 650 NOK/h | `labour = hours × 650` | derived from [27][28] | [ESTIMATE] |
| P16 | Overtime premium | ≥ 40% of wage (law); use +50% in-game (tariff practice) | `OT_hour = 650 + 0.5 × 295` ≈ 800, or simply 1.25 × P15 | [26][31] | [SOURCED] |
| P17 | Overtime caps | 10 h/week, 25 h/4 weeks, 200 h/year | warning rule | [26] | [SOURCED] |

Worked example (plot B, steel, 5 floors × ~460 m² footprint ≈ 2,300 m² BTA):
- Land 20,000 × 2,070 ≈ **41 MNOK**.
- Building 35,000 × 2,300 × 1.00 ≈ **80.5 MNOK**.
- Lift +1.5 MNOK.
- Total ≈ **123 MNOK excl. VAT**.
- Frame 5 × 1.0 = 5 weeks, within ~12 months in total.

## Source appendix

| # | Claim/finding it supports | Publisher | Pub date | Accessed | Confidence |
|---|---|---|---|---|---|
| [1] | State office area norm 23 m² BTA, upper limit | [KMD, rundskriv H-2/16](https://www.regjeringen.no/no/dokumenter/rundskriv-om-normer-for-energi--og-arealbruk-for-statlige-bygg/id2474498/) | 2015-12-17 | 2026-10-31 | high |
| [2] | State average 25.5 m²/employee; 19.7 m² via Statsbygg; norm review | [DFD/Statsbygg, Statens lokaler 2024](https://www.regjeringen.no/contentassets/5cef510093144705822eddbe4f38e2f6/statens-lokaler-2024.pdf) | 2025 | 2026-10-31 | high |
| [3] | 27.8 m² (2023), target 18 m² | [Altinget](https://www.altinget.no/artikkel/statsbygg-vil-spare-milliarder-paa-mindre-lokaler-18-kvadratmeter-er-romslig) | 2024-05-08 | 2026-10-31 | medium |
| [4] | Norsk Prisbok 2017 office cost breakdown; Oslo land burden | [TU (Teknisk Ukeblad)](https://www.tu.no/artikler/hva-koster-det-a-oppfore-et-typisk-kontorbygg-br/441201) | 2018-06-30 | 2026-10-31 | medium |
| [5] | Bygganalyse office calculation 733 MNOK; 44% building body; +10% for >15 floors | [Estate Nyheter / Bygganalyse](https://www.estatenyheter.no/aktuelt-pluss/her-er-regnestykket-sa-mye-koster-et-nytt-kontorbygg/392971) | 2023-11-13 | 2026-10-31 | medium |
| [6] | Residential land values Bjørvika / Nydalen / Bryn | [Akershus Eiendom (via NEF)](https://nef.no/wp-content/uploads/2019/03/Ragnar-Eggen_AkershusE_Boligpres-25mars19-RE.pdf) | 2019-03-26 | 2026-10-31 | medium |
| [7] | Mariakvartalet document duty ≈715 NOK/m² BRA | [Røisland & Co (sales document)](https://osu.no/uploads/Salgsoppgave-Mariakvartalet-05.03.24.pdf) | 2024-03-05 | 2026-10-31 | low |
| [8] | Oslo single-family plot price 13,375 NOK per m² of plot | [Samfunnsøkonomisk analyse for KDD](https://www.regjeringen.no/contentassets/b84e8453f33444eb85bc3344108483fa/utredning-om-tomteprisfastsettelse-og-sammenhenger-mellom-priser-og-kostnader-i-boligbygging_rapport-34-2022-soa.pdf) | 2022 | 2026-10-31 | low |
| [9] | Valle Wood CLT ~5% dearer than steel/concrete | [TU](https://www.tu.no/artikler/ncc-er-snart-ferdig-med-norges-storste-kontorbygg-i-massivtre-se-bildene-br/448460) | ~2018 | 2026-10-31 | low |
| [10] | CLT 9-storey frame in 5 weeks; about half of concrete time | [TU](https://www.tu.no/artikler/boligblokk-i-tre-tok-halvparten-sa-lang-tid-a-bygge-som-naboblokka-i-betong/276082) | 2015-11-02 | 2026-10-31 | medium |
| [11] | Stamas ≈7,000 m², precast/steel, ~9 months, 125 MNOK | [Byggeindustrien 13-2025](https://www.bygg.no/files/2025/09/01/Stamas%20Solutions%20NY.pdf) | 2025 | 2026-10-31 | high |
| [12] | Norva24 4,911 m², steel + hollow-core, ~11 months, 76 MNOK | [Byggeindustrien 9-2026](https://www.bygg.no/files/2026/06/01/Norva24.pdf) | 2026 | 2026-10-31 | high |
| [13] | Kongsberg Maritime 5,563 m², ~193 MNOK project cost | [Byggeindustrien](https://www.bygg.no/files/2024/09/09/Kongsberg_Maritime.pdf) | 2024 | 2026-10-31 | medium |
| [14] | Elvebredden 11,000 m², ~2 years | [Byggeindustrien](https://www.bygg.no/files/2025/06/25/Elvebredden.pdf) | 2025 | 2026-10-31 | low |
| [15] | Lagårdsveien 100: 4,500 m², 8 floors, ~20 months | [Produktfakta](https://www.produktfakta.no/lagaardsveien-100/prosjekt.html) | 2024–25 | 2026-10-31 | low |
| [16] | Cast-in-place ~1 floor per 7 days; mass timber up to 1 per day | [MarketScale](https://www.marketscale.com/industries/architecture-and-design/mass-timber-can-cut-weeks-off-schedules-but-insurance-and-keeping-it-dry-decide-who-wins.md) | ~2025 | 2026-10-31 | low |
| [17] | Cast-in-place slower, so prefab is often chosen | [TU](https://www.tu.no/artikler/skal-effektivisere-plasstoping-av-betong/442416) | ~2018 | 2026-10-31 | medium |
| [18] | Guide H-2300, measurement rules for BYA/BRA | [KMD](https://www.regjeringen.no/no/dokumenter/grad-av-utnytting/id749790/) | 2014-01-23 | 2026-10-31 | high |
| [19] | Oslo KPA 2015 in force; revision not adopted | [Oslo kommune](https://www.oslo.kommune.no/politikk/kommuneplan/kommuneplanens-arealdel/) | 2026 | 2026-10-31 | high |
| [20] | Proposed U-categories: heights and 100–125% utilisation | [Oslo kommune](https://www.oslo.kommune.no/politikk/kommuneplan/kommuneplanens-arealdel/utviklingsomrader/) | 2026 | 2026-10-31 | medium |
| [21] | High-rise strategy: >42 m; 42–70 m / 42–125 m zones | [Oslo kommune](https://www.oslo.kommune.no/slik-bygger-vi-oslo/hoyhus-i-oslo-strategi-for-barekraftige-hoyhus/) | 2023-09 | 2026-10-31 | medium |
| [22] | Økern syd at 278–800% BRA vs 125% guideline | [Groruddalen Miljøforum (citing PBE)](https://groruddalen.no/wp-content/uploads/2024/04/Selma-Ellefsens-vei-15-Planprogram-og-detaljregulering-16042023.pdf) | 2023-04-16 | 2026-10-31 | medium |
| [23] | Height as kotehøyde or metres, not number of floors | [Miljøverndepartementet T-1205](https://cms12.regjeringen.no/contentassets/20503ddfe0664fac9e2185c1a6c80716/t_1205.pdf) | 1997 | 2026-10-31 | medium |
| [24] | Building cost index for housing, annual 2017–2025 | [SSB table 08650](https://www.ssb.no/statbank/table/08650) | 2026-01-13 | 2026-10-31 | high |
| [25] | Building cost index for housing, September 2026 = 160.3 | [SSB table 08651](https://www.ssb.no/statbank/table/08651) | 2026-10-13 | 2026-10-31 | high |
| [26] | Overtime supplement ≥40%; caps | [Lovdata, aml § 10-6](https://lovdata.no/lov/2005-06-17-62/§10-6) | current | 2026-10-31 | high |
| [27] | Average monthly earnings by occupation 2025 | [SSB table 11418](https://www.ssb.no/statbank/table/11418) | 2026 | 2026-10-31 | high |
| [28] | Employer's social security contribution, zone I, 14.1% | [Skatteetaten](https://www.skatteetaten.no/satser/arbeidsgiveravgift/) | 2026 | 2026-10-31 | high |
| [29] | Tariff minimum for skilled workers 264.32 NOK/h | [Fellesforbundet](https://www.fellesforbundet.no/globalassets/lonn-og-tariffsaker/tariffavtaler/overenskomster-2024-2026/protokoll-mellomoppgoret-2025-fellesoverenskomsten-for-byggfag.pdf) | 2025-04-29 | 2026-10-31 | low |
| [30] | Lift required in work buildings with 2+ floors | [DiBK, TEK17 § 12-3](https://www.dibk.no/regelverk/byggteknisk-forskrift-tek17/12/i/12-3) | current | 2026-10-31 | high |
| [31] | Tariff overtime commonly 50% / 100% | [Virke](https://www.virke.no/arbeidsgiverstotte/arbeidstid-overtid/overtid) | n/a | 2026-10-31 | medium |

## Staleness map

These dates were computed with `recon_kit.py staleness`. Quantitative claims use a 36-month window. Regulatory claims use a 6-month window, and the pack says to re-verify them on every use.

| Claim | Pub | Re-check by | Stale |
|---|---|---|---|
| [4] Norsk Prisbok 2017 cost / land burden | 2018-06 | 2021-06 | **yes** |
| [6] Akershus Eiendom land values | 2019-03 | 2022-03 | **yes** |
| [1]/[2] 23 m² norm (under review) | 2025-06 | 2025-12 | **yes** |
| [28] Social security contribution 14.1% | 2026-01 | 2026-07 | yes (rate is for 2026; re-check in January 2027) |
| [5] Bygganalyse office cost | 2023-11 | 2026-11 | due now |
| [26] aml § 10-6 | 2026-10 | 2027-04 | no |
| [19]/[20] Oslo KPA status | 2026-10 | 2027-04 | no |
| [27] SSB wages | 2026-02 | 2029-02 | no |
| [11]/[12] Project durations | 2026-06 | 2029-06 | no |
| [25] SSB index | 2026-10 | 2029-10 (update the factor yearly) | no |

The earliest re-check date has already passed (2021-06, the Norsk Prisbok 2017 data). The two land and cost anchors from 2017–2019 are the first things to refresh.
