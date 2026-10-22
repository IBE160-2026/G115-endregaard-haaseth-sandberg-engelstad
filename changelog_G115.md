# Changelog – G115 simulator

Major iterations of the *Regjeringskvartalet Light* project management simulator. Each entry has a summary of at most four lines.

## v0.2 – 2026-10-22

Playable: the player is the project owner and runs the build week by week to completion (play/pause, 1×/2×/4×), against a target of 283.10 MNOK and 114 weeks.
Rule-based AI roles (project manager, site manager, 13 foremen) in an interactive org chart raise challenges and recommend options; easy/medium/hard sets how reliable the advice is.
Scenario buttons such as "Vann i kjeller" (pump → cost + drying time), plus crew-size choice per discipline where base staffing pays off and too few or too many workers costs.
A 3D window shows the construction stage of A-blokka as built (11 floors); Byggene shows real facts about A-blokka and the basement complex. 43 tests.

## v0.1 – 2026-10-22

First runnable version: a Windows 11-style desktop with five tabs (Menneskene, Byggene, Disiplinene, Budsjett, Fremdriftsplan) and icons in Fluent style.
A pure simulation engine computes durations, the critical path and cost for 13 disciplines, with normal time 1.0, overtime 1.3 and extra hire 1.5.
Budget in MNOK with 2 decimals and a generated Gantt chart that update immediately when the work mode changes. A-blokka and the basement complex are simulated.
24 tests check the worked examples in Appendix A of the brief. Not yet included: AI advisor, decision points, risks and forking.
