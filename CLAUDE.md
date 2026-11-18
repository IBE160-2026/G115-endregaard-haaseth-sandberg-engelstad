## Sesjonslogg

Når en oppgave eller økt avsluttes, før sluttoppsummeringen, bruk `sesjonslogg`-skillen: dokumenter Oppgave + Plan + Resultat + åpne punkter i `.logs/<bruker>/`, og før åpne punkter i `.logs/<bruker>/issues.md`. Skillen committer loggfila lokalt; push gjør du selv. Gruppens egne regler for commit og språk gjelder foran dette.

## Arkivet er historikk

`02. Arkiv/` holder planer som *Fra tomt til tak* har erstattet. Ikke rediger filene der, og ikke bygg krav, regler eller kode på dem med mindre noen ber om det; de gjeldende planene ligger i `01. Admin/planning-artifacts/`. Det er greit å lese i arkivet for å hente ideer, men si da hvilken fil ideen kommer fra.

## Reminder: reflection note before submission

Until `01. Admin/planning-artifacts/prds/prd-fra-tomt-til-tak-2026-10-31/refleksjon-prd.md` has `status: final`:

- **At the start of every session**, check the table "Before submission: everyone adds their input" in that file. If the current git user (`git config user.name`; if it is unset, ask who is working) has not ticked "Input added", remind them in one line that every member must add their reflection input before submission (Bård's PRD feedback §7).
- **When a member gives input** ("legg inn mitt refleksjonsinnspill", or similar), write it under their name in "Input from the group", tick their box, and put each part where the file's table "Where input ends up" says: the draft answers, `ByggAPP/G115_Dilemmas.md`, `prd.md` via a pull request, or their own `.logs/<name>/issues.md`. Quote their words; do not invent input for anyone.
- When all four have ticked both columns, ask the group whether to set `status: final`.
