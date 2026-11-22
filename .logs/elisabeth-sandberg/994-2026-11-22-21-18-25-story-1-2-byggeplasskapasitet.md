# Story 1.2 byggeplasskapasitet

## 2026-11-22 kl. 21:18 — Elisabeth-himolde

### Oppgave
Bygge story 1.2 med `bmad-build`: lukke regelhullet mellom crew stepper i UX og R21, slik at FR-33 (byggeplasskapasitet) faktisk kan slå inn.

### Plan
- Kompilere `FraTomtTilTak/implementering/epic-1-context.md`. Lese R21, S-tabellen, eksempel (c), `EXPERIENCE.md` og spine Open Questions.
- Spec: [spec-1-2-rule-gap-site-capacity-and-the-crew-stepper.md](../../FraTomtTilTak/implementering/spec-1-2-rule-gap-site-capacity-and-the-crew-stepper.md) (oneshot-rute).
- Arbeidet ble satt på pause fordi story 1.1 ble bygget samtidig i de samme filene ([995-…-story-1-1-milepaeler.md](995-2026-11-22-20-58-09-story-1-1-milepaeler.md)). Etter brukerens beskjed ble `docs/1-2-site-capacity` lagt oppå `story/1-1-rule-gap-milestones` (PR #7). 1.2 ble revisjon 6, og `epic-1-context.md` fra 1.1 er brukt.

### Resultat
- `simulation-rules.md` revisjon 6:
  - R21 er generalisert til `h` = 4–16 i steg på 4 (standard 12). Med `h = 12` blir regelen som før, og eksempel (c) er sjekket helt likt.
  - Ny R32 (`S27 + h ≤ S36`, i dag 40), S32 er oppdatert, og S36 og S37 er nye.
  - Eksempel (f) er lagt til. Tallene er regnet om med Node.
  - §1.4 lagrer `h`, og åpent punkt 8 og 20 er oppdatert. Nytt punkt 21 gjelder tolkningen av «once».
- `EXPERIENCE.md` crew stepper: 40 er ikke lenger en plassholder, og minus stopper på 4. Spine OQ 3 er lukket, og OQ 2 er oppdatert. Ny oppføring i `G115_Changelog.md`. Sprintstatus 1-2 → review.
- Blind Hunter-review: 12 funn. 8 er rettet, og 4 er utsatt til `deferred-work.md`.
- Commit `66f3560`, pushet. PR #8 har base `story/1-1-rule-gap-milestones`: https://github.com/IBE160-2026/G115-endregaard-haaseth-sandberg-engelstad/pull/8
- Punktet «story 1.2 må bli revisjon 6» fra 1.1-loggen er løst.

### Åpne punkter
- Få gruppens bekreftelse av R21/R32 i PR #8, særlig at «once» betyr én gang per hendelse (§5 punkt 21). Flett etter #7, og bytt base til `main`.
- Utsatt fra story 1.2:
  - Hva «fulgt» betyr i R27 når eleven velger en annen `h` enn AI-ens 12.
  - Om prognosen på hendelseskortet følger stepperen.
  - «Proposed»-ordlyden i PRD FR-33 og epics.
  - Et eget eksempel for kapasitetsmeldingen fra rådgiveren i R32.
