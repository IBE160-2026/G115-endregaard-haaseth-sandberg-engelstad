---
title: "Addendum: PRD Fra tomt til tak"
status: draft
created: 2026-10-31
updated: 2026-10-31
---

# Addendum: PRD Fra tomt til tak

Detail that supports the PRD but does not belong in its requirements. Sources are the IDs in the two research reports:
- **[R1]** `../../research/research-fra-tomt-til-tak-2026-10-31/research.md` (parameters P1–P17)
- **[R2]** `../../research/research-referanseprosjekter-2026-10-31/research.md` (reference values V1–V12, events E1–E10)

## 1. The adviser's method: reference class forecasting

The adviser judges the student's schedule estimate the way experienced planners do: by what comparable projects actually took, not by how the plan looks on paper. This is known as reference class forecasting, described by Bent Flyvbjerg as the remedy for optimism bias in project estimates.

Why it fits the product:
- It answers Sara's question directly. Buildings run on average 32 % over schedule and 62 % over cost, and 7 of 10 overrun (V11, [R2]).
- It is real Oslo practice. Oslobygg's 2025 form for documenting enough construction time asks the client to list comparable projects ([R2]).
- It keeps the adviser honest. It can only cite what is listed with a source.

How the adviser phrases a citation: project name, the figure, and the year of the source (see [R2] §D). For example: "Statens hus Nordfjordeid (1,880 m², steel and hollow-core slabs) took about 11 months to build." When no real project exists for the chosen structural system (cast-in-place concrete), the adviser describes the reference generically and gives the source of the figure.

## 2. Reference projects the adviser may cite

| Project | Place | Size | Structural system | Construction time | Use |
|---|---|---|---|---|---|
| Statens hus Nordfjordeid | Nordfjordeid | 1,880 m² BRA, 3 floors | Steel and hollow-core slabs | about 11 months | Best comparable for the whole project |
| Elvebredden | Kongsvinger | 11,000 m² | Steel and precast | about 2 years; frame about 3 weeks per 1,400 m² floor | Frame time; phase shares |
| Valle Wood | Oslo | 6,700 m², 7 floors | Timber (CLT) | 2017 to summer 2019, a few months late (the crane had to hold beams until bolted) | Timber frame; estimate overrun |
| HasleTre | Oslo | 2,655 m², 5 floors | Timber (CLT) | completed 2023, duration not published | Size and system only |
| Lumber 5 | Kristiansand | about 6,600 m², 7 floors | Timber (CLT) | about 16 months planned (March 2025 to summer 2026) | Timber, total time (planned) |
| Youngs gate 2–4 | Oslo | about 2,700 m² | not stated | about 21 months planned | Upper anchor for a central plot (planned, not actual) |

Full details and sources are in [R2] §A. No completed cast-in-place concrete office of this size with a published construction time was found.

## 3. Main parts and reference shares

| Main part | Reference | Source |
|---|---|---|
| Design and building permit | at least 12 weeks' processing (rammetillatelse, Oslo) | V8 [SOURCED] |
| Groundworks | 20–25 % of construction time | V3 [ESTIMATE], one project |
| Frame | about 25 %; or floors × weeks per floor (steel and precast 1.0–1.3, timber about 1.0) | V4, V9, V10 [ESTIMATE] |
| Weathertight envelope | 20–25 % | V5 [ESTIMATE] |
| Technical installations and interior | about 20 % | V6 [ESTIMATE] |
| Handover | about 10 % | V7 [ESTIMATE] |

The shares come from one project (Elvebredden). The total construction time for about 2,300 m² on a simple site is 11–12 months (V1); a central Oslo infill site is longer, about 18–21 months planned (V2).

## 4. Event catalogue for stage 2

Each playthrough draws 3–4 events (FR-19): one estimate overrun, one or two external risks tied to the concept, and one change request. FR-35 (proposed) adds at most one opportunity.

| ID | Event | Triggered by the student's choice | Decision type (assignment) | Learning goal | Evidence |
|---|---|---|---|---|---|
| E1 | A main part takes longer than estimated | The schedule estimate | Resource allocation: accept, overtime, hire | Time costs money; resources have limits | Mean overrun 32 % (V11); Valle Wood frame [SOURCED] |
| E2 | Wind stops a crane lift, HMS reacts | Many floors, tall building | Risk response: wait, change lift plan, mobile crane | Risk | Crane out of service at about 20 m/s [partly sourced] |
| E3 | Strike at a foreign supplier delays materials | Steel or precast from abroad | Risk response: wait, or a dearer local supplier | Risk; time costs money | Finnish port strikes Feb–Apr 2024 [partly sourced] |
| E4 | Archaeological find in the excavation | Central plot (medieval town) | Risk response | Risk and reserve | Oslo requires monitoring of all digging in the medieval town; a Bjørvika dig took about 6 months [SOURCED] |
| E5 | Contaminated ground | Central or former industrial plot | Risk response | Risk and reserve | Oslo PBE [partly sourced] |
| E6 | Material price rise | Structural system | Risk response: lock the price now or take the chance | Risk | SSB 2021: materials +9.5 %; steel +40–44 % [SOURCED / excerpt] |
| E7 | Subcontractor bankruptcy | Any | Resource allocation | Resources; reserve | 29 % of bankruptcies Q2 2024 in construction; Kirkenes hospital about 8 months late [SOURCED] |
| E8 | Client change request | Any | Change approval: now, or later at a higher cost | Late changes cost more | Changes about 14 % of contract cost, two thirds from the client (V12) [SOURCED, thesis abstract] |
| E9 | Frost and winter concreting | Cast-in-place concrete in winter | Risk response | Time costs money | No Norwegian figure found [ESTIMATE] |
| E10 | Moisture in timber during construction | Timber without weather protection | Risk response | Risk | NTNU ZEB lab, Danish damage-fund findings [SOURCED] |

Impact ranges per event are in [R2] §C. Where only the occurrence is sourced, the delay and cost figures are estimates and must be marked as such in the simulation rules.
