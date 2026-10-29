# Dilemmas – G115 AI_BYGGplant

The choices the AI (Claude Code) put to the group, with the group's reply word for word, one section per version (newest first). Each entry has at most four lines: the prompt, the reply, and what came of it.

## v0.3 – 2026-10-30

**Open:** Check the demo in a browser (`npm run build`, then `npm start`, open http://localhost:8080 and click «Neste demo-replikk» 7 times). The buyer the team chose (a builders' merchant or kit supplier, white-label) still needs the group's confirmation. The loft rule (a loft is not counted in `floors`) was decided by the integrator.

1. **Start again.** Prompt: none (the group's own request).
   Reply: "50% of 7d limit! Start again and make something fantastic" and "go ahead"
   Result: team meeting 2 with three real agents (`.docs/planning-artifacts/team-meeting-2-2026-10-29.md`), then v0.3 built by four parallel agents.

## v0.2 – 2026-10-29

**Open:** The team picked the buyer itself: a prefab garage, cabin or house supplier (or a builders' merchant) buying a white-label licence, about 150 000 USD for the licence and setup plus 100 000 USD for the first year. Is that the buyer the group wants? Who pays for the Claude API key while testing, and with what budget? Accounts were left out on purpose (Ingrid's decision 7, against Mats's wish) and come in v0.5. The meeting was run by Claude Code playing all three roles in one session, not as three separate AI runs.

1. **Three AI bots and a 250 000 USD mandate.** Prompt: none (the group's own request).
   Reply: "Nå. legg inn 3 AI boter. En prosjektleder, en utvikler og en selger. Sett alle disse sammen og gi dem oppdrag om å utvikle dette til en software som skal koste 250 000 dollar! la alle rollene diskutere sammen også lager dere et ny revisjon. Bruk 50% kapasitet på denne prompten!"
   Result: the agent skills g115-agent-pm (Ingrid), g115-agent-dev (Jonas) and g115-agent-sales (Mats); team meeting 1 with seven decisions and a roadmap to v1.0; v0.2 built from decisions 1–5. "50 % kapasitet" was read as a medium-sized revision: five features and no new architecture.

## v0.1 – 2026-10-29

**Open:** The draft has not yet been run against Claude (no API key on the development PC); try a full dialog for a garage and a house and tune `server/prompt.ts`. Choices the AI made without asking: the model is claude-opus-5-5 at medium effort; the API key lives on the Vite dev server, so the app runs locally but not as a static page (a published version needs a small backend or a Claude Artifact); the AI returns the whole project every turn; the building tab is 2D (elevations and a plan), not 3D.

1. **A new app.** Prompt: none (the group's own request).
   Reply: "Opprett ny mappe som heter AI_BYGGplant. Jeg ønsker å bygge en app som skal visualisere og strukturere en byggeprosess. Inputen skal være AI generert uten regler. output skal visualiseres som ByggAPP. BMAD rammeverket og Skills og annent fra 01. Admin skal brukes. Jeg ønsker at den skal starte med Hei, hva skal bygges? Deretter så skriver brukeren input, deretter genererer AI spørsmål om byggeprosjektet. Utifra det så stilles nye spørsmål som naturlig tar prosessen videre. Først de grove tingene som terreng. byggets størrelse, antall etasjer, dører og vinduer. Er det f.eks en garasje så er det naturlig å spørre om port. Deretter skal budsjett og GANT diagram genereres. Start smalt, også spør bredere etterhvert. Det skal være en dialog som alltid er åpen for endringer. Vinduet/appen må ha tabs hvor brukeren kan se informasjonen. Start med et utkast. Push Git og bruk samme regler som ByggAPP for G115 filene."
   Result: v0.1 in `AI_BYGGplant/`, with a BMAD spec in `.docs/implementation-artifacts/` and these G115 files.
