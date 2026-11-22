# Fra tomt til tak valgt: arkitektur, epics og stories

## 2026-11-05 kl. 21:00 — Oskar Lia

### Oppgave
Gruppen valgte «Fra tomt til tak» som eneste prosjekt. Plassere det i repoet, arkivere det som kolliderer, skrive arkitektur og stories, og komme til main via PR.

### Plan
- Flette main inn i branchen, arkivere i `02. Arkiv/`, flytte README og CLAUDE.md til rotmappen, skrive arkitektur, og lage epics og stories.
- Arkitektur: `01. Admin/planning-artifacts/architecture/architecture-fra-tomt-til-tak-2026-11-05/`.

### Resultat
- Laget en klikkbar demo for gruppen (Claude Artifact, kopi i UX-mappa under `mockups/`). Motoren i demoen ga samme tall som simuleringsreglene.
- `5716587` arkivering, `4ec0ecf` README og CLAUDE.md til rotmappen, `76d15b3` og `d2f67f5` arkitektur, `3e942ca` fletting med main, `df27278` v0.5 i arkivet og demo. Git-taggen `v0.5` er pushet.
- Arkitekturen viste at v0.5-motoren bør skrives på nytt. PRD, brief og README er rettet. Beslutninger: ny motor, Sonnet 5.5 for Rådgiver, server i `ByggAPP/server`.
- Elisabeth endret samtidig Vercel til bare AI_BYGGplant (`606ea2f`). Konflikten ble løst til fordel for byggapp, og Oskar sier Vercel ikke trengs nå. Elisabeth setter opp en ny side.
- G115-filene har fått en egen seksjon for prosjektet, med gruppens svar ordrett.
- Epics og stories: `epics.md` med 55 stories, alle FR og NFR koblet. PR #1 er opprettet, ikke flettet.
- Brannregelen er kildesjekket og rettet: fra 5 etasjer plasstøpt og prefab 1,5, stål 3,3 og massivtre 2,5 MNOK. Nye mål: uke 67 og 171 MNOK. Simuleringsreglene, UX-dokumentene og demoen er oppdatert.
- Lukket: `CLAUDE.md` i rotmappen.

### Åpne punkter
- E-posten på commitene er nå koblet til GitHub-kontoen. Tronds gmail-adresse har samme problem (41 commits uten kobling).
- Hvem som eier API-nøkkelen og forbruksgrensen må bekreftes av gruppen.
- Tronds gmail-adresse må kobles til GitHub-kontoen hans.
- Forslagene merket [GROUP TO CONFIRM] i `epics.md` må godkjennes. Regneeksemplene i stories 1.1–1.5 er eldre enn brannregelen og regnes på nytt i story 1.5.
- FR-19 krever 3–4 hendelser, men en plan som unngår alle risikoer kan gi bare 2.
