# Team meeting 1 – AI_BYGGplant to 250 000 USD

**Date:** 2026-10-29 · **Chair:** 📋 Ingrid (prosjektleder) · **Present:** 💻 Jonas (utvikler), 💼 Mats (selger)
**Mandate from the group:** "gi dem oppdrag om å utvikle dette til en software som skal koste 250 000 dollar! la alle rollene diskutere sammen også lager dere et ny revisjon."
**Input:** AI_BYGGplant v0.1 (the AI dialog, four tabs, local dev server, not yet run against Claude).

---

## 1. What does "a software that costs 250 000 USD" mean?

💼 **Mats:** Nobody pays 250 000 dollars for a chat with four tabs. The buyer who pays that is a company that sells buildings: a prefab garage, cabin or house supplier, or a builders' merchant chain. They want *their* customers to plan the build in a dialog, and they want a lead with a budget at the end. That is a white-label licence: about 150 000 USD for the licence and setup, plus about 100 000 USD for the first year of operation and adaptation to their product range. Private builders and small contractors are the volume market later (a subscription at about 49 USD a month).

📋 **Ingrid:** So the goal is one enterprise contract worth 250 000 USD, and the product we show them has to look like something a customer can finish and take with them. What is missing for that today?

💼 **Mats:** Three things the buyer asks in the first meeting. One: "Can my customer get a report out?" Today the result dies in the browser. Two: "Can I trust the numbers?" One number per budget line looks like false precision. I want ranges and risks. Three: "Can I keep several projects?" A seller handles many customers.

💻 **Jonas:** And one thing they will ask that is not a feature: "Can it run on our servers?" Today it only runs on the Vite dev server. That is a blocker for any demo outside our laptops.

## 2. What goes into the next revision?

💻 **Jonas:** The cheapest big wins are in the schema, because the AI does the work. If the AI returns a risk list and a short change list every turn, we get a risk tab and a change log for almost nothing in code. A budget range per line is one more field.

💼 **Mats:** The change log sells. "Every change you made, and what it did to the price" is exactly what the customer's bank wants.

💻 **Jonas:** Report: a print layout that the browser saves as PDF. No PDF library, no server work. Projects: several projects stored in the browser, plus export and import as a JSON file. Accounts and a database are a separate architecture decision, and I do not want to rush them.

💼 **Mats:** Without accounts I cannot sell a SaaS subscription.

📋 **Ingrid:** Not in this revision. The enterprise buyer will want to plug into their own login anyway, so we decide that with them. Logged as out of scope for v0.2.

💼 **Mats:** Then I want the white-label part on the roadmap: their logo, their product range in the prompt, the lead sent to their CRM.

📋 **Ingrid:** On the roadmap for v0.4. Jonas, the production server?

💻 **Jonas:** A small Node server (`npm start`) that serves the built app and `/api/turn` with the same code as the dev server. It can run on any host with Node. It also gets a size limit on requests, so nobody can send us a megabyte of text on our API key.

💻 **Jonas:** One more risk: the AI returns the whole project every turn. With risks and changes it grows. I will keep `max_tokens` where it is and watch for truncation; streaming is a v0.3 item if answers get slow.

## 3. Decisions

| # | Decision | Owner |
|---|----------|-------|
| 1 | v0.2 adds **Risiko** (the AI's risk list: probability, consequence, measure, cost) and **Endringer** (what changed every turn, with the budget total before and after) as new tabs. | Jonas |
| 2 | Each budget line gets an **uncertainty in %**; the budget shows the total as a range. | Jonas |
| 3 | **Rapport**: a print/PDF layout of the whole project (overview, building, budget, risks, schedule, changes). | Jonas |
| 4 | **Prosjekter**: several projects in the browser, plus export and import as a JSON file. | Jonas |
| 5 | **Production server**: `npm run build` then `npm start`, with a request size limit. | Jonas |
| 6 | The team itself (Ingrid, Jonas, Mats) is installed as agent skills in `.claude/skills/`. | Ingrid |
| 7 | **Out of v0.2:** accounts, payment, a database, white-label, 3D, supplier price lists. They are on the roadmap. | Ingrid |

## 4. Roadmap to 250 000 USD

| Release | What it sells | Main content |
|---------|---------------|--------------|
| v0.2 (now) | "The customer takes the result with them, and can trust it." | Risks, change log, budget ranges, report/PDF, several projects, production server |
| v0.3 | "It feels instant." | Streaming answers, the dialog tested against Claude, prompt tuning per building type, cost per conversation measured |
| v0.4 | "It is *your* product." (white-label pilot) | Brand, the supplier's product range and prices in the prompt, the lead sent by e-mail or webhook |
| v0.5 | "Your sellers can work in it." | Accounts, projects stored on the server, sharing a project with a customer |
| v1.0 | The 250 000 USD contract | 3D model of the building, application documents (byggesøknad drafts), SLA, deployment on the customer's cloud |

**Sales target (Mats):** one white-label pilot with a prefab garage or cabin supplier after v0.4, converted to a 250 000 USD contract at v1.0.

## 5. Open questions for the group

- Is the buyer we picked (a prefab or building-supply company, white-label) the one the group wants?
- Who pays for the Claude API key while we test, and what is the budget?
