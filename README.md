# G115 — Fra tomt til tak

Group project in **IBE160 Programming with AI** at Molde University College, autumn 2026 (15 ECTS credits).

This repository contains the group's application and the documentation of how it was developed, tested and quality-assured with AI.

## The project

*Fra tomt til tak* ("From plot to roof") is a 20-minute web simulator in which a newcomer runs a construction project as its project manager: an office building for 100 employees near the centre of Oslo, for a fictional client.

1. **Plan (the main part).** The student chooses the number of floors and the structural system, estimates the schedule, and chooses how to meet the known risks, with an AI adviser beside them.
2. **Execute.** The plan is put to the test. A few unforeseen events hit, and the student chooses a response. Each choice is compared with the AI's path from the same state.
3. **Debrief.** A budget bridge shows where the deviation came from, the decisions are ranked by how much they mattered, and a short conclusion ties the result to the learning goals.

### Why

Building projects run on average 32 % over schedule and 62 % over cost. Project management is usually taught through static artefacts, so learners rarely see how a plan breaks. Here the student's own plan is tested, which makes the consequences theirs.

## Status

The group chose this direction after comparing three proposals. **The planning is done; the new app is not built yet.** `ByggAPP/` still contains the previous game (v0.5, *Regjeringskvartalet Light*), which is the starting point for the new app: the 3D world, Gantt view and icons are reused, while the engine is rewritten to follow the new simulation rules. The README will be updated as the stories are completed.

## Run locally

Requires [Node.js](https://nodejs.org/) 22.12 or newer. No API keys or accounts are needed.

```bash
cd ByggAPP
npm install
npm run dev     # serves the app at http://localhost:5173
npm test        # runs the tests
npm run build   # type-checks and builds to dist/
```

The simulation engine is in `ByggAPP/src/engine/` and has no UI code.

## Folder structure

- `ByggAPP/` — the application: source code (`src/`), icons (`assets/`), build setup, the group's G115 files and the BMAD specs for each version (`.docs/`)
- `01. Admin/` — assignment material and planning: the instructor's feedback and `planning-artifacts/`
- `02. Arkiv/` — what the group decided not to take forward, kept as history (see its README)
- `_bmad/` — the BMAD framework, with its Claude Code skills in `.claude/skills/`
- `.logs/` — session logs per group member

## Planning documents

All in `01. Admin/planning-artifacts/`:

- [Product brief](01.%20Admin/planning-artifacts/briefs/brief-G115-tre-stadier-2026-10-29/brief.md)
- [PRD](01.%20Admin/planning-artifacts/prds/prd-fra-tomt-til-tak-2026-10-31/prd.md), with [simulation rules and worked examples](01.%20Admin/planning-artifacts/prds/prd-fra-tomt-til-tak-2026-10-31/simulation-rules.md)
- [Research: figures](01.%20Admin/planning-artifacts/research/research-fra-tomt-til-tak-2026-10-31/research.md) and [research: reference projects](01.%20Admin/planning-artifacts/research/research-referanseprosjekter-2026-10-31/research.md)
- [UX: EXPERIENCE.md](01.%20Admin/planning-artifacts/ux-designs/ux-fra-tomt-til-tak-2026-10-31/EXPERIENCE.md) and [DESIGN.md](01.%20Admin/planning-artifacts/ux-designs/ux-fra-tomt-til-tak-2026-10-31/DESIGN.md)
- [Architecture](01.%20Admin/planning-artifacts/architecture/architecture-fra-tomt-til-tak-2026-11-05/ARCHITECTURE-SPINE.md)
- [Clickable demo of the proposal](01.%20Admin/planning-artifacts/ux-designs/ux-fra-tomt-til-tak-2026-10-31/mockups/demo-fra-tomt-til-tak.html): download and open in a browser

Development follows the [BMAD framework](https://bmadcode.com/).

## Members

- Hedda R Endregaard
- Oskar Lia Haaseth
- Elisabeth Sandberg
- Trond Engelstad
