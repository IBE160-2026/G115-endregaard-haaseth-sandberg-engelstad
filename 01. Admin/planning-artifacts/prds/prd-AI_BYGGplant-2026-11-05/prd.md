---
title: "PRD: AI_BYGGplant — plan a building project in a conversation"
status: draft
created: 2026-11-05
updated: 2026-11-05
---

# PRD: AI_BYGGplant — plan a building project in a conversation

*Working title (the app itself says «AI Byggplan»; the fictional demo brand says «Nordlys Byggplan»). Preliminary draft for the G115 group. Nothing here is approved.*

## 0. Document Purpose

This PRD gives the G115 group one self-contained description of AI_BYGGplant, so the group can decide whether to take it forward. It stands alone: no requirement or decision here comes from any other project in the repository. It was written after the fact, from the code at v0.4 and the project's own documents; `addendum.md` lists the sources and holds the technical detail.

**How far to trust each statement**

| Label | Meaning |
|---|---|
| **Group** | The group's own request, quoted word for word in `G115_Dilemmas.md`. |
| **Agent** | Decided or claimed by the AI agents Ingrid, Jonas or Mats in the team meetings. The group has not confirmed it (⚑ G3). |
| **Proposal** | Suggested in this draft and awaiting group approval. |
| `[ASSUMPTION An]` | Inferred while writing this draft and indexed in §15. |
| ⚑ G*n* | A decision the group must make (§12). |

**Status of each functional requirement**

| Status | Meaning |
|---|---|
| **Built** | The code exists, and the logs record that it worked in a browser with the demo dialogs. |
| **Built, unproven live** | The code exists, but has only run on hand-written fixtures or a fake AI client. |
| **Partial** | Some of the requirement exists; the gap is named. |
| **Missing** | Not in the code. |

Tests and builds were not run for this draft. Test counts and run results are quoted from the changelog and session logs (latest: 2026-11-03).

## 1. Vision and Purpose

AI_BYGGplant lets someone who wants to build something describe it in their own words and leave with a plan. The app opens with «Hei, hva skal bygges?». An AI then asks the questions an experienced builder would ask, starting narrow and going broader, while the building appears in 3D beside the conversation. The result is a structured project with a drawing, a budget range, a schedule, risks and a log of every change. The person can take it with them as a report or send it to a dealer.

**The bet behind the product:** the AI can do the planning work if the app stays out of the way. The app has no building rules. It validates and draws what the AI returns, so a new building type needs no new code. That is why one model can cover a garage and a block of flats, and it is also the product's largest risk (§13).

**Where the product stands:** the app is broad and has been demonstrated, but **no document records it ever running against the real AI**. Everything shown so far uses hand-written dialogs, clearly labelled as demo. The next step is therefore to prove the core promise rather than add features.

## 2. The Problem

Before anyone has drawn or priced anything, a person planning a building faces three problems:

- **They do not know what to decide, or in what order.** Site conditions, size, openings, materials and services depend on each other, and a beginner cannot tell which question comes first.
- **They cannot see the consequence of a change.** What does one more metre, or another window, do to the price and the schedule? Finding out usually means asking a professional again.
- **The early work goes nowhere.** Notes and rough ideas do not reach the supplier or contractor in a form they can use, so the first sales conversation starts from scratch.

On the supplier's side (**Agent**, not validated with any real company), a seller receives vague enquiries and has to qualify each one by hand, without a budget or scope.

*None of this has been tested on real people. The problem statement comes from the group's product idea and the sales agent's reasoning, with no user or customer research behind it.*

## 3. Target Users

Who the product is sold to is undecided (⚑ G2). This draft separates the person who uses the product from the company that might pay for it.

| Role | Who | Status |
|---|---|---|
| **Byggherre** (primary user) | A private person planning a garage, cabin or house, and possibly a small business owner planning a hall or a barn. Norwegian-speaking, not a building professional. `[ASSUMPTION A1]` | Implied by the group's request and the prompt |
| **Forhandler** (receives the lead) | A seller at a kit supplier or builders' merchant. | Agent |
| **Buyer** (pays for a white-label licence) | Head of digital sales at the same kind of company. | Agent, ⚑ G2 |

### 3.1 Jobs To Be Done

- **Byggherre:** "Help me work out what I actually need to decide, and show me what it means for the building, the price and the time."
- **Byggherre:** "Let me change my mind at any point without starting again."
- **Byggherre:** "Give me something I can show the bank, my family or a supplier."
- **Forhandler:** "Give me an enquiry with scope, budget and the customer's reasoning, so I can pick up where the customer left off."
- **Buyer:** "Put this on our website under our name, with our products and prices, and send the leads to our CRM."

### 3.2 Non-Users (MVP)

- Professional designers and contractors who need construction documents. The output is an early estimate, not a basis for building.
- Anyone who needs a binding offer, or a checked statement that a project meets building regulations.
- Anyone who needs to work in a language other than Norwegian bokmål.

### 3.3 User Journeys

