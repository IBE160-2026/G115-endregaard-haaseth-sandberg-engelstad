---
title: "PRD: Fra tomt til tak"
status: final
created: 2026-10-31
updated: 2026-11-18
---

# PRD: Fra tomt til tak
*Working title ("From plot to roof").*

## 0. Document Purpose

This PRD turns the product brief `../../briefs/brief-G115-tre-stadier-2026-10-29/brief.md` into numbered requirements that UX, architecture, epics and stories can trace back to. It is written for the G115 group, for Claude Code as the implementing agent, and for the IBE160 examiner, who checks that code can be traced to requirements. Vocabulary is fixed in §3 Glossary. Features are grouped in §4 with globally numbered FRs. Inferred items are tagged `[ASSUMPTION]` inline and listed in §12. Figures for the simulation come from `../../research/research-fra-tomt-til-tak-2026-10-31/research.md` (parameter table P1–P17). §10 explains how this PRD departs from the brief and what it reuses from the group's v0.5 game.

**Revision 2026-11-18.** Revised after the instructor's feedback (`tilbakemelding-prd.md` in this folder): FR-17 has testable consequences and a decided provider, FR-32 to FR-36 and NFR-10 have testable consequences and sit in the sections they belong to, every requirement has a priority with a cut order (§8), the Glossary has Norwegian display names and the missing terms, and UJ-2 covers the examiner. Open questions 1 and 2 are answered by the simulation rules and removed.

## 1. Vision

*Fra tomt til tak* is a 20-minute web simulator in which a newcomer runs a construction project as its project manager: an office building for 100 employees in Oslo, for a fictional client. The student plans the project with an AI adviser, sees the plan tested by unforeseen events, and ends with a debrief that explains why things turned out as they did.

The simulator answers a question many people ask when they read the news: why do building projects so often run late and over budget? The student finds out by doing it. Their own optimistic estimates, their choice of height and structure, and their responses to events add up to a result they own. The AI adviser draws on what comparable projects actually took, warns when the student is far off, and is compared with the student's choices throughout, so the student also learns when AI advice is worth following.

## 2. Target User

### 2.1 Jobs To Be Done

- Understand, in one short session, what makes a construction project late or over budget.
- Try project manager decisions safely, and see their consequences instead of reading about them.
- Learn to weigh AI advice against one's own judgement.
- (Examiner) Run the simulator from the README without keys, and trace requirements to code (UJ-2).

### 2.2 Non-Users (v1)

- Professional project managers looking for a planning tool. The figures are simplified and partly estimated.
- Anyone who needs to plan a real project. No output from the simulator is a real estimate.

### 2.3 Key User Journeys

- **UJ-1. Sara finds out why building projects run late.**
  - **Persona + context:** Sara, 22, studies economics and management. She has little construction experience, but keeps seeing news of projects over budget and late, and wants to understand why.
  - **Entry state:** opens the simulator in a desktop browser. No account.
  - **Path:**
    1. A meeting in the site office, with the 3D view beside it. The client presents the order: offices for 100 employees in Oslo, a deadline and a budget.
    2. She chooses the number of floors (and so how much plot area to buy) and a structural system, and watches the building take shape in the 3D view while cost and time update.
    3. She estimates how long each main part takes. This is the hardest step. The adviser suggests shares of the total from historical figures. When her estimate for the frame is far below comparable projects, it steps in: "Comparable projects took about X weeks for the frame", and gives her reference values. She adjusts, but not all the way.
    4. She chooses responses to the known risks, sets a reserve and presents the plan to the client.
    5. The project runs. The frame takes longer than she estimated, and she chooses between accepting the delay, overtime or hiring more workers. Wind stops a crane lift and HMS (health, safety and environment) reacts. A strike at a foreign logistics firm delays steel, and she weighs a more expensive local supplier. After each choice she sees her path next to the AI's.
  - **Climax:** the debrief's budget bridge shows where the overrun came from: her optimistic estimate, the events, and her own choices.
  - **Resolution:** a short conclusion ties the result to the learning goals, with one "next time" piece of advice for each goal she missed. She can download her decision log.
  - **Edge case:** if she approves a plan the adviser has warned against, the warning is recorded in the decision log and shown again in the debrief next to what actually happened.

- **UJ-2. The examiner runs the simulator without a key.**
  - **Persona + context:** the IBE160 examiner, who has the repository and the assignment text, but no API key and no account with the group's services.
  - **Entry state:** a fresh clone and Node.js installed.
  - **Path:**
    1. Follows the README: `npm install` and `npm run dev` in `ByggAPP`, then `npm test`. Every test passes without a key or network.
    2. Plays through all three stages. Suggestions and warnings work, suggested questions get prepared answers, and a typed question gets the nearest prepared answer, marked as prepared.
    3. Opens §13 and follows an assignment item to its FRs, and an FR to its story and code.
  - **Climax:** a complete playthrough with no key, no error message and no waiting on the network.
  - **Resolution:** the examiner can judge the adviser without the language model, and sees from the README how the live path is turned on.
  - **Edge case:** with a key on the deployed site, a failed or slow model call falls back to a prepared answer within 8 seconds, and the student is told the answer is prepared.

## 3. Glossary

The interface is in Norwegian (NFR-6). The middle column is the name the student sees; names marked † are proposals that UX may change, the others are already used in `EXPERIENCE.md`.

