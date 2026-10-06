# Tilbakemelding på product brief

| | |
|---|---|
| **Gruppe** | G115 – G115-endregaard-haaseth-sandberg |
| **Product brief** | `brief-G115-AI-prosjektledelse-simulering.md` (commit `2d76bf0`) |
| **Tilbakemelding fra** | Faglærer i IBE160 (utarbeidet med KI-støtte) |
| **Dato** | 2026-10-06 |

Briefen er skrevet på engelsk; tilbakemeldingen er på norsk.

## Samlet vurdering

- **Godt utgangspunkt med justeringer.** Gruppen kan gå videre og innarbeide punktene under.

**Det som er bra:**

1. Kjernemekanikken er original og tydelig beskrevet: ved hvert beslutningspunkt gir KI-rådgiveren en anbefaling, studenten bestemmer, og simuleringen kjøres videre to ganger fra samme tilstand – studentens valg og KI-ens valg – side om side. Sammenligningen med debrief i flysimulator gjør pedagogikken lett å forstå.
2. Arbeidsdelingen i scenariogenereringen er klok: en mal-/biblioteklag lager et konsistent skjelett (WBS, ressurser, kost/tid-baseline, milepæler), og språkmodellen legger bare på fortelling og enkelte nye risikohendelser. Det gjør strukturen kontrollerbar.
3. Briefen er ærlig om begrensninger: gruppen har ikke domeneekspertise i bygg eller prosjektledelse, realismen avgrenses av research (PMI, VCS3), og suksesskriteriene er tydelig merket som gruppens egen tolkning.

**De viktigste endringene:**

1. Simuleringsmodellen er ikke beskrevet. Hvordan beregnes konsekvensen av et valg på tidsplan, kostnad og risiko? Uten konkrete regler (f.eks. «å sette inn ekstra mannskap på en aktivitet forkorter varigheten med X % og øker kostnaden med Y») kan verken dere eller sensor kontrollere at de to utfallene er riktige. Dette er kjernen i appen og må på plass før PRD.
2. V1 inneholder alle fire beslutningstyper, alle fem outputtyper, LLM-generert scenario, KI-rådgiver og forking av simuleringen. Det er svært mye. Definer en minimal versjon, f.eks. ett fast scenario med to beslutningstyper, og legg resten i tydelige trinn.
3. Briefen sier ikke hvilken språkmodell som skal brukes, hva det koster, eller hvordan sensor kan kjøre appen uten deres nøkkel. Både scenariogenerering og rådgiver avhenger av den.

## Vanskelighetsgrad og gjennomførbarhet

### Vurdert vanskelighetsgrad

- **Vanskelig**

**Sammenlignbart med:** 3) KI-styrt simulering av prosjektledelse – byggeprosjekt (vanskelig). Briefen bygger direkte på dette forslaget, og forking av simuleringen for å sammenligne studentens og KI-ens valg gjør den om noe mer krevende enn forslaget.

**Begrunnelse:**

| Faktor | Nivå (lav / middels / høy) | Kommentar |
|---|---|---|
| Domenelogikk – hvor mange og hvor kompliserte regler og beregninger må stemme? | Høy | Tidsplan med avhengigheter (Gantt), kostprognose, risikoeksponering og effekten av fire typer beslutninger, i tillegg til deterministisk, gjentakbar tilstand som kan forkes. |
| Datamodell – antall entiteter og relasjoner mellom dem | Høy | Prosjekt, WBS-elementer, aktiviteter med avhengigheter, ressurser, milepæler, risikoer, hendelser, beslutninger og to parallelle tilstandsforløp. |
| Brukere, roller og innlogging | Lav | Én spiller, ingen kontoer i v1. Godt valg. |
| KI-funksjonalitet i appen, f.eks. kall til språkmodell, prompts i koden og håndtering av usikre svar | Høy | Språkmodellen genererer scenariofortelling og risikohendelser og gir anbefalinger med begrunnelse. Anbefalingen må kunne oversettes til en beslutning simuleringen forstår. |
| Integrasjoner og eksterne tjenester, f.eks. API-er, betaling og e-post | Middels | Språkmodell-API. Ingen andre integrasjoner. |
| Sanntid, samtidighet eller flere brukere som påvirker hverandre | Lav | Ikke relevant. |
| Filhåndtering, f.eks. opplasting, PDF-lesing og eksport | Lav | Ikke i v1. |
| Sikkerhet og personvern | Lav | Ingen personopplysninger og ingen kontoer. |

**Hva vanskelighetsgraden betyr for dere:**

- _Vanskelig:_ Et vanskelig prosjekt gir større mulighet for toppkarakter, men også større risiko. Definer en minimal versjon som sikkert kan bli ferdig, og legg resten i tydelige trinn etterpå. Her bør den minimale versjonen være én komplett gjennomspilling av ett fast scenario med forking og side-om-side-sammenligning – det er det som gjør prosjektet unikt.