*These protagonists are illustrative. They are built from the group's request and the sales agent's demo script, not from research.* `[ASSUMPTION A2]`

**UJ-1. Kari plans a double garage from scratch.**
Kari wants a garage with a loft but has never built anything. Kari opens the app without logging in and sees «Hei, hva skal bygges?», then types "Dobbelgarasje med loft". The AI asks about the site and terrain, then size, then the gates, offering short answers Kari can click. The garage rises in 3D as the answers come in. Once size and openings are known, the budget range, schedule and risks appear. Kari now has a concrete figure and a list of what it assumes, and can continue, save or stop. **Edge case:** if Kari answers "vet ikke", the AI proposes a common choice and records it as an assumption.

**UJ-2. Kari changes the plan.**
Kari writes "Gjør den 1 meter lengre og legg til et vindu". The 3D model updates and the changed parts glow. Endringer shows what changed and the budget total before and after. Kari can see what the change costs before deciding on it. **Edge case:** if the AI's answer fails validation or is cut off, a Norwegian error appears, the project stays as it was, and Kari can retry.

**UJ-3. Kari sends the plan to a dealer, and Anders picks it up.**
Kari opens the report and saves it as PDF, then presses «Send til forhandler», reads what will be sent and adds a phone number. Anders, a seller at the supplier, receives the lead with the project, budget, catalogue product numbers and the full conversation, and can call with the context already in hand. **Edge case:** if the dealer's system cannot be reached, Kari is told, and the lead stays available locally.

**UJ-4. Sara shows the product without an API key.**
Sara is presenting AI_BYGGplant to the group or a prospective buyer. Sara opens the deployed app, chooses one of the four demo dialogs and steps through it using «Neste demo-replikk». A label stays on screen the whole time: «Demo – forhåndsskrevet dialog, ikke live AI». The audience sees the full flow without anyone being misled about what is live.

## 4. Glossary

- **Byggherre** — the person planning the building and using the dialog.
- **Forhandler** — the supplier's seller who receives a Lead.
- **Dialog** — the running conversation between the Byggherre and the AI.
- **Turn** — one AI response: a reply, questions, the phase, changes and the Project.
- **Project** — the structured result: facts, Building, budget, schedule, risks and assumptions. A browser can hold several.
- **Building** — one or more Volumes, plus Openings and the exterior.
- **Volume** (*bygningskropp*) — one rectangular, axis-aligned body of a building, with position, size, floors, basement and roof.
- **Opening** — one physical door, window, gate or other opening, belonging to a Volume.
- **Budget range** — the budget total with a low and high end, calculated from each budget line's ± uncertainty.
- **Report** — the print layout of a Project, saved as PDF through the browser.
- **Lead** — the data package in the `ai-byggplant.lead/1` format sent to the Forhandler.
- **Brand** — the supplier's name, logo, colours, contact details and Catalogue, read from `brand.json`.
- **Catalogue** — the supplier's products and prices, given to the AI as data (at most 50 products).
- **Demo mode** — hand-written Dialogs played from fixtures, with no AI involved.
- **Live mode** — real AI responses, using an API key held on the server.

## 5. MVP

**Proposal, pending ⚑ G1 and ⚑ G3.** The MVP is the smallest version that proves the core promise:

> With the real AI running, a Byggherre can go from «Hei, hva skal bygges?» to a credible plan, change it along the way, and hand it over as a Report and a Lead, under one fictional Brand.

This is a proof MVP for the course and for a possible pilot. It is not a launch to real customers `[ASSUMPTION A3]`. Most of the surface already exists, so the MVP is mainly about proof and closing a few gaps.

### 5.1 In Scope

**Already built, and must keep working**
- The Dialog, the Project model, 3D, Tegning and all six tabs (FR-1 to FR-16)
- Report, several Projects, export and import (FR-17 to FR-19)
- The Lead and webhook delivery (FR-20 to FR-22)
- Brand and Catalogue from a file (FR-26, FR-27)
- Demo mode (FR-28, FR-29)

**To be done for the MVP**

| # | Work | FR / NFR | Depends on |
|---|---|---|---|
| 1 | Get an API key and a budget | FR-30 | ⚑ G4 |
| 2 | Run live Dialogs per building type, then tune the prompt | FR-2, FR-30, SM-1 to SM-4 | 1, ⚑ G6 |
| 3 | Measure time and cost per Dialog | NFR-1, NFR-2, SM-6 | 1 |
| 4 | Check live Turns for consistency on the server | FR-7 | — |
| 5 | Show the estimate warning in the app, not only in the Report | FR-14 | — |
| 6 | Make the rate limit work on the public host | NFR-5 | ⚑ G8 |
| 7 | Add consent and a contact rule to the Lead form | FR-23 | ⚑ G7 |
| 8 | Settle how the Report reaches the Forhandler | FR-24 | ⚑ G7 |
| 9 | Test the deployed app in a browser | NFR-9 | — |
| 10 | Test with people outside the group, and have a building professional review the budgets | SM-5, SM-7 | 2 |