| Term | Norwegian in the interface | Meaning |
|---|---|---|
| **Playthrough** | spillrunde † | One run from the client's order to the debrief, about 20 minutes. Has one seed. |
| **Stage** | fase † | One of three parts of a playthrough: planning (stage 1), execution (stage 2), debrief (stage 3). |
| **Client** | byggherre † | The fictional owner who sets the order and the targets. |
| **Order** | bestilling † | The client's requirements: 100 workplaces in Oslo, a deadline (target week) and a budget (target cost). |
| **Targets** | mål † | The deadline and budget from the order. |
| **Plot** | tomt | The building site near the centre of Oslo (also called the central site). It has one price per m² of plot area and zoning limits. The student buys as much plot area as the footprint needs. |
| **Zoning limits** | reguleringskrav † | The site's maximum footprint as a share of plot area (%BYA) and maximum height in metres. |
| **Concept** | konsept | The combination of number of floors and structural system, which together set the footprint, the plot area bought and the frame time. |
| **Structural system** | bæresystem † | The load-bearing system: cast-in-place concrete, precast concrete, steel or timber (CLT). |
| **Building-block model** | byggeklossmodell † | The rules that turn a concept into main parts, durations and cost. |
| **Main part** | hoveddel † | One of six top-level parts of the WBS: design and building permit, groundworks, frame, weathertight envelope, technical installations and interior, handover. |
| **Critical path** | kritisk linje † | The main parts that decide the completion week. All six run in sequence, so in v1 every main part is on it. |
| **Reference duration** | referansevarighet † | The building-block model's duration for a main part, from reference values. |
| **Actual duration** | faktisk varighet † | What a main part really takes in stage 2: the reference duration plus a deviation set by the seed. |
| **Schedule estimate** | tidsestimat † | The student's estimated duration for each main part. |
| **Milestone** | milepæl | The finish of one main part plus a target week, set by the student (FR-32). Changes no cost or time. |
| **Reference values** | referanseverdier † | What comparable projects took or cost, from historical figures; the basis for the adviser's suggestions and warnings. |
| **Site overhead** | riggkostnad per uke † | The fixed cost of keeping the site running for one week. Every week of delay adds it, which is how time costs money. |
| **Site capacity** | maks på byggeplassen † | The largest number of workers the central site holds at once (FR-33). |
| **Adviser** | Rådgiver | The AI in its own window. Gives suggestions, warnings and answers. Never changes the student's choices. |
| **Suggestion** | *Forslag* | The adviser's proposed choice for a step in **stage 1**, with a reason. |
| **Recommendation** | anbefaling † | The option the AI would choose for an event in **stage 2** (FR-22). The AI path follows the recommendations. A suggestion and a recommendation are both counted in FR-28. |
| **Warning** | *Varsel* | A rule-based message when a choice is far outside reasonable bounds or breaks a limit. |
| **Prepared answer** | *Forberedt svar* | A fixed answer to a question, filled from the engine's figures; works without a key. |
| **Known risk** | kjent risiko † | A risk listed in stage 1, with probability and impact, that depends on the concept. |
| **External risk** | ekstern hendelse † | A known risk that occurs in stage 2. It counts toward the 3–4 events in FR-19. A risk the student avoided cannot occur. |
| **Response** | tiltak † | What the student does about a known risk: accept, reduce, transfer or avoid. |
| **Reserve** | reserve | Time and cost set aside in the plan for the unexpected. |
| **Risk exposure** | *Risikoeksponering* | The expected cost and delay of the known risks after the chosen responses. |
| **Plan** | plan | The student's approved concept, schedule estimate, responses and reserve. The baseline for stage 2. |
| **Event** | hendelse † | Something that happens in stage 2 and requires a decision: an estimate overrun, an external risk, a change request or an opportunity. |
| **Estimate overrun** | overskridelse † | An event where a main part takes longer than the student's schedule estimate. |
| **Change request** | endringsønske † | An event where the client asks for a change; approving it later costs more. |
| **Opportunity** | mulighet † | A positive event that saves money, usually at the cost of time (FR-35). |
| **Forecast** | *Prognose sluttkostnad*, *Prognose ferdig* | The final cost and completion week the student sees during stage 2 (FR-34). |
| **AI path** | KI-ens vei † | The outcome had the student followed the AI's recommendations, calculated from the same state. |
| **Result band** | *På mål*, *Litt over*, *Klart over* | How a final cost or week is judged against the targets (R29). |
| **Budget bridge** | *Budsjettbroen* | A debrief chart that splits the difference between targets and result by cause. |
| **Decision log** | *Beslutningslogg* | The record of every choice, with time and what the adviser recommended. |
| **Seed** | – (not shown) | The number that decides which events occur, so the same seed and choices always give the same result. |
| **Difficulty** | vanskelighetsgrad † | Easy, medium or hard: how often the AI's stage 2 recommendation is the best option (FR-1). |
| **Learning goal** | læringsmål | One of four: time costs money; resources have limits; risk is managed, not just suffered; AI advice is worth weighing. |

**Two thresholds, on purpose (group decision 2026-11-18).** The adviser's "the choice matters little" (FR-14) is 2 % of the target cost (S42, 3.420 MNOK), because concept options differ by several MNOK. The debrief's "small" (FR-38) is under 0.900 MNOK, three weeks of site overhead, and under 3 weeks (S43); with 2 % nearly every decision in a playthrough would be called small. So a choice the adviser called close in stage 1 can still show in the debrief: CLT instead of steel at 7 floors is about 1 MNOK dearer and 2 weeks faster, and the student should see that trade-off.

## 4. Features

### 4.1 Opening and order

