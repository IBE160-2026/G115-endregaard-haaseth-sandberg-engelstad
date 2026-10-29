# Dilemmas – G115 simulator

The choices the AI (Claude Code) put to the group, with the group's reply word for word, one section per simulator version (newest first). Each entry has at most four lines: the prompt, the reply, and what came of it.

## Repo structure – 2026-10-29

1. **The folder structure.** Prompt: none (the group's own request).
   Reply: "Vi må oppdatere mappestrukturen. Alt som har med spillet og gjøre skal inn i en mappe som heter ByggAPP. G115 filene skal ligge som de er. Oppgavetekst, tilbakemeldinger, BMAD rammeverkt og lignende skal inn i 01. Admin mappe. Logs skal ligge som den er."
2. **Moving BMAD.** Prompt: Claude Code only finds skills in `.claude/skills` at the root, and 73 skill files call `{project-root}/_bmad/...`. Keep BMAD at the root, move `_bmad` and rewrite the paths, or move both and accept that BMAD breaks?
   Reply: "Move _bmad, rewrite paths"
   Result: `_bmad/` is in `01. Admin/`, and every path to it is rewritten (paths in commands are quoted because of the space). `.claude/` stays at the root.
3. **The specs.** Prompt: should `.docs/implementation-artifacts` go to 01. Admin or ByggAPP?
   Reply: "ByggAPP"
4. **The G115 files.** Prompt: none (the group's own request).
   Reply: "put G115 filene inn i ByggAPP også"
   Result: the four G115 files are in `ByggAPP/`.

## v0.5 – 2026-10-27

**Open:** Ask bipa or TesAgi-HiMolde to turn on GitHub Pages (Source: GitHub Actions); until then the Artifact is the test link and has to be republished by hand after each change. The group's prompt names the player both «Statnet» and «Statsbygg»; the game uses Statsbygg (the owner in the scenario). The HMS checks, the walking and the meetings are presentation only and do not change cost or time: should a missing piece of gear (or a reply that earns a telling-off) have a cost in the simulation? The foremen's titles (e.g. «Formann Betong» for E Kjeller råbygg, «Formann Prosjektering» for A) were chosen by the AI; check them.

1. **Third test round: space, progression, people, consequences, camera, light and performance.** Prompt: none (the group's own request).
   Reply: "Nye kommentarer til v0.5 Implementer dette" with seven points (pasted): "Rom og orientering … Byggeprogresjon … Mennesker og maskiner … Synlige konsekvenser … Kamera og møter … Lys, materialer og omgivelser … Ytelse og grensesnitt" (the full text is in the session log for 2026-10-27).
   Result: all seven areas are addressed (see the changelog). Interpretation: the existing figures were improved and no more were added; the consequences shown are only those that come from the game state (stalls and their causes, water, crews and modes).
2. **The game in one file.** Prompt: should the status (about 74 % against the grading criteria, about 35 % of the BMAD flow) go into the recommendations, or should the PRD come next? Then: push the summary and add it to the changelog?
   Reply: "hvordan ligger vi an prosentvis i forhold til project brief, oppgaveteskt og Bmad rammeverket?", "oppsummer hele spillet i tekst i en ny fil  g115_FinalPrompt" and "push. revise v0.5"
   Result: ``G115_FinalPrompt.md`` (named like the other G115 files). The status estimate (brief about 75 %, grading criteria about 74 %, BMAD about 35 %) is given in chat; the task text itself is not in the repo.
3. **Feedback from the second test round.** Prompt: none (the group's own request).
   Reply: "Kommentarer 1. La oskar gå litt rundt og gi tilsnakk til arbeidere og kran og litt av hvert. Dette skal skje i bakgrunnen 2. Ta vekk de første dialogboksene. fra case 2 og ut spiller. Da holder det med sammendraget, anbefalinger og valg. Boksen etter er konklusjon og revidert budsjett + fremdrift. Oppdater v0.5, push Git og oppdater 115"
   Result: Oskar's rounds with 8 stops and remarks (only where the crane, the pump or the pit is on site). From the second meeting on, the speech lines are skipped (the first meeting is played in full as an introduction, and «Hør forslagene igjen» still works). The decision panel has a summary; the box after has a conclusion and the revised budget and schedule. «Run» was also asked for in the same session.
4. **Feedback from the first test round.** Prompt: none (the group's own request).
   Reply: "oppdater v.05 etter disse kommentarene: 1. Vis bedre hvem som snakker. zoom gjerne litt inn på personen. 2.Mindre tekst. det blir veldig repetativt med alle tall og uker hele tiden. 3. Flytt brakka i første scene 4. Begrens scenarioet til maks 9 utfordringer 5. under "byggene" fjern alle som ikke er i bruk 6. Arbeidsmodus under disiplinene (Normaltid, overtid, innleie) kunne ikke endres under testen 7. begrens HMS til maks 2 spørsmål"
   Result: a close-up of the speaker; short reasons and one change per option; the site offices moved and the start-up meeting filmed from the site side; MAX_CHALLENGES = 9; Byggene only A-blokka and Kjelleranlegget; staffing unlocked while a challenge waits (the cause: it was locked by design, and a challenge waits whenever you walk to a foreman); HMS checks only at the gate and the blasting. Interpreted «2 spørsmål» as two checks; the gate check still has three answers.
5. **Publishing without admin rights.** Prompt: GitHub Pages needs a repo admin (only bipa and TesAgi-HiMolde have it; the group has write access). Options: ask an admin, a fork under a personal account, Netlify Drop, or a Claude Artifact.
   Reply: "gjør det du", "hwo is admin?", "prøv claude artifact", "en tester finner ikke siden med artifact med sin claude bruker. Sjekk om det ble gjort riktig?" and "fungerer. Oppdater v0.5 og push GIt. oppdater alle G115"
   Result: the game is a private Claude Artifact (https://claude.ai/artifact/Nh9p4q3T5mbQaphKD9iSdY) that the owner shares from the Share menu. It works. GitHub Pages waits for an admin to set Source to "GitHub Actions".
6. **Publishing for testers.** Prompt: GitHub Pages (recommended: free, publishes itself on every push to main, a fixed link), Netlify/Vercel (a test link per pull request), itch.io (uploaded by hand) or a Claude Artifact. Go ahead with GitHub Pages?
   Reply: "Nå må spillet publiseres slik at det kan testes av andre. LocalHost fungerer bra når vi utvikler dette videre.", then "anbefal hvordan det kan publiseres?", "hva trenger spilleren for å starte spillet fra GitHub+" and "ok, publiser med github pages"
   Result: the workflow `.github/workflows/deploy.yml` publishes to https://ibe160-2026.github.io/G115-endregaard-haaseth-sandberg-engelstad/ on every push to main (the tests must pass). A repo admin must set Settings → Pages → Source to "GitHub Actions" once.
7. **Push and update the documents.** Prompt: none (the group's own request).
   Reply: "push git. oppdater alle G115 dokumentene"
   Result: v0.5 is pushed to `main`, with `G115_Changelog.md`, `G115_Dilemmas.md` and `G115_Recommendations.md` (a new v0.5 assessment) updated.
8. **Foremen's recommendations go to the AI roles.** Prompt: none (the group's own request).
   Reply: "revider 0.5: ta vekk anbefalingene til formenn for spiller. Det kan spilles rett inn til prosjektleder og site manager. De skal fortsatt være med, og være en del av AI input som i bruk nå"
   Result: in the meeting, the decision and Menneskene the player sees only Elisabeth's and Hedda's proposals. The foreman's view (cheapest now) is still computed as before and given to them as input; Hedda says it was taken into account, without naming the foreman's pick.
9. **A walkable, story-driven site.** Prompt: none (the group's own request).
   Reply: "Bygg om slik at man styrer en figur som representeter Statnet/spiller som må gå rundt på byggeplassen til formennen sammen med prosjektleder og site manager  for å se på utfordringene. Der må formenne stå medet utropstegn over hodet så må man løse utfordringene sammen. I dialogboksen nå så står det hva prosjekleder, sitemanager og forman foreslår. Sett dette mer sammen og gjør det mer interaktivt i spillet ved å lage en scene som zoomer inn på de 4 som er i møtet og en 3D grafikk om hva som er utfordringen. Legg også til mer detlajer på byggeplassen. en kran og flere arbeidere. Lag en artig scene der HMS kommer og sjekker verneutstyr. Spilleren / statsbygg mangler f.eks vernebriller og får tilsnakk. Menyen til venstre er også alt for lite i bruk. Knytt menneskene mer sammen med spilleren Prosjektleder skal hete Elisabeth. Site manager skal hete Hedda og HMS skal hete Oskar. Alle formennene kan døpes om til "Formann VVS", Forman Elektro, Formann Heis etc.Disiplinene så står det estimert timer etc. Dette må komme opp som forslag å sette seg inn i ved starten av scenarioet. De skal treffe på timer, og vurdere om man skal sette på flere. Nå så ruller å går alt sammen uten at men trenger å se på dette. Kai og 3D utvikleren må gå sammen å sette dette sammen til helt utrolig å spille. Lag historien bedre, mer spillbar og interaktiv. Oppgrader også 3D slik at det ser bra ut når man spiller"
   Result: v0.5, built with Kai's (gameplay) and Vera's (3D and scene) guidelines: the walking avatar with Elisabeth and Hedda, «!» over the foremen, meeting scenes with a 3D model of the challenge, Oskar's HMS checks, a start-up meeting and staffing reviews, a busier rail, and the 3D upgrade.
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