### 5.2 Out of Scope for MVP

- **Accounts, server-side projects, sharing and a database.** Agent decision, against the sales agent's wish; ⚑ G9.
- **Payment and subscriptions.** Nothing to charge for until the core is proven.
- **Live CRM integrations and e-mail delivery of Leads.** The webhook is the integration point.
- **Real suppliers, real catalogues and multiple Brands in one deployment.** ⚑ G10.
- **Application documents** (byggesøknad drafts). These carry professional responsibility and are on the agents' v1.0 roadmap.
- **SLA and deployment in a customer's cloud.** On the agents' v1.0 roadmap.
- **Rooms and interior layout.** Agent ruling in team meeting 2.
- **Rotated, round or curved Volumes, joined roof valleys and drawn terrain slope.** ⚑ G11.
- **Partial updates ("delta turns").** Prepared in the data model but not used. Revisit if measured time or cost requires it.

## 6. Features and Functional Requirements

### 6.1 The Dialog

The Dialog is always open. It starts narrow, goes broader, and accepts a change at any point. Realizes UJ-1, UJ-2. **Group:** greeting, order of questions, always open.

#### FR-1: Greeting — *Built*
A new Project opens with «Hei, hva skal bygges?» and the Byggherre answers in free text.
- A new Project shows exactly this text, and the tabs show empty-state hints.

#### FR-2: Questions that move the process forward — *Built, unproven live*
The AI asks 1–3 questions per Turn, adapted to the building type, in the order site and terrain → form and size → openings → materials and services → budget and schedule → details and changes.
- For a garage in Live mode, the question about the gate comes before materials.
- Budget and schedule stay empty until form, size and Openings are settled.
- No Turn contains more than 3 questions.

#### FR-3: Answering — *Built*
The Byggherre can type freely or click up to 4 suggested answers, which fill the text box.
- Clicking a suggestion adds its text to the box without sending; Send submits it.

#### FR-4: Change at any time — *Built, unproven live*
The Byggherre can change anything at any time, and the AI returns the whole Project updated consistently.
- After "1 meter lengre", the Volume, the budget, the changes list and (where affected) the schedule all reflect the new length in the same Turn.

#### FR-5: Unknown answers and off-topic input — *Built, unproven live*
If the Byggherre does not know, the AI proposes a common choice and records it as an assumption. Off-topic requests get a short reply and a return to the Project.
- After "vet ikke", the proposed value appears in the Project's assumptions.

#### FR-6: Streaming, stopping and retrying — *Built*
The reply appears as it is written. The Byggherre can stop a running Turn and retry a failed one.
- Stopping or failing a Turn leaves the Project as it was before that Turn.
- Stopp is visible only while a Turn is running.

### 6.2 The Project Model

**Group:** "Inputen skal være AI generert uten regler"; "Modellen skal kunne bygge ALLE typer bygg."

#### FR-7: Every Turn is checked before it is used — *Partial*
The server validates every AI Turn against the data contract and rejects anything invalid.
- A Turn that breaks the schema gives a Norwegian error, and the Project does not change. *(Built.)*
- A live Turn with duplicate ids, a change pointing at nothing, a task depending on an unknown task, or an Opening in a Volume or floor that does not exist is also rejected. **(Missing: `consistencyErrors` exists but runs only in the tests.)**