**Description:** The playthrough opens in the site office, with the 3D view beside it. The client presents the order and the targets. Realizes UJ-1.

#### FR-1: Start a playthrough

The student can start a new playthrough. Realizes UJ-1.

**Consequences (testable):**
- A new playthrough gets a seed; starting with the same seed and making the same choices gives the same result (see FR-30).
- The order shows 100 workplaces, Oslo, the target week and the target cost.
- The targets are set from the building-block model so that a good plan just meets them. They are a guide, not an exact answer: results are judged in bands (FR-38).
- The student can choose a difficulty (easy, medium, hard) that sets how often the AI's stage 2 recommendation is the best option, as in v0.5. The best option is the one with the lowest forecast final cost, where every week of delay is priced in as site overhead; on a tie, the earlier completion wins.

#### FR-2: Meeting in the site office

The client presents the order in a short meeting in the site office, with the 3D view visible. Realizes UJ-1.

**Consequences (testable):**
- The meeting can be skipped.
- After the meeting, the planning view opens at the concept step.

### 4.2 Concept: floors, plot area and structure

**Description:** The building stands on a plot near the centre of Oslo, with one price per m² of plot area. The student chooses the number of floors and a structural system. The required gross area follows from the order (P1: 23 m² BTA per workplace, about 2,300 m²). The trade-off is plot area against what each floor costs. Fewer floors give a larger footprint, which needs more plot area and so raises the plot cost. More floors save plot area, but each floor adds frame weeks and site overhead, a fire-class cost step applies from a certain height, and the risk of crane stops in wind grows. With a tight deadline, the cheapest height only meets it with a faster, dearer structural system. The 3D view and the consequences update with every choice. Realizes UJ-1.

#### FR-3: Plot area and plot cost

The plot area the student must buy follows from the concept, at the plot's single price per m² of plot area. Realizes UJ-1.

**Consequences (testable):**
- The plot shows its price per m² of plot area, its maximum footprint (%BYA) and its maximum height in metres.
- Plot area needed = footprint ÷ maximum %BYA. Plot cost = plot area needed × price per m² of plot area. The price and its derivation from the research are shown in the simulation rules.
- Fewer floors always give a higher plot cost than more floors.

#### FR-4: Choose floors and footprint

The student can choose the number of floors from a fixed set; the footprint follows from gross area divided by floors. Realizes UJ-1.

**Consequences (testable):**
- Building height = floors × floor height (from the research). A concept whose height breaks the zoning limit cannot be approved, and the adviser gives a warning that names the limit.
- Lifts are always included (required from two floors under TEK17, the Norwegian building regulations), and lift cost grows with the number of floors.
- From the height where TEK17 requires a stricter fire class, building cost steps up, as set in the simulation rules.
- Each extra floor adds frame weeks according to the structural system.

#### FR-5: Choose a structural system

The student can choose cast-in-place concrete, precast concrete, steel or timber (CLT). Realizes UJ-1.

**Consequences (testable):**
- The choice changes frame time per floor and cost according to the parameter table.
- The choice decides which known risks and events can occur (for example moisture in CLT, frost in cast-in-place concrete).

#### FR-6: See consequences at once

After every choice the student sees plot area and plot cost, building cost and expected duration against the targets, and the 3D view shows the concept. Realizes UJ-1.

**Consequences (testable):**
- The figures shown equal the building-block model's output for the current concept.
- The site overhead per week is shown next to the expected duration, so the cost of time is visible.
- The 3D view shows the chosen number of floors and footprint on the plot.

### 4.3 Schedule estimate

**Description:** The building-block model splits the project into main parts. The student estimates how long each takes. The adviser suggests shares of the total from historical figures, and does not talk about crew numbers. The Gantt chart and critical path update as the student estimates. The schedule estimate is what stage 2 tests. Realizes UJ-1.

#### FR-7: Main parts from the concept

The building-block model generates the main parts and their order from the concept. Realizes UJ-1.

**Consequences (testable):**
- The project always has the six main parts in the Glossary, in that order.
- The same concept always gives the same reference durations. Reference durations come from the research (permit processing time, frame time per floor by structural system, phase shares).

#### FR-8: Estimate durations

The student can set a duration in weeks for each main part. Realizes UJ-1.

**Consequences (testable):**
- The Gantt chart shows the main parts with the critical path marked, and updates after every change.
- The completion week is compared with the target week.

#### FR-9: Reference shares from the adviser

The adviser can suggest a duration for each main part as a share of the total, based on reference values. Realizes UJ-1.

**Consequences (testable):**
- The suggestion states its basis (for example "comparable office buildings").
- Accepting a suggestion fills in the duration; the student can change it afterwards.

#### FR-32: Milestones

In the schedule step, the student keeps two or three milestones, each the finish of a different main part with a target week. Stage 2 shows whether each is met, and the debrief reports them. Realizes UJ-1. *Covers "milestones" in the assignment's data in.* Rule R31 (proposed in epics story 1.1).

**Consequences (testable):**
- Milestones come from a fixed list with one per main part. Two are pre-filled with the plan's finish weeks, so the step never blocks on them.
- Fewer than two milestones, or two on the same main part, cannot be approved.
- During stage 2 each milestone has one status: *Planlagt* while the forecast (FR-34) meets its week, *I fare* when it does not, *Nådd* when the main part finishes on or before the week, and *Ikke nådd* when the week passes first.
- The debrief lists each milestone with its target week, actual week and status.
- Milestones change no cost or time, and are not decisions in FR-38.

