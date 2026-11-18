# Tilbakemelding på PRD

| | |
|---|---|
| **Gruppe** | G115 – G115-endregaard-haaseth-sandberg |
| **PRD vurdert** | `01. Admin/planning-artifacts/prds/prd-fra-tomt-til-tak-2026-10-31/prd.md` (status `final`, sist endret 2026-11-05, commit d2f67f5) |
| **Dato** | 2026-11-12 |
| **Type** | Formativ tilbakemelding, ikke karakter |

## 1. Samlet inntrykk

Dette er en sterk PRD med egen tese, dyp domenesubstans og krav som stort sett kan bli testtilfeller. Risikoen ligger i tre ting: KI-samtalen (FR-17) er «must-have» uten avgjort leverandør og uten testbare konsekvenser, de seks sist tilføyde kravene (FR-32 til FR-37) mangler det som gjør de andre kravene gode, og MVP har ingen kuttlinje for et team på tre.

## 2. Dette fungerer godt

- **Tesen styrer innholdet.** §1 og tilleggsdokumentet bygger på én idé: studenten opplever hvorfor byggeprosjekter går over tid og budsjett, og rådgiveren bruker referanseklasser («Comparable projects took about X weeks»). FR-15 tvinger fram kilde og årstall, og bare prosjekter med kilde kan siteres.
- **Lærings­målene er koblet til krav og måles.** §4.10 gir hvert av de fire målene en «Missed when»-betingelse som FR-27 bruker, og betingelsen vurderer forventet kostnad, ikke flaks («so bad luck is not punished»). SM-C1 til SM-C3 er ekte motmål, ikke pynt.
- **Regnbare, kontrollerbare krav.** FR-24 gir en budsjettbro i fast rekkefølge som «add up exactly», FR-30 krever identisk resultat for samme seed, og FR-31 krever regneeksempler som kjøres som tester. Dette svarer på det viktigste i tilbakemeldingen på briefen.

## 3. Oversikt per dimensjon

| Dimensjon | Vurdering | Kort begrunnelse |
|---|---|---|
| Beslutningsklarhet | god | §10 viser avvik fra briefen, og NOTE FOR PM i NFR-2 peker på en reell spenning. Men språkmodell og hosting (Åpent spørsmål 3) er ikke avgjort, selv om FR-17 er «must-have». |
| Substans | sterk | Konkrete kilder og regler (TEK17, aml. § 10-6, Valle Wood). Ingen pynte-personas eller boilerplate-NFR-er; NFR-9 om klarspråk er produktspesifikk. |
| Strategisk sammenheng | sterk | Tese, læringsmål, FR-er og SM-er henger sammen. FR-32 til FR-37 er derimot lagt til for å dekke oppgaveteksten, ikke fra tesen. |
| Testbarhet | god | FR-1 til FR-31 har «Consequences (testable)». FR-32 til FR-37 har ingen, og FR-17 har ingen kontroll av selve KI-svaret. |
| Scope og avgrensning | god | Ikke-mål (§7) og «Out of Scope» (§8.2) er eksplisitte. Størrelsen er den svake siden: alt er «in scope», uten prioritering. |
| Brukbarhet for neste fase | god | Glossar og ID-er er gode. Noen begreper brukes uten definisjon, og alle FR-er viser til samme UJ-1. |
| Formtilpasning | god | Maler tilpasset produktet (§4.10, §13). Skjøtene vises: §4.11 er et tillegg midt i funksjonsdelen, og FR-38 ligger i §4.8. |

## 4. Viktigste forbedringer

### 4.1 KI-samtalen (FR-17) er «must-have», men uavklart og uten kontroll av svaret
- **Alvorlighet:** høy
- **Hvor:** FR-17 «The answer never states a figure that differs from the building-block model»; §6 «at most about 20 calls per playthrough» [ASSUMPTION]; NFR-2; Åpent spørsmål 3.
- **Problem og hvorfor det betyr noe:** Kravet sier hva som ikke skal skje, men ikke hvordan det oppdages eller testes. Leverandør og hosting er åpne, og den serverfunksjonen som skjuler nøkkelen kan kalles av hvem som helst på en offentlig side. Taket på 20 kall gjelder per spilløkt, ikke per dag. Arkitektur og testing kan ikke starte uten dette.
- **Forslag:** Legg til konsekvenser, for eksempel: «Hvert tall i et språkmodellsvar sjekkes mot byggeklossmodellen; ved avvik forkastes svaret og det nærmeste ferdige svaret vises, og avviket logges.» «Ved feil, timeout (10 s) eller etter 20 kall vises ferdig svar, og studenten får beskjed.» «`LLM_MODE=mock` gir faste svar, og alle automatiske tester kjører i den modusen.» «Serverfunksjonen har dagsgrense og rate limit.» Avgjør leverandør, eller sett FR-17 til «should have» til hosting er på plass.

### 4.2 FR-32 til FR-37 og NFR-10 mangler testbare konsekvenser
- **Alvorlighet:** høy
- **Hvor:** §4.11, f.eks. FR-33 «The central site has a maximum number of workers at once» og FR-32 «Stage 2 shows whether each is met».
- **Problem og hvorfor det betyr noe:** De andre FR-ene har konsekvenser, disse seks har bare én setning. FR-33 oppgir ikke tallet, FR-32 sier ikke hvordan et milepæl­krav regnes som oppfylt, og FR-37 er et dokumentkrav, ikke et produktkrav. Her ville stories bli gjettet.
- **Forslag:** «**FR-33** … Consequences: Et valg som gir flere enn N arbeidere samtidig (N står i simulation-rules) er ikke valgbart; rådgiveren nevner grensen; avvisningen logges i beslutningsloggen.» Flytt kravene dit de hører hjemme (milepæler til §4.3, kapasitet og prognose til §4.7), og behold ID-ene.

