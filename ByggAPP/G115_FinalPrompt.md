# G115 Final Prompt – Regjeringskvartalet Light (v0.5)

The whole game, described in text: what it is, how it plays, the rules it computes with, and how it is built. It is written so it can be read as a description of the finished app, or used as a prompt to rebuild it.

---

## 1. The game in one paragraph

*Regjeringskvartalet Light* is a web-based 3D project management game. The player is **Statsbygg**, the owner of A-blokka in Regjeringskvartalet in Oslo (11 floors over a basement complex). The goal is to finish the building within **114 weeks** and **283.10 MNOK**. The player walks around the building site with the project manager **Elisabeth** and the site manager **Hedda**. When a foreman has a challenge, he stands with a «!» over his head; the team walks there and makes the decision in a meeting round a 3D model of the problem. After every choice the game shows the player's path next to the AI's recommendation, calculated from the same state, together with the revised budget and schedule. That comparison is the teaching mechanic: like the debrief in a flight simulator.

---

## 2. People

| Person | Role | What they do |
|---|---|---|
| **You (Statsbygg)** | Project owner, the player | Owns the budget and makes the final decisions. Walks the site. |
| **Elisabeth** | Project manager (AI role) | Follows plan, budget and forecast. Gives the official recommendation at every decision (closest to both targets). Proposes a staffing plan. Follows the player. |
| **Hedda** | Site manager (AI role) | Leads the site and the foremen. Recommends the option with the least delay. Leads the staffing reviews. Follows the player. |
| **Oskar** | HMS lead (AI role) | Checks the player's protective gear (twice), and walks his rounds in the background telling off workers, the crane driver and the flagman. |
| **The foremen** | One per discipline | «Formann Prosjektering, Sprengning, Fundament, Betong, Råbygg, Kjellerteknikk, Fasade, Heis, VVS, Elektro, Innredning, Automasjon, Overlevering». They raise challenges and give their view (lowest cost now) **to Elisabeth and Hedda as input**. The player does not get the foremen's recommendations directly. |

All AI roles are **rule-based** (no language model): the game needs no API key, and every recommendation can be tested.

---

## 3. The scenario (Appendix A of the product brief)

13 disciplines with predecessors, base crew, hours, hourly rate and materials:

| ID | Discipline | Foreman | After | Crew | Hours | Rate (NOK) | Materials (MNOK) |
|---|---|---|---|---|---|---|---|
| A | Prosjektering og byggesøknad | Prosjektering | – | 36 | 21 600 | 1000 | 3.40 |
| C | Sprengning og graving | Sprengning | A | 14 | 6 300 | 600 | 10.22 |
| D | Fundamentering og spunt | Fundament | C | 16 | 4 800 | 600 | 7.12 |
| E | Kjeller råbygg | Betong | D | 30 | 15 750 | 600 | 12.55 |
| F | Kontor råbygg | Råbygg | E | 34 | 25 500 | 600 | 19.70 |
| L | Kjeller innredning og teknikk | Kjellerteknikk | E | 8 | 3 000 | 600 | 3.20 |
| G | Tak og fasade | Fasade | F | 30 | 15 750 | 600 | 18.55 |
| O | Heiser | Heis | F | 6 | 1 800 | 600 | 5.92 |
| H | VVS | VVS | G | 32 | 21 600 | 600 | 19.04 |
| I | Elkraft | Elektro | G | 32 | 19 200 | 600 | 14.48 |
| K | Innvendige arbeider | Innredning | G | 30 | 18 000 | 600 | 9.20 |
| J | Tele og automatisering | Automasjon | I | 18 | 6 750 | 600 | 8.95 |
| N | Prøvedrift og overlevering | Overlevering | H, J, K, L, O | 10 | 1 500 | 1000 | 0.50 |

The base plan reaches exactly 114 weeks and 283.10 MNOK; there is no buffer. Critical path: A → C → D → E → F → G → I → J → N.

Buildings in the game (Byggene): only the two that are simulated, **A-blokka** (office tasks) and **Kjelleranlegget** (basement tasks C, D, E, L), with real facts from public sources.

---

## 4. The simulation rules (pure and deterministic)