### 4.4 Risk and reserve

**Description:** The student sees the known risks for the chosen concept, chooses a response to each, and sets a reserve in time and cost. Risk exposure updates with each choice. Realizes UJ-1.

#### FR-10: Known risks

The student sees 3–4 known risks for the chosen concept, each with probability and impact. Realizes UJ-1.

**Consequences (testable):**
- Which risks are listed depends on the number of floors and the structural system; risks tied to the central site (for example archaeological finds and contaminated ground) are always listed.

#### FR-11: Choose a response

The student can choose accept, reduce, transfer or avoid for each known risk, each with its cost and effect. Realizes UJ-1.

**Consequences (testable):**
- Risk exposure (expected cost and delay) updates after each choice.
- If the risk occurs in stage 2, the chosen response is applied (FR-21).

#### FR-12: Set a reserve

The student can set a reserve in weeks and in cost. Realizes UJ-1.

**Consequences (testable):**
- The reserve is included in the plan's completion week and cost.
- In stage 2, delays and extra costs draw on the reserve before they exceed the targets.

#### FR-36: Warnings in the risk step

The adviser warns when the student sets no reserve, or pays more to reduce or transfer a risk than the risk's expected cost. Realizes UJ-1.

**Consequences (testable):**
- A reserve of 0 weeks or 0 cost gives a warning before the plan can be approved. The plan can still be approved (FR-13).
- A response whose price is higher than the risk's expected cost (probability × impact, with delay priced as site overhead) gives a warning that states both amounts.
- Both warnings are rule-based, follow FR-15 (same input, same warning) and are recorded in the decision log.

### 4.5 Present the plan

**Description:** Back in the site office, the student presents the plan to the client against the targets, sees the adviser's overall assessment, and approves it. Realizes UJ-1.

#### FR-13: Approve the plan

The student can review the whole plan (concept, Gantt chart, cost, risk exposure, reserve) against the targets and approve it. Realizes UJ-1.

**Consequences (testable):**
- Before approval, the student can go back to any step.
- A plan that breaks the zoning limits cannot be approved.
- A plan that misses the targets can be approved; the adviser's warning is recorded in the decision log.
- After approval the plan is locked as the baseline for stage 2.

### 4.6 AI adviser

**Description:** The adviser is a window in the planning view. It acts as a coach the student can discuss with: it suggests, warns and answers questions, and always gives its reasons. Its suggestions and warnings are rule-based, drawn from the reference values and the building-block model, so they are correct and testable. Free-text questions go to a language model when a key is available; the language model is given the scenario, the rules and a set of approved facts, and keeps its answers within them. The adviser never changes the student's choices. Realizes UJ-1.

#### FR-14: Suggestions

At each step in stage 1, the adviser gives a suggestion with a short reason. Realizes UJ-1.

**Consequences (testable):**
- Every suggestion is computed by rules from the building-block model and reference values.
- When two options differ only a little in cost and time (rule R30 in the simulation rules), the adviser says that the choice matters little and why, instead of recommending one firmly. The adviser spends its warnings on the choices that weigh most.

#### FR-15: Warnings with reference values

The adviser warns when a choice is far outside reasonable bounds or breaks a limit, and opens with what real comparable projects did. Realizes UJ-1.

**Consequences (testable):**
- A schedule estimate more than 20 % away from the reference value triggers a warning that states the reference value.
- When the research lists a real comparable project for the chosen structural system, the warning names it, with its figure and the year of the source (for example Valle Wood for timber, Statens hus Nordfjordeid for steel and precast). When it lists none (cast-in-place concrete), the warning describes the reference generically and still states its source. Only projects listed with sources in `research-referanseprosjekter-2026-10-31` may be cited.
- A concept that breaks the zoning limits triggers a warning that names the limit.
- Warnings are rule-based; the same input always gives the same warning.
- Every warning is recorded in the decision log.

#### FR-16: Suggested questions

The student can pick from 3–5 suggested questions per step and get a prepared answer. Realizes UJ-1 and UJ-2.

**Consequences (testable):**
- Prepared answers work without a key or network.

#### FR-17: Free-text questions within approved facts

The student can type a question. With a key, a language model answers within the approved facts; without a key, or if the call fails, the nearest prepared answer is shown. Realizes UJ-1 and UJ-2 (the fallback).

**Provider:** Claude (model `claude-sonnet-5-5`, set by the environment variable `ADVISER_MODEL`), called through a server function on Vercel that holds the key (architecture AD-11 to AD-14, AD-20). Cost per playthrough and response time are measured in the first live test (NFR-10).

**Consequences (testable):**
- **Figure check.** Before a reply is shown, every number in it is checked against the approved facts from the building-block model. If one number does not match, the reply is discarded, the nearest prepared answer is shown instead, and the discard is counted in the session (not logged with the question text).
- **Fallback.** On an error, on a timeout of 8 seconds, or after 20 calls in one playthrough, the nearest prepared answer is shown, marked *Forberedt svar*, and the student is told why in one line. No error message is shown.
- **Tests run without a key.** Every automated test runs with no key and no network. Tests of the server function replace the model call with a fixed reply, and tests of the figure check use replies with a correct figure, a wrong figure and no figure.
- **Off-topic.** An off-topic question gets an answer that steers back to the current step.
- **Reasons.** Every answer gives its reasons, so the student can discuss and push back.
- **Abuse limits.** The server function rejects requests over 32 KB and limits calls per playthrough and per IP address. Because the function is public, the hard cap on cost is a monthly spend limit on the Claude account, set before the key goes live.
- **No key.** With no key configured, every free-text question still gets a prepared answer, and the client never waits on the network.
- This FR is must-have (see §8). The live path depends on the Vercel setup; everything above except the live reply is testable without it.

