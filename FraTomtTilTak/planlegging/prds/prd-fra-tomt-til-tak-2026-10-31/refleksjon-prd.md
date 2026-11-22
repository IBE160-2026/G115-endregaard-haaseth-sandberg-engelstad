---
title: "Reflection: answers to Bård's PRD feedback, §7"
status: draft
created: 2026-11-18
updated: 2026-11-22
answers: tilbakemelding-prd.md §7 (2026-11-12)
---

# Reflection on the PRD: answers to Bård's two questions

> **DRAFT — not the group's answer yet.** Claude Code wrote this draft on 2026-11-18 from the group's logs (`.logs/`, the `.memlog.md` files in `FraTomtTilTak/planlegging/` and `FraTomtTilTak/G115_Dilemmas.md`). Bård asked the group directly, so **every member adds their own input below before submission**, and the answers are rewritten in the group's own words. Then `status` becomes `final`.

## Before submission: everyone adds their input

| Member | Input added (section "Input from the group") | Read and approved the final answers |
|---|---|---|
| Trond Engelstad | [x] | [ ] |
| Oskar Lia | [ ] | [ ] |
| Hedda Endregaard | [ ] | [ ] |
| Elisabeth Sandberg | [ ] | [ ] |

**How:** write a few lines under your name in "Input from the group" (Norwegian or English, rough notes are fine) and tick your box. Or tell Claude Code "legg inn mitt refleksjonsinnspill" in a session; `CLAUDE.md` tells it what to do with the input.

**Where input ends up** (Claude Code or the member does this when the input is added):

| Input about … | Goes into |
|---|---|
| How we used or corrected the AI (answer 1 or 2) | The draft answers below, in the group's words |
| A choice the AI put to us, and our reply | `FraTomtTilTak/G115_Dilemmas.md`, prompt + reply word for word + result |
| A decision that changes a requirement | `prd.md` (and its `.memlog.md`), via a pull request |
| Something still to do | The member's own `.logs/<name>/issues.md` |

---

## Who did what (from the logs)

Facts for both answers. Check that your own row is right.

| Who | What the logs show | Source |
|---|---|---|
| **Trond** | Built ByggAPP v0.1–v0.5 with Claude Code (game, 3D site, AI roles), including three test rounds with comments. Made the two earlier ideas: the brief of 29 Oct and AI_BYGGplant v0.1–v0.5. Restructured the repo (29 Oct and 18 Nov). Approved PR #2 and #3, and the R30 fix on 18 Nov. On 22 Nov: built story 1.6 (removed the v0.5 code, with a review by three AI reviewers) and wrote the draft `save-code-context.md` (what a playthrough code must hold). | `.logs/trond-engelstad/` 984–999, `brief-G115-2026-10-29/.memlog.md` |
| **Oskar** | Proposed the three stages (plan → execute → debrief) and carried out "Fra tomt til tak" with Claude Code: brief, research, PRD, simulation rules, UX, architecture and epics. The product decisions in them were made by the group in its weekly meetings; Oskar brought them into the sessions, which is why the memlogs record them as "Source: Oskar" (23 in the brief, 27 in the PRD, 7 in UX). Challenged the AI on the fire rule and the 30 % warning threshold. Answered Bård's feedback (PR #3). | `.logs/oskar-lia/` 994–999, the `.memlog.md` files; Oskar's input below |
| **Hedda** | Wrote the PRD for ByggAPP (3 Nov) with 22 proposals (P-1 to P-22) for the group to decide, ahead of the group meeting on 5 Nov. | `.logs/hedda-endregaard/999-2026-11-03-…-byggapp-prd.md` |
| **Elisabeth** | Set up the deploy on Vercel (3, 5 and 11 Nov) and is assumed to own the Claude key and spend limit (to be confirmed). | `.logs/elisabeth-sandberg/`, architecture `.memlog.md` |
| **The group** | Meets every week; all four take part and make the decisions together. Chose "Fra tomt til tak" as the only project, keeping the good parts of the earlier ideas. Confirmed the four PR #3 points on 18 Nov. | `G115_Dilemmas.md`; Oskar's input below |

**What the logs do not show:** the meetings themselves, because only the sessions are logged. Oskar's input confirms that the decisions on the `forslag/tre-stadier` branch were made in the weekly meetings with all four. The others can add how they saw it under their own names.

---

## Draft answer 1

**Bård's question:** *The adviser's suggestions and warnings are rule-based, while free text goes to a language model. How did you decide what the AI could phrase freely, and what would you have done if a reply stated a wrong figure in a test?*

