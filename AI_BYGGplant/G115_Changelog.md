# Changelog – G115 AI_BYGGplant

Major iterations of *AI Byggplan*, the AI dialog that plans a building project. Each entry has a summary of at most four lines.

## v0.3 – 2026-10-30

"Start again and make something fantastic": team meeting 2 was run with Ingrid, Jonas and Mats as three separate agents (positions, replies, Ingrid's decision), then built by four parallel agents against a frozen contract (`src/contract/`).
New: a split screen with a live 3D model of the AI's building (Three.js, lazy-loaded; rises, eases on change, and changed openings glow), a streamed reply (SSE), a 7-step garage demo dialog that runs without an API key (labelled «Demo – forhåndsskrevet dialog, ikke live AI»), white-label for the fictional «Nordlys Hus og Garasje» (logo, colours, a 32-product catalogue in the prompt), «Send til forhandler» (lead.json, a webhook, the dealer's inbox), a new report, a schema validator, and a rate limit.
272 tests, tsc, `npm run build` and `npm run smoke` pass. Checked in Chrome (headless, driven over DevTools): all 7 demo steps, the 3D garage rising and changing colour, the glow on step 6, every tab, the report with the 3D snapshot, and the lead in the dealer's inbox, with no console errors. One bug fixed (Stopp showed while idle). Still never run against Claude.

## v0.2 – 2026-10-29

The team revision. Three AI agents (📋 Ingrid prosjektleder, 💻 Jonas utvikler, 💼 Mats selger) got the mandate to make AI_BYGGplant software worth 250 000 USD. They met, agreed a roadmap (a white-label licence for a prefab or building-supply company) and decided what this revision contains.
New: the Risiko tab (the AI's risks with probability, measure and cost), the Endringer tab (what every turn changed and the budget before → after), budget ranges from ± % per line, a Rapport button (print or PDF of every tab), and several projects with export and import as a file (v0.1 data is migrated).
Production: `npm run build`, then `npm start` serves the app and the AI on one Node server with a 512 kB request limit; the Claude call is now streamed. 16 tests pass.
Still not tested against Claude with a real key. The meeting notes are in `.docs/planning-artifacts/team-meeting-2026-10-29.md`.

## v0.1 – 2026-10-29

First draft. The app opens with «Hei, hva skal bygges?»; Claude (claude-opus-5-5) asks 1–3 questions per turn, narrow first (site, size, floors, doors, windows, gates) and broader later (materials, services), then makes a budget and a Gantt schedule. The dialog is always open for changes.
The AI returns the whole project as structured JSON every turn; the app has no building rules and only draws it. Tabs: Oversikt, Bygget (four elevations and a plan), Budsjett and Fremdrift, in ByggAPP's Fluent look.
Run with `cd AI_BYGGplant`, `npm install`, put `ANTHROPIC_API_KEY` in `.env` (from `.env.example`), then `npm run dev`. The key stays on the dev server. 9 tests pass.
Not yet tested against Claude: there was no API key on the development PC.