**Out of Scope:**
- The language model choosing or changing anything in the plan.

### 4.7 Execution

**Description:** The project runs from the approved plan, with the 3D view showing construction progressing. Three or four events occur and each requires a decision. After every decision the student sees their path next to the AI's, both calculated from the same state. Overtime and hired crews are offered as responses to delays, reusing the v0.5 rules for work modes, crowding and cost factors. Realizes UJ-1.

#### FR-18: Run the plan

The project advances week by week from the plan, and the 3D view shows the progress. Realizes UJ-1.

**Consequences (testable):**
- The project pauses at every event until the student decides.
- [ASSUMPTION: stage 2 takes about 6 minutes, with the project advancing automatically between events.]

#### FR-19: Event selection

Each playthrough has 3–4 events, decided by the seed: one estimate overrun, one or two external risks tied to the concept, and one change request. Realizes UJ-1.

**Consequences (testable):**
- Every main part's actual duration = reference duration × (1 + deviation), where the seed sets the deviation within a fixed range given in the simulation rules.
- The estimate overrun hits the main part with the largest gap between actual duration and the student's schedule estimate. Its size is that gap in weeks.
- If no main part's actual duration exceeds the student's estimate, there is no estimate overrun, and one more external risk or opportunity takes its place.
- An external risk is a known risk that occurs (see Glossary), so it counts toward the 3–4 events. An opportunity (FR-35) also counts.
- External risks are drawn only from those possible for the central site, the number of floors and the structural system.
- **Edge case.** A student who avoids every known risk and has no estimate overrun gets two events: the change request and an opportunity. This is accepted, because good planning should be able to make execution quiet (confirmed by the group 2026-11-18, epics story 1.3).
- The same seed and plan always give the same events.

#### FR-20: Decide on an event

For each event the student chooses between 2–4 options, each showing its effect now and later. Realizes UJ-1.

**Consequences (testable):**
- For an estimate overrun, the options include accepting the delay, overtime, and hiring more workers.
- Overtime hours cost at least 1.4 × the normal rate (arbeidsmiljøloven § 10-6, at least 40 % premium). Overtime beyond the legal caps (10 hours a week, 25 hours per 4 weeks) triggers an adviser warning.
- Each hired worker above the planned crew adds only part of a full worker's output (crowding), as in v0.5, but is paid in full.
- For a change request, the options include approving now and approving later at a higher cost.

#### FR-21: Prepared risks apply

When a known risk occurs and the student chose a response in stage 1, the response's effect is applied. Realizes UJ-1.

**Consequences (testable):**
- A risk the student chose to avoid does not occur.

#### FR-22: Compare with the AI's path

After every decision, the student sees their own outcome next to the AI path, both calculated from the same state. Realizes UJ-1.

**Consequences (testable):**
- Both outcomes show completion week and cost against the targets.
- The AI's recommendation is chosen by rules from the same options the student had.

#### FR-33: Site capacity

The central site has a maximum number of workers at once. Hiring beyond it is not possible, and the adviser explains why. Realizes UJ-1. *Covers "resource capacity" in the assignment's data in, and strengthens the resources goal.* Rule R32 (proposed in epics story 1.2).

**Consequences (testable):**
- The site capacity is a parameter in the simulation rules (S36, proposed 40 workers [ESTIMATE]). The planned crew plus hired workers can never exceed it.
- The student chooses how many workers to hire in fixed steps. At the capacity, the option to add more is disabled, with the limit shown beside it in words.
- The first time the student reaches the capacity, the adviser names the limit and why it exists. The event is recorded in the decision log.
- With the proposed values, the capacity is reachable: hiring 16 fills the site, and hiring 20 is not possible.

#### FR-34: Cost forecast during execution

During stage 2 the student always sees the forecast final cost and completion week against the targets, updated every week and after every decision. Realizes UJ-1. *Covers "cost forecasts" in the assignment's data out.* Rule R34 (proposed in epics story 1.4).

**Consequences (testable):**
- At week 0 the forecast equals the approved plan's cost and completion week, so the forecast does not reveal an overrun the student has not yet discovered.
- A main part not yet started counts at the student's estimate; a started or finished part counts at its actual duration. Decided events apply; undecided events do not.
- The forecast changes when a main part starts and after every decision, and is shown with its result band (*På mål*, *Litt over*, *Klart over*).
- The AI's ranking of options is the same whether it uses this forecast or the full one, so FR-22 is unaffected. A test checks this over many seeds.

#### FR-35: Opportunities

The event pool includes positive events, at most one per playthrough, so that not every event is bad news. Realizes UJ-1. *Restores what the brief promised.* Rule R33 (proposed in epics story 1.3).

**Consequences (testable):**
- A playthrough has at most one opportunity.
- An opportunity saves money and usually costs time (for example reuse of blasted rock or a supplier discount against a later delivery), so taking it is a real choice. The student can take it or decline it.
- An opportunity occurs only when fewer than four other events occurred, and the seed decides whether and which, so the same seed and plan always give the same opportunity.
- Every other rule (the AI path, the budget bridge, decision impact) treats an opportunity as an event.

### 4.8 Debrief

**Description:** A short debrief built on the assignment's outputs, ending in a conclusion tied to the learning goals. Realizes UJ-1.

