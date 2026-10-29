# Changelog – G115 AI_BYGGplant

Major iterations of *AI Byggplan*, the AI dialog that plans a building project. Each entry has a summary of at most four lines.

## v0.1 – 2026-10-29

First draft. The app opens with «Hei, hva skal bygges?»; Claude (claude-opus-5-5) asks 1–3 questions per turn, narrow first (site, size, floors, doors, windows, gates) and broader later (materials, services), then makes a budget and a Gantt schedule. The dialog is always open for changes.
The AI returns the whole project as structured JSON every turn; the app has no building rules and only draws it. Tabs: Oversikt, Bygget (four elevations and a plan), Budsjett and Fremdrift, in ByggAPP's Fluent look.
Run with `cd AI_BYGGplant`, `npm install`, put `ANTHROPIC_API_KEY` in `.env` (from `.env.example`), then `npm run dev`. The key stays on the dev server. 9 tests pass.
Not yet tested against Claude: there was no API key on the development PC.
