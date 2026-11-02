---
title: "EXPERIENCE: Fra tomt til tak"
status: draft
created: 2026-10-31
updated: 2026-10-31
sources:
  - ../../prds/prd-fra-tomt-til-tak-2026-10-31/prd.md
  - ../../briefs/brief-G115-tre-stadier-2026-10-29/brief.md
  - ../../briefs/brief-G115-tre-stadier-2026-10-29/addendum.md
  - ../../../../ByggAPP/G115_FinalPrompt.md
  - .working/direction-verktoy.html
name: Fra tomt til tak
design: DESIGN.md
---

# Fra tomt til tak — Experience Spine

## Foundation

Desktop web browser only (NFR-7); no account, no login. One playthrough of about 20 minutes: about 1 minute in the site office, about 9 in planning, 6 in execution and 4 in the debrief (NFR-3). The interface is Norwegian (NFR-6); this document is English and gives UI microcopy in Norwegian.

No third-party UI system is named. Controls follow Fluent conventions (as in v0.5), and `DESIGN.md` is the visual identity reference for the "Prosjektverktøy" direction. [ASSUMPTION: controls are hand-built in Fluent style rather than taken from a Fluent component library; architecture decides.]

The product is half game, half professional tool. The tool half sets the frame (targets, steps, forms, tables); the game half lives in the 3D view, which answers every choice, and in Rådgiver, the adviser who talks back. There is no walking: the 3D view is to look at, not to move through.

Glossary terms from the PRD (playthrough, stage, order, targets, plot, concept, main part, schedule estimate, reference values, adviser, warning, prepared answer, known risk, response, reserve, risk exposure, plan, event, AI path, budget bridge, decision log) are used as defined there.

## Information Architecture

### Persistent frame

Every surface after the start screen shares one frame (layout in `DESIGN.md` Layout & Spacing):

| Region | Content | Rule |
|---|---|---|
| Top bar | Project ("Kontorbygg, Oslo sentrum"), stage ("Stadium 1 av 3: Planlegging"), key-figure cards, warning count, "Beslutningslogg" | Targets always visible. Stage 1 cards: *Budsjett (plan / mål)*, *Ferdigstillelse (plan / mål)*, *Risikoeksponering*. Stage 2 cards: *Prognose sluttkostnad*, *Prognose ferdig*, *Reserve igjen* (FR-34). Stage 3 cards: final cost and final week with their band. |
| Step rail | Where the student is | Stage 1: Oppdrag · Konsept · Tidsplan · Risiko og reserve · Legg frem, each with status and rough time. Stage 2: current week, the six main parts with progress, milestones with status. Stage 3: anchors to the debrief sections. [ASSUMPTION for stages 2 and 3] |
| Main area | Form or decision column + 3D card + consequence card | Changes per surface. |
| Adviser window | Rådgiver | Always open, bottom-right corner, never minimised or closed, present on every surface including the site office and the debrief. |

### Surfaces

| Surface | Reached from | Purpose | FRs |
|---|---|---|---|
| Start | App open | Title, one-line premise, difficulty (lett / middels / vanskelig), "Start ny gjennomspilling" | FR-1 |
| Stage 0: Site office meeting | Start | The client presents the order (100 arbeidsplasser, Oslo, target week, target cost) in 3–4 short lines; the 3D card shows the empty plot. "Hopp over" skips it. | FR-1, FR-2 |
| Stage 1 · Konsept | Meeting end / skip / rail | Floors slider, structural-system radios, plot facts (price per m², maks %BYA, maks høyde); consequence table (plot area, plot cost, building cost, finish week, rigg og drift per uke); 3D shows the building on the plot | FR-3–FR-6, FR-14, FR-15 |
| Stage 1 · Tidsplan | "Neste: Tidsplan" / rail | Six main parts with a weeks field each; Gantt with critical path and target week; 2–3 milestones; adviser reference shares ("Bruk forslaget") | FR-7–FR-9, FR-15, FR-32 |
| Stage 1 · Risiko og reserve | "Neste" / rail | 3–4 known risks as rows with probability, impact and four response options with cost and effect; reserve in weeks and MNOK; risk exposure updates | FR-10–FR-12, FR-36 |
| Stage 1 · Legg frem | "Neste" / rail | Back in the site office: whole plan against targets (concept, Gantt, cost, risk exposure, reserve), Rådgiver's overall assessment, open warnings, "Godkjenn planen" | FR-13 |
| Stage 2 · Execution | Plan approved | 3D card shows construction progressing week by week; auto-advance between events; event card with options; path comparison after each decision; live forecast | FR-18–FR-22, FR-32–FR-35 |
| Stage 3 · Debrief | Last week of stage 2 | One scrolling page in sections (below) | FR-23–FR-29, FR-38 |
| Decision log | Top bar, any time; debrief | Read-only list of every choice with time, Rådgiver's recommendation and any warning; download in the debrief | FR-29 |

