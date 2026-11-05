---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - prds/prd-fra-tomt-til-tak-2026-10-31/prd.md
  - prds/prd-fra-tomt-til-tak-2026-10-31/simulation-rules.md
  - prds/prd-fra-tomt-til-tak-2026-10-31/addendum.md
  - architecture/architecture-fra-tomt-til-tak-2026-11-05/ARCHITECTURE-SPINE.md
  - ux-designs/ux-fra-tomt-til-tak-2026-10-31/EXPERIENCE.md
  - ux-designs/ux-fra-tomt-til-tak-2026-10-31/DESIGN.md
  - ../../ByggAPP/G115_Changelog.md
---

# Fra tomt til tak - Epic Breakdown

## Overview

This document breaks the PRD, the UX contract and the architecture spine for *Fra tomt til tak* into epics and stories. Each story is meant to fit one branch and one pull request.

**How this was made.** The BMAD skill ran non-interactively, so no menu or approval step reached the group. Choices made on the group's behalf are marked:

- **[GROUP TO CONFIRM]**: a concrete resolution proposed here. Stories can build on it, but the group decides.
- **[ASSUMPTION]**: a smaller choice made to fill a gap.

**Reading a story.** `Traces` lists the FR, NFR, rule (R), architecture (AD) and UX-DR ids. `Depends on` lists what must be merged first.

**New ids proposed here** (they do not exist in the rules until the Epic 1 rule-gap stories are merged): R31 milestones, R32 site capacity, R33 opportunities, R34 visible forecast, and parameters S36–S43.

## Requirements Inventory

### Functional Requirements

FR-1: Start a playthrough with a seed and a difficulty; the order shows 100 workplaces, Oslo, target week and target cost.
FR-2: The client presents the order in a skippable site-office meeting; the concept step opens afterwards.
FR-3: Plot area and plot cost follow from the concept at one price per m² of plot area.
FR-4: Choose floors from a fixed set; footprint, height, zoning check, lifts, fire-class step and frame weeks follow.
FR-5: Choose cast-in-place concrete, precast concrete, steel or CLT; frame time, cost and possible risks follow.
FR-6: After every choice, see plot and building cost, duration against targets, site overhead per week, and the concept in 3D.
FR-7: The building-block model generates the six main parts in fixed order with reference durations.
FR-8: Set a duration in weeks per main part; the Gantt chart, critical path and completion week update.
FR-9: The adviser suggests a duration per main part with its basis; accepting fills the field and it stays editable.
FR-10: See 3–4 known risks for the concept, with probability and impact.
FR-11: Choose accept, reduce, transfer or avoid per risk; risk exposure updates.
FR-12: Set a reserve in weeks and cost; it is part of the plan and is drawn on in stage 2.
FR-13: Review the whole plan against the targets and approve it; zoning breaches block, missed targets warn, and approval locks the plan.
FR-14: The adviser gives a rule-computed suggestion at each stage 1 step, and says when a choice matters little (R30).
FR-15: Rule-based warnings open with real reference values, name only listed projects, and are logged.
FR-16: 3–5 suggested questions per step with prepared answers that work with no key or network.
FR-17: Free-text questions go to a language model within approved facts; with no key or on failure, the nearest prepared answer is shown. Must-have.
FR-18: The project advances week by week from the plan, shows in 3D, and pauses at every event.
FR-19: 3–4 events per playthrough decided by seed: one estimate overrun, one or two external risks, one change request.
FR-20: 2–4 options per event, each showing effect now and later, with overtime premium and caps, crowding and change-request timing.
FR-21: A known risk that occurs applies the chosen response; an avoided risk does not occur.
FR-22: After each decision, the student's outcome is shown next to the AI path from the same state.
FR-23: The plan's Gantt chart is overlaid with what happened, with late parts marked.
FR-24: A budget bridge splits target-to-final cost into four causes that sum exactly; the reserve is a separate line.
FR-25: Every known risk is listed with its response and whether it occurred; every event with the option chosen.
FR-26: Final result next to the AI path through the same events.
FR-27: A 2–3 sentence conclusion naming the missed learning goals, with one next-time advice per missed goal.
FR-28: AI trust figures: recommendations, followed, right, and right but not followed.
FR-29: View and download the decision log, with one entry per decision.
FR-30: Same seed, plan and decisions give the same result.
FR-31: Every parameter has a source or is marked as an estimate; every rule has a worked example that runs as a test.
FR-32: Set two or three milestones in the schedule step; stage 2 shows whether each is met, and the debrief reports them.
FR-33: The site has a maximum number of workers at once; hiring beyond it is impossible, and the adviser explains why.
FR-34: Stage 2 always shows forecast final cost and completion week against the targets, updated weekly and after each decision.
FR-35: The event pool has positive events, at most one per playthrough.
FR-36: The adviser warns when no reserve is set, or when the student pays more to reduce or transfer a risk than its expected cost.
FR-37: The PRD holds a table mapping every assignment item to the FRs covering it.
FR-38: The debrief ranks decisions by impact on cost and week, labels small ones, and shows results in bands.

### NonFunctional Requirements

NFR-1: Runs without keys: the whole must-have scope runs from the README with no keys, accounts or backend.
NFR-2: No secrets in the repo: the key is never committed or sent to the browser; calls go through a server function; `.env.example` has no real values.
NFR-3: Session length of about 20 minutes (10 planning, 6 execution, 4 debrief).
NFR-4: Smooth 3D on an ordinary student laptop (at least 30 fps [ASSUMPTION in PRD]), lowering quality by itself.
NFR-5: Accessibility: all choices by keyboard, readable contrast, a text alternative for the 3D view.
NFR-6: The interface is Norwegian; documentation is English.
NFR-7: Desktop browser; mobile is not supported in v1.
NFR-8: Engine, building-block model, adviser rules and event selection are pure and covered by automated tests.
NFR-9: Every technical term is explained in plain Norwegian where it first appears.
NFR-10: The 3D view, free-text answers and a full playthrough have a written manual test plan, and each round's results are recorded.

### Additional Requirements

From the architecture spine (status final). There is no starter template: this is a brownfield rewrite inside `ByggAPP/`, so the first code story is a removal, not a scaffold.

- Layers and import direction are fixed: engine, adviser rules, content, AI layer, view (spine, Design Paradigm).
- AD-1: the engine is pure; a test scans `src/engine` for banned APIs and imports.
- AD-2: `drawAll(seed)` fills a fixed `Draws` table with mulberry32; slots never move, and new slots are appended.
- AD-3: integer units; `roundDiv` and `floorDiv` in `engine/units.ts`; each rule rounds once at its end.
- AD-4: the building-block model replaces the fixed scenario; the listed v0.5 files are removed, not adapted.
- AD-5: every S-value and the risk table live in `engine/data/params.ts`; citable projects live in `engine/data/references.ts`; numeric literals in rule functions are defects.
- AD-6: `selectEvents` is fixed at approval; `replay` is a pure fold over six parts; weeks are playback over a `Run`.
- AD-7: `Playthrough` is immutable; `reduce` is the only writer; `derive` computes all figures.
- AD-8: the append-only log is the single record; the debrief is a pure function of plan, draws and log.
- AD-9: every what-if is a `replay`; bridge causes must sum exactly, tested over many seeds.
- AD-10: adviser rules return records, not text; citations point only into `references.ts`.
- AD-11: the language model only explains; `src/ai` has no access to `dispatch` or `reduce`.
- AD-12: prepared answers are the floor; `ask.ts` is the one entry point; `guard` checks every number; no streaming to the browser.
- AD-13: `ByggAPP/server` is its own package on TypeScript ~5.9.3 and the only reader of the key; `contract.ts` is the source of the contract.
- AD-14: 20 calls per playthrough, client abort at 8 s, server timeout 7 s with no retries, 32 KB body limit, in-memory rate limit, no question logging.
- AD-15: 3D reads `SceneState` only; `three` loads lazily; missing WebGL gives a static illustration; `describeScene` gives the text alternative.
- AD-16: student-facing text lives only in `src/content`; ids never show in the UI.
- AD-17: vanilla TypeScript renderers, one mounted form per step, `mountApp(root, deps)`, delegated `data-action`.
- AD-18: every worked example is a test; rule functions and test titles start with the rule id; a test fails if an R id has no test.
- AD-19: three test layers: Vitest in Node, DOM flows under jsdom, a manual test plan.
- AD-20: Vercel is the one deployment; local `npm install && npm run dev` needs nothing; GitHub Pages is dropped (`ByggAPP/.github`, `BASE_PATH`).
- Conventions: ids for parts, systems and responses; commands as plain objects with `type` and `at`; only `content/format.ts` formats numbers; decision log as UTF-8 CSV with BOM and `;`; no analytics, cookies or storage.
- Deferred by the spine and picked up here: delivery order, when v0.5 is deleted, and root CI [ASSUMPTION in the spine].
- Spine Open Questions 1–3 are closed by the Epic 1 rule-gap stories. Open Question 4 (model, cost, owner) is handled in the FR-17 stories.

### UX Design Requirements

UX-DR1: Implement the `DESIGN.md` colour, type, radius and spacing tokens as CSS custom properties, replacing `styles.css` and the glass HUD. Light mode only.
UX-DR2: Persistent frame: top bar, step rail (220 px), main two-column grid (form 420 px + 3D card), adviser window (330 px) in a reserved bottom-right zone.
UX-DR3: Key-figure cards per stage, with target, 4 px meter, band badge and a brief highlight on change.
UX-DR4: Step rail per stage with done, current and upcoming states and rough time; upcoming steps clickable only when earlier steps are valid.
UX-DR5: Floors slider with discrete stops, mirrored number field, arrow and Home/End keys. Values over the limit are selectable but block "Neste".
UX-DR6: Structural-system radios with arrow-key selection that updates figures and 3D at once.
UX-DR7: Consequence table on every stage 1 step, with band badges and red offending rows.
UX-DR8: Duration field: whole weeks, empty until filled, commit on blur or Enter.
UX-DR9: "Bruk forslaget" per part and "Bruk alle forslag", logged as followed.
UX-DR10: Milestone rows with names from a short list plus a week.
UX-DR11: Risk rows with probability, impact and four response options with cost and effect.
UX-DR12: Reserve fields in weeks and MNOK; zero allowed, with a *Varsel*.
UX-DR13: Plan-approval dialog listing open warnings; focus starts on "Gå tilbake".
UX-DR14: Event card replacing the progress panel: radio rows, "nå", "senere", delta line, "Rådgiver anbefaler" tag, "Bekreft valg".
UX-DR15: Crew stepper with plus and minus, disabled plus at capacity with visible reason.
UX-DR16: Path comparison cards "Din vei" and "AI-veien" with bands, then "Fortsett byggingen".
UX-DR17: Term explanation popover on the first occurrence per surface, on hover or focus, Esc closes; same text as the chip answer.
UX-DR18: Decision-log surface reachable from the top bar any time, read-only, with an empty state; download in the debrief.
UX-DR19: Adviser window that never closes: face, status caption, message list, chips, free-text input; message types *Forslag*, *Varsel*, *Svar*, *Vurdering*, each ending in "Grunnlag: …".
UX-DR20: Warning states: red InfoBar blocks, yellow InfoBar does not; warnings are mirrored to the adviser and top-bar count; a disabled primary always shows its reason.
UX-DR21: Empty states for adviser, Gantt, decision log and debrief ("Ingen av risikoene inntraff." and so on).
UX-DR22: 3D card with header, footer, dashed limit line, skeleton while loading, red floors above the limit, static illustration without WebGL.
UX-DR23: Keyboard: reading-order tabs, skip link "Gå til Rådgiver", Space pauses stage 2 outside text fields, "Hopp til neste hendelse", no drag-and-drop.
UX-DR24: Accessibility floor: polite debounced announcements, assertive blocking warnings, `aria-disabled`, focus moved to the event title, status never colour-only, focus ring, reduced motion, "Vis som tabell" for Gantt and bridge.
UX-DR25: Minimum 1280 × 720 with the desktop notice below that; centred above 1440 px.
UX-DR26: Browser leave-page prompt mid-playthrough; no save or resume.
UX-DR27: Gantt visuals: planned, actual and late bars, critical path, target line, milestone diamonds.
UX-DR28: Budget bridge waterfall in FR-24 order, with the reserve as a separate line below.
UX-DR29: Voice: *du*, plain Norwegian, facts not blame, bands only (*På mål*, *Litt over*, *Klart over*), no exclamation marks or praise.

