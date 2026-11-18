---
title: "AI-styrt simulering av prosjektledelse (byggeprosjekt)"
status: draft
created: 2026-09-17
updated: 2026-10-22
---

# Product Brief: AI-styrt simulering av prosjektledelse (byggeprosjekt)

## Executive Summary

This is a web application, built for the IBE160 course (Høgskolen i Molde), that simulates the planning and execution of a construction project. The student takes the role of project manager and makes the real decisions — planning strategy, risk response, resource allocation, change approval — while an AI advisor analyzes each situation and recommends an action. After the student decides, the simulation forks and runs both paths forward from the same state: what actually happened from the student's choice, and what would have happened had they followed the AI's recommendation. Seeing those two outcomes side by side, at every decision point through to project completion, is the core teaching mechanic — closer to a flight-simulator debrief against an expert benchmark than to a conventional PM training tool.

Scenarios are generated through a hybrid approach: a template/library layer builds a coherent skeleton (WBS, resources, cost/time baseline, milestones) from chosen parameters, while an LLM layer adds narrative flavor and occasional novel risk events, so every playthrough is different without losing structural coherence. This pairing of a genuinely AI-generated recommendation with a genuinely simulated counterfactual outcome has no clear precedent in either commercial AI-PM tools or academic construction simulators, making the comparison mechanic itself the project's real contribution. The team built it with no prior construction or PM domain expertise, on assignment terms set by the course instructor.

## The Problem

Project management education typically teaches planning tools (Gantt charts, WBS, risk registers) as static artifacts to fill in correctly, not as a decision-making practice under uncertainty. Students learn *what* a schedule or risk register looks like, but rarely *how* a plan actually breaks — how a resource conflict cascades into schedule slip, how a change request forces tradeoffs between cost and time, how a risk event that seemed minor compounds into a milestone miss. Real project management judgment is built by making decisions, watching them play out, and comparing them against a better-informed alternative — something a textbook or a static spreadsheet exercise can't provide.

At the same time, AI decision-support tools are becoming part of how real project managers work — but students have little structured exposure to what it looks like to make a decision with AI-generated analysis in front of them, weigh it against their own judgment, and see which one held up.

## The Solution

A web application where the student takes the role of project manager on a simulated construction project. Each scenario is assembled through a hybrid approach: a template/library layer provides a coherent skeleton — WBS, resources, cost/time baseline, milestones — parameterized by project size, budget, and risk profile, while an LLM layer adds narrative detail, flavor, and occasional novel risk events on top, so no two playthroughs feel identical while staying structurally sound.

The core loop repeats at each decision point (planning strategy, risk response, resource allocation, change approval), through to project completion:

1. The simulation presents a situation — a schedule state, a resource conflict, an incoming change request, a risk event.
2. An AI advisor analyzes the situation and recommends an action, showing its reasoning and the consequences it projects.
3. The student makes their own decision — which may agree with or diverge from the AI's recommendation.
4. The simulation engine runs forward twice from the same state: once along the student's choice, once along the AI's recommendation — producing two real, computed outcomes (schedule, cost forecast, risk exposure) shown side by side.

That side-by-side comparison is the teaching mechanic: the student doesn't just see the outcome of their decision — they see it against a genuinely simulated benchmark and learn from where the two diverge. This requires the simulation engine to support deterministic, replayable state — forking forward from a decision point rather than only advancing linearly.

## Who This Serves

**Primary: the student playing project manager.** Someone building intuition for PM decision-making under uncertainty — likely with limited real construction or PM experience themselves — who learns fastest by acting, seeing consequences, and comparing their judgment against a reasoned alternative rather than by reading theory.

**Secondary: the course instructor, as evaluator.** Needs the application to reliably demonstrate the intended learning mechanic (decision → consequence → comparison) end-to-end, with scenarios varied enough to show it isn't a single scripted path.

There is no broader audience for this version — it is not intended for use by other students or the public.

## What Makes This Different

This is not a market product competing for adoption — it's an assignment-scoped build — so the differentiation that matters is pedagogical honesty, not a competitive moat.

