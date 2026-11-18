# Vercel Root Directory til FraTomtTilTak/app

## 2026-11-18 kl. 21:49 — Elisabeth-himolde

### Oppgave
Etter at PR #5 samlet prosjektet i `FraTomtTilTak/`, skulle Vercel bygge fra den nye mappen i stedet for `ByggAPP`. I samme økt: pushe lokale commits, oppdatere git-remote til repoets nye adresse og rydde den lokale mappen så den er lik GitHub.

### Plan
- Fortsettelse av [vercel-kun-byggapp](997-2026-11-11-19-48-11-vercel-kun-byggapp.md), der Root Directory ble satt til `ByggAPP`.
- Endre Root Directory via Vercel CLI (`vercel api`, PATCH `/v9/projects/{id}`), verifisere med `vercel project inspect`.
- Pushe `main` slik at Vercel bygger på nytt, og vente på at produksjonsbyggingen blir Ready.
- Oppdatere `origin` til ny GitHub-adresse og fjerne ignorerte restmapper med `git clean -fdx`.

### Resultat
- Vercel-prosjektet `g115-endregaard-haaseth-sandberg-engelstad` (`prj_3JF5eLncfZxpmSgUpDtVVbsRoaUu`): Root Directory endret fra `ByggAPP` til `FraTomtTilTak/app`. Verifisert med `vercel project inspect`, og sjekket på nytt senere i økten (uendret). Ingen filer i repoet endret; `FraTomtTilTak/app/vercel.json` (Vite, `npm ci`, `npm run build`, `dist`) gjelder fortsatt.
- Pushet `main` (`94c8f7e..aad6087`): tre tidligere loggcommits (vercel-kun-byggapp) og tre merge-commits fra pull.
- Produksjonsbyggingen etter pushen ble **Ready** med ny rotmappe. De to byggene rett før (etter PR #5) feilet, fordi Vercel da lette i `ByggAPP/`.
- `origin` endret til `https://github.com/IBE160-2026/G115-endregaard-haaseth-sandberg-engelstad.git` (repoet er flyttet på GitHub). Kjørt av brukeren med `!`; første forsøk fikk et `!` på slutten av URL-en og ble rettet. `git fetch` virker.
- Lokal mappe lik GitHub: `git clean -fdx` (kjørt av brukeren) fjernet `AI_BYGGplant/`, `ByggAPP/` og `node_modules/` (kun `node_modules`/`dist`, ingen egne filer). `main` i synk med `origin/main`.
- Loggen pushet (`0299574`).
- Vercel ryddet etter brukerens eksplisitte bekreftelse: 44 gamle utrullinger slettet med `vercel rm` (AI_BYGGplant 3.–9. nov., ByggAPP 10.–18. nov., 9 feilede bygg og forhåndsvisninger fra grener). Igjen er kun `dpl_AmmREmh3zzPQstnM7Kzy1Y4qAnk1` (produksjon, commit `0299574`, bygget fra `FraTomtTilTak/app`). Prosjektet har ingen miljøvariabler og kun standarddomenet `g115-endregaard-haaseth-sandberg-en.vercel.app` (svarer 200). Det finnes bare ett Vercel-prosjekt; ingen egne prosjekter for ByggAPP eller AI_BYGGplant. Ingen endring i GitHub-repoet; GitHubs «Deployments»-oppføringer for gamle commits blir stående med døde lenker.
- Merk: den publiserte appen viser fortsatt v0.5-spillet, fordi `FraTomtTilTak/app` ennå ikke er erstattet (story 1.6).

### Åpne punkter
- Legge inn eget refleksjonsinnspill og krysse av «Input added» i `FraTomtTilTak/planlegging/prds/prd-fra-tomt-til-tak-2026-10-31/refleksjon-prd.md` (Bårds PRD-tilbakemelding §7), og bekrefte/rette raden om Vercel og Claude-nøkkel i «Who did what».
- Før sprintplanlegging: `_bmad/config.toml` peker `planning_artifacts` og `implementation_artifacts` til `.docs/`, ikke til `FraTomtTilTak/planlegging` og `FraTomtTilTak/implementering`.
