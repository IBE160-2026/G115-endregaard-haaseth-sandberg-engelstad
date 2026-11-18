# Merge PR #2 gammel-struktur

## 2026-11-18 kl. 19:56 — Trond Engelstad

### Oppgave
Pull the repo from GitHub, show PR #2 ("Tilbake til den gamle strukturen, med Fra tomt til tak som innhold", by Oskar), and merge it after Trond approved it: "Jeg er Trond og godkjenner Pr #2. Jeg huket også av på GIT hub. Start godkjenning."

### Plan
- Fetch, check that `fiks/gammel-struktur` merges into main without conflicts.
- Merge with `--no-ff` locally (the `gh` CLI is not installed on this PC), so GitHub marks the PR as merged when main is pushed.
- Add the approval to `ByggAPP/G115_Dilemmas.md`; the changelog entry "Repo structure restored – 2026-11-18" was already in the PR.

### Resultat
- Merge commit `23c6d7d` on main: AI_BYGGplant and the agents are back at the root and in `.claude/skills/`, the earlier plans are in `01. Admin/planning-artifacts/`, `02. Arkiv/` is gone from git. No conflicts.
- `ByggAPP/G115_Dilemmas.md`: entry 2, "Approving PR #2", under "Repo structure restored – 2026-11-18".
- Closed two open items from 2026-10-29: `CLAUDE.md` and `README.md` are at the root again.
- Pushed to origin/main. Left on this PC only: the ignored folder `02. Arkiv/AI_BYGGplant/node_modules/`, which can be deleted by hand.

### Åpne punkter
- Publishing AI_BYGGplant: `vercel.json` is in `ByggAPP/`, so Elisabeth and Trond must agree on it (already listed under "Choose how to publish AI_BYGGplant").
