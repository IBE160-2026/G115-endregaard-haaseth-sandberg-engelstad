# Opprydning i repoet og Bårds PRD-tilbakemelding

## 2026-11-18 kl. 17:50 — Oskar Lia

### Oppgave
Trond meldte at flettingen 10. nov rotet til repoet. Få tilbake strukturen fra før flettingen, med «Fra tomt til tak» som innhold, og med de gamle ideene lett tilgjengelige. Sjekke om Bård har lagt inn noe nytt.

### Plan
- Analyse av `main` før flettingen (`33da81c`) mot nå. Tre løsninger ble lagt fram: A rydde forover, B revert, C force-push. Oskar valgte A («Gjør som anbefalt»).
- Ny branch `fiks/gammel-struktur` fra `main`, med PR som Trond godkjenner.

### Resultat
- Lokal `main` er oppdatert (den var 62 commits bak). Remote-URL endret til `G115-endregaard-haaseth-sandberg-engelstad`. Loggcommiten fra 10. nov ble cherry-picket inn i den nye branchen.
- `0b360ab` på `fiks/gammel-struktur`: `AI_BYGGplant/` er tilbake på rot (identisk med main), agentene er tilbake i `.claude/skills/` (og lastes igjen), og den gamle briefen og PRD-ene ligger i `01. Admin/planning-artifacts/`. README er tilbake i `01. Admin/` med en seksjon om tidligere ideer, `02. Arkiv/` er fjernet, og v0.5 er dekket av taggen. `bc83720`: henvisningene i arkitektur, epics og brief er rettet, og G115-filene har fått en oppføring.
- Avvik fra den gamle strukturen: `CLAUDE.md` på rot, den gamle briefen i `briefs/` og `vercel.json` i `ByggAPP/` (Elisabeths valg).
- PR #2 er opprettet, ikke flettet.
- Bård har ikke gjort noe siden 12. nov. Da la han inn en PRD-tilbakemelding (sterk PRD, men FR-17 mangler testbarhet og leverandør, FR-32–37 mangler konsekvenser, og MVP mangler kuttlinje) og `technology.md`, som beskriver en annen nettside (Pytagoras).
- Lukket: «si fra til Trond om 02. Arkiv» (erstattet av PR #2).

### Åpne punkter
- Trond godkjenner PR #2.
- Vercel for AI_BYGGplant avklares av Elisabeth og Trond.
- Bårds PRD-tilbakemelding må følges opp.
- Spør Bård om formålet med `technology.md`.

## 2026-11-18 kl. 18:03 — Oskar Lia

### Oppgave
Pushe loggen, gå gjennom Bårds PRD-tilbakemelding (12. nov) og gjøre endringene han anbefaler.

### Plan
- Ny branch `prd/tilbakemelding-bard` oppå `fiks/gammel-struktur` (PR #3 bygger på PR #2).
- Svar på punktene 4.1–4.5 i tilbakemeldingen. Konsekvensene for FR-32–35 følger forslagene R31–R34 i epics, historie 1.1–1.4.

### Resultat
- Loggen er pushet til PR #2.
- `10ff859`: PRD-en er revidert. FR-17 har fått leverandør og testbare konsekvenser. FR-32–36 og NFR-10 har fått konsekvenser og er flyttet til sine seksjoner, og FR-37 er gjort til dokumentkrav i §13. §8 har fått must/should/could, et vertikalt snitt og en kuttrekkefølge, mens hele scopet beholdes. Ordlisten er en tabell med norske navn og ti nye begreper. UJ-2, SM-5 og SM-6 er lagt til, og besvarte åpne spørsmål er fjernet. Addendumet, arkitekturhenvisningen §8.3 og EXPERIENCE.md er oppdatert, og memlogen har fått en oppføring.
- PR #3 er opprettet med base `fiks/gammel-struktur`, ikke flettet.
- Lukket: «følg opp Bårds PRD-tilbakemelding», «FR-32 til FR-37 mangler testbare konsekvenser» og «FR-19 3–4 hendelser».
- Oppdaget: memlogen viser at README ble flyttet til rot 5. nov så GitHub og sensor finner den. PR #2 flytter den tilbake til `01. Admin/`.

### Åpne punkter
- Gruppen bekrefter prioriteringene, R31–R34 og SM-5 i PR #3.
- README: rot eller `01. Admin/`.
- Refleksjonsspørsmålene i Bårds §7.
- Tillegg samme dag: Oskar sa ja til å la README ligge på rot. `a614106` og `651d8d8` på `fiks/gammel-struktur` flytter den tilbake til rot og retter lenkene og G115-filene. Beskrivelsen av PR #2 er oppdatert. Rettelsen er flettet inn i `prd/tilbakemelding-bard`.

## 2026-11-18 kl. 20:44 — Oskar Lia

### Oppgave
Pull og se hva som har skjedd.

### Plan
- Hente fra GitHub, oppdatere lokal `main`, lese Tronds commits og sjekke hva som gjenstår i epics.

### Resultat
- Trond flettet PR #2 (`23c6d7d`) og PR #3 (`46ff35e`) 18. nov. Gruppen bekreftet alle fire punktene: «Pr #3- Vi bekrefter alle 4 punktene.» Trond markerte dem som bekreftet i PRD-en og epics historie 1.1–1.4, og la inn G115-oppføringer (`4b8dfa3`, `ac788dc`).
- Lokal `main` er oppdatert til `ef0b509`.
- Eneste [GROUP TO CONFIRM] igjen er de to R30-forslagene i historie 1.5. Forslag 2 (0,5 % for «liten» i debriefen) motsier en merknad jeg la i PRD-ordlisten i PR #3, som sier at 2 % gjelder begge steder.
- Lukket: PR #2-godkjenning, PR #3-bekreftelse og [GROUP TO CONFIRM] for historie 1.1–1.4.

### Åpne punkter
- R30-forslagene i historie 1.5 må avgjøres, og PRD-merknaden rettes etter det.

## 2026-11-18 kl. 20:57 — Oskar Lia

### Oppgave
Flytte unødvendige filer til arkivet, så ingen jobber i feil fil.

### Plan
- Kartla fire grupper: gamle planer, `technology.md`, AI_BYGGplant med agentene, og v0.5-koden. Oskar valgte bare «Gamle planer».
- `main` lå 6 commits bak (Trond: historie 1.5, refleksjonsutkast, technology.md-spørsmål). Den ble oppdatert med rebase før arbeidet startet.

### Resultat
- `chore/arkiver-gamle-planer`: forrige brief og tre PRD-er er flyttet til `02. Arkiv/planning-artifacts/`. Det finnes en ny `02. Arkiv/README.md`, README lenker til arkivet, og briefen og G115-filene er oppdatert. `CLAUDE.md` har fått en regel om at arkivet er historikk.
- PR #4 er opprettet, ikke flettet.
- Lukket: R30-forslagene i historie 1.5 (Trond, `e0aeac6`).
- Påminnelse etter Tronds CLAUDE.md-regel: Oskar har ikke lagt inn refleksjonsinnspill i `refleksjon-prd.md`.

### Åpne punkter
- PR #4 må godkjennes.
- Oskars refleksjonsinnspill.

## 2026-11-18 kl. 21:11 — Oskar Lia

### Oppgave
Systematisere repoet: få ByggAPP og resten til å ligge under «Fra tomt til tak», siden mange ulike ideer og prosjekter har gjort det uoversiktlig.

### Plan
- Kartla årsaken: `ByggAPP/` inneholdt v0.5, `01. Admin/` inneholdt hele planen, og AI_BYGGplant lå på rot. `ByggAPP` var nevnt 93 steder.
- Oskar valgte «Én prosjektmappe» og AI_BYGGplant «Til arkivet».
- Branch `chore/en-prosjektmappe` oppå PR #4.

### Resultat
- Ny struktur: `FraTomtTilTak/` med `app/` (tidligere ByggAPP), `planlegging/` (tidligere `01. Admin/planning-artifacts/`), `implementering/` og G115-filene. `01. Admin/` har bare kursmateriale. AI_BYGGplant, agentene og v0.x-specs er flyttet til `02. Arkiv/`.
- BMAD-oppsettet, README, `CLAUDE.md`, de gjeldende planleggingsdokumentene og spillagentene peker til de nye stiene. Relative lenker er sjekket. Historiske filer er ikke endret.
- Bekreftet: `npm ci`, 187 tester og `npm run build` i `FraTomtTilTak/app`.
- PR #5 er opprettet (base: PR #4-branchen), ikke flettet.

### Åpne punkter
- PR #4 og deretter PR #5 må godkjennes.
- Root Directory i Vercel må settes til `FraTomtTilTak/app` (Elisabeth).

## 2026-11-18 kl. 21:18 — Oskar Lia

### Oppgave
GitHub viste ikke den nye strukturen. Få alt over i `main`.

### Plan
- PR #4 og #5 var pushet, men ikke flettet. Flette #4, peke #5 mot `main` og flette den, og lukke PR #3, som allerede var flettet i `main` av Trond.

### Resultat
- PR #4 flettet (`c1175fd`) og PR #5 flettet (`02d4110`). PR #3 er lukket med en kommentar om at innholdet er i `main` (`46ff35e`).
- `main` på GitHub har nå `FraTomtTilTak/`, `01. Admin/` og `02. Arkiv/`. Lokal `main` er oppdatert.

### Åpne punkter
- Elisabeth endrer Root Directory i Vercel til `FraTomtTilTak/app` (står allerede i issues).

## 2026-11-18 kl. 21:29 — Oskar Lia

### Oppgave
Oskar trodde loggen manglet arbeid, siden den bare hadde 252 linjer. Han ønsket en loggfil per arbeidsdag, og at den gamle fila ble splittet.

### Plan
- Sjekket git-historikken: ingenting var fjernet. Alt lå i én fil, fordi skillen legger samme arbeid i samme fil.
- Lagret preferansen «én fil per dag» i Claudes hukommelse på Oskars maskin. Den delte skillen er ikke endret.
- Splittet fila etter dato på branchen `docs/dagslogg-oskar`.

### Resultat
- Seks dagsfiler: 999 (29. okt), 998 (31. okt), 997 (2. nov), 996 (5. nov), 995 (10. nov) og 994 (18. nov). Innholdet er uendret (sjekksummen er lik), med en ny overskrift per fil.
- Lenkene i `issues.md` peker til riktig dagsfil.
- Trond har en ufflettet branch `chore/branch-arbeidsflyt` med en regel om branch og PR for alt.

### Åpne punkter
- Trond lager PR for `chore/branch-arbeidsflyt`, og et annet medlem godkjenner.