**Debrief section order:** (1) *Resultat* — final cost and week in bands; (2) *Budsjettbroen* — the climax; (3) *Det som betydde mest* — top three decisions by cost impact with MNOK and weeks, small ones labelled "liten betydning" (FR-38); (4) *Plan mot faktisk* — Gantt overlay and milestones (FR-23, FR-32); (5) *Risikoer* — prepared vs occurred (FR-25); (6) *Din vei mot AI-veien* (FR-26); (7) *AI-tillit* — recommendations, followed, right, right-but-not-followed (FR-28); (8) *Konklusjon* — 2–3 sentences and one "Neste gang" per missed learning goal (FR-27, §4.10); (9) *Beslutningslogg* with "Last ned" (FR-29). [ASSUMPTION: order puts the budget bridge right after the result so the climax comes early.]

Navigation rules: before approval the student can go back to any stage 1 step from the rail (FR-13); after approval stage 1 is read-only. Stage 2 has no back. Modals stack at most one deep; the only modal is the plan-approval confirmation and the term explanation popover. [ASSUMPTION]

→ Composition reference: `.working/direction-verktoy.html` (Konsept step, default and warning state). Spine wins on conflict; in particular the mock's "– ×" adviser controls are not built.

## Rådgiver (adviser) behaviour

Product-specific rules for the adviser window (FR-14–FR-17, FR-36).

- **Message types.** *Forslag* (a suggestion with a reason), *Varsel* (rule-based warning), *Svar* (answer to a chip or free text), *Vurdering* (overall assessment at Legg frem and after each stage 2 decision). Each ends with "Grunnlag: …" naming the rule or reference.
- **Who speaks first.** Rådgiver posts one *Forslag* when the student enters a step and a *Varsel* the moment a rule fires. It does not comment on every slider tick. When two options differ little (rule R30) it says so instead of picking one.
- **Never acts.** Rådgiver never changes a choice. "Bruk forslaget" in the Tidsplan step is a button in the form, triggered by the student, not by the adviser (FR-9).
- **Chips.** 3–5 suggested questions per step; they change with the step and are always answerable without a key (FR-16). Term chips ("Hva er rigg og drift?") double as the plain-language help.
- **Free text.** The input is always enabled. With a key, the answer comes from the language model within approved facts; without a key or on failure, the nearest prepared answer is shown (FR-17). Off-topic questions are steered back to the current step.
- **History.** Messages persist across steps within the playthrough; the window scrolls to the newest. [ASSUMPTION]
- **Warnings are mirrored.** A warning appears in two places: an InfoBar on the form (where the problem is) and a *Varsel* message (why, with reference values). The top-bar warning count includes it, and it is written to the decision log (FR-15).

## Voice and Tone

Microcopy. Brand voice lives in `DESIGN.md` Brand & Style. Address the student as *du*. Plain Norwegian, short sentences, numbers first. Every technical term is explained where it first appears (NFR-9).

| Do | Don't |
|---|---|
| "Velg høyde og bæresystem. Tallene oppdateres med en gang." | "Konfigurer konseptparametere." |
| "Over høydegrensen. 8 etasjer gir 32 m; tomta tillater maks 28 m." | "Ugyldig verdi!" |
| "Rammen tok 4 uker lenger enn du anslo." | "Du tok feil om rammen." |
| "Sammenlignbare prosjekter brukte rundt 14 uker på råbygget." | "Anslaget ditt er urealistisk." |
| "Litt over målet: 172,1 av 169 MNOK." | "STRYK" / "Du tapte" |
| "Stål og massivtre gir nesten samme resultat – forskjellen er rundt 1 MNOK." | Firm recommendations where the choice barely matters |
| "Rigg og drift (kostnaden ved å ha byggeplassen i gang) koster 0,3 MNOK per uke." | Unexplained "BTA", "%BYA", "CLT", "MNOK" |
| "Jeg foreslår 22 % av tiden til råbygg. Grunnlag: sammenlignbare kontorbygg." | Rådgiver speaking without a basis |

Rådgiver speaks in the first person as a calm, experienced colleague. [ASSUMPTION] No exclamation marks, no emojis, no streaks or praise ("Flott jobba!"). Bad news is stated as a fact with its cause, never as blame. Result language is always the three bands: *På mål*, *Litt over*, *Klart over* (FR-38, rule R29).