### Gjennomførbarhet med BMAD og Claude Code

Dere skal planlegge med BMAD (product brief → PRD → arkitektur → epics og stories) og implementere med Claude Code. Vurderingen under tar hensyn til at det må være tid til hele denne flyten, og til testing, retting og README til slutt.

| Spørsmål | Vurdering (OK / risiko / stor risiko) | Kommentar |
|---|---|---|
| **Tid og omfang** – kan v1 realistisk bli ferdig og stabil i løpet av semesteret, med tid til flere iterasjoner? | Stor risiko | Hele v1 slik den er beskrevet, er for mye for et semester med BMAD-flyten, selv for tre personer. Det finnes ennå ingen PRD. |
| **BMAD-flyten** – er briefen konkret nok til at PRD, arkitektur og stories kan lages uten store hull, og blir det overkommelig mange stories? | Risiko | Kjerneløkken og beslutningstypene er tydelige, men simuleringsreglene mangler. Uten dem vil PRD og arkitektur måtte gjette på det viktigste. |
| **Egnet for Claude Code** – bruker løsningen en vanlig, godt dokumentert teknologistakk som Claude Code håndterer godt, eller krever den nisjeteknologi, spesialmaskinvare eller mye manuell konfigurasjon? | OK | En webapp med en simuleringsmotor i vanlig kode, Gantt-visning og LLM-kall er godt dokumentert. |
| **Kontroll på KI-ens arbeid** – kan gruppen selv avgjøre om koden gjør det riktige? Krever domenet kunnskap gruppen ikke har, f.eks. avanserte beregninger eller fagregler, så er det vanskelig å kvalitetssikre. | Stor risiko | Dere sier selv at dere mangler domeneekspertise. Hvis Claude Code også «finner på» simuleringsreglene, kan ingen avgjøre om utfallene er rimelige. Skriv reglene selv, enkle og eksplisitte, og lag håndregnede eksempler med fasit. |
| **Testbarhet** – finnes det tydelige regler og forventede resultater som tester kan skrives mot? | Risiko | Kravet om deterministisk og gjentakbar tilstand er et godt utgangspunkt for tester (samme tilstand og beslutning gir samme utfall). Men uten definerte regler finnes det ingen forventede resultater å teste mot. |
| **Kjørbar for sensor** – kan appen kjøres lokalt etter README, uten gruppens nøkler, betalte kontoer eller egen infrastruktur? | Stor risiko | Suksesskriteriet sier at faglærer skal kunne åpne og spille gjennom appen uten hjelp, men briefen sier ikke hvordan det skjer uten nøkkel. Planlegg en demomodus med fast scenario og lagrede KI-svar. |
| **Avhengigheter og kostnader** – krever løsningen betalte API-er, f.eks. språkmodeller, og finnes det en plan for kostnad, testmodus eller mock-data? | Risiko | Mange LLM-kall per gjennomspilling (scenario, hendelser, anbefaling ved hvert beslutningspunkt). Velg modell og planlegg kostnad og testmodus. |

**Konklusjon om gjennomførbarhet:**

- **Gjennomførbart med justert omfang.** Se forslagene under.

**Forslag til justering av omfang eller vanskelighetsgrad:**

1. Minimal versjon: ett fast, håndlaget scenario (f.eks. et lite bolighus med 10–15 aktiviteter), to beslutningstyper (risikorespons og ressursallokering), forking og side-om-side-sammenligning av tidsplan og kostnad. Legg til endringsforespørsler, planstrategi, risikoeksponering og LLM-generert scenario i senere trinn.
2. Skriv simuleringsreglene som en enkel, eksplisitt modell i briefen eller i et addendum, med 2–3 regneeksempler. Gjør KI-rådgiveren til en som velger blant de samme beslutningsalternativene som studenten, slik at begge veier kan simuleres med samme regler.
3. Utsett LLM-generert scenariofortelling og nye risikohendelser til kjernen virker. De gjør hver gjennomspilling forskjellig, men også vanskeligere å teste.

## Hvorfor product brief er viktig for mappen

Product brief er utgangspunktet for PRD, arkitektur, stories og til slutt koden. Del 1 av mappen vurderes blant annet på om sensor kan følge en sporbar vei fra plan til ferdig app. Den vurderes også på om appen gjør det dere har beskrevet, om den er testet, om den er godt designet, og om den kan kjøres etter README. Et uklart, for stort eller for lite brief gjør alt dette vanskeligere senere. Det er mye enklere å rette nå enn sent i semesteret.

## 1. Gjennomgang av briefens deler