- **The comparison mechanic is a genuine gap, not just a course exercise.** Existing AI project-management tools (e.g. Microsoft Project Copilot) analyze risk and recommend actions, but they optimize the live plan going forward — they don't show the student a computed side-by-side of "what you chose" vs. "what the AI would have done," run forward from the same state.
- **There is academic precedent for the structure, not the AI layer.** The Virtual Construction Simulator (VCS3, Penn State/Reading) already does plan → simulate → compare as-built vs. as-planned. This project's contribution is replacing the fixed as-planned baseline with an AI-generated, reasoned recommendation as the comparison point — closer to a flight- or medical-simulator "debrief against an expert benchmark," generalized with an LLM as the benchmark generator.

## Success Criteria

_No formal grading rubric exists from the instructor, but the working application itself is what's graded (per course requirements) — the criteria below are the team's own best read of "done," not instructor-verified requirements._

- A student can complete a full playthrough — from scenario start to project completion — encountering all four decision types (planning strategy, risk response, resource allocation, change approval) at least once.
- At each decision point, the AI advisor produces a legible recommendation with visible reasoning, and the simulation computes and displays both the student's actual outcome and the AI's counterfactual outcome from the same forked state, without manual intervention.
- Two playthroughs with the same input parameters (size, budget, risk profile) produce recognizably different scenarios (different flavor/risk events from the LLM layer) while remaining internally coherent (budget matches scope, risks fit project type).
- Outputs — Gantt schedule, cost forecast, risk exposure, scenario results, recommended actions — are all present and update correctly after each decision.
- The application runs end-to-end as a working web app the instructor can open and play through unassisted.

## Scope

**In (first version):**
- Single-player web app; no accounts or persistent history required by default *(see open question below)*.
- One domain: construction projects only *(see open question below)*.
- Scenario generation: template/library skeleton (WBS, resources, cost/time baseline, milestones) parameterized by size/budget/risk profile, with LLM-generated narrative flavor and occasional novel risk events layered on top.
- All four decision points implemented: planning strategy, risk response, resource allocation, change approval.
- The full counterfactual loop: AI recommendation → student decision → dual-simulated outcomes (student's path and AI's path, both forward-simulated from the same forked state) → side-by-side comparison.
- All five output types: Gantt schedule, cost forecast, risk exposure, scenario results, recommended actions — kept simple enough to compute and render reliably, not enterprise-grade.
- A single playthrough runs start to finish (project completion).

**Out (first version):**
- Multiplayer or negotiation features (no multi-role negotiation play, in the style of tools like Virtual Construction Negotiation).
- Compliance with real scheduling interchange formats (MSPDI, XER, PMXML) — a custom lightweight schema, informed by PMI's WBS/RBS practice standards, is enough.
- Multiple simultaneous scenario sizes/complexity tiers as a user-facing choice beyond the parameters that drive generation.
- Analytics or comparison across multiple past playthroughs.
- Domain realism guaranteed beyond what research supports — the team has no lived construction/PM expertise, so scenario and advisor realism is bounded by research quality (PMI standards, VCS3 precedent), not judgment calls.

**Open questions (deferred, not yet decided):**
- **Save/resume:** does a playthrough need to support pausing and resuming across sessions, or is a single continuous session sufficient? A full playthrough's length is untested.
- **Domain exclusivity:** is construction confirmed as the only domain for v1, or could the instructor expect a more generic "any project type" simulator? Worth a quick check against the assignment brief or instructor before build.

## Vision

If the core loop works well for construction, the same pattern — AI recommendation, human decision, dual-simulated comparison — generalizes to other decision-training domains where judgment is learned by doing and debriefing: software delivery, healthcare operations, disaster response planning. For this project, though, the goal is a working, demonstrable proof of that pattern in one domain, built to a semester's scope, not a platform.

## Appendix A: Simulation scenario – Regjeringskvartalet Light

_Added 2026-10-22 after the instructor feedback (`tilbakemelding-product-brief.md`)._


