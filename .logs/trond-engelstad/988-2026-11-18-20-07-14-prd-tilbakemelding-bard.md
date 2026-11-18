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

## 2026-11-18 kl. 20:24 — Trond Engelstad

### Oppgave
Fix the two R30 problems in epics story 1.5. Trond asked for a proposal, then: "implement both fixes" (the recommended variant).

### Plan
- Estimates ranked by what they hid from the plan, with their own debrief wording; "small" = under 0.900 MNOK and under 3 weeks (S43); S41 (5 %) and S42 (2 %) named.
- Write story 1.5 into `simulation-rules.md`: examples (i), (j), (k), amended R30, S41–S43.

### Resultat
- `simulation-rules.md` revision 4: S41–S43 in the parameter table, R29 refers to S41, R30 rewritten, examples (i), (j), (k) and a closeness table added.
- Story 1.5's examples used the old 169 MNOK target (from before the fire-rule revision on 5 Nov). Re-based to 171 MNOK and final 174.354; the impacts are differences, so they did not change. The seed-115 values were checked by running mulberry32 with Node.
- The old closeness example (steel 168.429 vs CLT 172.210, firm) was stale; with current figures steel and CLT at 7 floors differ by 0.981, so "about 1 MNOK" in Flow 1 step 3 was right after all.
- `prd.md` (thresholds paragraph, FR-38), `EXPERIENCE.md` (Flow 1 steps 3 and 8, debrief order), `epics.md` story 1.5 marked confirmed, spine Open Question 2 half closed. Changelog and Dilemmas updated.
- Not pushed yet.

### Åpne punkter
- Spine Open Question 2 stays half open: R31–R34 (confirmed) must still be written into `simulation-rules.md` (stories 1.1–1.4). Example (i) already refers to R33's slots 15–16.
- Story 1.5's own tables in `epics.md` still show the old 169 MNOK figures; `simulation-rules.md` is the authority.

## 2026-11-18 kl. 20:41 — Trond Engelstad

### Oppgave
Draft answers to Bård's two reflection questions (§7), saved as a draft, using the logs from the earlier proposals to show who did what. Set up a reminder that everyone adds their reflection input before submission, and that the input is put where it belongs.

### Plan
- Read all `.logs/` folders and the `.memlog.md` files in `01. Admin/planning-artifacts/` for who decided what.
- Write `refleksjon-prd.md` next to the feedback, with `status: draft`.
- Reminder in `CLAUDE.md`, so every member's Claude Code session reminds them and routes their input.

### Resultat
- `01. Admin/planning-artifacts/prds/prd-fra-tomt-til-tak-2026-10-31/refleksjon-prd.md`: checklist per member, a table of where input ends up, a who-did-what table (Trond: ByggAPP v0.1–v0.5, earlier brief, AI_BYGGplant, repo; Oskar: three stages and all of "Fra tomt til tak", 23 + 27 + 7 decisions in the memlogs; Hedda: ByggAPP PRD with P-1 to P-22; Elisabeth: Vercel and likely key owner), two draft answers and an empty input section per member.
- Corrected from the chat draft: the fire-rule challenge was Oskar's, not Trond's. "The group play-tested" was softened to "three test rounds", because the logs do not say who tested.
- `CLAUDE.md`: new section "Reminder: reflection note before submission".
- `G115_Dilemmas.md` entry 3 and a changelog line.

### Åpne punkter
- The submission date is not in the repo, so the reminder fires at every session start rather than at a date.
- Reflection input from all four members before submission (in `issues.md`).