- **Week by week.** A task starts when all its predecessors are finished. Weekly capacity = effective workers × hours per week.
- **Hours per week:** normal 37.5, overtime 45.
- **Work modes and cost factors:** normal ×1.0, overtime ×1.3 on the overtime hours, extra hire ×1.5 on the hired hours. Extra hire adds 50 % of the own crew (rounded up).
- **Crew:** 50–200 % of the base crew, in steps of 2. Above the planned crew, each extra worker gives only 0.5 of a full worker (**crowding**), but everyone is paid for all their hours.
- **Rigging and running (rigg og drift):** 0.45 MNOK per week from week 16 until the building is finished.
- **Materials** follow the share of the work done.
- **Events** add cost, stall a task for some weeks, change its work mode, change its remaining hours, or schedule a **delayed consequence** that lands some weeks later.
- **Forecast:** the game runs on from today's state with no new events. Everything shown (Gantt, budget, gauges) comes from the forecast.
- **Seeds:** the same seed, difficulty and choices always give the same game. Every new game is a seed whose «story» can be solved within both targets with perfect information.

### Worked examples (tested)
- F on overtime: 111 weeks, 282.52 MNOK, 95 weeks of rigging (95 × 0.45).
- F crew 24 (too few): F takes 29 weeks, the project +9 weeks, +4.05 MNOK in rigging, ends at week 123.
- «Vann i kjeller» in week 40, permanent pump: +2 weeks, +0.80 + 2 × 0.45 = +1.70 MNOK.

---

## 5. Challenges and decisions

**At most 9 challenges per game.** The four strategy choices always come, and there is room for up to five more.

27 events in four kinds (colour on the site):

| Kind | Examples |
|---|---|
| **Strategy choice** (gold, always when the discipline starts) | C: core drilling and careful blasting, or overtime. F: prefabricated or cast-in-place, cheap formwork (a correction later). H: prefabricated modules. N: full, staged or short test operation. |
| **Risk** (red) | Water in the basement, weathered rock, contaminated soil, frost in the concrete, the crane stopping in strong wind, a late facade delivery, a shortage of electricians, integration faults in the automation, the crane breaking down, copper cable theft, an order from Arbeidstilsynet. |
| **Opportunity** (green) | Reusing blasted rock, cheaper steel, a facade discount, reusing formwork, a discount on lift installation. |
| **Change request** (blue) | Stronger security, solar panels, a new floor plan, charging points. Approve now, or defer or decline and pay more later. |

Follow-ups only come after certain choices: the hired pump fails, a leak through the grouted zone, quality issues from the new steel supplier.

**Difficulty** sets how reliable Elisabeth is: easy = always the best option, medium ≈ 8 of 10, hard ≈ 6 of 10.

**The three AI lenses** at every decision:
- Elisabeth: the option closest to both targets (the official recommendation).
- Hedda: the least delay.
- The foreman: the lowest cost now (input to Elisabeth and Hedda only).

---

## 6. How a game plays

1. **Start.** Choose easy, medium or hard (or skip the intro). The player stands outside the gate.
2. **The HMS check at the gate.** Oskar stops the player: helmet ✓, vest ✓, boots ✓, safety glasses ✗. The player picks a reply. Two of the three earn a stamped «Tilsnakk!». The glasses then appear on the player's figure.
3. **The start-up meeting in the site offices.** Elisabeth and Hedda introduce themselves. Then the plan is reviewed: every discipline with the foreman's estimate, crew and work mode, the forecast against both targets, and Elisabeth's proposed staffing. «Approve the plan» starts the clock.
4. **The building runs week by week** (1×, 2× or 4×, or one week at a time). Workers, cranes and trucks show the progress.
5. **A challenge.** The clock stops. The foreman stands with a «!». A ring and an arrow show the way, and G walks there automatically. Elisabeth and Hedda come along.
6. **The meeting.** The camera cuts to the four round a table with a 3D model of the challenge, and moves in on whoever speaks.
   - **The first meeting** is played line by line: the foreman explains, Elisabeth names the dilemma, Hedda passes on the foreman's input, and then Hedda and Elisabeth give their proposals.
   - **From the second meeting on** it opens straight on the summary: what happened, the dilemma, Elisabeth's and Hedda's recommendations, and the options. Each option shows what it means now, later, and as one short change («+2 weeks · +1.70 MNOK»), with who backs it.
7. **The choice → the result box.** A conclusion (followed Elisabeth or not, and the difference) and the **revised budget and schedule** (before → after, against the targets). «End the meeting» starts the clock again.
8. **A new chapter** (Groundwork, Basement, Structure, Weathertight, Services and fit-out, Handover) opens a **staffing review** led by Hedda for the new disciplines. Oskar's second check (ear defenders) comes when the blasting starts.
9. **Between decisions** the player can walk around, talk to anyone (E), change crew and work mode (including while a challenge waits; the forecasts update), follow Elisabeth's staffing plan, or start a challenge from the scenario menu.
10. **The final report.** Your result against the targets, the AI's path (the same seed played with Elisabeth's staffing and recommendations), the story's solution, every decision with its difference, and how many times Oskar had to tell you off. If both targets are met: fireworks.

