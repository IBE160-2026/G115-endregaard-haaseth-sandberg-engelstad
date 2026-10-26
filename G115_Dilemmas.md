# Dilemmas – G115 simulator

The choices the AI (Claude Code) put to the group, with the group's reply word for word, one section per simulator version (newest first). Each entry has at most four lines: the prompt, the reply, and what came of it.

## v0.4 – 2026-10-27

**Open:** Is a full-screen 3D view with panels on top the right base for the next versions? Day and night, seasons and the number of figures are presentation only; check that they do not distract from the decisions. The construction start in January (which decides when it snows) is an assumption.

1. **Makeover and a new agent.** Prompt: none (the group's own request).
   Reply: "spillet er alt for kjedelig. Det er bare masse masse tekst, ingen visualisering av hva som skjer. Bygg 3d modellen sammen med spillet, og ikke som et lite vindu.Ikke bruk windows explorer som base - kun fargene. Gi hele spillet en enorm makeover. Kai kan ansette en ny AI agent som er best på 3D og utforming av spill. Kai må fortsette å oppgradere spillet."
   Result: v0.4 with the 3D site as the game screen, the Fluent colours without the Windows layout, and the agent Vera (`g115-agent-3d-artist`) hired by Kai. Kai has a standing order to keep upgrading.

## v0.3 – 2026-10-26

**Open:** All prices, delays and chances of the 16 new events are proposals for the team to check. Also to check: the strategy options (e.g. prefab on F at 5 MNOK and −30 % hours) and the v0.2 event chances that were lowered to keep about 12–15 decisions per game. Scenario buttons now fire each event once (to stop free savings from pressing an opportunity again and again). In v0.2 a button could be pressed again: should risks still be repeatable?

1. **Approving the spec.** Prompt: approve and build now / approve and stop / review the spec first.
   Reply: "Review spec", then, while the review was running: "go for it." and "start implementering nå"
   Result: an independent reviewer found 12 gaps (4 high); all were fixed in the spec before the build started.
2. **Game design for v0.3.** Prompt: a third score for change requests and strategy, or only money and time? How many decisions per game? How should the fork be shown? The spec is about 2,500 tokens: keep it or split it?
   Reply: "Keep two targets (Recommended)" / "About 12–15 (Recommended)" / "Short dialog (Recommended)" / "Keep full spec (Recommended)" (asked twice; the first prompt was interrupted: "spør på nytt")
   Result: benefits are expressed as money and time (declining a change costs more later); event chances tuned to about 14 decisions; the fork card after every choice.
3. **Scope, git and reviewers.** Prompt: build content, consequences and AI roles together or split? Commit the Kai agent files first? Use subagents?
   Reply: "Keep all goals (Recommended)" / "Commit them first (Recommended)" / "Yes, use subagents (Recommended)"
   Result: one v0.3 spec; Kai committed separately (`69f3ac8`); independent reviewers check the spec and the build.
4. **A game developer agent.** Prompt: none (the group's own request).
   Reply: "Kan du sette opp en ny AI agent for prosjektet. Den skal ta rolle som en spillutvikler og ta spillet til nye høyder. Spesielt på 3d fronten." Then, to Kai: "Start med å lage mer innhold. Flere scenarioer, større handling i hvert game. Bedre histore, flere valg. Det må komme bedre frem hvilke konsekvenser og fordeler alle valg har. Dette skal være interaktivt. Gi også AI rollene større plass i hver game."
   Result: the BMAD agent Kai (🎮, game developer and 3D specialist), and this v0.3.

## v0.2 – 2026-10-22

**Open:** Should the project manager's staffing plan also become less reliable on Medium and Vanskelig? Today it is always right. Also to check: event prices, crowding 0.5, crew range 50–200 %, and the sources for the building facts.

1. **Recommendations file.** Prompt: should the assessment be made into a shareable page, or should v0.3 start with forking?
   Reply: "push reccomendations to G115_Reccomandations structured as the other two G115 .md files."
   Result: `G115_Recommendations.md` (name spelled correctly), structured like the changelog.
2. **Assessing how well the goals are met.** Prompt: none (the group's own request).
   Reply: "vurder måloppnålese mot oppgavetekst etc."
   Result: assessed against the instructor's feedback and the brief (the task description is not in the repo). Top priority is forking and side-by-side comparison.
3. **Structure of the dilemma log.** Prompt: none (the group's own request).
   Reply: "structure G115_Dilemmas as G115_ Changelog"
   Result: the folder became this single file, structured like `G115_Changelog.md`.
4. **Repository conventions.** Prompt: none (the group's own request).
   Reply: "push git for v.02 . always update changelog. rename Changelog_G115 to G115_Changelog and create G115_Dilemmas. to this folder always push your promts with our reply."
   Result: `G115_Changelog.md`; every prompt and reply is logged here and pushed with its change.
5. **Game design after the review.** Prompt: best option = cheapest or both targets? Should hired workers crowd? Should a mode chosen at an event be locked? Late but within budget is hard to reach. Is that intended?
   Reply: "This should be dilemmas. Can be presentet shortly for player. yes, the project manager should mange so the staff is utilized betst possible way." / "yes, the game should be fun and suprising" / "no," / "yes, but it should be possible. implement a "story solution" for each game."
   Result: a dilemma line in events, the AI scored against both targets, a PM staffing plan, hired workers crowd, opportunities, and a story solution per game.
6. **Version in the game.** Prompt: none (the group's own request).
   Reply: "include version in game. this will be v0.2"
   Result: the version comes from `package.json` and shows in the title bar, the taskbar, the start dialog and the final report.
7. **Independent review.** Prompt: run 3 reviewer agents (bugs, edge cases, test gaps)?
   Reply: "Yes, run 3 reviewers (Recommended)"
   Result: 30 findings; 20 fixed, the rest deferred or rejected with a reason in the spec's triage log.
8. **Approving the spec.** Prompt: approve and build now / approve and stop / review the spec first.
   Reply: "1"
9. **How the game works.** Prompt: AI roles rule-based or LLM? Real A-blokka size or the Light numbers? Auto-play or manual? What should difficulty change?
   Reply: "Rule-based (Recommended)" / "Keep the Light numbers (Recommended)" / "Auto-play with pause (Recommended)" / "Less reliable AI advice"
10. **Split v0.2?** Prompt: four parts that could each be built on their own (game loop, org chart, 3D, Byggene). Start with the game loop?
   Reply: "fortsett med alle målene nå. Dette vil bli v.02 og det vil gi oss mer å diskutere for senere input."

## v0.1 – 2026-10-22

1. **Independent review.** Prompt: run 3 reviewer agents?
   Reply: "Yes, run 3 reviewers (Recommended)"
2. **Approving the spec.** Prompt: approve and build now / approve and stop / review the spec first.
   Reply: "1"
3. **What the Byggene tab simulates.** Prompt: (a) an information tab with a "Light" label, or (b) the scenario linked to A-blokka + Kjelleranlegget?
   Reply: "b"
4. **B-blokka or Høyblokka?** Prompt: in the real project, BT1 is A, D and Høyblokka, not B. Was "a.b." meant as Høyblokka?
   Reply: "korriger etter hva som var i prosjektet"
   Result: the icons follow the real phases (BT1 A/D/H + basement, BT2 C/Kjeller 2/G, BT3 E + park).
5. **Technology.** Prompt: Vite + TypeScript with a separate simulation engine now, or the BMAD architecture step first?
   Reply: "j"
6. **Where the scenario goes.** Prompt: there is no brief-G115-AI folder. Create one, move the brief, put the file next to it, or keep it in `_bmad-output`?
   Reply: "push to https://github.com/IBE160-2026/G115-endregaard-haaseth-sandberg-engelstad/blob/main/brief-G115-AI-prosjektledelse-simulering.md"
   Result: the scenario became Appendix A of the brief.
7. **The simulation model.** Prompt: the rules must come from the group. Are the suggested multipliers OK? Should a delay cost the daily rate? How should "avoid" work?
   Reply: "Lag et scenario for regjeringskvartalet light. Kontor + parkeringskjeller. Hent info fra nett og finn de største budsjettpostene også lager vi et scenario utifra det" / "vi tar de store linjene som foreslått ovenfor. Estimer arbeidstimer og antall arbeidere for hver disiplin. Deretter så legger vi inn en faktor på 1.0 for normaltid også kan scenarioet regne om med en overtidsfaktor på 1.3 og eventuell ekstra innleie på 1.5 (kost)"
   Result: Appendix A, with hours and crew per discipline and the cost factors 1.0, 1.3 and 1.5.
