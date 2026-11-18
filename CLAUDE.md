## Sesjonslogg

Når en oppgave eller økt avsluttes, før sluttoppsummeringen, bruk `sesjonslogg`-skillen: dokumenter Oppgave + Plan + Resultat + åpne punkter i `.logs/<bruker>/`, og før åpne punkter i `.logs/<bruker>/issues.md`. Skillen committer loggfila lokalt; push gjør du selv. Gruppens egne regler for commit og språk gjelder foran dette.

## Reminder: reflection note before submission

Until `01. Admin/planning-artifacts/prds/prd-fra-tomt-til-tak-2026-10-31/refleksjon-prd.md` has `status: final`:

- **At the start of every session**, check the table "Before submission: everyone adds their input" in that file. If the current git user (`git config user.name`; if it is unset, ask who is working) has not ticked "Input added", remind them in one line that every member must add their reflection input before submission (Bård's PRD feedback §7).
- **When a member gives input** ("legg inn mitt refleksjonsinnspill", or similar), write it under their name in "Input from the group", tick their box, and put each part where the file's table "Where input ends up" says: the draft answers, `ByggAPP/G115_Dilemmas.md`, `prd.md` via a pull request, or their own `.logs/<name>/issues.md`. Quote their words; do not invent input for anyone.
- When all four have ticked both columns, ask the group whether to set `status: final`.

## Git: work on a branch, never directly on main

Each member's Claude Code has its own memory; only this file is shared. So these rules apply to everyone:

- **Start:** `git switch main`, `git pull`, then `git switch -c <type>/<short-name>` (for example `docs/r31-r34`, `fiks/…`, `feat/…`). One branch per task.
- **Never commit or push directly to `main`.** Push the branch (`git push -u origin <branch>`) and open a pull request to `main` on GitHub. Another member approves before it is merged.
- **Before the pull request:** `git pull origin main` into the branch and resolve any conflicts there, not on `main`.
- **G115 files** (`G115_Changelog.md`, `G115_Dilemmas.md`) and the session log are updated in the same branch as the change they describe.
- Keep branches short-lived, and delete them after merging, so pull requests are not left pointing at old branches.