## Component Patterns

Behavioural. Visual specs live in `DESIGN.md` Components.

| Component | Use | Behavioural rules |
|---|---|---|
| Key-figure card | Top bar | Updates on every change. A brief highlight when its value moves (off under reduced motion). Band badge appears once a value is comparable with a target. |
| Step rail | Left | Done steps are clickable before approval; upcoming steps are clickable only once all earlier steps are valid. [ASSUMPTION] Current step announced on change. |
| Floors slider | Konsept | Discrete stops from the building-block model; arrow keys move one stop; number field mirrors and accepts typing. A value above the height limit is allowed to be selected so the consequence is visible, but blocks "Neste". |
| Structural-system radios | Konsept | Four options; arrow keys move and select; selection updates figures and 3D at once. |
| Consequence table | Every stage 1 step | Recomputes on every change (FR-6). Compared values carry a band badge; an offending row turns red with the limit in brackets. |
| Duration field | Tidsplan | Whole weeks; empty until filled. Gantt and finish week update on blur or Enter. A value >20 % from the reference triggers a *Varsel* (FR-15). |
| "Bruk forslaget" | Tidsplan | Fills one main part (or all, via "Bruk alle forslag") with the adviser's share; the field stays editable (FR-9). Logged as followed. |
| Milestone row | Tidsplan | 2–3 rows: name from a short list ("Tett bygg", "Råbygg ferdig", …) + week. [ASSUMPTION: names picked from a list, not typed.] |
| Risk row | Risiko og reserve | Probability, impact, then four response options (aksepter / reduser / overfør / unngå) with cost and effect. Risk exposure updates on choice (FR-11). |
| Reserve fields | Risiko og reserve | Weeks and MNOK; zero is allowed but triggers a *Varsel* (FR-36). |
| Plan-approval dialog | Legg frem | Summarises open warnings, states "Planen låses som utgangspunkt for byggingen." Buttons: "Godkjenn planen" / "Gå tilbake". Focus starts on "Gå tilbake". [ASSUMPTION] |
| Event card | Stage 2 | Clock stops; card replaces the progress panel in the form column. Options are radio rows; "Bekreft valg" commits. Rådgiver's recommendation is tagged on its option and explained in the window. |
| Crew stepper | Stage 2 hiring option | Plus/minus with number; at site capacity the plus is disabled with "Maks 40 på byggeplassen samtidig" beside it, and Rådgiver explains why (FR-33). [ASSUMPTION: capacity figure is a placeholder.] |
| Path comparison | Stage 2, after each decision; debrief | "Din vei" and "AI-veien" side by side, both from the same state, week and cost against targets with bands (FR-22). "Fortsett byggingen" resumes. |
| Term explanation | Anywhere | First occurrence per surface is dotted-underlined; hover or focus opens a short popover; Esc closes. Same text as the matching chip answer. |
| Decision-log download | Debrief | One file, one entry per decision (FR-29). [ASSUMPTION: format decided in architecture.] |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Blocking problem (zoning limit) | Konsept, Legg frem | `infobar-error` at the top of the form; offending table row red; 3D card paints the floor(s) above the limit red and its header shows badge "Over grensen"; top bar "1 varsel"; primary button disabled with the reason as visible text under it ("Velg 7 etasjer eller færre for å gå videre."). Rådgiver posts a *Varsel* naming the limit. |
| Non-blocking warning | Tidsplan, Risiko og reserve, stage 2 overtime | `infobar-warning` + *Varsel* with reference values; "Neste" stays enabled. If the student proceeds, the warning is logged and resurfaces at Legg frem and in the debrief (UJ-1 edge case). |
| Blocked Next (incomplete) | Tidsplan, Risiko og reserve | Disabled primary with count of what is missing: "Fyll inn varighet for 2 hoveddeler til." No InfoBar — missing input is not a warning. |
| Target missed but allowed | Legg frem | Band badges in the summary; dialog lists the warning; approval allowed (FR-13). |
| Adviser thinking | Adviser window | Typing indicator "Rådgiver skriver …"; input stays enabled. After about 8 s without an answer, fall back to the nearest prepared answer. [ASSUMPTION: 8 s timeout] |
| No key / model call failed | Adviser window | Free text still works; the answer is the nearest prepared answer, with caption "Forberedt svar". Header caption shows "Forberedte svar". No error message; the student is never told something is broken (NFR-1, FR-17). |
| Off-topic question | Adviser window | "Det kan jeg ikke svare på her. I dette steget handler det om tidsplanen – vil du vite hvordan forslaget er regnet ut?" + current chips. |
| Empty: adviser on entry | Adviser window | Greeting at the site office: "Hei, jeg er Rådgiver. Jeg foreslår, advarer og svarer – men du bestemmer." Then step chips. |
| Empty: Gantt before estimates | Tidsplan | Empty rows with "Fyll inn varighet for å se planen." |
| Empty: decision log before first choice | Decision log | "Ingen beslutninger ennå. Valgene dine lagres her mens du spiller." |
| Empty: no risk occurred / no estimate overrun / no missed goals | Debrief | State it plainly: "Ingen av risikoene inntraff." / "Ingen hoveddel tok lenger enn anslaget ditt." / "Du bommet ikke på noen læringsmål." |
| Opportunity event | Stage 2 | Same event card; delta shown in good colour ("−0,8 MNOK") (FR-35). |
| Milestone status | Stage 2 rail | *Nådd* (good), *I fare* (warning, when forecast passes the milestone week), *Ikke nådd* (bad). [ASSUMPTION for "I fare"] |
| Reserve used up | Stage 2 | Top-bar card "Reserve igjen: 0" turns warning; Rådgiver notes that further delays now hit the targets directly. |
| 3D loading / low performance | 3D card | Skeleton plot outline while loading; quality lowers automatically without a message (NFR-4). If WebGL is unavailable, a static illustration plus the text alternative; the playthrough continues. [ASSUMPTION] |
| Leaving mid-playthrough | Browser | Browser's leave-page confirmation; no save or resume in v1. [ASSUMPTION] |