| Del av brief | Status | Kommentar |
|---|---|---|
| Executive Summary – er det klart hva appen er, og hvilket problem den løser? | OK | Tydelig: en simulering der studenten er prosjektleder og sammenligner egne valg med KI-ens anbefaling, simulert fram fra samme tilstand. |
| The Problem – er problemet konkret, med reelle situasjoner og brukere? | OK | Godt formulert: prosjektledelse undervises som statiske artefakter, ikke som beslutninger under usikkerhet. |
| The Solution – beskriver løsningen brukeropplevelsen, ikke bare teknologi? | Juster | Kjerneløkken i fire steg er godt beskrevet. Men hvordan utfallene beregnes – selve simuleringen – er ikke beskrevet, og det er avgjørende for at sammenligningen skal ha verdi. |
| What Makes This Different – er vurderingen ærlig og realistisk? | OK | Ærlig og godt underbygget med Microsoft Project Copilot og VCS3. |
| Who This Serves – er primærbrukerne tydelige, og vet vi hva de trenger? | OK | Studenten som spiller prosjektleder er tydelig primærbruker. |
| Success Criteria – kan kriteriene faktisk sjekkes eller testes? | Juster | Kriteriene er i hovedsak sjekkbare (full gjennomspilling, alle beslutningstyper, to utfall vist). «Update correctly» og «internally coherent» krever at dere definerer hva som er riktig, altså simuleringsreglene. |
| Scope – er det klart hva som er med i første versjon, og hva som ikke er det? | Endre | Tydelig delt i In og Out, men In er for stor. Definer en minimal versjon. På det åpne spørsmålet om domene: forslaget i lista gjelder byggeprosjekt, så det er et naturlig valg å holde seg til. |
| Vision – henger visjonen sammen med resten uten å blåse opp omfanget? | OK | Generalisering til andre domener er tydelig plassert etter prosjektet. |

## 2. Utgangspunkt for del 1 av mappen

Punktene følger kriteriene i sensorveiledningen for del 1. Vektene i parentes viser hvor mye hvert kriterium teller i del 1.

| Kriterium i del 1 | Hva briefen bør legge til rette for | Status | Kommentar |
|---|---|---|---|
| **1. Prosess og KI-styring** (30 %) | Brief som er presis nok til at PRD og stories kan bygges direkte på den, slik at krav kan spores fra brief til kode. | Juster | Kjerneløkken kan spores til stories. Briefen er lastet opp som fil uten videre iterasjon; fortsett med PRD og lagre prompts og KI-økter. |
| **2. Funksjonalitet og omfang** (20 %) | Realistisk omfang for gruppen og semesteret: en tydelig kjerneflyt som kan bli ferdig og stabil, og nok innhold til å vise reell funksjonalitet. | Endre | For stort omfang i v1. Kutt til en minimal versjon som garantert kan bli ferdig og stabil. |
| **3. Kvalitetssikring og testing** (15 %) | Suksesskriterier og funksjoner som er konkrete nok til å bli testtilfeller. | Juster | Determinisme gir godt testgrunnlag, men regler og regneeksempler med fasit mangler. |
| **4. Design og brukeropplevelse** (10 %) | Tydelige brukere og brukssituasjoner som designet kan bygges rundt, gjerne med de viktigste skjermbildene eller flytene skissert. | Juster | Side-om-side-sammenligningen er det viktigste skjermbildet. Skisser hvordan to Gantt-diagrammer og kostnadstall vises sammen uten å bli uoversiktlig. |
| **5. Kodekvalitet og arkitektur** (10 %) | Teknologivalg som er begrunnet og ikke mer komplekse enn appen trenger. | Juster | Teknologi er ikke valgt. Skill tydelig mellom simuleringsmotor (ren, testbar kode), KI-lag og visning i arkitekturen. |
| **6. README og kjørbarhet** (10 %) | Løsning som andre kan kjøre lokalt uten betalte kontoer, og uten tilgang til gruppens egne tjenester og nøkler. | Endre | Planlegg demomodus med fast scenario og lagrede KI-svar, slik at sensor kan spille gjennom uten nøkkel. |
| **7. Ryddighet i repoet** (5 %) | En plan for hvor hemmeligheter, testdata og dokumentasjon skal ligge. | Juster | Briefen ligger løst i rotmappen. Flytt planleggingsdokumentene til en egen mappe (f.eks. `_bmad-output/planning-artifacts/`), og legg nøkler i `.env` utenfor Git. |

## 3. Neste steg for gruppen

1. Skriv ned simuleringsmodellen: hvilke tilstandsvariabler som finnes, hvordan hver beslutningstype endrer dem, og 2–3 regneeksempler med fasit.
2. Definer en minimal versjon (ett fast scenario, to beslutningstyper, forking og sammenligning), og oppdater Scope.
3. Velg språkmodell, planlegg demomodus, og gå videre til PRD.

Oppdater product brief i repoet når dere har gjort endringene, slik at historikken viser hvordan planen utviklet seg. Det er en del av prosessen sensor ser etter.