> We split the adviser into two layers from the start. Everything that carries a number or a judgement — suggestions, warnings, reference values, the "both work" closeness rule — is rule-based and computed by the building-block model (FR-9, FR-14, FR-15, R30). The language model only phrases free-text answers, and only within the approved facts the model hands it (FR-17). It can never choose or change anything in the plan. The split follows your feedback on the brief: a pure engine, an AI layer and a view, and a game that runs without keys.
>
> The line moved while we worked. At first we wanted free text to be optional ("det må være et valg"), then made it must-have ("ki skal være en must i språkmodellen"). The assignment text described the AI part poorly, and we first read it as a risk rather than a strength. Once we saw that the point of the course is to use AI, it had to be usable in the game, with a clear line between what the rules decide and what the language model may phrase. We accepted must-have only because the whole game still runs from the README without a key, on prepared answers (NFR-1, UJ-2).
>
> If a reply stated a wrong figure in a test, it would never reach the student. Every number is checked against the model before display; a mismatch discards the reply, shows the nearest prepared answer and counts the discard (FR-17). All automated tests run without a key, including tests with a deliberately wrong figure. SM-5 then measures the live answers: no figure outside the approved facts, and at least 16 of 20 judged useful by two of us independently.
>
> We do not trust the AI's figures blindly because it has been wrong with us before. It claimed the v0.5 engine could be reused, and the code review showed it had to be rewritten. It charged timber 2 MNOK extra for fire until Oskar asked "Er ikke massivt tre bedre enn stål ifht bærende evne ved brannkrav?", and a source check showed steel's fire protection had been left out. In Trond's earlier AI_BYGGplant, a free-form AI drew a 12-storey apartment block when asked for a small cabin, which is exactly why the AI here answers only within approved facts.

## Draft answer 2

**Bård's question:** *FR-32 to FR-37 were added after a review against the assignment text. What in them came from you and what from the AI, and how did you check that they serve the thesis and do not just cover the assignment?*

> Honestly, mostly from the AI. Oskar asked Claude Code to check the PRD against the assignment text, and it found gaps: milestones, resource capacity, a cost forecast during stage 2, and resource allocation as a guaranteed decision (`reconcile-research-and-course.md`, A1–A5). It drafted FR-32 to FR-37 and NFR-10 as proposals, and Oskar approved all of them in one decision. What came from us was the decision to keep the whole assignment in scope instead of cutting it, and much of the content: overtime, hiring with crowding, opportunities and the forecast come from Trond's v0.5 game, revised over three test rounds.
>
> At first we did not check them against the thesis, and your feedback showed it: one sentence each, no testable consequences. Since then:
> - each has rules and worked examples (R31–R34), which the group confirmed point by point on 18 Nov, for example at most 40 workers on site;
> - each ties back to a learning goal: capacity to "resources have limits", the forecast to "time costs money";
> - they are prioritised as *should* or *could* (§8.2), so they can never push out the core of the game;
> - while working the forecast we found it gave away the overrun from week 0 and changed it (R34), and while working the ranking we found estimates counted as zero and fixed R30.
>
> Our lesson: the AI is good at finding gaps against a checklist, but the group has to ask whether each addition serves the thesis before approving it, not after.

---

## Input from the group

Write a few lines under your name: what you did, what you think of the AI's role in the PRD, and whether the draft answers are fair. Rough notes are fine.

### Trond

*Added 2026-11-22, word for word from a Claude Code session.*

- **On his row in "Who did what":** "ja, det stemmer."
- **The AI's role:** "foreløpig mye avklaringer å lite bruk i selve utviklingen. men i utviklingen av "regjeringskvartelet" ble jeg imponert over hva som ble generert og hvor bra agentene fungerte. Bmad og skills er definitivft en claude styrke."
- **Keeping control of the AI:** "venner meg til å bruke visual studio code, som jeg syntes gir meg lettere og bedre kontroll over hva AIen gjør ved å se i koder, ha filtrer oppe etc."

### Oskar

*Added 2026-11-22, word for word from a Claude Code session. Question 3 (FR-32 to FR-37) is still open: Oskar wants to see the requirements listed before he comments.*

- **On his row in "Who did what":** "Nei vi gjorde det gjennom møter og jeg utførte bare."
- **Why free text became must-have (answer 1):** "For å ha klar linje, hele hensikten med KI er jo å bruke det, derfor er det et must å kunne bruke det i spillet. Grunnen til vi rotet med dette i starten, var for det var dårøig beskrevet i oppgaven og vi trodde det var negativt, fremofor positivt."
- **Who took part in the decisions:** "ja alle er med i øtene ukentlig og tar beslutninger ssmmen."
- **The AI's role overall:** "Fordeler og ulemper, i starten visste vi ikke noen ting om faget eller hvordan det skulle gjøres før vi bestemte oppgave og startet arbeidet. Det skapte derfor mye kløning for oss og kommunikasjon med KI. Det positive med ki-rns rolle er at den utypder valg og vurdering, som gjør at man får en fortåelse og kan ta valg sammen."

### Hedda

*(not added yet)*

### Elisabeth

*(not added yet)*