### 4.3 MVP har ingen kuttlinje
- **Alvorlighet:** medium
- **Hvor:** §8.1 «FR-1 to FR-31 … FR-32 to FR-38 and NFR-10».
- **Problem og hvorfor det betyr noe:** 38 FR-er, 10 NFR-er, 3D-visning, Gantt, KI-samtale, deterministisk motor og debrief er mye for tre personer på ett semester. Briefen ble bedt om å definere en minimal versjon. §8.2 bruker MoSCoW for det som er ute, men ikke for det som er inne.
- **Forslag:** Merk hver FR «must», «should» eller «could». Definer et vertikalt snitt som er en komplett spilløkt med ferdige svar, for eksempel FR-1, 3 til 8, 10 til 13, 18 til 24 og 30 til 31. Si hva som kuttes først (for eksempel FR-28, FR-35, FR-38 og vanskelighetsgraden i FR-1).

### 4.4 Begreper brukes uten definisjon, og to av dem overlapper
- **Alvorlighet:** medium
- **Hvor:** FR-19 «external risks» mot FR-21 «known risk occurs»; FR-22 og FR-28 «recommendation» mot Glossary «Suggestion»; FR-1 «difficulty».
- **Problem og hvorfor det betyr noe:** Det er uklart om en kjent risiko som inntreffer teller blant de 3–4 hendelsene. «Recommendation», «milestone», «opportunity», «difficulty», «site overhead» og «critical path» finnes ikke i glossaret. R30 brukes både for «liten forskjell» i FR-14 og «liten effekt» i FR-38. Brukergrensesnittet er norsk (NFR-6), glossaret engelsk.
- **Forslag:** Legg til «**External risk** — a known risk that occurs in stage 2; it counts toward the 3–4 events in FR-19», definer «Recommendation» og de andre begrepene, og legg til en kolonne med norsk visningsnavn.

### 4.5 Ett UJ og noen synkroniseringsfeil
- **Alvorlighet:** lav
- **Hvor:** Status `final`; §2.1 «(Examiner) Run the simulator from the README without keys»; SM-1 «Validates FR-1 to FR-29»; addendum «FR-35 (proposed)».
- **Problem og hvorfor det betyr noe:** Alle FR-er sier «Realizes UJ-1», så sporingen skiller ingenting. Sensorveien (SM-4) har ingen reise. Statusen `final` stemmer dårlig med fem åpne spørsmål, og addendumet er utdatert.
- **Forslag:** Legg til UJ-2 «Sensoren kjører spillet uten nøkkel» og knytt FR-16, FR-17-fallback og NFR-1 til den. La SM-ene også dekke FR-30 til FR-38 og KI-svarkvaliteten. Oppdater addendumet.

## 5. Mekaniske funn

- FR-1 til FR-38 er sammenhengende uten duplikater, men FR-38 ligger i §4.8 etter FR-29, og NFR-10 ligger i §4.11 mens NFR-1 til NFR-9 står i §5.
- `[ASSUMPTION]` går opp: tre inline (FR-18, NFR-4, §6) og tre i §12.
- Krysshenvisninger til FR-30, FR-38, §4.10, §12 og §13 løser seg. R29 og R30 peker til `simulation-rules.md`, og verdiene står ikke i PRD-en. Kontroller at AD-4 og AD-6 i §10 finnes i arkitekturen.
- Addendumet har `status: draft` og kaller FR-35 «proposed», mens PRD-en sier at kravet er godkjent.
- Ingen sensitive opplysninger funnet.

## 6. Før dere går videre

**Må avklares før UX, arkitektur og epics:**
- Språkmodell, hosting og kostnadsgrenser for FR-17 (Åpent spørsmål 3), og om NFR-1 «no backend» skal gjelde.
- Målverdier og valgmengder (Åpent spørsmål 1 og 2). Står svarene nå i `simulation-rules.md`, så flytt dem inn eller henvis og fjern spørsmålene.
- MVP-kuttlinjen (4.3) og testbare konsekvenser for FR-32 til FR-37.
- Forholdet mellom kjent risiko, ekstern risiko og hendelse.

**Kan vente:** bedre kilder til fasefordeling og tomtepriser (Åpent spørsmål 4 og 5, er merket som estimat), 30 fps-grensen i NFR-4, og et konkret mål for kontrast i NFR-5.

**Oppfølging av tilbakemelding på product brief: delvis.** Simuleringsreglene er skrevet med regneeksempler (FR-31), og kjøring uten nøkkel er et krav (NFR-1, FR-16). Språkmodell er fortsatt ikke valgt, og scopet er økt i stedet for kuttet til en minimal versjon.

## 7. Refleksjonsspørsmål

1. Rådgiverens forslag og advarsler er regelstyrte, mens fritekst går til en språkmodell. Hvordan bestemte dere hva KI-en fikk formulere fritt, og hva ville dere gjort om et svar oppga feil tall i en test?
2. FR-32 til FR-37 ble lagt til etter en gjennomgang mot oppgaveteksten. Hva i dem kom fra dere og hva fra KI-en, og hvordan sjekket dere at de tjener tesen og ikke bare dekker oppgaveteksten?

_Vurdert mot kvalitetsrubrikken i bmad-prd. Dette er veiledning, ikke sensur._