#### FR-23: Plan against actual

The student sees the plan's Gantt chart overlaid with what actually happened, with deviations marked. Realizes UJ-1.

**Consequences (testable):**
- For every main part, the planned and actual start and finish weeks are shown, and every main part that finished later than planned is marked.

#### FR-24: Budget bridge

The student sees a budget bridge that splits the difference between target cost and final cost into causes, computed by re-running the deterministic engine in a fixed order. Realizes UJ-1.

**Consequences (testable):**
- The causes are calculated in this order, each as the change in final cost from the step before: (1) **the plan** — the approved plan's cost against the target; (2) **the schedule estimate** — the plan run with actual durations and no events; (3) **events** — the events added, each handled as the AI recommended; (4) **the student's decisions** — the student's own choices instead of the AI's.
- The four causes add up exactly to the difference between target cost and final cost.
- The reserve is shown as a separate line (how much of it was used), not as a cause.

#### FR-25: Risks prepared and risks that occurred

The student sees which known risks were prepared for, and which events actually occurred. Realizes UJ-1.

**Consequences (testable):**
- Every known risk is listed with its chosen response and whether it occurred; every event that occurred is listed with the option chosen.

#### FR-26: Own result against the AI path

The student sees their final result next to the AI path through the same events. Realizes UJ-1.

**Consequences (testable):**
- Both show final week and final cost against the targets, from the same seed and plan.

#### FR-27: Conclusion and next-time advice

The debrief ends in a conclusion of 2–3 sentences that names the learning goals the student's choices touched, with one piece of next-time advice for each goal the student missed. Realizes UJ-1.

**Consequences (testable):**
- A learning goal counts as missed by the condition in §4.10; the conclusion names exactly the missed goals.
- Each missed goal gets one piece of next-time advice; a playthrough with no missed goals says so.

#### FR-28: AI trust

The student sees how often they followed the adviser and the AI's recommendations, and how often those were right. Realizes UJ-1.

**Consequences (testable):**
- A stage 2 recommendation counts as right when, run forward from the same state, it gives a final cost equal to or lower than the option the student chose.
- A stage 1 duration suggestion counts as right when the main part's actual duration is within 20 % of it.
- The figures shown are: number of recommendations, number followed, number right, and number of right ones the student did not follow.

#### FR-29: Decision log

The student can view and download the decision log: every choice, with time, what the adviser recommended, and any warning given. Realizes UJ-1.

**Consequences (testable):**
- The downloaded file contains one entry per decision in the playthrough.

#### FR-38: What mattered most

The debrief ranks the student's decisions by how much each one changed the final cost and completion week, so the student sees which choices weighed heavily and which mattered little. Realizes UJ-1.

**Consequences (testable):**
- The three decisions with the largest cost impact are shown first, each with its effect in MNOK and weeks (rule R30).
- Decisions with an impact under the "small" threshold (S43: under 0.900 MNOK and under 3 weeks) are labelled as small.
- Estimates are ranked by what they hid from the plan, so they sum to bridge step 2 (FR-24), and are worded that way ("Planen skjulte 6 uker og 1,8 MNOK").
- The final result is shown in bands against the targets (on target, slightly over, clearly over; rule R29), not as pass or fail on the exact figure.

### 4.9 Simulation model

**Description:** All figures come from a pure, deterministic engine. The building-block model's rules use the research parameter table. Each rule is written down by the group with worked examples and answers, as the instructor required. Realizes UJ-1.

#### FR-30: Deterministic simulation

The same seed, plan and decisions always give the same result.

**Consequences (testable):**
- Running the same playthrough twice in tests gives identical results.

#### FR-31: Rules with sources and worked examples

Every parameter in the building-block model has a source or is marked as an estimate, and every rule has at least one worked example with an answer that runs as a test.

**Consequences (testable):**
- The worked examples pass as automated tests.
- Estimated parameters are marked as estimates in the documentation.
- The rules are written in a separate simulation rules document that this PRD links to.

### 4.10 Learning goals in the requirements

Each learning goal is made visible by specific FRs and has a condition that decides whether the student missed it. FR-27 and SM-2 use these conditions.

| Learning goal | Where the student meets it | Missed when |
|---|---|---|
| **Time costs money** | FR-6 (site overhead per week shown), FR-20, FR-24 | The student accepted a delay whose site overhead cost more than the cheapest acceleration option offered for that event. |
| **Resources have limits** | FR-20 (overtime premium, caps, crowding) | The student hired workers where overtime would have saved the same weeks for less, or went beyond the overtime caps after a warning. |
| **Risk is managed, not just suffered** | FR-10 to FR-12, FR-21, FR-25 | At the time of the choice, the student accepted a known risk whose expected cost (probability × impact, including delay as site overhead) was higher than the cost of reducing or avoiding it; or the reserve ran out before completion. Judged on expected cost, not on whether the risk occurred, so bad luck is not punished. |
| **AI advice is worth weighing** | FR-14, FR-15, FR-22, FR-28 | In at least half of the decisions with a recommendation, the student either followed a recommendation that was not right or ignored one that was (as defined in FR-28). |

### 4.11 Additions from the assignment review

*FR-32 to FR-37 and NFR-10 close gaps the reviews found against the assignment text. They were approved by the group on 2026-10-31. On 2026-11-18 they moved to the sections they belong to, with their IDs kept: FR-32 in §4.3, FR-36 in §4.4, FR-33 to FR-35 in §4.7, FR-37 in §13 and NFR-10 in §5.*