## Interaction Primitives

- **Keyboard covers every choice** (NFR-5). Tab order follows reading order: top bar → step rail → form → consequence card → primary action → adviser (chips, input). A skip link "Gå til Rådgiver" is the first focusable element on each surface. [ASSUMPTION]
- Slider and radios: arrow keys; Home/End on the slider. Number fields: type, Enter commits, Up/Down step by one.
- Enter on a focused button acts; Esc closes the popover or dialog; the adviser window itself never closes.
- Stage 2: Space pauses and resumes the run when focus is not in a text field; "Hopp til neste hendelse" skips the wait. [ASSUMPTION] The run always stops at an event until the student commits (FR-18).
- **Mouse:** click to act. No drag-and-drop anywhere (Gantt bars are not draggable; durations are set in fields). [ASSUMPTION]
- **3D view is look-only:** no camera control is required to play. Optional orbit by mouse drag in the card is allowed but never needed. [ASSUMPTION]
- **Feedback timing:** figures and 3D update immediately on each change (target under 100 ms for the figures). [ASSUMPTION]
- **Banned:** walking/WASD movement, hover-only information, auto-applying adviser suggestions, timers that force a decision, modal stacks deeper than one.

## Accessibility Floor

Behavioural. Visual contrast is set in `DESIGN.md` (all text tokens pass WCAG AA on their surfaces).

- Target: WCAG 2.2 AA for the 2D interface. [ASSUMPTION: AA as the bar; NFR-5 states keyboard, contrast and 3D text alternative.]
- **3D text alternative** (NFR-5): a visible-on-demand and screen-reader text kept in sync with the model. Stage 1: "7 etasjer i stål, 28 m høyt, fotavtrykk 329 m² på en tomt på 548 m². Høydegrense 28 m." Stage 2: "Uke 34: råbygget er 60 % ferdig, 5 av 7 etasjer reist. Kranen står stille på grunn av vind."
- Consequence and key-figure changes are announced politely and debounced (one summary after the student stops changing, e.g. "Byggekostnad 73,7 MNOK, ferdig uke 67, på grensen"). Blocking warnings use an assertive announcement.
- Disabled primary buttons stay focusable (`aria-disabled`) so the reason next to them is reachable.
- Status is never colour-only: every band, milestone and Gantt deviation has a text label or pattern.
- New adviser messages are announced politely; the student's focus is never moved into the adviser window automatically.
- Event cards move focus to the event title when the run stops, so keyboard and screen-reader users know a decision is waiting.
- Gantt chart and budget bridge each have a table equivalent ("Vis som tabell").
- `prefers-reduced-motion`: no key-figure highlight animation, 3D transitions cut instead of animate, auto-advance still works.
- Focus ring: 2 px `{colors.accent}` outline with 2 px offset on every interactive element.

## Responsive & Platform

Desktop only (NFR-7). Minimum 1280 × 720; below that width a notice says "Fra tomt til tak er laget for PC. Gjør vinduet bredere eller bruk en datamaskin." [ASSUMPTION] Above 1440 px the frame centres. The frame does not reflow into a single column.

## Inspiration & Anti-patterns

