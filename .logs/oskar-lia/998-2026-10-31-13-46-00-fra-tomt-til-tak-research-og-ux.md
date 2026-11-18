# Fra tomt til tak: brief, research, PRD og UX

## 2026-10-31 kl. 13:46 — Oskar Lia

### Oppgave
Lage prosjektet «Fra tomt til tak» fra bunnen på branchen `forslag/tre-stadier`, uten å påvirke main: ny product brief, research på tall og referanseprosjekter, og en PRD med simuleringsregler. Presentasjonen for gruppen er droppet; neste uke lages et sammendrag i stedet.

### Plan
- Ny brief i coaching-modus (`bmad-product-brief`), polert og satt til ferdig.
- To research-runder i bakgrunnen (`bmad-deep-recon`): tall til byggekloss-modellen, og ekte referanseprosjekter og kilder til hendelsene.
- PRD i coaching-modus (`bmad-prd`) med Sara som brukerreise, deretter gjennomgang mot BMADs sjekkliste og sjekk mot briefen, researchen, oppgaveteksten og sensorveiledningen.
- Simuleringsreglene skrevet som eget dokument med regneeksempler med fasit.
- Plandokumenter: [brief](../../01.%20Admin/planning-artifacts/briefs/brief-G115-tre-stadier-2026-10-29/brief.md), [PRD](../../01.%20Admin/planning-artifacts/prds/prd-fra-tomt-til-tak-2026-10-31/prd.md), [simuleringsregler](../../01.%20Admin/planning-artifacts/prds/prd-fra-tomt-til-tak-2026-10-31/simulation-rules.md).

### Resultat
- Commits på `forslag/tre-stadier` (ikke pushet): `09c9e9b` brief, `d60963a` og `012aeb6` research, `e62d8d2` PRD-utkast, `616dde7` simuleringsregler, `70c482f` én sentrumstomt, `0004f9f` bånd og rangering, `c762043` PRD ferdig.
- **Brief** (status final): tre stadier (planlegge, gjennomføre, debrief), studenten som prosjektleder, ca. 20 minutter, fire læringsmål, 100 arbeidsplasser i Oslo, fiktiv byggherre, 3D-panel i stedet for gåing, beslutningslogg i stedet for innlogging (åpent på GitHub, fiktive data). Senere oppdatert til PRD-beslutningene.
- **Research:** 23 m² BTA per arbeidsplass gir 2 300 m²; prisindeks ×1,524; overtid minst 40 %; ekte referanseprosjekter for massivtre og stål/prefab (Valle Wood, Statens hus Nordfjordeid m.fl.), ingen for plasstøpt betong; fasefordeling fra ett prosjekt; byggeprosjekter sprekker i snitt 32 % på tid og 62 % på kostnad.
- **PRD** (status final): UJ-1 Sara, FR-1 til FR-38, NFR-1 til NFR-10, læringsmål koblet til krav (§4.10), sporingstabell mot oppgaveteksten (§13). Viktige beslutninger: én sentrumstomt med én tomtepris, avveining tomteareal mot etasjekostnad med tid som motvekt, seks hoveddeler, rådgiver som coach som siterer ekte prosjekter ved mer enn 20 % avvik, fritekst mot språkmodell som must (krever serverfunksjon), mål som ramme med bånd, og debrief som rangerer valgene etter betydning.
- **Simuleringsregler:** R1–R30 med fire regneeksempler, regnet ut eksakt. Mål uke 67 / 169 MNOK; 7 etasjer er billigst, men rekker fristen bare med stål eller massivtre. Brannklasse 3 fra 5 etasjer er kildesjekket mot TEK17; kostnadstrinnet er estimat.
- Gjennomgang og sjekker: 3 rapporter i PRD-mappa (`review-rubric.md`, `reconcile-brief.md`, `reconcile-research-and-course.md`); alle alvorlige funn rettet.
- Forslaget fra 2026-10-29 er avklart av Oskar (punktet om planleggingsprosesser, læringsmål og beslutningslogg i issues.md er lukket). Vedlegg A-tallene i den gamle briefen er erstattet av de nye simuleringsreglene.

### Åpne punkter
- Gruppen må godkjenne estimatene i §5 i simuleringsreglene (rigg og drift per uke, byggekostnad, faktorer per bæresystem, brann- og vindtall, timesats), 5 %-båndet og brannkostnadsregelen (brannbeskyttelse av stål mot analyse for massivtre).
- FR-32 til FR-37 i PRD-en mangler testbare konsekvenser; i simuleringsreglene §5 punkt 5 må formuleringen om prefab og stål sjekkes.
- FR-17 (fritekst mot språkmodell) er must og krever Vercel og en serverfunksjon før den bygges.
- Gruppen må bestemme om retningen tas i bruk (PR fra `forslag/tre-stadier` til main).

## 2026-10-31 kl. 15:30 — Oskar Lia

### Oppgave
Starte UX for «Fra tomt til tak» (`bmad-ux`) på samme branch.

### Plan
- Coaching først, deretter rask modus etter Oskars ønske. UX-mappe: `01. Admin/planning-artifacts/ux-designs/ux-fra-tomt-til-tak-2026-10-31/`.

### Resultat
- Beslutninger i UX-memloggen: både spill og profesjonelt verktøy; Fluent-stilen beholdes; rådgiveren har ansikt og navn (plassholder «Rådgiver») og er et lite vindu som alltid er åpent i et hjørne.
- Tre visuelle retninger laget i `.working/`; retning 2 «Prosjektverktøy» valgt. Committet.
- Utkast til DESIGN.md og EXPERIENCE.md lages i rask modus.

### Åpne punkter
- Navnet på rådgiveren.
- Gå gjennom og finjustere utkastene til DESIGN.md og EXPERIENCE.md.
