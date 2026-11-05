---
title: "Addendum: Fra tomt til tak"
status: draft
created: 2026-10-31
updated: 2026-10-31
---

# Addendum: Fra tomt til tak

Detail from the brief conversation that belongs in later documents (PRD, UX, architecture) rather than in the brief itself.

## 1. Stage 1 flow and time budget

| Step | Content | Time |
|---|---|---|
| 0. Site office | The fictional client presents the order (100 workplaces in Oslo, deadline, budget) | about 1 min |
| 1. Concept | One central site with one price per m²; floors against plot area; structural system against time | about 3 min |
| 2. Schedule estimate | Six main parts; the student estimates durations, the adviser gives reference shares; Gantt updates | 2–3 min |
| 3. Risk and reserve | 3–4 known risks that depend on plot and concept; responses; time and cost reserve | about 2 min |
| 4. Present the plan | Plan against the targets, the adviser's assessment, approval | about 1 min |

Stage 2 takes about 6 minutes (3–4 events) and stage 3 about 4 minutes.

Example risks tied to the concept: contaminated ground on a central plot; crane stops in wind on a tall building.

## 2. Planning view: first layout sketch (for UX)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Office building, Oslo · 100 workplaces  Budget ▓▓▓▓▓░ 212/240  Done wk 86/90 │
│                                          Risk exposure: medium   ⚠ 1 warning │
├────────────┬──────────────────────────────┬──────────────┬───────────────────┤
│ STEPS      │ 1. PLOT AND CONCEPT          │ 3D VIEW      │ ADVISER           │
│ ✓ Order    │ Site: central Oslo, 1 price  │ building on  │ suggestions,      │
│ ● Plot and │ Floors [──●──] 4             │ the chosen   │ warnings,         │
│   concept  │ Footprint 600 m²             │ plot, updates│ suggested-question│
│ ○ Schedule │ Structure ○ concrete ● steel │ with every   │ buttons and a     │
│ ○ Risk     │ Consequence: plot · building │ choice       │ free-text field   │
│ ○ Present  │ · weeks                      │              │                   │
└────────────┴──────────────────────────────┴──────────────┴───────────────────┘
```

The figures are placeholders. Principles: the targets are always visible at the top; the steps on the left tell a newcomer where they are; the form sits in the middle with an immediate consequence box; the 3D view and the adviser each have their own panel. There is no walking: the 3D view is to look at, not to move through.

## 3. Adviser: options considered

| Option | How | For | Against |
|---|---|---|---|
| A. Suggested-question buttons only | 3–5 prepared questions per step | No key, testable, cheap | No real free text |
| B. Language model with guardrails | Model gets scenario data, rules and approved facts, and answers only within them | Real conversation | Needs a key, costs per call, must be tested for drift |
| **C. Both (chosen)** | Buttons always work; free text goes to the model when a key exists, otherwise to the nearest prepared answer | Runs without a key, real AI when available | Somewhat more to build |

Warnings and numbers are always rule-based; the language model only explains. Example warning rules: the plot does not allow the chosen height or footprint; a schedule estimate is more than 20 % from the reference; there is no reserve; more is paid to cover a risk than its expected cost.

## 4. Login or decision log

| | Accounts and login | Decision log (chosen) |
|---|---|---|
| What | Accounts, data stored per user on a server | Every choice logged with time and the adviser's recommendation; no account |
| Requires | Database, password handling, keys, privacy | Code in the app only; shown in the debrief and downloadable |
| Rough cost | 15–25 hours | A few hours, and the debrief needs it anyway |

Reason: the product is open to the public on GitHub and uses a fictional scenario, so there is nothing confidential to protect.

## 5. Learning goals: what was left out

Of the six goals first proposed, two were not kept as separate goals:

- **Critical path and slack** is not a goal of its own, but the "time costs money" and "resources have limits" goals rest on it, and the adviser's warnings explain it.
- **Risk responses** (accept, reduce, transfer, avoid) were folded into the risk goal rather than made a fifth goal, so the four goals map to the assignment's three areas (scheduling, resources, risk) plus AI support.

## 6. Model and research needs (for PRD and architecture)

- The fixed 13-discipline WBS of Regjeringskvartalet Light (the scenario in the earlier brief) becomes a **building-block model**: plot, floors, footprint and structural system produce the WBS, quantities, durations and cost. Keep the options discrete (for example 3 plots × 2–4 floor counts × 3–4 structural systems), with simple rules the group owns and worked examples with answers.
- 100 workplaces is roughly 2,000–2,500 m² gross floor area at an assumed 20–25 m² per workplace, which must be checked against a source. The 15,000 m² scale and all figures in Appendix A of the earlier brief no longer apply directly.
- Figures that need sources: floor area per workplace; plot prices in Oslo; cost and duration per structural system and per floor; zoning limits that make the three plots differ.
- Reusable from v0.5: the site office scene and figures, the week-by-week engine (crowding, work modes, events), the Gantt view, the comparison with the AI's path, and the final report as a base for the debrief.