## 5. Cross-Cutting NFRs

- **NFR-1 Runs without keys.** The whole must-have scope runs from the README with no keys, accounts or backend: the game, the tests and the adviser on prepared answers. The server function for FR-17 is an addition that only the live language model needs; without it, FR-17 falls back as specified (UJ-2).
- **NFR-2 No secrets in the repo.** The language model key is never committed and never sent to the browser; calls go through a server-side function with the key in an environment variable, and the repo has a `.env.example` without real values. The function runs as a Vercel service (architecture AD-13, AD-20), and the key is set for Production only.
- **NFR-3 Session length.** A playthrough takes about 20 minutes: about 10 for planning, 6 for execution and 4 for the debrief.
- **NFR-4 Performance.** The 3D view keeps a smooth frame rate on an ordinary student laptop and lowers its quality by itself when it cannot. [ASSUMPTION: at least 30 fps.]
- **NFR-5 Accessibility.** All choices can be made with the keyboard, text has readable contrast, and the 3D view has a text alternative for what it shows.
- **NFR-6 Language.** The interface is in Norwegian; documentation is in English.
- **NFR-7 Platform.** Desktop browser; mobile is not supported in v1.
- **NFR-8 Testability.** The engine, the building-block model, the adviser's rules and the event selection are pure and covered by automated tests.
- **NFR-9 Plain language.** Every technical term the student meets (for example BTA, BRA, %BYA, critical path, CLT, reserve, site overhead) is explained in plain Norwegian where it first appears, and the interface uses no unexplained abbreviations.
- **NFR-10 Documented manual tests.** The flows that are hard to test automatically (the 3D view, the adviser's free-text answers, a full playthrough) have a written manual test plan in the repository. *Consequences (testable):* the plan lists each flow with steps and the expected result; each test round records the date, the tester, the version tested and pass or fail per flow; a failed flow links to the issue or story that fixes it. The first live round also records the language model's response time and cost per playthrough (FR-17).

## 6. Constraints and Guardrails

- **AI safety.** The adviser cannot change the plan, cannot state figures that differ from the building-block model, and steers off-topic questions back to the step.
- **Cost.** With a key, language model calls are limited per playthrough and per IP address, and a monthly spend limit on the Claude account is the hard cap (FR-17). [ASSUMPTION: at most about 20 calls per playthrough.]
- **Privacy.** No personal data is collected; the decision log stays in the browser unless the student downloads it.
- **Openness.** The product is public on GitHub and uses only a fictional scenario.

## 7. Non-Goals

- A real planning or estimating tool.
- Building one's own WBS from scratch.
- Detailed crew and staffing planning (crew size per discipline, lodging for hired workers). Overtime and hiring appear only as responses to events in stage 2.
- Walking around the site.
- Accounts, login, multiplayer, real scheduling file formats, domains other than construction.

## 8. MVP Scope

### 8.1 In Scope

- FR-1 to FR-38, including FR-17 free-text conversation with the language model (must-have; prepared answers remain the fallback without a key).
- NFR-1 to NFR-10.

The group keeps the whole scope and reassesses it once the pace is known (decision 2026-10-31). The priorities below decide the order of work, and which requirements go first if the pace demands a cut.

### 8.2 Priorities and cut order

| Priority | Requirements | Why |
|---|---|---|
| **Must** | FR-1 (without difficulty), FR-3 to FR-8, FR-10 to FR-24, FR-27, FR-30, FR-31; NFR-1 to NFR-3, NFR-6 to NFR-9 | A complete playthrough from order to conclusion, with the adviser on rules and prepared answers, the language model, and the budget bridge. This is the thesis. |
| **Should** | FR-9, FR-25, FR-26, FR-29, FR-32, FR-33, FR-34, FR-36, FR-38; NFR-4, NFR-5, NFR-10 | Makes the learning sharper and covers the assignment fully, but a playthrough works without them. |
| **Could** | FR-2, FR-28, FR-35, the difficulty choice in FR-1 | Adds colour; cut first. |
| **–** | FR-37 | A requirement on this document, already met by §13. |

**Vertical slice.** The first version to build end to end is FR-1, FR-3 to FR-8, FR-10 to FR-13, FR-16, FR-18 to FR-24, FR-30 and FR-31: one complete playthrough on prepared answers. FR-14, FR-15, FR-17 and FR-27 follow, then *should*, then *could*.

**Cut order if the pace demands it:** (1) FR-28, (2) FR-35, (3) the difficulty choice in FR-1, (4) FR-2, (5) FR-38's ranking, keeping its result bands, (6) FR-9. Must-have requirements are not cut; FR-17 can at most fall back to prepared answers in the delivered version, which NFR-1 already covers.

The priorities, the vertical slice and the cut order were confirmed by the group on 2026-11-18.

Assignment coverage (§13) holds after every cut in this list, because each row in §13 also names a must-have FR.

### 8.3 Out of Scope for MVP

- The AI's own plan from stage 1 run through the same events (should have; FR-26 compares with the AI path from stage 2 decisions).
- A scaled-down HMS check (could have).
- Saving and resuming (could have).
- Detailed staffing planning, including lodging for hired workers (later extension).

## 9. Success Metrics

**Primary**
- **SM-1 Completion:** at least 4 of 5 testers outside the group finish all three stages unaided in 25 minutes or less. Validates FR-1 to FR-29, FR-32 to FR-36, FR-38, NFR-3.
- **SM-2 Learning:** after a playthrough, testers answer at least 3 of 4 short questions correctly, one per learning goal. Validates FR-24, FR-27.

**Secondary**
- **SM-3 Correctness:** every worked example and every adviser warning rule passes as an automated test. Validates FR-15, FR-30, FR-31, FR-33, FR-34, FR-36.
- **SM-4 Runnable:** a person outside the group runs the simulator from the README without a key on the first try. Validates UJ-2, NFR-1, FR-16, the FR-17 fallback.
- **SM-5 Answer quality:** in the first live test round (NFR-10), 20 typical free-text questions are asked with a key. No reply shown contains a figure outside the approved facts, and at least 16 of 20 are judged on topic and useful by two group members independently. Validates FR-17. The 20 questions and the 16-of-20 bar were confirmed by the group on 2026-11-18 as a first target, to be adjusted after the first live round.
- **SM-6 Coverage:** every row in §13 names at least one FR, and every FR has a story in `epics.md`. Validates FR-37.

**Counter-metrics (do not optimize)**
- **SM-C1 Rate of following the AI.** A high rate is not the goal; the goal is that the student learns when to follow it. Counterbalances SM-2.
- **SM-C2 Shortest possible session.** Cutting the debrief to save time would remove the learning. Counterbalances SM-1.
- **SM-C3 Precision of figures.** More precise figures are not worth more complexity; simple rules the group can check matter more. Counterbalances SM-3.

## 10. Relation to the Brief and to v0.5

**Departures from the brief:**
- Stage 1 step 2 is a schedule estimate (durations per main part, with reference shares from the adviser), not choosing crew and work mode. Crew decisions move to stage 2 as responses to events. The learning goal "resources have limits" is met there.
- The adviser's warnings follow a reference-class approach: they open with what comparable projects did.

**Carried over from v0.5:** the rules and ideas behind work modes, crowding, cost factors, events and the forecast; the comparison with the AI path from the same state; the final report as a model for the debrief. **Code reused:** the 3D world and figures, the Gantt view (adapted), formatting, the random generator and the icons. The v0.5 engine code itself is replaced, because it runs one fixed scenario week by week (architecture AD-4, AD-6).

**New:** the planning view, the building-block model, the schedule estimate, the adviser window with prepared answers, event selection tied to the plan, and the debrief.

**Detail elsewhere:** the event catalogue and the adviser's method are in `addendum.md` in this folder; the simulation rules with worked examples are in `simulation-rules.md`; the layout principles for the planning view are in the brief's addendum.

## 11. Open Questions

*Answered on 2026-11-18 and removed:* target values (week 67 and 171 MNOK, simulation rules R14 and example (a)), options per choice (floors, structural systems and the fire-class step, simulation rules §2.3 and §2.4) and the language model provider (FR-17). Also confirmed on 2026-11-18: R31 to R34 and parameter S36 (milestones, site capacity of at most 40 workers, opportunities, visible forecast), epics stories 1.1 to 1.4.

1. **Live language model.** Who owns the key and the spend limit, and when the Vercel service is set up. Cost per playthrough and response time are measured in the first live round (NFR-10, SM-5).
2. **Phase shares.** The shares of total duration come from one project (Elvebredden); can a better source be found?
3. **Weak figures.** Land prices and structural-system factors are estimates; can the group find better sources (a current Norsk Prisbok or a broker report)?

## 12. Assumptions Index

- §4.7 FR-18 — stage 2 about 6 minutes, advancing automatically between events.
- §5 NFR-4 — at least 30 fps.
- §6 — at most about 20 language model calls per playthrough.
- ~~§9 SM-5 — 20 test questions, 16 of 20 judged on topic and useful.~~ Confirmed by the group 2026-11-18.

## 13. Traceability to the Assignment

**FR-37: Traceability to the assignment.** This table maps every item in the assignment's data in, data out and decision points to the FRs that cover it, so the examiner can check coverage. It is a requirement on this document, not on the product. *Consequence (testable):* every item in the assignment text has a row, and every FR named in a row exists in §4.

| Assignment item | Covered by |
|---|---|
| **Data in:** project scope / WBS | FR-3 to FR-5 (concept), FR-7 (six main parts) |
| **Data in:** resource capacity | FR-20 (overtime, hiring, crowding), FR-33 (site capacity) |
| **Data in:** cost and pace parameters | FR-5, FR-6, FR-8, FR-20; parameters in the simulation rules (FR-31) |
| **Data in:** risks and events | FR-10, FR-11, FR-19, FR-21, FR-35 |
| **Data in:** milestones | FR-32 |
| **Data in:** change requests | FR-19, FR-20 |
| **Data out:** schedules (Gantt) | FR-8, FR-23 |
| **Data out:** cost forecasts | FR-6, FR-24, FR-34 |
| **Data out:** risk exposure | FR-11, FR-13, FR-25 |
| **Data out:** scenario results | FR-22, FR-26, FR-38 |
| **Data out:** recommended actions | FR-14, FR-15, FR-22, FR-27 |
| **Decision point:** planning strategy | FR-3 to FR-5, FR-8, FR-12, FR-13 |
| **Decision point:** risk response | FR-11, FR-20, FR-36 |
| **Decision point:** resource allocation | FR-20, FR-33 |
| **Decision point:** change approval | FR-20 |
| **Security / login, version control and audit log** | FR-29 (decision log); no login, because the product is public and uses a fictional scenario (§7) |
| **AI supporting decisions in scheduling, resources and risk** | §4.6 (FR-14 to FR-17), §4.10 |