---

## 7. The screen

- **The 3D site fills the screen**, with glass panels on top in the Fluent colours (accent #005fb8 / #60cdff, good #0f7b0f, bad #c42b1c).
- **Top bar:** the week, the chapter, and gauges for finish week and forecast against the targets. They flash when a choice moves them.
- **Left rail:** the objective («Gå dit»), the team with their status (gear count, «Følger deg»), and the panels, each with a short hint and a badge: Menneskene (an org chart with controls), Byggene, Disiplinene (crew and mode), Budsjett, Fremdriftsplan (Gantt with the critical path), Meldinger.
- **Right:** the messages from the AI roles. **Bottom:** play, pause, next week, speed, scenario menu, camera (follow the player or the overview), new game.
- **In meetings:** letterbox bars, and the HUD steps aside for a speech panel at the bottom.
- **Controls:** WASD or the arrow keys walk (Shift to run), a click on the ground walks there, a click on a person walks to them and talks, E talks, G goes to the objective, space plays or pauses, N steps a week, 1/2/4 sets the speed, C switches the camera, M shows the messages, Esc closes.

---

## 8. The 3D site

- **A-blokka** grows floor by floor: the pit is blasted out, piles and foundations, basement walls, columns and slabs with orange formwork (or precast concrete for prefab), a glass facade, floors that light up as the services are fitted, the roof with plant, and the art work «AAkhA» when it is finished.
- **Machines:** a tower crane from the basement phase (it slews and lifts, stops in wind, its lights blink), a mobile crane, a concrete pump, an excavator, trucks on the ring road, a pump when the water is pumped out.
- **People:** articulated figures whose legs and arms swing; the workers hammer. About one figure per three workers (hired workers in blue), plus crews in the material yard, at the site hut and at the gate.
- **Site details:** a material yard, toilets, skips, floodlights, a railing round the pit, scaffolding that climbs with the tower and comes down as the facade is fitted, a signboard, cones, and the fence with a gate.
- **The world:** the city, Høyblokka under scaffolding, trees and street lights, a two-minute cycle of day and night, seasons (snow in winter), bloom on the lights, and a park when the building is handed over.
- **Visible consequences:** water in the pit, red beacons over stalled work, the crane swaying, solar panels, charging points, bollards and plant modules when they are chosen.

---

## 9. Technology

- **Stack:** TypeScript, Vite, Three.js 0.186 (OrbitControls, EffectComposer with UnrealBloom, RoomEnvironment) and Vitest. No backend, no API key.
- **Structure:**
  - `ByggAPP/src/engine/`: the pure simulation (scenario, game, events, advisor, chapters, simulate). It never knows about the UI.
  - `ByggAPP/src/ui/story.ts`: the story layer (objectives, meeting scripts, HMS checks, Oskar's rounds, start-up meeting, staffing reviews). Pure and tested.
  - `ByggAPP/src/ui/scene/`: walking and routes round the pit (`walk.ts`), people (`cast.ts`), challenge models (`challenge.ts`), site details (`props.ts`), the city (`world.ts`), and the scene state (`visuals.ts`). The 3D only reads the game and never changes it.
  - `ByggAPP/src/ui/view3d.ts`: the scene and the camera. `ByggAPP/src/ui/play.ts`, `scenes.ts`, `hud.ts` and `tabs/`: HTML. `ByggAPP/src/main.ts`: directs the clock, the scenes and the input.
- **Tests:** 186 Vitest tests (the engine, the brief's worked examples as expected answers, the story layer, walking, the renderers).
- **Run locally:** in `ByggAPP/`, `npm install`, then `npm run dev` (http://localhost:5173). `npm test` and `npm run build`.
- **Demo links:** `?scene=hms`, `?scene=kickoff&steg=9`, `?uke=60&hendelse=change-security&steg=9`.
- **Published:** as a Claude Artifact (https://claude.ai/artifact/Nh9p4q3T5mbQaphKD9iSdY). GitHub Pages is ready in `.github/workflows/deploy.yml` and waits for a repo admin to turn on Pages.

---

## 10. How it was made

Built in iterations with Claude Code and the BMAD framework (v0.1 → v0.5), with the custom agents Kai (game developer) and Vera (3D art director). Every request and reply is logged word for word in `G115_Dilemmas.md`, every version in `G115_Changelog.md`, the assessment against the goals in `G115_Recommendations.md`, and each session in `.logs/`. v0.5 was revised after two test rounds with users.

**Still open:** a PRD, architecture and epics/stories in BMAD; an updated brief (scope, and rule-based AI instead of an LLM); a view of risk exposure; tests of the click flow; GitHub Pages turned on by an admin.
