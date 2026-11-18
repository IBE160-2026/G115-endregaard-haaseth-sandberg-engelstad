# PRD tilbakemelding Bård

## 2026-11-18 kl. 20:07 — Trond Engelstad

### Oppgave
Pull Bård's latest feedback, then merge PR #3 ("PRD: svar på Bårds tilbakemelding", by Oskar). The group confirmed all four points in the PR: "Pr #3- Vi bekrefter alle 4 punktene."

### Plan
- Bård's feedback (`tilbakemelding-prd.md`, 12 Nov) was already on main after PR #2; summarised it for Trond.
- Merge `prd/tilbakemelding-bard` into main with `--no-ff` (the PR base was `fiks/gammel-struktur`, already merged).
- Mark the four confirmations in the PRD and epics, and log them in the G115 files.

### Resultat
- Merge commit `46ff35e` on main, no conflicts.
- `epics.md`: R31 (story 1.1), R32 (1.2), R33 and the FR-19 two-event edge case (1.3), R34 (1.4) changed from [GROUP TO CONFIRM] to [CONFIRMED by the group 2026-11-18].
- `prd.md`: §8.2 priorities and cut order marked confirmed; FR-19 edge case confirmed; SM-5 assumption replaced by the confirmed first target; open question 4 (R31–R34) removed and listed as answered.
- `ByggAPP/G115_Changelog.md` and `ByggAPP/G115_Dilemmas.md`: new section "PRD revised after Bård's feedback – 2026-11-18".

### Åpne punkter
- The two R30 proposals in epics story 1.5 are still [GROUP TO CONFIRM]; they were not among the four points.
- Bård's two reflection questions (§7 in the feedback) must be answered by the group itself.