The fixed, hand-made scenario for the minimum version (see the instructor's feedback, `tilbakemelding-product-brief.md`). It is a scaled-down version of Phase 1 (byggetrinn 1) of the new Government Quarter in Oslo. The real project had a cost frame of NOK 24.7 billion. Ours is **one office block and a two-level parking basement**, at about NOK 283 million.

> **Ownership:** the structure and the budget proportions come from public sources (listed at the end). The **durations, multipliers and risk impacts are proposals**. The team must review and approve or change every number before this goes into the PRD.

### 1. The project

| | |
|---|---|
| Building | Office block, 7 floors, about 11,000 m² gross floor area (BTA) |
| Basement | 2 levels of parking, about 4,000 m² BTA (about 100 spaces) |
| Total | 15,000 m² BTA, the same size as the Norsk prisbok 2017 reference office building |
| Client | "Statsbygg" (fictional role in the game) |
| Price level | 2017 prices, NOK excluding VAT (VAT is left out for simplicity) |
| Baseline | **114 weeks, NOK 283.1 million** |

**Simplification:** the real basement under the Government Quarter is mainly logistics and technical space. Very little of it is parking. We use parking because it makes the scenario easier to understand.

### 2. Budget: the biggest cost items

The proportions follow the Norsk prisbok 2017 calculation for a 15,000 m² office building with a basement (TU, 2018), per m² BTA:

| Cost item (NS 3453 group) | NOK/m² | Share of building cost | × 15,000 m² ≈ | In the scenario |
|---|---|---|---|---|
| Building (bygning: groundwork, structure, facade, interior) | 8,618 | 53 % | 129 MNOK | 129 MNOK (C, D, E, F, G, K) |
| Plumbing and HVAC (VVS) | 2,474 | 15 % | 37 MNOK | 37 MNOK (H, L) |
| Site overheads (felleskostnader: site setup and running) | 2,038 | 13 % | 31 MNOK | part of the weekly site overhead |
| Electrical power (elkraft) | 1,741 | 11 % | 26 MNOK | 26 MNOK (I) |
| Telecom and automation (tele og automatisering) | 867 | 5 % | 13 MNOK | 13 MNOK (J) |
| Other installations, lifts (andre installasjoner) | 440 | 3 % | 7 MNOK | 7 MNOK (O) |
| General costs: design, administration (generelle kostnader) | 2,610 | – | 39 MNOK | 25 MNOK design (A), 2 MNOK handover (N), 12 MNOK in the site overhead |

**The three biggest items are the building work (53 %), plumbing and HVAC (15 %) and site overheads (13 %).** In the real project, the basement (Veidekke, NOK 2.1 billion) and the building automation contract (Gk, NOK 243 million) were among the largest single contracts.

**Site overhead (rigg og drift):** 31 + 12 = 43 MNOK spread over the construction phase. That gives **0.45 MNOK per week, from week 16 until the project is finished**. This is how delays cost money: every extra week adds 0.45 MNOK.

### 3. Tasks (WBS)

Every task can start only when all of its predecessors have finished. Cost per week = total cost / duration.

| ID | Task | Predecessors | Weeks | MNOK | MNOK/week | Start–finish (baseline) |
|---|---|---|---|---|---|---|
| A | Design and building permit | – | 16 | 25 | 1.5625 | 0–16 |
| C | Blasting and excavation of the construction pit | A | 12 | 14 | 1.1667 | 16–28 |
| D | Foundations and sheet piling | C | 8 | 10 | 1.25 | 28–36 |
| E | Basement structure (concrete, 2 levels) | D | 14 | 22 | 1.5714 | 36–50 |
| F | Office structure (frame, floor slabs, 7 floors) | E | 20 | 35 | 1.75 | 50–70 |
| L | Basement fit-out (ventilation, sprinklers, ramps) | E | 10 | 5 | 0.5 | 50–60 |
| G | Roof and facade (weathertight building) | F | 14 | 28 | 2.0 | 70–84 |
| O | Lifts | F | 8 | 7 | 0.875 | 70–78 |
| H | Plumbing and HVAC | G | 18 | 32 | 1.7778 | 84–102 |
| I | Electrical power | G | 16 | 26 | 1.625 | 84–100 |
| K | Interior work (walls, ceilings, floors) | G | 16 | 20 | 1.25 | 84–100 |
| J | Telecom and building automation | I | 10 | 13 | 1.3 | 100–110 |
| N | Commissioning and handover | H, J, K, L, O | 4 | 2 | 0.5 | 110–114 |

- **Critical path:** A → C → D → E → F → G → I → J → N = **114 weeks**.
- **Slack (float):** H 8 weeks, K 10 weeks, O 32 weeks, L 50 weeks.
- **Cost:** tasks 239 MNOK + site overhead 98 weeks × 0.45 = 44.1 MNOK = **283.1 MNOK**.

### 3b. Labour: hours and crews per discipline

Each task's cost is split into **labour** (hours × hourly rate) and **materials/equipment** (fixed). The number of hours is the task's work content and does not change. A decision only changes how many people do the work, how many hours a week they work, and what each hour costs.

Assumptions (proposals):
- Normal working week: **37.5 hours**.
- Hourly rate in 2017 prices, all-in cost to the contractor: **NOK 600/h** for trades, **NOK 1,000/h** for engineers (A, N).
- Hours = crew × weeks × 37.5. The crews are chosen so that labour share of cost looks plausible per discipline: low for groundwork and lifts (machines and equipment), high for interior work and design.

| ID | Discipline | Crew (normal) | Weeks | Hours | NOK/h | Labour MNOK | Materials/equipment MNOK | Total MNOK | Labour share |
|---|---|---|---|---|---|---|---|---|---|
| A | Design and permit | 36 engineers | 16 | 21,600 | 1,000 | 21.60 | 3.40 | 25 | 86 % |
| C | Blasting and excavation | 14 | 12 | 6,300 | 600 | 3.78 | 10.22 | 14 | 27 % |
| D | Foundations and sheet piling | 16 | 8 | 4,800 | 600 | 2.88 | 7.12 | 10 | 29 % |
| E | Basement structure | 30 | 14 | 15,750 | 600 | 9.45 | 12.55 | 22 | 43 % |
| F | Office structure | 34 | 20 | 25,500 | 600 | 15.30 | 19.70 | 35 | 44 % |
| L | Basement fit-out | 8 | 10 | 3,000 | 600 | 1.80 | 3.20 | 5 | 36 % |
| G | Roof and facade | 30 | 14 | 15,750 | 600 | 9.45 | 18.55 | 28 | 34 % |
| O | Lifts | 6 | 8 | 1,800 | 600 | 1.08 | 5.92 | 7 | 15 % |
| H | Plumbing and HVAC | 32 | 18 | 21,600 | 600 | 12.96 | 19.04 | 32 | 41 % |
| I | Electrical power | 32 | 16 | 19,200 | 600 | 11.52 | 14.48 | 26 | 44 % |
| K | Interior work | 30 | 16 | 18,000 | 600 | 10.80 | 9.20 | 20 | 54 % |
| J | Telecom and building automation | 18 | 10 | 6,750 | 600 | 4.05 | 8.95 | 13 | 31 % |
| N | Commissioning and handover | 10 engineers | 4 | 1,500 | 1,000 | 1.50 | 0.50 | 2 | 75 % |
| | **Total** | | | **161,550** | | **106.17** | **132.83** | **239** | **44 %** |

- Construction work (excluding A and N) is 138,450 hours, about 9.2 hours per m². Labour on site is about 34 % of the building cost, which is in a plausible range, but neither figure has been checked against a source.
- Peak staffing: weeks 84–100, with H + I + K = **94 workers** on site.

#### Cost factors

| Mode | Who works | Hours per week | Cost factor on those hours |
|---|---|---|---|
| Normal | Own crew | 37.5 | **1.0** |
| Overtime | Own crew | 45 (37.5 normal + 7.5 overtime) | **1.3** on the overtime hours |
| Extra hire | Own crew + 50 % more hired workers (rounded up) | 37.5 | **1.5** on the hired workers' hours |

Calculation rules:
- Duration = ⌈hours / (workers × hours per week)⌉, rounded up to whole weeks.
- Labour cost = sum of (hours × rate × factor). Labour is paid only for the task's actual hours. The rounding up only affects the schedule.
- Overtime: 7.5 of 45 hours are overtime, so 1/6 of the hours cost 1.3. **Labour × 1.05.**
- Extra hire: with N own workers and h = ⌈N/2⌉ hired, the hired share of hours is h/(N+h). With an even N this gives 1/3 of the hours at 1.5. **Labour × 1.1667.**
- Materials and equipment cost the same in every mode.

### 4. Risks

Whether each risk happens is decided once, from the scenario's seed, when the game starts. Both branches of a fork therefore face the same events. A risk adds its delay to the task's duration and its cost as a fixed amount. The task's weekly rate is not charged for the extra weeks, but the site overhead is (because the project takes longer).

| ID | Risk | Task | Delay | Cost | Basis |
|---|---|---|---|---|---|
| R1 | Weathered rock, new foundations needed | D | +4 weeks | +6 MNOK | Really happened under Høyblokka (TU) |
| R2 | Contaminated soil in the construction pit | C | +3 weeks | +4 MNOK | Common in central Oslo (generic) |
| R3 | Late delivery of facade elements | G | +4 weeks | +3 MNOK | Generic supplier risk |
| R4 | Shortage of electricians | I | +3 weeks | +2 MNOK | Generic resource risk |
| R5 | Integration problems in the building automation | J | +2 weeks | +1.5 MNOK | Building automation was a large, complex contract (Gk) |

### 5. Decision points (minimum version: 2 decision types)

| # | Week | Type | Situation |
|---|---|---|---|
| DP1 | 16 | Risk response | Ground surveys point to possible weathered rock (R1) |
| DP2 | 50 | Resource allocation | The office structure (F) is about to start, on the critical path |
| DP3 | 70 | Risk response | The facade supplier reports a capacity problem (R3) |
| DP4 | 84 | Resource allocation | Plumbing/HVAC (H) or electrical (I): where should the extra crew go? |

The four risk-response options use the rules in the simulation model (accept, mitigate, transfer, avoid). The prices for each risk are set per decision point. R1's prices are in example 3.

### 6. Worked examples (with answers)

Rules used: the cost factors and calculation rules in section 3b. All amounts are in MNOK.

#### Example 1 – DP2: overtime or extra hire on F (critical path)

F: 25,500 hours, 34 own workers, labour 15.30, materials 19.70.

| Option | Workers × h/week | F weeks | F labour | Project weeks | Site overhead | Total | Δ vs. baseline |
|---|---|---|---|---|---|---|---|
| Normal | 34 × 37.5 | 20 | 15.300 | 114 | 98 × 0.45 = 44.10 | 283.100 | – |
| Overtime | 34 × 45 | ⌈16.67⌉ = 17 | 15.30 × 1.05 = 16.065 | 111 | 95 × 0.45 = 42.75 | 282.515 | −0.585, −3 weeks |
| Extra hire | (34 + 17) × 37.5 | ⌈13.33⌉ = 14 | 15.30 × 1.1667 = 17.850 | 108 | 92 × 0.45 = 41.40 | 282.950 | −0.150, −6 weeks |

Teaching point: on the critical path, speeding up pays for itself, because each week saved saves 0.45 in site overhead. Overtime is the cheapest option and extra hire is the fastest. That is a real trade-off for the student and the AI to weigh.

#### Example 2 – DP4: speed up H (not on the critical path) or I (on it)

H: 21,600 hours, 32 workers, labour 12.96, 8 weeks of slack. I: 19,200 hours, 32 workers, labour 11.52.

| Option | Task weeks | Labour | New finish | Project weeks | Total | Δ |
|---|---|---|---|---|---|---|
| H overtime | 21,600 / (32 × 45) = 15 | 13.608 (+0.648) | H week 99 | 114 | 283.748 | +0.648, 0 weeks |
| H extra hire | 21,600 / (48 × 37.5) = 12 | 15.120 (+2.160) | H week 96 | 114 | 285.260 | +2.160, 0 weeks |
| I overtime | ⌈19,200 / (32 × 45)⌉ = ⌈13.33⌉ = 14 | 12.096 (+0.576) | I week 98, J week 108 | 112 | 282.776 | −0.324, −2 weeks |
| I extra hire | ⌈19,200 / (48 × 37.5)⌉ = ⌈10.67⌉ = 11 | 13.440 (+1.920) | I week 95, J week 105 | 109 | 282.770 | −0.330, −5 weeks |

How the totals are worked out:
- H rows: 283.1 + the extra labour. N still waits for J in week 110, so the site overhead doesn't change.
- I overtime: 283.1 + 0.576 − 2 × 0.45.
- I extra hire: 283.1 + 1.920 − 5 × 0.45.

Teaching points:
- Speeding up a task that isn't on the critical path costs money and gains no time.
- With extra hire on I, H (finishing in week 102) has only 3 weeks of slack left before N (starting in week 105). One more acceleration of I/J would move the critical path over to H.

#### Example 3 – DP1: risk response to R1 (weathered rock, D)

Proposed prices: Mitigate = extra ground surveys, 1.5 MNOK, impact halved (+2 weeks, +3 MNOK). Transfer = insurance, 2.5 MNOK, covers the cost but not the delay. Avoid = switch to a pile foundation, D +2 weeks and +1 MNOK, and the risk is removed.

**If R1 happens:**

| Option | Upfront cost | Impact | Project weeks | Site overhead | Total | Δ |
|---|---|---|---|---|---|---|
| Accept | 0 | +4 weeks, +6 | 118 | 102 × 0.45 = 45.9 | 290.9 | +7.8 |
| Mitigate | 1.5 | +2 weeks, +3 | 116 | 100 × 0.45 = 45.0 | 288.5 | +5.4 |
| Transfer | 2.5 | +4 weeks, 0 | 118 | 45.9 | 287.4 | +4.3 |
| Avoid | 1.0 | +2 weeks (redesign), no risk | 116 | 45.0 | 285.0 | +1.9 |

**If R1 does not happen:** Accept 283.1 / 114 weeks · Mitigate 284.6 / 114 · Transfer 285.6 / 114 · Avoid 285.0 / 116.

Teaching point: Transfer covers the cost but not the time, and time costs site overhead. Avoid is the best option if the risk happens and the worst on schedule if it doesn't. That makes the student's choice against the AI's choice interesting to compare.

### 7. For the team to decide

1. Are the durations reasonable? The total of about 2.2 years for 15,000 m² is a rough estimate, not checked against a source.
2. Should we index the 2017 prices to 2026 prices, or is that unnecessary for teaching purposes?
3. The rule that **a delay costs site overhead but not the task's weekly rate** is a decision for the simulation model. Confirm it.
4. The prices for mitigate, transfer and avoid for R2–R5.
5. Should R2–R5 happen or not in the fixed demo seed?
6. **Overtime factor and Norwegian law:** the Working Environment Act (arbeidsmiljøloven § 10-6) requires an overtime supplement of at least 40 %, so 1.3 is below the legal minimum. 1.4 would be realistic. The act also limits overtime to 25 hours per 4 weeks unless there is a written agreement with the employee representatives. 7.5 hours a week is 30 hours per 4 weeks, so the scenario assumes such an agreement.
7. Should overtime and hired workers be **less productive** (tiredness, learning time)? If not, speeding up the critical path almost always pays off, as in example 1, and the AI will nearly always recommend it. A factor such as "hired workers are 80 % as productive" would make the choice harder.
8. Should extra hire always be +50 %, or should the student choose how many workers to hire?
9. The crew sizes and hourly rates in 3b are estimates and have not been checked against a source.

### Sources

- Phase 1 cost frame NOK 24.7 bn, opened 13 April 2026: [Bygg.no / Byggeindustrien](https://www.bygg.no/files/2026/04/27/Nytt%20Regjeringskvartal.pdf), [Wikipedia](https://en.wikipedia.org/wiki/Regjeringskvartalet)
- Original frame NOK 20.5 bn, quality assurance estimate NOK 24.1 bn: [regjeringen.no](https://www.regjeringen.no/no/aktuelt/regjeringa-foreslar-a-starte-bygginga-av-nytt-regjeringskvartal/id2769242/)
- Basement contract NOK 2.1 bn (Veidekke, 2 levels, about 15,000 m²): [Veidekke](https://www.veidekke.com/investor-relations/company-disclosures/nok-2.1-billion-contract-in-the-government-quarter)
- Building automation NOK 243 million (Gk): [Security World Market](https://www.securityworldmarket.com/no/Nyheter/Bedriftsnyheter/gk-leverer-byggautomasjon-til-nye-regjeringskvartalet1)
- Weathered rock under Høyblokka: [TU](https://www.tu.no/artikler/fjellet-under-hoyblokka-var-forvitret-bygget-har-fatt-ny-fundamentering/511467)
- Cost breakdown for an office building (Norsk prisbok 2017): [TU](https://www.tu.no/artikler/hva-koster-det-a-oppfore-et-typisk-kontorbygg-br/441201)
