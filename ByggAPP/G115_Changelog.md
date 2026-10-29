# Changelog – G115 simulator

Major iterations of the *Regjeringskvartalet Light* project management simulator. Each entry has a summary of at most four lines.

## Repo structure – 2026-10-29

The repo is split into folders. `ByggAPP/` holds everything for the game (source code, icons, build setup, the BMAD specs), the G115 files and the deploy workflow (`ByggAPP/.github/`, where GitHub does not run it). `01. Admin/` holds `README.md`, `CLAUDE.md`, the brief and the instructor's feedback.
The BMAD framework (`_bmad/`), `.claude/`, `.logs/` and `.gitignore` stay at the root. Run the game locally with `cd ByggAPP`, then `npm install` and `npm run dev`. 187 tests pass.

## v0.5 – 2026-10-27

You walk the site: the player (Statsbygg) moves with WASD, the arrow keys or a click on the ground, with Elisabeth (prosjektleder) and Hedda (site manager) following. A foreman with a challenge stands with a «!» over their head; you walk there (or press G), and the camera cuts to a meeting of the four round a table with a 3D model of the challenge.
Meetings instead of a dialog box: the foreman explains and Elisabeth names the dilemma. The foreman's view goes to Elisabeth and Hedda as input to the AI and is not shown to the player as a recommendation; Hedda and Elisabeth give their proposals, and the decision shows each one on the option it backs. The foremen are called «Formann VVS», «Formann Elektro», «Formann Heis» and so on; Oskar (HMS) stops you at the gate for missing safety glasses and checks your gear again as the chapters open.
The plan is reviewed before the clock runs: a start-up meeting goes through every discipline's estimated hours with the foreman's pitch, and each new chapter opens a staffing review (crew, mode, Elisabeth's proposal, the forecast against both targets). The left rail shows the objective, the team and what each panel has to say.
3D: articulated people and workers (legs and arms swing, workers hammer), a mobile crane and a concrete pump, a tower crane from the basement on, scaffolding that climbs with the tower, a material yard, floodlights, a pit railing and a signboard; bloom and environment lighting. Demo links `?scene=hms`, `?scene=kickoff&steg=9`, `?uke=60&hendelse=change-security&steg=9`. 184 tests. The assessment against the goals is updated in G115_Recommendations.md.
Revised after the first test round: the camera moves in on whoever speaks; less text (the AI roles give short reasons in words, and each option shows one short change instead of the full forecast); the site offices moved, and the start-up meeting is filmed with them behind the people; at most 9 challenges per game (4 strategy choices included); Byggene shows only A-blokka and Kjelleranlegget; crew and work mode can be changed while a challenge waits (the meeting's forecasts follow); Oskar checks twice (the gate and the blasting).
Second test round: Oskar walks his rounds in the background and tells off the crane driver, the flagman, the yard crew and others (speech bubbles). From the second challenge on, the meeting opens straight on the summary, the recommendations and the options; after the choice comes the conclusion with the revised budget and schedule (before → after, against the targets). 186 tests.
Third round (space, progression, people, consequences, camera, light, performance): a minimap you can click to walk, a marked driving road and walkways, signs at the gate, the site offices, the stores and the pit; nobody walks through the pit, huts, stores or machines (routes go round them); each floor is cast slab first, then the columns; workers keep a place in their work area and work in the manner of their trade; machines have marked working zones; the task tags give the cause of a stop, the floor or facade reached, and overtime, hired workers or a changed crew; the camera never hides the player behind the building, comes back behind the player facing the site after a meeting, and shows the work area during a dilemma; the scene panel can be folded; brighter nights and winter, closer fog for depth, fewer shadows, and an automatic low-quality mode on a weak PC (or `?kvalitet=lav`). 187 tests.
`G115_FinalPrompt.md` describes the whole game in text: the people, the scenario, the simulation rules, the challenges, a full game step by step, the screen, the 3D site, the technology and how it was made. It can be read as the specification of v0.5, or used as a prompt to rebuild it.
Published for testers as a Claude Artifact (https://claude.ai/artifact/Nh9p4q3T5mbQaphKD9iSdY; it works, and it is shared from the Share menu). The GitHub Pages workflow is in place (https://ibe160-2026.github.io/G115-endregaard-haaseth-sandberg-engelstad/), but the repo admins (bipa, TesAgi-HiMolde) must turn Pages on first. Local development (npm run dev) is unchanged.
## v0.4 – 2026-10-27

Makeover: the 3D site now fills the whole screen and is the game. The HUD sits on top as glass panels in the Fluent colours (week and gauges for money and time, a panel rail, the message feed, a play dock). The Windows desktop, window frame and taskbar are gone.
A living site: progress grows week by week; the crane slews and lifts, workers move in hi-vis (hired workers in blue), trucks drive past, rock is blasted, welders spark, snow falls in winter, and day turns to night with lit floors. The city and Høyblokka surround the site.
Events can be seen: the camera flies to the decision, with a beacon coloured by kind, water in the pit, the crane swaying in wind, red beacons over stalls, and choices that show on the building (solar panels, prefab, pump, bollards). The AI roles speak in speech bubbles where they stand.
Kai hired Vera (🎨, 3D art director and game designer). Shortcuts (space, N, 1/2/4, C, M, Esc) and a demo link (`?uke=40&hendelse=water`). 171 tests (9 new for the scene state).

## v0.3 – 2026-10-27

More story: six chapters opened by the Prosjektleder, 4 strategy choices that always come when C, F, H and N start, change requests, follow-ups and delayed consequences (16 new events, about 12–15 decisions per game).
Visible consequences: every option shows its cost and delay now and later, plus the forecast week and MNOK with Δ against the recommendation; a fork card after each choice shows your path next to the Prosjektleder's.
Bigger AI roles: three voices (Prosjektleder, Site manager, foreman) recommend and disagree at every decision, and a message feed reports starts, finishes, chapters, consequences and forecast changes.
The final report compares your result with the full AI path and the story solution, decision by decision. 156 tests.

## v0.2 – 2026-10-22

Playable: the player is the project owner and runs the build week by week to completion (play/pause, 1×/2×/4×) against 283.10 MNOK and 114 weeks. Every game is a story with a known solution.
Rule-based AI roles in an interactive org chart: events are dilemmas (money against time), the advice is scored against both targets, and the project manager offers a staffing plan.
Easy/medium/hard sets how reliable the advice is. Scenario buttons (e.g. "Vann i kjeller") and opportunities; crew choice where crowding applies to own and hired workers.
A 3D window shows A-blokka as built (11 floors); Byggene has real facts; the version is shown in the game. 79 tests. Prompts and replies are logged in G115_Dilemmas.md; the assessment against the goals is in G115_Recommendations.md.

## v0.1 – 2026-10-22

First runnable version: a Windows 11-style desktop with five tabs (Menneskene, Byggene, Disiplinene, Budsjett, Fremdriftsplan) and icons in Fluent style.
A pure simulation engine computes durations, the critical path and cost for 13 disciplines, with normal time 1.0, overtime 1.3 and extra hire 1.5.
Budget in MNOK with 2 decimals and a generated Gantt chart that update immediately when the work mode changes. A-blokka and the basement complex are simulated.
24 tests check the worked examples in Appendix A of the brief. Not yet included: AI advisor, decision points, risks and forking.