### FR Coverage Map

Epic level. The story-level table is in the section "Coverage: every FR and NFR to stories".

| Requirement | Epic |
|---|---|
| FR-1, FR-2 | Epic 2 |
| FR-3 to FR-8, FR-10 to FR-13, FR-32 (setting) | Epic 2 (model in Epic 1) |
| FR-9, FR-14 to FR-17, FR-36 | Epic 3 |
| FR-18 to FR-22, FR-33 to FR-35, FR-32 (status) | Epic 4 |
| FR-23 to FR-29, FR-38, FR-32 (report) | Epic 5 |
| FR-30, FR-31 | Epic 1 |
| FR-37 | Epic 6 |
| NFR-8 | Epic 1 |
| NFR-1, NFR-2 | Epic 3, checked in Epic 6 |
| NFR-6, NFR-7, NFR-9 | Epic 2 |
| NFR-3, NFR-4, NFR-5, NFR-10 | Epic 6 (built into Epics 2 to 5) |

## Epic List

| Epic | Outcome | Covers |
|---|---|---|
| **0: v0.5 as built** | Traceability only: what existed, with commits and changelog. No build work, no stories. | None |
| **1: A foundation the group can check by hand** | Every rule runs as a test, an estimate changes in one data file, and the old game is gone. Rule gaps close first. | FR-30, FR-31, NFR-8; the rule half of FR-32, FR-33, FR-35; the calculations behind FR-3 to FR-8 and FR-10 to FR-12 |
| **2: Plan the project** | The student goes from start through concept, schedule, risk and reserve to a locked plan, seeing the building in 3D. | FR-1 to FR-8, FR-10 to FR-13, FR-32 (setting), NFR-6, NFR-7, NFR-9 |
| **3: Plan with Rådgiver** | Suggestions, warnings and answers always work. A key adds the language model and nothing else. | FR-9, FR-14 to FR-17, FR-36, NFR-1, NFR-2 |
| **4: Run the plan** | The plan runs week by week, events force decisions, the forecast moves, and each decision is compared with the AI path. | FR-18 to FR-22, FR-32 (status), FR-33 to FR-35 |
| **5: Understand the result** | The debrief explains why it turned out as it did. | FR-23 to FR-29, FR-32 (report), FR-38 |
| **6: Prove it and hand over** | Click flows, manual test plan, accessibility and performance checks, and a README an outsider can follow. | FR-37, NFR-3, NFR-4, NFR-5, NFR-10; checks of NFR-1, NFR-2 |

Linter, formatter and CI sit in Epic 1 rather than Epic 6, so that all later pull requests use them.

**Epic dependencies:** Epic 2 stands on Epic 1. The rule stories in Epic 3 stand on Epic 1, and its window needs the frame from Epic 2. Epic 4 needs a plan from Epic 2. Epic 5 needs a run from Epic 4. Epic 6 tests everything. No epic needs a later one to function.

## Epic 0: v0.5 as built

Traceability only. No stories and no build work.

**What existed.** `ByggAPP/` held *Regjeringskvartalet Light* v0.5: a walkable 3D site of the Government Quarter, with a fixed scenario run week by week, rule-based AI roles, meetings instead of dialogs, and a final report. It had 187 passing tests at the repo restructure.

| Version | Date | What it added | Commit |
|---|---|---|---|
| v0.1 | 2026-10-22 | Windows-style desktop, pure engine, budget and Gantt | See changelog |
| v0.2 | 2026-10-22 | Playable, rule-based AI roles, difficulty, 3D window | See changelog |
| v0.3 | 2026-10-27 | Chapters, change requests, fork card, final report | `8af8112` |
| v0.4 | 2026-10-27 | Full-screen 3D makeover, glass HUD | `8286a81` |
| v0.5 | 2026-10-27 | Walkable site, meetings, test rounds | `d4cdcc3` |
| Pages workflow | 2026-10-27 | GitHub Pages workflow; Pages was never turned on | `71eeaa7` |
| Repo structure | 2026-10-29 | Code moved into `ByggAPP/` | `c4913eb`, `ebeaac7`, `0aed2f6` |

Commit hashes come from `.logs/trond-engelstad/` and `.logs/oskar-lia/`. Details per version are in [G115_Changelog.md](../../ByggAPP/G115_Changelog.md); the whole game is described in [G115_FinalPrompt.md](../../ByggAPP/G115_FinalPrompt.md).

**What happens to it.** The spine's table "What happens to the v0.5 code" is the authority. Story 1.6 carries it out.

## Epic 1: A foundation the group can check by hand

The group can run every rule as a test, change an estimate in one data file, and build on a repo free of the old game. Stories 1.1 to 1.5 are document stories: they close what blocks later stories, and each edits `simulation-rules.md` and needs a group confirmation in its pull request.

### Story 1.1: Rule gap: milestones

As the group,
I want a written rule for milestones,
So that the schedule, execution and debrief stories build the same thing.

**Traces:** FR-32, new R31, UX-DR10, spine Open Question 2. **Depends on:** none.

**Proposed resolution [GROUP TO CONFIRM]: R31.**

- A milestone is one main part's finish plus a target week. The names are a fixed list, one per part: *Tillatelse klar* (permit), *Grunnarbeid ferdig* (ground), *Råbygg ferdig* (frame), *Tett bygg* (envelope), *Teknikk og innredning ferdig* (interior), *Overlevert* (handover).
- The student keeps 2 or 3, on different parts. *Råbygg ferdig* and *Tett bygg* are pre-filled with the plan's finish week, so the step never blocks on them. A week the student has not edited follows the estimates.
- Status in stage 2: *Planlagt* (neutral) while the visible forecast (R34) meets the week; *I fare* when it does not; *Nådd* when the part finishes on or before the week; *Ikke nådd* once the week has passed with the part unfinished, or the part finishes later. *Planlagt* is an addition to the three states in `EXPERIENCE.md`.
- Milestones change no cost or time. They are not decisions in R30 and not part of R28.