- **Lifted from professional project software:** key figures on top, steps on the left, forms with consequence tables, tabular numbers.
- **Lifted from v0.5:** Fluent colours, the site office as a scene, path comparison, the Gantt chart with critical path, option deltas ("+2 uker · +1,7 MNOK").
- **Rejected — the v0.5 walking game:** no avatar, no WASD, no walking to events. The 3D view is an instrument.
- **Rejected — glass HUD over full-screen 3D:** contrast risk; replaced by a framed 3D card.
- **Rejected — pass/fail on exact figures:** results are bands, because the targets are a guide (FR-1, FR-38).
- **Rejected — a minimisable chatbot bubble:** Rådgiver is a permanent colleague in the corner, not a support widget.

## Key Flows

### Flow 1 — UJ-1. Sara finds out why building projects run late

*Sara, 22, economics and management student, little construction experience, desktop browser, no account. All figures below are placeholders until the building-block model sets them (PRD open questions 1–2). [ASSUMPTION]*

1. **Start.** Sara opens the simulator, keeps difficulty *middels* and presses "Start ny gjennomspilling" (FR-1).
2. **Site office (stage 0).** The client presents the order in short lines: "Vi trenger kontorer til 100 ansatte i Oslo sentrum. Ferdig innen uke 67, innenfor 169 MNOK." The 3D card shows the empty plot. Rådgiver greets her. The targets settle into the top bar, where they stay (FR-2).
3. **Konsept.** She drags the floors slider to 8; the 3D building grows past the dashed limit line and the top floor turns red. The InfoBar reads "Over høydegrensen. 8 etasjer gir 32 m; tomta tillater maks 28 m." and "Neste: Tidsplan" is disabled with its reason. She moves to 7, picks steel; the plot cost and building cost update, and Rådgiver notes that steel and CLT differ by about 1 MNOK (FR-3–FR-6, R30).
4. **Tidsplan.** She types her estimates. For the frame she enters 9 weeks; Rådgiver posts a *Varsel*: "Sammenlignbare prosjekter brukte rundt 14 uker på råbygget. Grunnlag: Statens hus Nordfjordeid (år fra kilden)." She raises it to 11, not all the way, and sets two milestones (FR-8, FR-15, FR-32).
5. **Risiko og reserve.** She reduces the crane-wind risk, accepts contaminated ground and sets a 2-week, 4 MNOK reserve; risk exposure updates in the top bar (FR-10–FR-12).
6. **Legg frem.** Back in the site office she sees the whole plan against the targets, *Litt over* on time, and Rådgiver's assessment. The dialog lists the open frame warning; she approves (FR-13).
7. **Execution.** The building rises week by week in the 3D card while the forecast updates (FR-18, FR-34). The run stops: "Råbygget tar 4 uker lenger enn anslaget ditt." She weighs *Aksepter forsinkelsen*, *Overtid* and *Leie inn flere*; the crew stepper stops at site capacity. She chooses overtime and sees "Din vei" next to "AI-veien" (FR-19–FR-22, FR-33). Wind stops a crane lift; a strike delays steel and she weighs a dearer local supplier.
8. **Climax — the budget bridge.** In the debrief, under *Klart over* on cost, the budget bridge splits the overrun into her plan, her optimistic schedule estimate, the events and her own decisions. The tallest red bar is the schedule estimate, not the strike (FR-24). *Det som betydde mest* confirms: the frame estimate weighed most; the structural choice mattered little (FR-38).
9. **Resolution.** The conclusion names the goals she missed, with one "Neste gang" each; *AI-tillit* shows she ignored two right recommendations. She downloads her decision log (FR-27–FR-29).

Failure: no key is configured. Sara's free-text question "Hvorfor tar råbygg så lang tid?" gets the nearest prepared answer, marked "Forberedt svar"; nothing looks broken.

### Flow 2 — UJ-1 edge case. Sara approves a plan Rådgiver warned against

1. At Tidsplan Sara keeps a frame estimate 30 % below the reference despite the *Varsel*.
2. At Legg frem the approval dialog lists "Råbygg: anslaget ditt er 30 % under referansen" and she presses "Godkjenn planen". The warning is written to the decision log with the time.
3. In stage 2 the estimate overrun hits the frame.
4. **Climax:** in the debrief, *Plan mot faktisk* marks the frame bar late, and next to it the original warning is shown again beside what actually happened: "Rådgiver advarte: rundt 14 uker. Du planla 9. Faktisk: 15." The student sees the cost of ignoring the warning in her own numbers.

Failure: if the warning turned out wrong (the frame finished on time), the same spot says so, and *AI-tillit* counts it as a recommendation that was not right (FR-28).
