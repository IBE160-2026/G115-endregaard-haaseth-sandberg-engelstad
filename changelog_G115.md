# Changelog – G115 simulator

Major iterations of the *Regjeringskvartalet Light* project management simulator. Each entry has a summary of at most four lines.

## v0.2 – 2026-10-22

Playable: the player is the project owner and runs the build week by week to completion (play/pause, 1×/2×/4×) against 283.10 MNOK and 114 weeks. Every game is a story with a known solution.
Rule-based AI roles in an interactive org chart: events are dilemmas (money against time), the advice is scored against both targets, and the project manager offers a staffing plan.
Easy/medium/hard sets how reliable the advice is. Scenario buttons (e.g. "Vann i kjeller") and opportunities; crew choice where crowding applies to own and hired workers.
A 3D window shows A-blokka as built (11 floors); Byggene has real facts; the version is shown in the game. 79 tests.

## v0.1 – 2026-10-22

First runnable version: a Windows 11-style desktop with five tabs (Menneskene, Byggene, Disiplinene, Budsjett, Fremdriftsplan) and icons in Fluent style.
A pure simulation engine computes durations, the critical path and cost for 13 disciplines, with normal time 1.0, overtime 1.3 and extra hire 1.5.
Budget in MNOK with 2 decimals and a generated Gantt chart that update immediately when the work mode changes. A-blokka and the basement complex are simulated.
24 tests check the worked examples in Appendix A of the brief. Not yet included: AI advisor, decision points, risks and forking.