#### FR-8: The app adds no building rules — *Built*
Questions, quantities, prices and schedules come from the AI. The app only draws, totals and displays them.
- A value the AI has not decided is shown as undecided and is not filled in with a guess.
- Drawing defaults affect only the picture, never the Project data or a Lead.
- Colours are used only as given (#rrggbb); the app never guesses a colour from a name.

#### FR-9: Every building type through Volumes — *Built, unproven live*
Any building is described as one or more Volumes, with Openings tied to a Volume.
- The four demo dialogs (garage, house with attached garage, block of 12 flats, warehouse with office section) validate and draw without error. *(Built.)*
- Live: each building type chosen in ⚑ G6 produces a valid Project.
- Projects saved by earlier versions open without loss.

### 6.3 Seeing the Building

#### FR-10: Live 3D model — *Built, unproven live*
The building is drawn in 3D beside the Dialog and updates when a Turn completes. Realizes UJ-1.
- The 3D model contains no geometry that the Project data lacks.
- The app remains usable if 3D has not loaded yet, since it loads separately.

#### FR-11: Changes glow — *Built*
Anything a Turn changed is highlighted through its stable id. Realizes UJ-2.
- After a change to an Opening, that Opening glows; after a change to a Volume, the whole Volume glows.
- Clicking a change in Endringer highlights the same element.

#### FR-12: Tegning — *Built*
The Tegning tab shows a site plan and elevations, including basements, and a table of Openings.
- Every Opening in the Project appears in the table.

### 6.4 Understanding the Project (tabs)

Six tabs: Oversikt, Tegning, Budsjett, Fremdrift, Risiko, Endringer. **Group:** tabs, budget and Gantt. **Agent:** ranges, risks and the change log.

#### FR-13: Oversikt — *Built*
Shows the phase, key figures (including footprint and gross area), settled facts and assumptions.
- Every assumption in the Project is listed.

#### FR-14: Budsjett with honest figures — *Partial*
Each line shows an amount and a ± uncertainty, and the total is a Budget range. The product says clearly that the figures are a rough AI estimate.
- Low and high totals equal the sum of each line's amount minus or plus its uncertainty. *(Built.)*
- Every budget has a line for contingencies (*uforutsett*). *(Prompt only; unproven live.)*
- Budsjett shows the warning «Tallene er et grovt overslag laget av AI og må kontrolleres av fagfolk før bestilling.» **(Missing: found only in the Report.)**

#### FR-15: Fremdrift — *Built*
Shows tasks as a Gantt chart in weeks, with dependencies.
- The project duration shown is the week the last task ends.

#### FR-16: Risiko and Endringer — *Built, unproven live*
Risiko lists 3–8 project-specific risks with probability, consequence, measure and cost. Endringer lists what each Turn changed, with the budget total before and after, newest first.
- A Turn that changes nothing adds no entry to Endringer.
- The risk total is a plain sum; the app does not weight it by probability.

### 6.5 Keeping the Result

#### FR-17: Report — *Built*
The Byggherre can print the Project or save it as PDF through the browser.
- The Report contains Oversikt, Tegning, Budsjett, Fremdrift, Risiko, Endringer, Antakelser, a 3D snapshot and the estimate warning.

#### FR-18: Several Projects — *Built*
The Byggherre can create, switch between and delete Projects in one browser, without logging in.
- Deleting the last Project leaves one new empty Project.
- Broken saved data gives a fresh Project instead of a crash.

#### FR-19: Export and import — *Built*
A Project can be exported to a `.byggplan.json` file and imported again.
- Importing any other JSON file is refused with «Filen er ikke et AI Byggplan-prosjekt.»

### 6.6 Handing Over to the Forhandler

Realizes UJ-3. **Agent** (the white-label thesis, ⚑ G2).

#### FR-20: Send a Lead — *Built*
The Byggherre can press «Send til forhandler», see what will be shared and add contact details.
- The form states that the Project, the budget and the whole Dialog go to the named Forhandler.

#### FR-21: A documented Lead format — *Built*
A Lead follows `ai-byggplant.lead/1` and contains the Project summary, the budget with product numbers, schedule, risks and transcript.
- An undecided value is `null`, never a guess.
- Every Lead has a unique id that a receiver can use to ignore duplicates.

#### FR-22: Webhook delivery, with a local copy on failure — *Built, unproven with a real receiver*
The server forwards the Lead to a configured webhook. The Byggherre is told what actually happened.
- With no webhook configured, the response says it is a demo and that nothing was delivered.
- A failed or timed-out webhook (5 s) is reported as not delivered, and the Lead remains available as a file.
- The panel «Forhandlerens innboks» is labelled as a demo. It stores Leads only in the same browser.

#### FR-23: Consent and a way to make contact — *Missing, ⚑ G7*
Before a Lead is sent, the Byggherre gives informed consent, and the Lead contains a way to reach them.
- A Lead cannot be sent without the consent being given.
- A Lead cannot be sent without at least a phone number or an e-mail address. **(Today all fields are optional, so a Lead can arrive with no way to reach the customer.)**

#### FR-24: The Report reaches the Forhandler — *Missing, ⚑ G7*
The Forhandler can get the Report for a Lead.
- The chosen method is documented and works from end to end. **(`src/handoff/README.md` says the PDF goes with the Lead, but the code sends only JSON. The Byggherre has to save and pass on the PDF separately.)**

#### FR-25: Failure-safe delivery — *Non-goal for MVP*
A queue and automatic retries for failed webhook deliveries belong to a real pilot, since the MVP has no real customers.

### 6.7 White-Label

**Agent** (⚑ G2, ⚑ G10).

#### FR-26: Brand from a file — *Built*
Name, logo, colours and dealer details come from `brand.json`.
- Changing the file changes the app's look and dealer details without code changes.

#### FR-27: Catalogue as data for the AI — *Built, unproven live*
The AI may price from the Catalogue and marks those lines with a product number.
- A budget line with a product number matches the catalogue price times the quantity.
- At most 50 products are sent to the AI.
- The AI may still use its own estimates for anything the Catalogue does not cover.

### 6.8 Demo Mode

Realizes UJ-4. **Agent.**

#### FR-28: The full flow without an API key — *Built*
With no key, or with `DEMO=1`, the app plays hand-written Dialogs through the same path as Live mode.
- All four demo dialogs (garage, house, block of flats, warehouse) can be played to the end.
- A new Project in Demo mode offers a choice of dialog.

#### FR-29: Demo never passes for live AI — *Built*
- The label «Demo – forhåndsskrevet dialog, ikke live AI» is visible for the whole Demo session.
- **Known limit:** the demo follows its script whatever the user types, which must be explained when presenting.

### 6.9 Live AI

#### FR-30: Live mode proven against the real AI — *Built, unproven live; the key blocker*
With a key on the server, a full Dialog runs against the real AI. **No document records this having happened.** ⚑ G4.
- At least one full Dialog per building type in ⚑ G6 reaches a budget, a schedule and risks.
- API key rejected, rate-limited, refused, cut off and invalid-answer cases each show their own Norwegian message.
- `npm run smoke` passes against the real AI (today it is documented against the demo provider only).

## 7. Non-Functional Requirements

*All thresholds are **Proposals** `[ASSUMPTION A4]`, because nothing has been measured in Live mode. Figures marked "as built" are in the code today.*

| ID | Area | Requirement | How to test |
|---|---|---|---|
| NFR-1 | Response time | In Live mode, the reply starts appearing within 5 s (90 % of Turns), and a whole Turn finishes within the host's limit (60 s on Vercel, as built). `[ASSUMPTION A5]` | Time each Turn in the live test runs |
| NFR-2 | Cost | Cost per finished Dialog is measured, and stays under the limit set in ⚑ G4. | Read token use for the live test runs |
| NFR-3 | API key safety | The key exists only on the server and never reaches the browser (as built). | Inspect the network traffic and the built files |
| NFR-4 | Safe display | All AI and user text is escaped before display (as built). | Send HTML or a script tag as input and as AI text; nothing executes |
| NFR-5 | Abuse protection | At most 20 Turns and 10 Leads per 10 minutes per user, enforced on the public host, and a request limit of 512 kB (limits as built). **The rate limit keys on the socket address and lives in memory, so it probably does not work on Vercel.** `[ASSUMPTION A6]` | Send 21 Turns through the public URL; the last one gets 429 |
| NFR-6 | Reliability of data | A failed Turn never damages the Project (as built). | Force each error type |
| NFR-7 | Privacy | Project data stays in the browser unless the Byggherre sends a Lead or a Dialog message. The app says what is sent, and where. `[ASSUMPTION A7]` | Review the data flows; ⚑ G7 |
| NFR-8 | Language | The whole UI and all AI text are in Norwegian bokmål. | Review the live test runs |
| NFR-9 | Browser and device | The full flow works on the deployed app in current Chrome, Edge and Safari, and on a phone. **Only headless Chrome is documented so far; the Vercel deployment has only had HTTP checks.** | Manual run per browser |
| NFR-10 | Accessibility | Keyboard use throughout, reduced motion respected, and everything in the 3D view also available as text or table. A WCAG 2.1 AA check is needed if the product goes to the public; it has not been audited. | Keyboard run and an automated audit tool |
| NFR-11 | 3D performance | A building with 120 windows stays smooth on a typical student PC (about 22 draw calls is documented, frame rate is not). | Measure the frame rate on real hardware |
| NFR-12 | Quality gates | Tests, type check, build and smoke test pass before every release (558 tests documented at v0.4). | CI or a manual run |
| NFR-13 | Trust | Every budget or Report view states that figures are an AI estimate that professionals must check. | Review each view; see FR-14 |

## 8. User Stories

Each story has one end-to-end test. The FR consequences in §6 hold the detail.

| ID | As a… | I want to… | so that… | Acceptance test | FR | Status |
|---|---|---|---|---|---|---|
| US-1 | Byggherre | describe my project in my own words | I do not need to know the jargon | Given a new Project, when I write "En garasje", then I get a reply and 1–3 relevant questions | FR-1, FR-2 | Live test pending |
| US-2 | Byggherre | be asked things in a sensible order | I decide the big things first | Given a live garage Dialog, then site and size come before materials, and the gate before materials | FR-2 | Live test pending |
| US-3 | Byggherre | say "vet ikke" | I can continue without knowing everything | Given a question, when I write "vet ikke", then a value is proposed and listed as an assumption | FR-5 | Live test pending |
| US-4 | Byggherre | see the building while we talk | I can tell it has understood me | Given a Turn with known size, then the 3D model shows those measurements and nothing the data lacks | FR-10 | Demo passed |
| US-5 | Byggherre | change the size or add a window | I can compare options | Given a budget, when I ask for 1 m more, then the model, budget and Endringer all update in that Turn, and the change glows | FR-4, FR-11, FR-16 | Demo passed; live pending |
| US-6 | Byggherre | see a price range with its risks | I do not mistake it for a fixed price | Given a budget, then each line has ± %, the total is a range, the risks are listed and the warning is visible | FR-14, FR-16 | Warning missing |
| US-7 | Byggherre | get a report | I can show it to others | Given a Project, when I click Rapport, then the print preview has all seven sections, the 3D snapshot and the warning | FR-17 | Demo passed |
| US-8 | Byggherre | keep several projects and move them as files | I can compare them or change browser | Given an exported file, when I import it elsewhere, then the Project is the same | FR-18, FR-19 | Built |
| US-9 | Byggherre | control what the dealer gets | I can trust the app with my details | Given the send form, then I see what is sent and to whom, and cannot send without consent and a contact method | FR-20, FR-23 | Consent missing |
| US-10 | Forhandler | receive a usable lead | I can call with context | Given a webhook, when a Lead is sent, then it arrives in the documented format, with contact details and transcript, and I can get the Report | FR-21, FR-22, FR-24 | Real receiver untested; Report missing |
| US-11 | Supplier (buyer) | see the product under my name and with my prices | I can picture it as mine | Given my `brand.json`, then my logo and colours show, and catalogue lines have my prices and product numbers | FR-26, FR-27 | Demo passed; live pending |
| US-12 | Presenter | show the flow without a key | I can demonstrate honestly | Given no key, then all four dialogs play to the end with the demo label visible throughout | FR-28, FR-29 | Demo passed; deployed browser test pending |
| US-13 | Group | run the product with the real AI | we know whether the idea works | Given a key, then the tests in SM-1 to SM-4 are run and the results written down | FR-30 | Blocked by ⚑ G4 |

## 9. Success Metrics

*All targets are **Proposals**, and no baseline exists. They test the bet in §1: can the AI do the planning without rules in the app?*

**Primary**
- **SM-1: Live Dialog completion.** Run 3 scripted Dialogs per building type in ⚑ G6 (12 with the proposed four types). Target: at least 10 of 12 reach a budget, schedule and risks without a blocking error. Validates FR-2, FR-9, FR-30.
- **SM-2: Budget credibility.** A building professional reviews one budget per type and judges whether it is usable as an early estimate. Target: at least 3 of 4 usable. Validates the core bet and FR-14.

**Secondary**
- **SM-3: Valid Turns.** Share of live Turns passing both schema and consistency checks on the first attempt. Target: at least 95 %. Validates FR-7.
- **SM-4: Consistent changes.** Run 10 scripted changes. Target: at least 9 where drawing, budget and Endringer agree. Validates FR-4, FR-11.
- **SM-5: Unaided use.** Five people outside the group plan a project without help. Target: at least 4 reach a budget and open the Report. Validates UJ-1.
- **SM-6: Cost and time.** Average cost and duration per finished Dialog are recorded and within NFR-1 and NFR-2.
- **SM-7: Warning understood.** After using the app, at least 4 of the 5 people from SM-5 can say that the figures are a rough estimate needing professional review. Validates FR-14, NFR-13.

**Only if ⚑ G1 aims for a real product**
- **SM-8: Outside interest.** At least one real supplier agrees to see a demo. The 250 000 USD contract is the stated commercial ambition, not an MVP target.

**Counter-metrics (do not optimize)**
- **SM-C1: Number of questions or Turns.** A longer Dialog is not better. Counterbalances SM-1.
- **SM-C2: Number of Leads.** Easy Leads with unreliable figures would hurt both customer and Forhandler. Counterbalances SM-8.
- **SM-C3: Test count and demo polish.** 558 passing tests and four smooth demos say nothing about the real AI. Counterbalances any reading of "Built" as "proven".
- **SM-C4: Low cost per Dialog at the expense of answer quality.** Counterbalances SM-6.

## 10. What Is Developed and What Is Missing

State at v0.4 plus the Vercel deployment (2026-11-03).

### 10.1 Developed

| Area | What exists | Evidence |
|---|---|---|
| Dialog and streaming | Greeting, questions with suggested answers, stop and retry, streamed reply | Code; browser run recorded (v0.3, v0.4) |
| Data contract | Every building type as Volumes, schema validator, stable ids, migration from older versions | Code; tests |
| 3D and Tegning | Live 3D with glow on changes, site plan and elevations | Code; browser run recorded |
| Tabs | Oversikt, Tegning, Budsjett, Fremdrift, Risiko, Endringer | Code; browser run recorded |
| Report | Seven sections plus 3D snapshot, through the browser's print function | Code; browser run recorded |
| Projects | Several per browser, export and import | Code; tests |
| Lead | Form, documented format, webhook forwarding, local file, demo inbox | Code; tests; browser run with demo inbox only |
| White-label | One fictional Brand (Nordlys Hus og Garasje AS) with a 32-product Catalogue | Code |
| Demo mode | Four dialogs (garage 7 steps, house 6, block of flats 5, warehouse 4) and a chooser | Fixtures; browser run recorded |
| Live AI provider | Claude integration with structured output and error messages | Code; tested only with a fake client |
| Server and deployment | Node server, Vercel function, public URL running in Demo mode | Code; HTTP checks recorded |
| Quality | 558 tests and a smoke test (documented; not rerun for this draft) | Changelog v0.4 |

### 10.2 Missing or Unproven

| Priority | Gap | Why it matters | FR / NFR |
|---|---|---|---|
| **Blocker** | Never run against the real AI; no API key or budget | The core promise is unproven, and prompt quality is unknown | FR-30, ⚑ G4 |
| **Blocker** | No real user or customer has seen the product | Problem, buyer and price are assumptions | SM-5, SM-8, ⚑ G2 |
| High | AI budgets not reviewed by anyone with building expertise | Credibility is the product's value | SM-2 |
| High | Consistency check does not run on live Turns | Bad ids or references could reach the display | FR-7 |
| High | Estimate warning appears only in the Report | Users may read figures as a price | FR-14 |
| High | Rate limit probably ineffective on Vercel | With a key, a public URL could run up API costs | NFR-5 |
| High | No consent or privacy text; a Lead can lack contact details | Personal data, and leads that cannot be followed up | FR-23, ⚑ G7 |
| Medium | PDF does not go with the Lead, despite what the docs say | The Forhandler misses the drawings | FR-24 |
| Medium | Deployed app not tested in a browser | Only HTTP responses are checked | NFR-9 |
| Medium | Time and cost per Dialog unknown | Budget and pricing cannot be set | NFR-1, NFR-2 |
| Medium | No real webhook receiver tested | The integration promise is unproven | FR-22 |
| Low | Geometry limits and no terrain slope drawn | Some building shapes are approximated | ⚑ G11 |
| Low | Brand tagline says garage and cabin, while the product covers all types | Inconsistent message | ⚑ G10 |
| Low | No cabin demo, though the sales script ends with one | Minor gap in the demo story | FR-28 |
| Low | `01. Admin/README.md` describes v0.1 tabs, and there is no README in `AI_BYGGplant/` | New readers get an outdated picture | — |
| Later | Accounts, multiple Brands, SLA, application documents | Part of the agents' v0.5 and v1.0 roadmap | §5.2 |

## 11. Non-Goals

- AI_BYGGplant is **not a construction design tool**, and its output is not a basis for building.
- It does **not check compliance** with building regulations, zoning plans or application requirements. The AI may raise these as questions and risks, but the app guarantees nothing.
- It does **not give binding prices or offers**.
- It is **not a rule engine**. Building knowledge belongs to the AI, not to the app's code.
- It is **not a project execution tool**. It plans a project; it does not follow one up during construction.

## 12. Decisions for the Group

*All are open. The proposals are suggestions only. Listed by what the other decisions depend on.*

**⚑ G1. Should this be the project we go forward with, and to what level?**
- Options: (a) course prototype; (b) proof MVP that could lead to a pilot; (c) aiming for a real product and the 250 000 USD contract.
- **Proposal:** if the group picks AI_BYGGplant, go for (b). It keeps the mandate alive without promising what no one has tested.
- Blocks: everything. **Check first:** the assignment text is not in the repository (an open item since 2026-10-29), so fit with the course requirements cannot be assessed from this PRD.

**⚑ G2. Who is the customer?**
- Options: (a) white-label licence for a kit supplier or builders' merchant; (b) direct to private builders by subscription; (c) leave open and treat the MVP as buyer-neutral.
- **Proposal:** keep (a) as the working hypothesis, since Lead and Brand are already built for it, and test it before relying on it. All sales figures come from an AI agent, with no market evidence behind them. `[ASSUMPTION A8]`
- Blocks: priority of §6.6 and §6.7, and SM-8.

**⚑ G3. What status do the agents' decisions have?**
Ingrid, Jonas and Mats decided the buyer, price, roadmap, what was in and out of scope, and the MVP's overall direction.
- **Proposal:** treat them as proposals until the group has confirmed them, and record the outcome in `G115_Dilemmas.md`.

**⚑ G4. Who pays for the API key, and what is the budget?** *(open since v0.2)*
- Decide: who owns the key, the test budget, a hard spending limit, and whether `claude-opus-5-5` remains the model once cost is measured.
- **Proposal:** set a small fixed test budget for SM-1 to SM-4, with a spending limit in the provider's console, and keep the public site in Demo mode until NFR-5 is fixed.
- Blocks: FR-30 and all live metrics.

**⚑ G5. How strict is "uten regler"?**
- Options: (a) no checks except data format; (b) technical consistency checks but no building rules; (c) also add building knowledge in the code (for example price ranges or regulatory checks).
- **Proposal:** (b). The checks catch broken data and do not change what the AI advises. The trade-off is that a plausible but wrong budget still gets through, so SM-2 has to catch that. Choosing (c) would change the product's core idea.

**⚑ G6. Which building types must pass the live test?**
The group asked for "ALLE typer bygg", and the model allows that. Testing every type is not realistic.
- **Proposal:** keep the open model, but require quality only for garage, house, block of flats and warehouse, which already have demos. Other types work on a best-effort basis, and the app should say so.

**⚑ G7. How are personal data and the Lead handled?**
- Decide: whether the MVP takes real customer data at all; what consent text to use; whether contact details are mandatory; whether the whole transcript goes to the Forhandler; how the Report gets there; and who checks the privacy obligations, including the transfer to the AI provider.
- **Proposal:** no real customer data in the MVP (test data only); consent checkbox; phone or e-mail required; transcript kept but clearly announced (it is already); and a Report link or attachment considered only for a pilot, with the docs corrected for now. `[ASSUMPTION A7]`

**⚑ G8. Where should it run?**
- Options: (a) the current Vercel deployment; (b) a Node host, which the app already supports (`npm start`).
- Note: `vercel.json` at the repository root also configures another app, so a separate deployment may be needed once one project is chosen.
- **Proposal:** stay on Vercel while in Demo mode. Decide after measuring whether a whole Turn fits inside 60 s, and pick a rate limit solution that works on the chosen host.

**⚑ G9. Accounts in the MVP?**
- **Proposal:** no. Projects stay in the browser, with export files. The agents disagreed: Mats (seller) wanted accounts, and Ingrid (project manager) deferred them. Without accounts there is no subscription sale and no seller workspace, so choosing option (b) in G2 would reverse this.

**⚑ G10. Which Brand and which real companies?**
- Decide: keep the fictional Nordlys Brand? Should it sell all building types (the tagline says garage and cabin)? May the group contact the real companies the sales agent named as potential buyers (see the addendum)?
- **Proposal:** keep Nordlys, broaden the tagline, and do not contact anyone or use real company names in the product until the group has agreed on it.

**⚑ G11. Do Volumes need more shapes?**
Today's Volumes are axis-aligned rectangles, attached roofs do not join in valleys, and terrain slope is stored but not drawn.
- **Proposal:** leave this out of the MVP and let the app state that the drawing is simplified. Revisit it if live tests show that users often need other shapes.

**⚑ G12. What is the link to the original instruction about appearance?**
The group's first request said "output skal visualiseres som ByggAPP", and the styling still has that origin. This PRD sets no requirement from it.
- **Proposal:** treat the current appearance as AI_BYGGplant's own and let it develop independently from now on.

## 13. Risks

| Risk | Likelihood | Impact | Measure |
|---|---|---|---|
| Real AI performance disappoints: bad order of questions, unrealistic prices, invalid Turns | Unknown (never tested) | Critical; the product idea depends on it | Test first (SM-1 to SM-4), before any further features |
| Users take AI figures as a price and act on them | Medium | High | FR-14, NFR-13, SM-7, professional review, clear non-goals |
| The demo gives a false impression of maturity | High | High | Demo label, the "Status" column in this PRD, and always stating that no live run has been done until SM-1 is complete |
| The API cost becomes too high: the whole Project is returned every Turn, on a large model, with up to 32 000 tokens | Unknown | High | Measure (SM-6), spending limit (G4), delta turns and a model review if needed |
| Public API misuse once a key is added | Medium | High | NFR-5, spending limit, Demo mode on the public site until fixed |
| Personal data goes to the AI provider and the Forhandler without a sound basis | Medium if real users are involved | High | G7; test data only in the MVP |
| The buyer and price thesis is wrong | Unknown | High if a real product is the aim | G2, SM-8; talk to real suppliers before building more for them |
| Decisions made by agents are treated as settled | Medium | Medium | G3 |
| The Turn exceeds the host's time limit | Unknown | Medium | NFR-1, G8 |

## 14. Open Questions

1. What does the assignment text require, and how would AI_BYGGplant be assessed against it? (Owner: group.)
2. Who in the group or network can review budgets as a building professional for SM-2?
3. Which five people outside the group can take part in SM-5?
4. Does the AI's question order feel natural in practice, and how long is a typical Dialog before a useful budget appears? (Answered by SM-1.)
5. Are the suggestion chips and «Neste demo-replikk» understood without explanation? (Answered by SM-5.)
6. Does the smoke test need a variant for Live mode, and who runs it? (Owner: developer.)

## 15. Assumptions Index

- **A1** (§3) — The primary user is a Norwegian-speaking non-professional. The group's request does not name a user directly.
- **A2** (§3.3) — The named journeys are illustrative, built from the group's request and the sales agent's demo script.
- **A3** (§5) — The MVP is a proof for the course and a possible pilot, not a launch to real customers (⚑ G1).
- **A4** (§7, §9) — All NFR thresholds and SM targets are proposals, with no measured baseline.
- **A5** (NFR-1) — A live Turn may come close to or exceed Vercel's 60-second limit. This follows from the 32 000-token maximum and has not been measured.
- **A6** (NFR-5) — The in-memory, socket-address rate limit is not effective behind Vercel's proxy and across function instances. Inferred from the code and the open item about X-Forwarded-For; not tested.
- **A7** (NFR-7, ⚑ G7) — Dialogs and Leads may contain personal data, so they need privacy handling. This is not a legal assessment.
- **A8** (⚑ G2) — The agents' figures (150 000 + 100 000 USD for the licence, 49 USD per month, 2–5k NOK per lead) are untested claims by an AI sales agent.
