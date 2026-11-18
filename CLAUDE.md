## Sesjonslogg

Når en oppgave eller økt avsluttes, før sluttoppsummeringen, bruk `sesjonslogg`-skillen: dokumenter Oppgave + Plan + Resultat + åpne punkter i `.logs/<bruker>/`, og før åpne punkter i `.logs/<bruker>/issues.md`. Skillen committer loggfila lokalt; push gjør du selv. Gruppens egne regler for commit og språk gjelder foran dette.

## Arkivet er historikk

Alt for prosjektet ligger i `FraTomtTilTak/`: koden i `app/`, planene i `planlegging/`, stories og sprintstatus i `implementering/`.

`02. Arkiv/` holder det *Fra tomt til tak* har erstattet: gamle planer, v0.x-specs og AI_BYGGplant med agentene. Ikke rediger filene der, og ikke bygg krav, regler eller kode på dem med mindre noen ber om det. Det er greit å lese i arkivet for å hente ideer, men si da hvilken fil ideen kommer fra. Eneste planlagte unntak: story 3.7 kopierer og tilpasser serverkode fra `02. Arkiv/AI_BYGGplant/server` (kopieres, importeres aldri).

## Reminder: reflection note before submission

Until `FraTomtTilTak/planlegging/prds/prd-fra-tomt-til-tak-2026-10-31/refleksjon-prd.md` has `status: final`:

- **At the start of every session**, check the table "Before submission: everyone adds their input" in that file. If the current git user (`git config user.name`; if it is unset, ask who is working) has not ticked "Input added", remind them in one line that every member must add their reflection input before submission (Bård's PRD feedback §7).
- **When a member gives input** ("legg inn mitt refleksjonsinnspill", or similar), write it under their name in "Input from the group", tick their box, and put each part where the file's table "Where input ends up" says: the draft answers, `FraTomtTilTak/G115_Dilemmas.md`, `prd.md` via a pull request, or their own `.logs/<name>/issues.md`. Quote their words; do not invent input for anyone.
- When all four have ticked both columns, ask the group whether to set `status: final`.
