---
title: "Addendum: AI_BYGGplant PRD"
status: draft
created: 2026-11-05
updated: 2026-11-05
---

# Addendum: AI_BYGGplant PRD

Detail that supports `prd.md` but does not belong in its main text: sources, the system as built, and the agents' commercial material.

## 1. Sources

Read for this draft, all from the repository at `143a321`:

| Source | Used for |
|---|---|
| `AI_BYGGplant/G115_Changelog.md` | What was built per version, and test counts |
| `AI_BYGGplant/G115_Dilemmas.md` | The group's requests word for word, and open items |
| `AI_BYGGplant/.docs/planning-artifacts/team-meeting-2026-10-29.md` | Agent decisions and roadmap |
| `AI_BYGGplant/.docs/planning-artifacts/team-meeting-2-2026-10-29.md` | Agent rulings and definition of done |
| `AI_BYGGplant/.docs/implementation-artifacts/spec-v0-1-*.md`, `spec-v0-2-*.md` | Intent and acceptance criteria |
| `AI_BYGGplant/src/handoff/README.md` | The Lead format |
| `01. Admin/README.md` (the AI_BYGGplant section only) | How to run it, and project description |
| `.logs/trond-engelstad/*` (AI_BYGGplant entries), `.logs/elisabeth-sandberg/*` | Run results, deployment, open items |
| Code in `AI_BYGGplant/server/`, `src/contract/`, `src/handoff/`, `src/projects.ts`; targeted searches elsewhere in `src/` | What actually exists |
| `AI_BYGGplant/brand.json`, `.env.example`, `package.json`, `vercel.json` | Configuration |

**Limits of this review**

- Tests, build and the app were not run for this draft. All run results are quoted from the logs.
- `src/three/`, `src/ui/` and `main.ts` were searched rather than read line by line.
- The statement that the estimate warning appears only in the Report comes from a keyword search of `src/` and `index.html`. Confirm it in the running app.

## 2. Separation from Other Projects

No requirement or decision in the PRD comes from another project's PRD or brief, and those were not used as input. The only links found in AI_BYGGplant's own material:

| Link | Where | Handling |
|---|---|---|
| The group's first request says output should be visualised like ByggAPP | `G115_Dilemmas.md` v0.1 | Flagged as ⚑ G12; no requirement derived |
| Shared visual language and copied icons | Comment at `src/styles.css:1`; spec v0.1 | Described as AI_BYGGplant's current appearance |
| Shared deployment configuration | `vercel.json` at the repository root | Noted in ⚑ G8 |
| The v0.1 spec cites a brief and a final prompt from outside this project | `spec-v0-1-*.md` frontmatter | Not used |

No code in `src/`, `server/` or `scripts/` refers to the other project.

## 3. The System as Built

**Stack:** Vite and TypeScript in the browser, Three.js (loaded separately), Node on the server, `@anthropic-ai/sdk`. TypeScript is pinned to `~5.9.3` because of the Vercel build.

**Flow of a Turn**

1. The browser posts the Dialog to the server; the newest user message carries the current Project as JSON.
2. The server cleans the messages and applies the rate limit and size limit.
3. The provider (`claude` or `demo`) produces a Turn. Only `reply` streams; the rest arrives complete at the end.
4. The server checks the Turn against the schema (`parseTurn`).
5. The browser merges it into the Project, stores it in `localStorage` and redraws.

**API**

| Route | Purpose | Limit |
|---|---|---|
| `POST /api/turn/stream` | SSE: `reply` deltas, then `turn` or `error` | 20 per 10 min per IP |
| `POST /api/turn` | The whole Turn as JSON | Same limit |
| `GET /api/config` | Provider, demo label, demo dialogs | — |
| `POST /api/lead` | Validates a Lead and forwards it to the webhook | 10 per 10 min per IP |

All POST bodies are limited to 512 kB.

**Claude call as configured (`server/providers/claude.ts`)**

- Model `claude-opus-5-5`, medium effort, `max_tokens` 32 000
- Structured output against `TURN_SCHEMA`, with the system prompt in a cached block
- Server-side fallback on refusal

**Environment variables:** `ANTHROPIC_API_KEY`, `DEMO`, `DEMO_DIALOG`, `LEAD_WEBHOOK_URL`, `PORT`.

**Deployment:** per the 2026-11-03 session log, the app is at `/ai-byggplant/` on the group's Vercel URL (`https://g115-endregaard-haaseth-sandberg-en.vercel.app/ai-byggplant/`), in Demo mode. The function limit is 60 s. These statements come from the log and were not rechecked.

## 4. Implementation Notes for the MVP Gaps

These are starting points for the developer, not decisions.

- **FR-7:** `consistencyErrors` in `src/contract/validate.ts` needs the merged Project. It can run on the server if the current Project is available there, or in the browser before the Turn is applied. Decide whether a failure rejects the Turn or triggers an automatic retry.
- **NFR-5:** `server/http.ts:131` uses `req.socket.remoteAddress`, and `server/ratelimit.ts` keeps its buckets in memory. A serverless host needs a trusted forwarded address and a shared store, or the host's own rate limiting.
- **FR-22:** the webhook call has no signature or shared secret, so a receiver cannot verify the sender. Add this before any real pilot.
- **FR-24:** `src/handoff/README.md` and the code disagree. The Lead type has no Report field, and `POST /api/lead` sends JSON only.
- **Deferred:** delta turns (the sections are already nullable and `mergeProject` handles them, but the prompt still asks for everything).

## 5. The Agents' Commercial Material

**Everything here is agent-generated and unverified (⚑ G2, ⚑ G3).** It is kept for reference and is not a basis for the requirements.

**Pricing (Mats, team meeting 1):** about 150 000 USD for licence and setup, plus about 100 000 USD for the first year. A volume market later at about 49 USD a month. A qualified lead is said to be worth 2–5k NOK to the buyer.

**Potential buyers named by the agent (team meeting 2):** builders' merchants (Byggmakker, Maxbo, XL-Bygg, Montér) and kit suppliers (Mesterhus, Nordbohus, Rindalshytter). None of them has been contacted, and nothing suggests they have any interest (⚑ G10).

**The agents' roadmap (team meeting 1), with the status at v0.4**

| Release | Planned content | Status |
|---|---|---|
| v0.2 | Risks, change log, ranges, report, several projects, production server | Done |
| v0.3 | Streaming, tested against Claude, prompt tuning per type, cost measured | Streaming done; the rest not done |
| v0.4 | Brand, supplier's catalogue in the prompt, lead by e-mail or webhook | Brand, Catalogue and webhook done (moved earlier, in v0.3); no e-mail |
| v0.5 | Accounts, server-stored projects, sharing | Not started |
| v1.0 | 3D model, application documents, SLA, deployment in the customer's cloud | 3D done (moved earlier); the rest not started |

The version numbers actually used differ: the shipped v0.4 was "every building type", which was not on this roadmap.

**The sales demo (Mats, team meeting 2):** their logo → "Dobbelgarasje med loft" → the 3D model rises → "1 m longer + a window" updates everything → budget ranges with their products → risks and Gantt → «Send til forhandler» → a cabin without a reset. The last step has no demo dialog yet.