**Worked example (e), from examples (c) and (d):** milestones *Råbygg ferdig* week 29 and *Tett bygg* week 37 (the plan's finishes: 12 + 10 + 7 = 29, then + 8 = 37). At week 0 both are *Planlagt*. At week 12, after E1 and E5 are decided as in (d), groundworks finishes at 32 and the visible forecast puts the frame at 39, so both are *I fare*. Actual finishes are frame 41 and envelope 51, so both end *Ikke nådd*, 12 and 14 weeks late.

**Acceptance Criteria:**

**Given** the group has confirmed or changed the proposal
**When** the pull request is merged
**Then** `simulation-rules.md` holds R31 with example (e), and §5 open point 20 no longer lists milestones
**And** spine Open Question 2 no longer lists FR-32

### Story 1.2: Rule gap: site capacity and the crew stepper

As the group,
I want UX and R21 to agree on how hiring works,
So that FR-33 is a real limit and not one the player can never reach.

**Traces:** FR-20, FR-33, R21, R25, R28, new R32, S32, S33, new S36, S37, UX-DR15, spine Open Questions 2 and 3. **Depends on:** none.

**The conflict.** R21 hires a fixed 12, so the site holds 36 workers and never reaches the UX placeholder of 40. FR-33 would never fire.

**Proposed resolution [GROUP TO CONFIRM]: keep the stepper and generalise R21; add R32.**

- The student hires `h` workers, in steps of 4 (S37), from 4 to 16. The stepper starts at 12 (S32).
- R21 generalised: `D = round(W × 24 ÷ (24 + 0.5h))`, extra cost `h × 37.5 × 650 × 0.5` NOK per week, times D. With `h = 12` this is exactly today's R21, so example (c) does not change.
- R32: `24 + h ≤ 40` (S36, [ESTIMATE], the UX placeholder). At 16 hired the plus is disabled, with "Maks 40 på byggeplassen samtidig" beside it, and the adviser returns a capacity record once.
- R25 ranks the hire option at the default `h = 12`, because the AI compares listed options. R27, R28 and R30 use the `h` the student chose.

**Alternative rejected:** keeping a fixed +12 and lowering capacity below 36 would remove hiring altogether.

**Worked example (f), example (c) groundworks, W = 16:**

| h | Crew | D | Extra cost | Against taking the delay |
|---|---|---|---|---|
| 4 | 28 | round(14.77) = 15 | 0.731 | +0.431 |
| 8 | 32 | round(13.71) = 14 | 1.365 | +0.765 |
| 12 | 36 | round(12.80) = 13 | 1.901 | +1.001 |
| 16 | 40 | round(12.00) = 12 | 2.340 | +1.140 |

`h = 20` is not possible: 44 > 40. Overtime still gives D = 14 for 0.546, so hiring 4 or 8 misses "resources have limits" (R28).

**Acceptance Criteria:**

**Given** the group has confirmed or changed the proposal
**When** the pull request is merged
**Then** `simulation-rules.md` holds the generalised R21, R32, S36, S37 and example (f), and example (c) is unchanged
**And** the crew stepper row in `EXPERIENCE.md` no longer calls 40 a placeholder, or names the agreed figure
**And** spine Open Question 3 is closed

### Story 1.3: Rule gap: opportunities

As the group,
I want a written rule for positive events,
So that not every event is bad news and the event count stays within FR-19.

**Traces:** FR-19, FR-20, FR-35, R15, R17, R18, R19, new R33, new S38, S39, S40, AD-2, spine Open Question 2. **Depends on:** none.

**Proposed resolution [GROUP TO CONFIRM]: R33.** Both events come from v0.5 and keep its trade-off: money saved at the cost of time.

| ID | Event | Fires at start of | Take it | Decline |
|---|---|---|---|---|
| O1 | *Gjenbruk av steinmasser* | Part 2, groundworks | −1.200 and +1 idle week (S39) | 0 |
| O2 | *Rabatt mot senere fasadeleveranse* | Part 4, envelope | −0.800 and +1 idle week (S40) | 0 |

- Two new `Draws` slots go after the last slot (AD-2): slot 15 for occurrence, slot 16 for which one, `floor(u × 2)`.
- Let `n` be the events after R17–R19, change request included. If `n = 4`, no opportunity. If `n = 3`, one occurs when `u < 30 %` (S38, [ESTIMATE]). If `n < 3`, one always occurs.
- Order within a part: overrun, external risks, change request, opportunity.
- All other rules treat it as an event. The bridge, R25 and R27 need no change.

**A consequence to accept [GROUP TO CONFIRM].** A student who avoids every risk and has no overrun gets two events (change request and opportunity), one short of FR-19's 3–4. Lifting the limit of one opportunity would conflict with FR-35, so this edge case stays.

**Worked example (g), example (d) with slot 15 = 0.20 and slot 16 = 0.20:** n = 3 and 0.20 < 0.30, so an opportunity occurs; floor(0.40) = 0 gives O1. Taking it is 172.554 − 1.200 + 0.300 = **171.654**, week 70. Declining stays 172.554, week 69. The AI recommends taking it, so run 3 is 172.000 − 0.900 = **171.100**, week 68. The bridge is −7.446 + 4.800 + 4.746 + 0.554 = **+2.654** = 171.654 − 169.000 ✓.

**Acceptance Criteria:**

**Given** the group has confirmed or changed the proposal
**When** the pull request is merged
**Then** `simulation-rules.md` holds R33, S38–S40 and example (g), R15 lists the two new draws, and R17 and R18 no longer say "if FR-35 is approved"
**And** spine Open Question 2 no longer lists FR-35

### Story 1.4: Rule gap: a forecast that does not reveal the overrun

As a student,
I want the forecast to start at my plan and move as the truth comes out,
So that the overrun is something I discover, not something the top bar shows at week 0.

**Traces:** FR-22, FR-26, FR-32, FR-34, R13, R24, R25, new R34, AD-6, AD-9, spine Open Question 1. **Depends on:** none.

**The problem.** R24 forecasts unstarted parts at their actual durations. In example (c) the top bar would show 166.354 and week 65 at week 0, against a plan of 161.554 and week 49, then stand still between events.

**Proposed resolution [GROUP TO CONFIRM]: two views of one replay.**

- **R24 stays as written** as the full forecast. It is used only where the engine needs the truth: R25, R26, R27, R30 and the final AI path. Examples (c) and (d) do not change.
- **New R34, the visible forecast.** The same `replay`, but a part not yet started counts at the student's estimate; a started or finished part counts at its actual duration. Decided events apply, and undecided ones do not. Everything shown in stage 2 uses it: top-bar cards, *Reserve igjen*, option deltas, path comparison and milestone status.
- **Why the AI needs no change.** An option changes only the current part, so all options differ from R24 by the same amount. The ranking and the difference between options are the same in both views. A test asserts this over many seeds.

**Worked example (h), example (c):**

| Moment | Visible cost | Visible week | Full cost (R24) | Full week |
|---|---|---|---|---|
| Week 0 | 150.454 + 0.300 × 37 = **161.554** | **49** | 166.354 | 65 |
| Week 12, take the delay | 150.454 + 0.300 × 43 = **163.354** | **55** | 166.354 | 65 |
| Week 12, overtime | 150.454 + 0.300 × 41 + 0.546 = **163.300** | **53** | 166.300 | 63 |
| Week 12, hire 12 | 150.454 + 0.300 × 40 + 1.901 = **164.355** | **52** | 167.355 | 62 |

At week 12 each option is 3.000 and 10 weeks below R24, so overtime still wins by 0.054. The forecast moves at each part start, when that part's actual duration becomes known, and after each decision.

**Alternative rejected:** replacing R24 with estimates everywhere would change example (c), R25 and the final AI path.

**Acceptance Criteria:**

**Given** the group has confirmed or changed the proposal
**When** the pull request is merged
**Then** `simulation-rules.md` holds R34 and example (h), and R13 says which forecast it uses
**And** spine Open Question 1 is closed, and AD-6 notes that the visible forecast is a `replay` with estimates for unstarted parts

### Story 1.5: Rule gap: worked examples for R15, R29 and R30

As the group,
I want a worked example for each rule that has none,
So that FR-31 holds and these rules can be tested from day one.

**Traces:** FR-14, FR-31, FR-38, R15, R16, R17, R25, R29, R30, new S41, S42, S43, AD-5, AD-9, AD-18, spine Open Question 2. **Depends on:** Story 1.3 (slots 15 and 16).

**Example (i), R15: seed 115 (group number) on the reference plan.** Generator: mulberry32 from v0.5. The test compares to 4 decimals.

| Slots | Used for | Values | Result |
|---|---|---|---|
| 0–4 | Deviation, parts 2–6 | 0.2682, 0.9728, 0.9265, 0.2672, 0.5870 | 0 %, +30 %, +30 %, 0 %, +10 %. Actual 13, 10, 13, 10, 6 |
| 5–8 | E4, E5, E2, E3 | 0.6846, 0.0470, 0.4766, 0.7998 | Only E5 occurs (0.0470 < 0.40) |
| 9–14 | Reliability | 0.7585, 0.5543, 0.6627, 0.6074, 0.7396, 0.6515 | Event order E5, E1, E8. Medium: best each time. Hard: second-best, best, second-best |
| 15–16 | Opportunity | 0.5104, 0.4384 | n = 3, 0.5104 ≥ 0.30, so none |

The overrun hits the envelope: gaps are 0, 2, 3, 0, 1 with estimates at reference. **If the student avoids E5**, every other slot keeps its value, no risk qualifies, and E2 occurs with the lowest u ÷ p (1.362, against E4 2.282 and E3 3.199). That shows an avoided risk does not shift the stream.

**Example (j), R29: targets 169 MNOK and week 67.** Limits are 169 × 1.05 = 177.450 and 67 × 1.05 = 70.35, rounded up to week 71.

| Final | Band | Final | Band |
|---|---|---|---|
| 169.000 | *På mål* | Week 67 | *På mål* |
| 172.554 (example d) | *Litt over* | Week 69 (example d) | *Litt over* |
| 177.450 | *Litt over* | Week 71 | *Litt over* |
| 177.451 | *Klart over* | Week 72 | *Klart over* |

**Two problems found in R30 while working the example, with proposals [GROUP TO CONFIRM]:**

1. **Estimates have no effect on final cost.** R16 makes actual durations independent of estimates, so R30 as written ranks an estimate near zero. That contradicts Flow 1 step 8 ("the frame estimate weighed most") and the point of the product. Proposal: an estimate's impact is what it hid from the plan: `0.300 × (actual − estimate)` for parts 2–6 and 0 for the permit, with `actual − estimate` weeks. These sum exactly to bridge cause 2. *Alternative:* compare with the reference estimate, which is closer to R30's wording but does not sum to the bridge.
2. **The 2 % threshold labels nearly everything small.** It is 3.380 MNOK, and in example (d) every decision falls under it, so the top three would all read "liten betydning". Proposal: the debrief's "small" becomes 0.5 % of target cost (S43, 0.845 MNOK). The adviser's closeness rule keeps 2 % (S42). The band width of 5 % becomes S41, so all three live in `params.ts`.

**Example (k), R30: the playthrough in example (d).** Final 172.554, week 69.

| Rank | Decision | Student → compared with | Cost | Weeks | Label |
|---|---|---|---|---|---|
| 1 | Groundworks estimate | 10, actual 16 | +1.800 | 6 | |
| 2 | Technical and interior estimate | 8, actual 13 | +1.500 | 5 | |
| 3 | E5 response | Accept → reduce: +0.640 upfront, −1.000, −2 weeks | −0.960 | −2 | |
| 4 | Frame estimate | 7, actual 9 | +0.600 | 2 | small |
| 5 | Envelope estimate | 8, actual 10 | +0.600 | 2 | small |
| 6 | E8 event | Later → now | −0.400 | +2 | small |
| 7 | Handover estimate | 4, actual 5 | +0.300 | 1 | small |
| 8 | E5 event | Impact → alternative | −0.100 | −2 | small |
| 9 | E2 response | Accept → reduce: upfront only, it did not occur | +0.100 | 0 | small |
| 10 | E1 event | Delay → overtime | −0.054 | −2 | small |

Permit estimate, E4, E3, floors and system equal the reference, so they are 0. The reserve is also 0, because unused reserve is not spent (R13). Ties go to the earlier part. Estimate rows sum to 4.800, which is bridge cause 2 ✓.

**Closeness (R30, stage 1).** At 4 floors, precast (219.300, week 65) and steel (220.334, week 64) differ by 1.034 < 3.380 and share a band, so the adviser says both work. At 7 floors, steel (168.429) and CLT (172.210) differ by 3.781 ≥ 3.380, so it recommends firmly. Flow 1 step 3 says "about 1 MNOK" for this pair; that figure is a placeholder and needs updating.

**Acceptance Criteria:**

**Given** the group has confirmed or changed the proposals
**When** the pull request is merged
**Then** `simulation-rules.md` holds examples (i), (j), (k), the amended R30, and S41–S43
**And** Flow 1 step 3 in `EXPERIENCE.md` matches the closeness figures
**And** spine Open Question 2 is closed, and §5 lists no rule gap

### Story 1.6: Remove the v0.5 code

As a developer,
I want the old game out of the repo,
So that no one builds on it by accident and the app has one model of truth.

**Traces:** AD-4, AD-17, AD-20, spine table "What happens to the v0.5 code". **Depends on:** none (document stories do not block it).

**Decided here (the spine left timing to this plan) [ASSUMPTION]:** removal comes before any new engine code. The app stops being playable from this story, and Epic 0 keeps the trail. `scene/challenge` is removed. Files marked **Adapt** that import removed code (`ui/view3d.ts`, `ui/gantt.ts`, `ui/scene/visuals.ts`, `world.ts`, `props.ts`, `cast.ts`) are parked: excluded from `tsconfig` and Vitest until the stories that adapt them.

**Acceptance Criteria:**

**Given** the spine's table
**When** the removal is done
**Then** every file marked **Remove**, with its tests, is gone, including `engine/scenario, game, simulate, events, chapters, advisor` and `ui/story, scenes, play, hud, budgetLines`, `ui/tabs/*` and `scene/walk`
**And** `iconUrl` has moved out of `ui/tabs/context` into a kept module, and `ui/format.ts` is in `src/content/format.ts` with its test

**Given** the old `main.ts`
**When** it is rewritten
**Then** it calls `mountApp(root, realDeps)` and shows only a placeholder title, with `?uke` and `?scene` gone

**Given** the repo
**When** `npm test` and `npm run build` run in `ByggAPP`
**Then** both pass, and no file outside the parked list imports a removed module
**And** the park list is one commented block in `tsconfig.json` and `vite.config.ts`

**Given** AD-20
**When** the deployment files are checked
**Then** `ByggAPP/.github` and `BASE_PATH` are gone, and the package and page title read *Fra tomt til tak*

### Story 1.7: Linter and formatter

As a developer,
I want one lint and format setup,
So that four people produce one style and reviews stay on the content.

**Traces:** NFR-8, spine Consistency Conventions. **Depends on:** Story 1.6.

**Proposed [ASSUMPTION]:** Biome for both jobs. The app is on TypeScript 7, and the group's Vercel log shows TS 7 lacks the JavaScript API that older tools call, so `typescript-eslint` is a risk. Check before choosing; if Biome fails on TS 7 syntax, record why and pick again.

**Acceptance Criteria:**

**Given** `ByggAPP`
**When** a developer runs `npm run lint` and `npm run format`
**Then** lint reports rule breaches, format rewrites files, and both pass on the repo

**Given** parallel work is about to start
**When** this pull request merges
**Then** the one-time reformat is in this pull request alone, and parked files are left out

### Story 1.8: Continuous integration

As the group,
I want tests and lint to run on every pull request,
So that a red branch is seen before review, since Vercel does not run tests.

**Traces:** AD-19, spine Deferred (CI). **Depends on:** Story 1.7.

**Acceptance Criteria:**

**Given** a pull request
**When** it opens
**Then** a root GitHub Action on Node 22 runs lint, tests and build for `ByggAPP`
**And** a failure shows on the pull request

**Given** `ByggAPP/server` does not exist yet
**When** the workflow runs
**Then** it skips that package without failing, and Story 3.7 turns it on

### Story 1.9: Units, parameter file and references

As a group member,
I want every parameter in one data file,
So that I can change an estimate without touching code.

**Traces:** FR-31, NFR-8, AD-3, AD-5, S1–S43, R10, rules §0, addendum §2. **Depends on:** Story 1.7. Takes S36–S43 from Stories 1.2, 1.3 and 1.5; if those are not merged yet, the values are entered as proposed.

**Acceptance Criteria:**

**Given** the rules §0
**When** `engine/units.ts` is tested
**Then** `roundDiv` and `floorDiv` give 8.5 → 9, 8.4 → 8 and 547.62 → 548, and money is whole NOK

**Given** `engine/data/params.ts`
**When** a test reads it
**Then** every S-id from the rules exists, the risk table R10 is present, and each value carries a `source` or an `estimate` flag

**Given** `engine/data/references.ts`
**When** a test reads it
**Then** it holds exactly the projects in addendum §2, each with figure, source and year

### Story 1.10: Seeded table and purity checks

As a developer,
I want one fixed table of random numbers and a guard on the engine,
So that a choice can never shift a later draw.

**Traces:** FR-30, NFR-8, R15, AD-1, AD-2, spine import arrows. **Depends on:** Story 1.9.

**Acceptance Criteria:**

**Given** seed 115
**When** `drawAll` runs
**Then** it returns the 17 slots of example (i) to 4 decimals, in order
**And** two calls give identical values

**Given** `src/engine`
**When** the purity scan runs
**Then** it fails on DOM, `three`, `fetch`, `Date`, `Math.random`, `localStorage`, `process`, or an import from `ui`, `ai` or `content`

**Given** the spine's arrows
**When** the import scan runs
**Then** it fails on a banned direction, on `server` importing from `src`, and on any import from `02. Arkiv`

### Story 1.11: Worked examples as tests

As an examiner,
I want each hand-checked example to run as a test,
So that I can see that code follows the group's rules.

**Traces:** FR-31, SM-3, AD-18, rules §4. **Depends on:** Story 1.10.

**Acceptance Criteria:**

**Given** every example in rules §4
**When** `engine/worked-examples.test.ts` is written
**Then** each has its inputs, injected `Draws` and answers copied from the document as fixtures
**And** an example whose rule is not built yet is `it.todo` and is enabled by the story that builds it

**Given** `simulation-rules.md`
**When** the coverage test runs
**Then** it fails for any `R` id with no test title starting with that id, except ids in a shrinking `pending` list
**And** the list is empty by the end of Epic 5

### Story 1.12: Building-block model: concept to cost and time

As a student,
I want a concept to give correct plot, building cost and durations,
So that every figure on screen is one the group can check by hand.

**Traces:** FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, R1–R8, AD-3, AD-4, AD-5, S1–S23. **Depends on:** Story 1.11.

**Acceptance Criteria:**

**Given** 7 floors and steel
**When** the model runs
**Then** steps 1–4 of example (a) pass: plot 548 m², plot cost 76.720, building cost 73.734, 46 construction weeks, base cost 164.254

**Given** example (b)
**When** 4 floors run against 7
**Then** the answers pass, and 8 floors gives a named height breach as data

**Given** Appendix A
**When** all 20 allowed concepts run
**Then** each cell matches
**And** fewer floors always cost more plot than more floors

### Story 1.13: Risks, responses, suggested reserve, targets and bands

As a student,
I want correct risk figures and targets derived from the model,
So that the order and the risk step rest on the same rules.

**Traces:** FR-1, FR-10, FR-11, FR-12, FR-38, R8, R10, R11, R12, R14, R29, S41, AD-4, AD-10. **Depends on:** Stories 1.5, 1.12.

**Acceptance Criteria:**

**Given** 7 floors and steel
**When** risks and responses run
**Then** step 5 of example (a) passes cell by cell, including the E5 tie broken by lower expected delay, and transfer is not offered for E3

**Given** the reference plan
**When** targets are derived
**Then** step 7 passes: week 67 and 169 MNOK, derived and not stored

**Given** R14's table
**When** all 20 concepts run with suggested responses and reserve
**Then** each cell matches

**Given** any concept
**When** its risks are listed
**Then** there are four: E4, E5, E2 and the system's risk, with E2 at 5 % × floors

**Given** example (j)
**When** bands run
**Then** every row matches, including 177.451 and week 72 as *Klart over*

## Epic 2: Plan the project

The student goes from the start screen to a locked plan, with the building answering in 3D. The adviser window is an empty frame until Epic 3.

### Story 2.1: Playthrough state, commands and decision log

As a developer,
I want one immutable state changed only by commands,
So that every surface reads the same figures and every decision lands in one log.

**Traces:** FR-1, FR-13, FR-30, R8, AD-7, AD-8. **Depends on:** Story 1.13.

**Acceptance Criteria:**

**Given** a seed and difficulty
**When** a playthrough starts
**Then** `Playthrough` holds id, seed, difficulty, stage, draft plan and an empty log, and `Draws` come from `drawAll`

**Given** a draft plan
**When** commands such as `setFloors` run through `reduce`
**Then** a new state is returned, the old one is unchanged, and `derive` gives plan cost and week by R8

**Given** an approved plan
**When** a plan command is sent
**Then** `reduce` refuses it and the state is unchanged

**Given** a step is left, or a plan approved
**When** the command carries `at`
**Then** one log entry is appended with that time, and no entry is added per slider tick

### Story 2.2: Frame, design tokens and app shell

As a student,
I want a calm, consistent project-tool screen,
So that targets, steps and work areas are always where I expect them.

**Traces:** NFR-6, NFR-7, AD-16, AD-17, AD-19, UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR25, UX-DR26, UX-DR29. **Depends on:** Story 1.7.

**Acceptance Criteria:**

**Given** `DESIGN.md`
**When** `styles.css` is replaced
**Then** all colour, type, radius and spacing tokens are CSS custom properties, and the glass HUD styles are gone

**Given** `mountApp(root, deps)`
**When** it runs under jsdom with fake deps
**Then** top bar, step rail, main grid and adviser zone render, and a `data-action` click reaches one delegated listener
**And** jsdom 31.0.0 is added, and this smoke test is the base for later DOM tests

**Given** a window narrower than 1280 px
**When** the frame renders
**Then** the desktop notice from `EXPERIENCE.md` shows

**Given** a running playthrough
**When** the student leaves the page
**Then** the browser's leave prompt appears, and nothing is saved

**Given** any visible text
**When** a test scans `src/ui`
**Then** student-facing strings come from `src/content`

### Story 2.3: Start screen and site-office meeting

As a student,
I want to pick a difficulty, start, and hear the order,
So that I know the job, the deadline and the budget before I plan.

**Traces:** FR-1, FR-2, R14, S35, UX-DR21. **Depends on:** Stories 2.1, 2.2.

**Acceptance Criteria:**

**Given** the start screen
**When** the student picks *lett*, *middels* or *vanskelig* and starts
**Then** a playthrough begins with a seed, or the `?seed=` value if given

**Given** the meeting
**When** it plays
**Then** the client gives 100 workplaces, Oslo, target week and target cost from the engine in 3–4 lines, and the targets settle into the top bar

**Given** the meeting
**When** the student presses "Hopp over" or reaches the end
**Then** the Konsept step opens

### Story 2.4: 3D card with a parametric building

As a student,
I want to see my concept as a building on the plot,
So that each choice has a visible answer.

**Traces:** FR-6, NFR-4, NFR-5, AD-15, UX-DR22. **Depends on:** Story 2.2. Unparks `ui/view3d.ts` and `scene/visuals, world, props, cast`.

**Acceptance Criteria:**

**Given** `SceneState` for floors and footprint
**When** the card updates
**Then** the building shows those floors and footprint on the plot, with the dashed height limit, and floors over the limit in `bad`

**Given** `View3d`
**When** it is inspected
**Then** it exposes only `update`, `setActive` and `dispose`, and has no callbacks into the shell, no player and no walking

**Given** `three` fails to load, or WebGL is missing
**When** the card mounts
**Then** the static illustration and the text alternative show, and the playthrough continues

**Given** a `SceneState`
**When** `describeScene` runs
**Then** it returns the Norwegian text alternative, for example "7 etasjer i stål, 28 m høyt, fotavtrykk 329 m² på en tomt på 548 m². Høydegrense 28 m."
**And** the v0.5 automatic quality drop is kept

### Story 2.5: Konsept step

As a student,
I want to choose floors and structure and see the consequences at once,
So that I can feel the trade-off between land and time.

**Traces:** FR-3, FR-4, FR-5, FR-6, R2–R8, AD-17, UX-DR5, UX-DR6, UX-DR7, UX-DR20. **Depends on:** Stories 2.1, 2.3, 2.4.

**Acceptance Criteria:**

**Given** the Konsept step
**When** the student changes floors or system by mouse or keyboard
**Then** plot area, plot cost, building cost, finish week and site overhead per week match `derive`, and the input keeps focus

**Given** the plot card
**When** it shows
**Then** price per m², maximum %BYA and maximum height are visible

**Given** 8 floors
**When** selected
**Then** the red InfoBar names 32 m against 28 m, the row turns red, the 3D floor turns red, and "Neste: Tidsplan" is disabled with its reason visible and focusable

### Story 2.6: Tidsplan step with Gantt chart

As a student,
I want to estimate each main part and see the plan take shape,
So that my schedule estimate becomes something I own.

**Traces:** FR-7, FR-8, R6, R8, UX-DR7, UX-DR8, UX-DR21, UX-DR27. **Depends on:** Story 2.5. Unparks `ui/gantt.ts`.

**Acceptance Criteria:**

**Given** the Tidsplan step
**When** it opens
**Then** six fields are empty, in fixed order, and the Gantt chart shows "Fyll inn varighet for å se planen."

**Given** a duration is entered
**When** the student presses Enter or leaves the field
**Then** the Gantt chart, critical path and finish week update, and the finish week is compared with the target week

**Given** missing durations
**When** the student looks at "Neste"
**Then** it is disabled with "Fyll inn varighet for 2 hoveddeler til.", and no InfoBar shows

**Given** the Gantt chart
**When** it renders
**Then** all six parts are marked as critical, and the target week is a dashed line with a text label

### Story 2.7: Milestones in the schedule step

As a student,
I want to set two or three milestones,
So that I commit to checkpoints the project will be measured against.

**Traces:** FR-32, R31, UX-DR10, UX-DR27. **Depends on:** Stories 1.1, 2.6.

**Acceptance Criteria:**

**Given** the Tidsplan step
**When** estimates are complete
**Then** *Råbygg ferdig* and *Tett bygg* are pre-filled with the plan's finish weeks, and diamonds show on the Gantt chart

**Given** the milestone rows
**When** the student adds a third, changes a week, or removes one
**Then** names come from the fixed list, no part is used twice, and there are never fewer than 2 or more than 3

**Given** an unedited milestone
**When** an estimate changes
**Then** its week follows; an edited one stays

**Given** the step is left
**When** the log is written
**Then** the milestones are part of the entry and of the approved plan

### Story 2.8: Risiko og reserve step

As a student,
I want to respond to known risks and set a reserve,
So that I decide what to pay for now and what to carry.

**Traces:** FR-10, FR-11, FR-12, R10, R11, R13, UX-DR11, UX-DR12. **Depends on:** Story 2.6.

**Acceptance Criteria:**

**Given** a concept
**When** the step opens
**Then** its four risks show probability, impact and four options with cost and effect, and transfer is hidden where c = 0

**Given** a response is chosen
**When** the choice is made
**Then** risk exposure updates in the card and the top bar, as expected cost and expected delay

**Given** the reserve fields
**When** weeks and MNOK are set
**Then** plan cost and plan week include them, and zero is accepted

**Given** a risk has no response yet
**When** the student looks at "Neste"
**Then** it is disabled with the count of what is missing

### Story 2.9: Legg frem: approve the plan

As a student,
I want to see the whole plan against the targets and approve it,
So that the plan is locked as what the project is measured against.

**Traces:** FR-13, R4, R8, AD-7, AD-8, UX-DR4, UX-DR13. **Depends on:** Stories 2.5, 2.7, 2.8.

**Acceptance Criteria:**

**Given** the Legg frem step
**When** it opens
**Then** concept, Gantt, cost, risk exposure, reserve and milestones show against the targets in the bands from R29, in the site office setting

**Given** the rail before approval
**When** the student clicks an earlier step
**Then** it opens with its values kept

**Given** a plan that breaks the zoning limit
**When** the student tries to approve
**Then** approval is blocked with the reason visible

**Given** a plan that misses a target
**When** the student presses "Godkjenn planen"
**Then** the dialog opens with focus on "Gå tilbake", and confirming locks the plan and leaves stage 1 read-only

### Story 2.10: Term explanations in plain Norwegian

As a newcomer,
I want each technical term explained where I meet it,
So that I never have to guess what BTA or rigg og drift means.

**Traces:** NFR-6, NFR-9, AD-16, UX-DR17, UX-DR29. **Depends on:** Story 2.8.

**Acceptance Criteria:**

**Given** a surface
**When** a listed term first appears on it
**Then** it has a dotted underline, opens a popover on hover or focus, and closes on Esc

**Given** `src/content/terms`
**When** a test reads it
**Then** BTA, BRA, %BYA, kritisk linje, CLT, reserve, rigg og drift and MNOK each have a short explanation

**Given** student-facing strings
**When** the test scans them
**Then** no listed abbreviation appears without its term markup on the first occurrence of each surface

## Epic 3: Plan with Rådgiver

The adviser suggests, warns and answers, always, with or without a key. A key adds the language model and nothing else. Stories 3.6 and earlier need no server.

### Story 3.1: Suggestion rules

As a student,
I want a reasoned suggestion at each step,
So that I have a sensible starting point and know why.

**Traces:** FR-9, FR-14, R12, R30, S42, AD-10. **Depends on:** Stories 1.5, 1.13.

**Acceptance Criteria:**

**Given** any stage 1 step
**When** `engine/adviser/suggest` runs
**Then** it returns records with `kind`, `ruleId`, `subject` and `values`, and no text

**Given** the same input
**When** it runs twice
**Then** the output is identical

**Given** 4 floors, comparing precast and steel
**When** closeness runs
**Then** it says the choice matters little, with about 1.0 MNOK (example (k) closeness)

**Given** 7 floors, comparing steel and CLT
**When** closeness runs
**Then** it recommends one firmly

### Story 3.2: Warning rules with reference values

As a student,
I want warnings that open with what real projects did,
So that I can weigh my estimate against evidence.

**Traces:** FR-13, FR-15, FR-36, R4, R9, R11, S25, AD-5, AD-10, SM-3. **Depends on:** Story 1.13.

**Acceptance Criteria:**

**Given** a reference of 10
**When** the estimate is 8, 12 or 7
**Then** only 7 warns, and the warning states the reference value (R9)

**Given** steel or CLT
**When** a schedule warning fires
**Then** it cites a project from `references.ts` with its figure and source year

**Given** cast-in-place concrete
**When** a schedule warning fires
**Then** the reference is generic and still states its source

**Given** 8 floors
**When** the zoning check runs
**Then** the warning names the 28 m limit

**Given** a reserve of zero, or a reduce or transfer price above the risk's expected cost
**When** the risk step is checked
**Then** the FR-36 warning is returned

**Given** a plan that misses a target
**When** the plan is checked
**Then** a warning record is returned for FR-13

### Story 3.3: Adviser window with suggestions and warnings

As a student,
I want Rådgiver always beside me, speaking when it matters,
So that advice arrives at the right moment and never gets in the way.

**Traces:** FR-13, FR-14, FR-15, AD-8, AD-10, AD-16, UX-DR2, UX-DR19, UX-DR20, UX-DR21, UX-DR29. **Depends on:** Stories 2.9, 3.1, 3.2.

**Acceptance Criteria:**

**Given** any surface after the start screen
**When** it renders
**Then** the window is open bottom-right, has no close or minimise control, and covers no figure or button

**Given** the site office
**When** the student arrives
**Then** the greeting from `EXPERIENCE.md` shows

**Given** a stage 1 step
**When** the student enters it
**Then** one *Forslag* appears, ending in "Grunnlag: …", and slider ticks add no message

**Given** a warning fires
**When** it is non-blocking
**Then** a yellow InfoBar and a *Varsel* appear, the top-bar count rises, "Neste" stays enabled, and it is logged once

**Given** Legg frem
**When** it opens
**Then** a *Vurdering* shows, and the dialog lists every open warning, which is logged on approval

**Given** a new message
**When** it arrives
**Then** it is announced politely, and focus does not move

### Story 3.4: "Bruk forslaget"

As a student,
I want to accept a duration with one press,
So that I can follow the reference when I choose to, and still change it.

**Traces:** FR-9, R12, R27, AD-10, UX-DR9. **Depends on:** Stories 2.6, 3.3.

**Acceptance Criteria:**

**Given** the Tidsplan step
**When** the student presses "Bruk forslaget" on a part
**Then** that field takes the reference duration, stays editable, and the suggestion's basis is shown

**Given** "Bruk alle forslag"
**When** pressed
**Then** all six fields fill

**Given** a used suggestion
**When** the log is written
**Then** it is logged as followed, and adviser code has issued no command

### Story 3.5: Suggested questions and prepared answers

As a student,
I want ready questions that always get an answer,
So that I can learn without typing and without a network.

**Traces:** FR-16, NFR-1, NFR-9, AD-12, AD-16, UX-DR17, UX-DR19. **Depends on:** Story 3.3.

**Acceptance Criteria:**

**Given** any step
**When** chips render
**Then** there are 3–5, and they change with the step

**Given** a chip
**When** pressed with no key and no network
**Then** an answer shows, ending in "Grunnlag: …"

**Given** prepared answers
**When** tested
**Then** every figure is a template filled from engine facts, and none is a literal

**Given** a term chip
**When** answered
**Then** the text equals the term's popover text

### Story 3.6: Free text without a server

As a student,
I want to type any question and get an answer,
So that the adviser works before any key exists.

**Traces:** FR-17, NFR-1, AD-11, AD-12, AD-16, UX-DR19. **Depends on:** Story 3.5.

**Acceptance Criteria:**

**Given** no server and no key
**When** the student sends a question
**Then** `ai/ask.ts` returns `nearestPrepared(question, step, facts)`, captioned "Forberedt svar", and no error shows

**Given** an off-topic question
**When** answered
**Then** the reply steers back to the current step, with its chips

**Given** a reply containing a number not in the approved facts
**When** `guard` runs
**Then** the reply is dropped and the prepared answer shown

**Given** all prepared answers
**When** `guard` runs on them in a test
**Then** each passes

**Given** `src/ai`
**When** it is scanned
**Then** it has no access to `dispatch` or `reduce`, and replies go only to `UiState`, never to the log or the engine

**Given** a question is waiting for an answer
**When** the window renders
**Then** "Rådgiver skriver …" shows, and the input stays enabled

### Story 3.7: Adviser server function

As the group,
I want one small server function that holds the key,
So that the language model can answer without the key reaching the browser.

**Traces:** FR-17, NFR-1, NFR-2, AD-11, AD-13, AD-14, AD-19, spine Open Question 4. **Depends on:** Story 3.6.

**External dependency.** The live path needs Elisabeth to add `ANTHROPIC_API_KEY` and `ADVISER_MODEL` (value `claude-sonnet-5-5`) on Vercel, Production only. **This story does not wait for that.** It merges and passes with no key: the status route says `live: false`, POST answers 503, and the client uses prepared answers. The live check is in Story 3.9.

**Acceptance Criteria:**

**Given** `ByggAPP/server`
**When** the package is created
**Then** it has its own `package.json` with TypeScript ~5.9.3 and `@anthropic-ai/sdk`, and `contract.ts` holds the contract from AD-13
**And** kept code from `02. Arkiv/AI_BYGGplant/server` is copied and adapted, never imported

**Given** no `ANTHROPIC_API_KEY` or no `ADVISER_MODEL`
**When** `GET /api/adviser/status` and `POST /api/adviser` are called
**Then** status returns `{ live: false }` and POST returns 503

**Given** a key and an injected fake client
**When** a valid request arrives
**Then** the reply is `{ answer, basis, onTopic }` with status 200, and the model comes from `ADVISER_MODEL`

**Given** a bad request
**When** it has the wrong method, an invalid shape, more than 500 characters of question, more than 6 history items, a body over 32 KB, or too many calls
**Then** it returns 405, 400, 413 or 429, and a client failure returns 502

**Given** the SDK call
**When** it is configured
**Then** the timeout is 7 s with `maxRetries: 0`, questions and facts are not logged, and no route accepts or returns a state change

**Given** the server tests
**When** CI runs
**Then** they run with no network and no key, and the workflow from Story 1.8 now covers this package

### Story 3.8: Vercel services and local proxy

As a developer,
I want the app and the function deployed together,
So that production and local runs behave the same way.

**Traces:** NFR-1, NFR-2, AD-13, AD-20, SM-4. **Depends on:** Story 3.7.

**Acceptance Criteria:**

**Given** `vercel.json`
**When** it is updated
**Then** it holds services `byggapp` and `adviser`, with `/api/(.*)` rewritten to `adviser` before the catch-all

**Given** a deployment with no key
**When** the app is opened
**Then** the game runs, status says `live: false`, and answers are prepared

**Given** `ByggAPP/server/.env.example`
**When** it is read
**Then** it lists `ANTHROPIC_API_KEY` and `ADVISER_MODEL` with no values, and real env files are in `.gitignore`

**Given** a local key
**When** `npm start` runs in `server` next to `npm run dev`
**Then** the Vite proxy forwards `/api` to it

**Given** the production bundle
**When** it is searched
**Then** it holds no key and no SDK code

### Story 3.9: Live adviser client

As a student,
I want real answers when a key is available,
So that I can discuss and push back, without ever waiting long or seeing an error.

**Traces:** FR-17, NFR-1, AD-12, AD-14, spine Open Question 4, spine Deferred (prompt text and approved-facts list). **Depends on:** Story 3.8. Live checks need the Vercel variables from Story 3.7.

**Acceptance Criteria:**

**Given** the start of a playthrough
**When** the client loads
**Then** it asks the status route once, and with `live: false` no later question waits on the network

**Given** `live: true` and a fake `fetch`
**When** a question gets a 200
**Then** the reply passes `guard` before display and shows its reasons, and nothing is streamed

**Given** a non-200, a guard miss, or no reply within 8 s
**When** the question is answered
**Then** the nearest prepared answer shows, with no error

**Given** 20 calls in one playthrough
**When** the student asks again
**Then** the prepared answer is used without a call

**Given** the prompt
**When** it is written
**Then** it holds the scenario, rules and approved facts, and the facts list is built from `derive`

**Given** the Vercel variables are set
**When** the group tests production
**Then** the result is recorded in the manual test plan: response time against 7 s, cost per playthrough, and who owns the key and the Console spend limit

**Given** the variables are not yet set
**When** this story is reviewed
**Then** it merges on the fake-`fetch` tests, and the live check stays open as a line in the manual test plan

## Epic 4: Run the plan

The approved plan runs, events force decisions, and the student sees their path next to the AI's.

### Story 4.1: Event selection

As a student,
I want events that follow from my plan,
So that what hits me is the result of my own choices.

**Traces:** FR-19, FR-21, FR-30, FR-35, R15, R16, R17, R18, R19, R33, AD-2, AD-6. **Depends on:** Stories 1.3, 2.1.

**Acceptance Criteria:**

**Given** the plan and `Draws` in example (c)
**When** `selectEvents` runs
**Then** actual durations are 12, 16, 9, 10, 13, 5, and the overrun hits groundworks with size 6

**Given** example (d)
**When** events are selected
**Then** they are E1, E5 and E8 at the right parts, in the order in R19

**Given** example (i)
**When** E5 is avoided
**Then** E2 occurs instead, and every other slot's use is unchanged

**Given** a plan with no positive gap
**When** events are selected
**Then** the next eligible risk takes the overrun's place (R18)

**Given** example (g), and the cases n = 4 and n < 3
**When** R33 runs
**Then** the results match, and there is never more than one opportunity

**Given** many seeds and plans
**When** events are selected twice
**Then** the result is identical, and nothing depends on a decision

### Story 4.2: Replay and forecasts

As a developer,
I want one pure fold over the six parts,
So that the run, the forecasts and every later what-if share one calculation.

**Traces:** FR-18, FR-30, FR-34, R13, R19, R24, R34, AD-3, AD-6, AD-9. **Depends on:** Stories 1.4, 4.1.

**Acceptance Criteria:**

**Given** example (c) with the delay taken
**When** `replay` runs with no further events
**Then** it gives 166.354 and week 65

**Given** example (h)
**When** the visible forecast runs at week 0 and at week 12
**Then** it gives 161.554 and week 49, then 163.354 and week 55

**Given** `timelineAt(run, week)`
**When** the cursor moves
**Then** progress per part is correct, and the cursor stops at the next undecided event

**Given** example (d)
**When** the reserve is computed
**Then** 3.000 of cost is used, and the reserve has run out (R13)

**Given** an upfront response cost
**When** a run is computed
**Then** it is included in final cost [ASSUMPTION: R26 shows none only because example (d) has none]

### Story 4.3: Overtime and hiring

As a student,
I want overtime and hiring as real options with real limits,
So that I learn that resources are not free.

**Traces:** FR-20, FR-33, R20, R21, R32, S26–S33, S36, S37, AD-10. **Depends on:** Stories 1.2, 4.2.

**Acceptance Criteria:**

**Given** example (c)
**When** options are built
**Then** overtime gives 14 weeks and 0.546, and hiring 12 gives 13 weeks and 1.901

**Given** example (f)
**When** `h` is 4, 8, 12 or 16
**Then** each row matches, and `h = 20` is refused with a capacity record

**Given** overtime chosen twice on one part
**When** it is applied
**Then** heavy overtime gives ×4/3 at 0.078 per week, and a warning record names the 10 h cap

**Given** a part with overtime
**When** hiring is offered
**Then** it is not available, because they cannot be combined in v1

**Given** idle weeks on a part
**When** overtime or hiring applies
**Then** only work weeks are compressed

### Story 4.4: Risk, change-request and opportunity options

As a student,
I want each event to offer clear choices,
So that I can weigh effect now against effect later.

**Traces:** FR-20, FR-21, FR-35, R11, R22, R23, R33. **Depends on:** Story 4.2.

**Acceptance Criteria:**

**Given** E5 accepted in stage 1
**When** it occurs as in example (d)
**Then** the options are 4 idle weeks and 2.000, or the alternative of 2 weeks and 2.500, or overtime on the part

**Given** a reduced or transferred risk
**When** it occurs
**Then** the response's impact from R11 applies, and an avoided risk never fires

**Given** E8
**When** it fires at the start of part 5
**Then** the options are now, at 2.000 and 2 idle weeks, or later, at 3.000 and none

**Given** O1 or O2
**When** it fires
**Then** taking it applies S39 or S40, and declining changes nothing

**Given** any event
**When** options are built
**Then** there are 2–4, each with its effect now and later as data

### Story 4.5: AI recommendation and AI path

As a student,
I want the AI's choice made by rules from the same options,
So that the comparison is fair, and difficulty changes how far I can trust it.

**Traces:** FR-1, FR-20, FR-22, R24, R25, S35, AD-9, AD-10. **Depends on:** Stories 4.3, 4.4.

**Acceptance Criteria:**

**Given** example (c) on easy
**When** the AI recommends
**Then** it picks overtime (166.300)

**Given** example (i) on medium and on hard
**When** three events are recommended
**Then** the results match the table: best each time on medium, and second-best, best, second-best on hard

**Given** a tie on cost
**When** ranking runs
**Then** the earlier week wins, then the option listed first

**Given** many seeds
**When** options are ranked by R24 and by R34
**Then** the order and the differences are identical

**Given** a decision in example (d)
**When** the AI path is computed
**Then** it comes from `replay` with the AI's option from the same state

### Story 4.6: Execution surface and playback

As a student,
I want to watch the project run with the forecast beside it,
So that I feel time passing and see what it costs.

**Traces:** FR-18, FR-34, R13, R34, AD-6, AD-7, UX-DR3, UX-DR4, UX-DR23, UX-DR24. **Depends on:** Stories 2.9, 4.2.

**Acceptance Criteria:**

**Given** an approved plan
**When** stage 2 opens
**Then** the top bar shows *Prognose sluttkostnad*, *Prognose ferdig* and *Reserve igjen*, and the rail shows the week and six parts

**Given** playback
**When** it runs
**Then** weeks advance by themselves, and the cards recompute weekly and after each decision from the visible forecast

**Given** week 0 of example (c)
**When** the cards render
**Then** they show the plan's 161,6 MNOK and uke 49, not the overrun

**Given** focus outside a text field
**When** Space is pressed
**Then** the run pauses or resumes, and "Hopp til neste hendelse" skips the wait

**Given** an undecided event
**When** its week arrives
**Then** the run stops until a decision is committed

**Given** the reserve is used up
**When** the card reaches 0
**Then** it turns warning and Rådgiver notes it

**Given** the last part finishes
**When** the run ends
**Then** stage 3 opens

### Story 4.7: Event card and decision

As a student,
I want to read what happened and choose,
So that each event is my decision, with nothing forced by a timer.

**Traces:** FR-20, FR-22, FR-33, FR-35, R32, AD-8, UX-DR14, UX-DR15, UX-DR24. **Depends on:** Stories 4.5, 4.6.

**Acceptance Criteria:**

**Given** a stop at an event
**When** the card shows
**Then** focus moves to the event title, and 2–4 radio rows show "nå", "senere" and a delta, tagged "Rådgiver anbefaler" on one

**Given** the hire option
**When** the student uses the stepper
**Then** it moves in steps of 4 and the delta updates; at 16 the plus is disabled with "Maks 40 på byggeplassen samtidig", and Rådgiver explains why

**Given** heavy overtime
**When** selected
**Then** a yellow warning and a *Varsel* show, and it is logged

**Given** an opportunity
**When** the card shows
**Then** the saving is shown in `good`, with its text

**Given** "Bekreft valg"
**When** pressed
**Then** `decideEvent` appends one log entry with the choice, recommendation and warning

### Story 4.8: Path comparison

As a student,
I want my path beside the AI's after each decision,
So that I see the consequence while I still remember the choice.

**Traces:** FR-22, R25, R29, R34, UX-DR16. **Depends on:** Story 4.7.

**Acceptance Criteria:**

**Given** a committed decision
**When** the cards show
**Then** "Din vei" and "AI-veien" each show week and cost against targets with a band, from the visible forecast and the same state

**Given** the student chose as the AI did
**When** the cards show
**Then** both show the same figures

**Given** "Fortsett byggingen"
**When** pressed
**Then** playback resumes

### Story 4.9: Milestone status during the run

As a student,
I want to see my milestones hold or slip,
So that I notice trouble while I can still respond.

**Traces:** FR-32, R31, R34, UX-DR4. **Depends on:** Stories 2.7, 4.6.

**Acceptance Criteria:**

**Given** example (e)
**When** the run passes weeks 0, 12 and 30
**Then** *Råbygg ferdig* goes from *Planlagt* to *I fare* to *Ikke nådd*, as in the rule

**Given** a part that finishes on time
**When** it finishes
**Then** its milestone shows *Nådd*

**Given** any status
**When** shown in the rail
**Then** it has a text label, not only a colour

### Story 4.10: Construction progress in 3D

As a student,
I want the building to rise as the weeks pass,
So that the project feels real and events can be seen.

**Traces:** FR-18, NFR-4, NFR-5, AD-15, UX-DR22, UX-DR24. **Depends on:** Stories 2.4, 4.6.

**Acceptance Criteria:**

**Given** `timelineAt`
**When** `sceneState` runs
**Then** progress follows the six parts, and `View3d` is given nothing else

**Given** stage 2
**When** the view updates
**Then** `describeScene` gives text such as "Uke 34: råbygget er 60 % ferdig, 5 av 7 etasjer reist."

**Given** an event
**When** the run stops
**Then** the 3D view shows it without any camera input from the student

**Given** `prefers-reduced-motion`
**When** set
**Then** transitions cut, and auto-advance still works

**Given** a removed `scene/challenge`
**When** events show
**Then** nothing depends on it [ASSUMPTION: a re-keyed version to E1–E10 is optional and not in scope]

## Epic 5: Understand the result

The debrief is a pure function of plan, draws and log. It explains the result and ties it to the learning goals.

### Story 5.1: Budget bridge calculation

As a student,
I want the difference from target split by cause,
So that I can see what came from my plan, the events and my own decisions.

**Traces:** FR-24, R26, AD-8, AD-9. **Depends on:** Story 4.5.

**Acceptance Criteria:**

**Given** example (d)
**When** the bridge runs
**Then** causes are −7.446, +4.800, +5.646, +0.554, summing to +3.554, with run 3 at 172.000 and week 67

**Given** example (g)
**When** the bridge runs
**Then** the causes sum to +2.654

**Given** many seeds and plans
**When** the bridge runs
**Then** the four causes sum exactly to final minus target

**Given** the reserve
**When** the bridge is returned
**Then** it is a separate line, not a cause

### Story 5.2: AI trust and learning goals

As a student,
I want to know how the AI did and which goals I missed,
So that I learn when to follow it, and what to do next time.

**Traces:** FR-27, FR-28, R27, R28, PRD §4.10, AD-9. **Depends on:** Story 5.1.

**Acceptance Criteria:**

**Given** example (d)
**When** trust runs
**Then** it gives 9 recommendations, 1 followed, 7 right, and 6 right but not followed

**Given** example (d)
**When** goals run
**Then** time, risk and AI advice are missed, and resources is not

**Given** E5 in example (d)
**When** the risk goal is judged
**Then** it does not count, because accept and reduce tie, and bad luck is not punished

**Given** hiring 4 or 8 in example (f)
**When** the resources goal is judged
**Then** it is missed

### Story 5.3: Decision impact

As a student,
I want to see which decisions weighed most,
So that I remember the few that mattered, not the many that did not.

**Traces:** FR-14, FR-38, R30, S43, AD-9. **Depends on:** Stories 1.5, 5.1.

**Acceptance Criteria:**

**Given** example (k)
**When** impact runs
**Then** the ranking and values match, with the top three not labelled small and the rest labelled small

**Given** example (k)
**When** estimate impacts are summed
**Then** they equal bridge cause 2

**Given** a stage 1 swap that changes the event set
**When** impact runs
**Then** stage 2 decisions are kept for events that still occur, and the AI handles new ones (AD-9)

### Story 5.4: Debrief: result, bridge and what mattered most

As a student,
I want the debrief to open with the result and its cause,
So that the climax comes early.

**Traces:** FR-24, FR-38, R29, AD-16, UX-DR3, UX-DR24, UX-DR28. **Depends on:** Stories 5.1, 5.3.

**Acceptance Criteria:**

**Given** the debrief
**When** it opens
**Then** *Resultat* shows final cost and week in bands, and the top bar shows them too

**Given** *Budsjettbroen*
**When** it renders
**Then** the waterfall has four cause bars in FR-24 order, each labelled in MNOK, with the reserve as a line below

**Given** "Vis som tabell"
**When** pressed
**Then** the same figures show in a table

**Given** *Det som betydde mest*
**When** it renders
**Then** the top three show MNOK and weeks, and small ones read "liten betydning"

**Given** the debrief's wording
**When** it is tested
**Then** only *På mål*, *Litt over* and *Klart over* are used

### Story 5.5: Debrief: plan against actual, milestones and past warnings

As a student,
I want to see my plan over what happened, and what I was warned about,
So that the cost of ignoring advice shows in my own numbers.

**Traces:** FR-15, FR-23, FR-32, R31, UX-DR21, UX-DR24, UX-DR27, UJ-1 edge case, EXPERIENCE Flow 2. **Depends on:** Stories 4.2, 4.9.

**Acceptance Criteria:**

**Given** a finished run
**When** *Plan mot faktisk* renders
**Then** each part shows planned and actual start and finish, and each late part is marked in text as well as colour

**Given** milestones
**When** the section renders
**Then** each shows its week, actual finish and final status

**Given** a warning the student overrode
**When** the section renders
**Then** it shows again beside what happened: "Rådgiver advarte: rundt 13 uker. Du planla 10. Faktisk: 16."

**Given** a warning that turned out wrong
**When** the section renders
**Then** the same spot says so

**Given** "Vis som tabell"
**When** pressed
**Then** the Gantt data shows in a table

### Story 5.6: Debrief: risks, AI path, trust and conclusion

As a student,
I want a short, fair closing,
So that I leave knowing what to do differently.

**Traces:** FR-25, FR-26, FR-27, FR-28, R27, R28, R29, UX-DR21, UX-DR29, SM-2. **Depends on:** Stories 5.2, 5.3.

**Acceptance Criteria:**

**Given** *Risikoer*
**When** it renders
**Then** each known risk shows its response and whether it occurred, and each event shows the option chosen

**Given** no risk occurred, no overrun or no missed goals
**When** the section renders
**Then** the matching plain sentence from `EXPERIENCE.md` shows

**Given** *Din vei mot AI-veien*
**When** it renders
**Then** both show final week and cost against targets, from the same seed and plan, by R24

**Given** *AI-tillit*
**When** it renders
**Then** the four figures from FR-28 show

**Given** *Konklusjon*
**When** it renders
**Then** it has 2–3 sentences naming exactly the missed goals, with one "Neste gang" for each

### Story 5.7: Decision log view and download

As a student,
I want to read and keep every decision,
So that I can look back and hand it in.

**Traces:** FR-29, AD-8, PRD §6 Privacy, spine convention Decision-log file, UX-DR18, UX-DR21. **Depends on:** Story 4.7.

**Acceptance Criteria:**

**Given** the top bar at any time
**When** "Beslutningslogg" is opened
**Then** a read-only list shows each choice with time, recommendation and warning, or the empty state

**Given** the debrief
**When** "Last ned" is pressed
**Then** one UTF-8 CSV with BOM and `;` downloads, with one row per log entry

**Given** the CSV builder
**When** tested
**Then** it is pure, and the row count equals the log length

**Given** the app
**When** it runs
**Then** the log stays in the browser unless downloaded

## Epic 6: Prove it and hand over

The group shows that it works and that an outsider can run it.

### Story 6.1: DOM click flow: Sara's playthrough

As the group,
I want the main journey to run as a test,
So that a change that breaks the flow fails before review.

**Traces:** FR-1 to FR-29 (flow), NFR-8, AD-19, UJ-1, EXPERIENCE Flow 1. **Depends on:** Stories 4.8, 5.6, 5.7.

**Acceptance Criteria:**

**Given** `mountApp` under jsdom with a fake `View3d` and adviser port, and a fixed seed
**When** the test clicks from start to debrief
**Then** it passes through all stages, and the final figures on screen equal the engine's

**Given** 8 floors in the flow
**When** "Neste" is tried
**Then** the test sees it blocked, with the reason

**Given** the flow
**When** it finishes
**Then** the log has one entry per decision

### Story 6.2: DOM click flows: warned plan and no key

As the group,
I want the edge flows tested as well,
So that the warning trail and the no-key path cannot break unnoticed.

**Traces:** FR-13, FR-15, FR-16, FR-17, NFR-1, AD-12, AD-19, EXPERIENCE Flow 2. **Depends on:** Story 6.1.

**Acceptance Criteria:**

**Given** Flow 2
**When** the test approves a plan against a warning
**Then** the dialog lists it, the log holds it, and the debrief shows it beside what happened

**Given** no key and status `live: false`
**When** the test uses a chip and free text at each stage
**Then** each gets an answer marked "Forberedt svar", and no error text appears

**Given** a fake port that fails or times out
**When** a question is asked
**Then** the same prepared answer path runs

### Story 6.3: Manual test plan and first round

As the group,
I want a written plan for what automation cannot reach,
So that each test round leaves a record.

**Traces:** NFR-10, NFR-4, FR-17, AD-19. **Depends on:** Story 6.1.

**Acceptance Criteria:**

**Given** `ByggAPP/docs/manual-test-plan.md`
**When** it is written
**Then** it covers the 3D view, free-text answers and a full playthrough, each with steps, expected result and a result column

**Given** a test round
**When** it is finished
**Then** date, tester, build, results and follow-ups are recorded, and one round is complete

**Given** Story 3.9's open items
**When** the plan is written
**Then** the live adviser check is listed, marked open until the Vercel variables exist

### Story 6.4: Accessibility check

As a student using the keyboard or a screen reader,
I want every choice within reach,
So that the simulator works for me too.

**Traces:** NFR-5, UX-DR20, UX-DR23, UX-DR24. **Depends on:** Story 6.1.

**Acceptance Criteria:**

**Given** the full flow
**When** a tester plays with the keyboard only
**Then** every choice can be made, including slider, radios, event card, stepper, dialog and popover, and tab order follows reading order

**Given** each surface
**When** `axe-core` [ASSUMPTION] runs under jsdom in the DOM tests
**Then** there are no serious or critical findings, and a contrast check of `DESIGN.md` tokens against WCAG 2.2 AA passes in Node, since jsdom cannot measure contrast

**Given** a screen reader
**When** a tester plays through once
**Then** the 3D text alternative, polite and assertive announcements, and the focus move to the event title all work

**Given** the checks
**When** they finish
**Then** findings are fixed or listed in the manual test plan with a reason

### Story 6.5: Performance and session timing

As the group,
I want measured figures for speed and session length,
So that NFR-3 and NFR-4 are shown and not assumed.

**Traces:** NFR-3, NFR-4, SM-1, SM-2, FR-18. **Depends on:** Story 6.3.

**Acceptance Criteria:**

**Given** an ordinary student laptop
**When** the 3D view runs through stage 2
**Then** the frame rate is at least 30 fps, or the automatic quality drop reaches it, and the result is recorded

**Given** at least 5 testers outside the group
**When** each plays unaided
**Then** time per stage is recorded against about 10, 6 and 4 minutes, with at least 4 of 5 finishing in 25 minutes or less
**And** testers answer the four learning-goal questions, with results recorded against SM-2

**Given** stage 2 runs too long or too short
**When** the result is reviewed
**Then** the playback speed is changed in one named constant, not across the surface

### Story 6.6: README and hand-over

As an examiner,
I want a README that gets me running on the first try,
So that I can run the simulator without keys and trace requirements to code.

**Traces:** FR-37, NFR-1, NFR-2, NFR-6, SM-4, AD-20. **Depends on:** Stories 3.8, 6.2.

**Acceptance Criteria:**

**Given** `README.md`
**When** it is updated
**Then** Status describes the built app, the folder list matches the repo, and run, test, lint and build commands are correct
**And** it explains how the adviser runs with and without a key, and links this document

**Given** a person outside the group
**When** they follow the README on a clean machine with no key
**Then** the whole game runs on the first try, and the result is recorded

**Given** PRD §13
**When** it is checked against the build
**Then** every assignment item still maps to a built FR, with changes made in the table (FR-37)

**Given** the repo and its history
**When** a secret scan runs
**Then** no key is found, and `G115_Changelog.md` has an entry for this version

## Coverage: every FR and NFR to stories

Result: **all 38 FRs and all 10 NFRs map to at least one story.** Nothing is unmapped. Stories in bold are the main home of the requirement.

| Req | Stories | Req | Stories |
|---|---|---|---|
| FR-1 | **2.3**, 1.13, 2.1, 4.5 | FR-26 | **5.6**, 1.4 |
| FR-2 | **2.3** | FR-27 | **5.6**, 5.2 |
| FR-3 | **2.5**, 1.12 | FR-28 | **5.6**, 5.2 |
| FR-4 | **2.5**, 1.12 | FR-29 | **5.7** |
| FR-5 | **2.5**, 1.12 | FR-30 | **1.10**, 2.1, 4.1, 4.2 |
| FR-6 | **2.5**, 1.12, 2.4 | FR-31 | **1.11**, 1.5, 1.9 |
| FR-7 | **2.6**, 1.12 | FR-32 | **2.7**, **4.9**, 1.1, 1.4, 5.5 |
| FR-8 | **2.6**, 1.12 | FR-33 | **4.3**, **4.7**, 1.2 |
| FR-9 | **3.4**, 3.1 | FR-34 | **4.6**, 1.4, 4.2 |
| FR-10 | **2.8**, 1.13 | FR-35 | **4.1**, **4.4**, 1.3, 4.7 |
| FR-11 | **2.8**, 1.13 | FR-36 | **3.2** |
| FR-12 | **2.8**, 1.13 | FR-37 | **6.6** |
| FR-13 | **2.9**, 2.1, 3.2, 3.3, 6.2 | FR-38 | **5.3**, **5.4**, 1.5, 1.13 |
| FR-14 | **3.1**, **3.3**, 1.5, 5.3 | NFR-1 | **3.6**, 3.5, 3.7, 3.8, 3.9, 6.2, 6.6 |
| FR-15 | **3.2**, **3.3**, 5.5, 6.2 | NFR-2 | **3.7**, 3.8, 6.6 |
| FR-16 | **3.5**, 6.2 | NFR-3 | **6.5** |
| FR-17 | **3.6**, **3.7**, **3.9**, 6.2, 6.3 | NFR-4 | **6.5**, 2.4, 4.10, 6.3 |
| FR-18 | **4.6**, 4.2, 4.10, 6.5 | NFR-5 | **6.4**, 2.4, 4.10 |
| FR-19 | **4.1**, 1.3 | NFR-6 | **2.2**, 2.10, 6.6 |
| FR-20 | **4.3**, **4.4**, **4.7**, 1.2, 1.3, 4.5 | NFR-7 | **2.2** |
| FR-21 | **4.4**, 4.1 | NFR-8 | **1.10**, 1.7, 1.9, 6.1 |
| FR-22 | **4.5**, **4.8**, 1.4, 4.7 | NFR-9 | **2.10**, 3.5 |
| FR-23 | **5.5** | NFR-10 | **6.3** |
| FR-24 | **5.1**, **5.4** | | |
| FR-25 | **5.6** | | |

**Also covered.**

- Rules: R1–R8 in 1.12; R9 in 3.2; R10–R12, R14, R29 in 1.13; R13 in 4.2; R15–R19 in 4.1; R20–R21, R32 in 4.3; R22–R23, R33 in 4.4; R24, R34 in 4.2; R25 in 4.5; R26 in 5.1; R27–R28 in 5.2; R30 in 5.3; R31 in 2.7 and 4.9.
- Architecture: AD-1 and AD-2 in 1.10; AD-3 and AD-5 in 1.9; AD-4 in 1.6 and 1.12; AD-6 in 4.1 and 4.2; AD-7 and AD-8 in 2.1; AD-9 in 4.5, 5.1 and 5.3; AD-10 in 3.1 and 3.2; AD-11 and AD-12 in 3.6; AD-13 and AD-14 in 3.7 and 3.9; AD-15 in 2.4 and 4.10; AD-16 in 2.2; AD-17 in 2.2 and 2.5; AD-18 in 1.11; AD-19 in 2.2, 6.1, 6.2 and 6.3; AD-20 in 1.6 and 3.8.
- UX-DRs: DR1–4 in 2.2; DR5–7 in 2.5; DR8 in 2.6; DR9 in 3.4; DR10 in 2.7; DR11–12 in 2.8; DR13 in 2.9; DR14–15 in 4.7; DR16 in 4.8; DR17 in 2.10; DR18 in 5.7; DR19 in 3.3; DR20 in 2.5 and 3.3; DR21 in 2.3, 2.6, 3.3, 5.5, 5.6, 5.7; DR22 in 2.4; DR23 in 4.6 and 6.4; DR24 in 3.3, 4.6, 4.7, 5.4, 6.4; DR25–26 in 2.2; DR27 in 2.6, 2.7, 5.5; DR28 in 5.4; DR29 in 2.2 and 3.3.

## Suggested order and parallel work

This is a suggestion. The tracks show what can run side by side; they are **not assignments**. Hedda, Oskar, Elisabeth and Trond decide who takes what. The only named task is the Vercel variables in Story 3.7, an external dependency given to this plan.

| Phase | Stories | What can run at once |
|---|---|---|
| A. Close the rules | 1.1, 1.2, 1.3, 1.4, then 1.5 | Up to four, one rule each. They touch different sections of `simulation-rules.md`, and the new ids are already allocated. Confirm as a group in one sitting. |
| B. Clear the ground | 1.6, 1.7, 1.8 | One at a time: 1.6 and 1.7 touch nearly every file. Hold other code branches until 1.7 merges. Can run alongside phase A. |
| C. Engine base | 1.9, 1.10, 1.11, 1.12, 1.13 | Mostly in sequence. 2.2 can start beside it, after 1.7. |
| D. Plan and adviser | See tracks below | Four tracks at once. |
| E. Run | See tracks below | Engine first, then surfaces. |
| F. Debrief | 5.1, 5.2, 5.3 first; 5.4–5.7 after | Calculations in sequence, then up to four surfaces at once. |
| G. Prove it | 6.1, then 6.2, 6.3, 6.4; then 6.5, 6.6 | Three at once after 6.1. |

**Tracks for phases D and E:**

| Track | Phase D | Phase E |
|---|---|---|
| State and engine | 2.1 | 4.1, 4.2, then 4.3 and 4.4 side by side, then 4.5 |
| Surfaces | 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9 | 4.6, 4.7, 4.8, 4.9 |
| 3D and language | 2.4, 2.10 | 4.10 |
| Adviser | 3.1 and 3.2 side by side, then 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9 | Continues if needed |

**Notes on order.**

- 3.1 and 3.2 need only 1.13, so the adviser track starts before the surfaces are done. 3.3 waits for 2.9.
- 3.7 to 3.9 can come late, because the game is complete on prepared answers after 3.6. The Vercel variables can arrive at any time without blocking a merge.
- The `pending` list from 1.11 is a progress measure: it reaches empty when 5.3 merges.

## Open for the group

**Confirm the rule resolutions (Stories 1.1–1.5):**

1. Milestones as part finishes, with a fixed name list and a new *Planlagt* status (R31).
2. A hiring stepper of 4–16 workers with capacity 40, generalising R21 (R32).
3. Two opportunities at 30 %, with the event floor of two as an accepted edge case (R33).
4. Two views of the forecast: full for the engine, visible for the student (R34).
5. An estimate's impact measured by what it hid from the plan, and "small" at 0.5 % of target cost (R30).

**Still open from earlier documents, and not blocking:**

- Rules §5 items 1–19 are estimates and design choices awaiting approval. All of them sit in `params.ts` or a rule, so approval can come at any time.
- The rules document is still `status: draft`.
- Model cost, response time and the owner of the key and spend limit (spine Open Question 4) are settled in Story 3.9.
