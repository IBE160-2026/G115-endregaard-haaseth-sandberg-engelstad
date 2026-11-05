# Team meeting 2 – "Start again and make something fantastic"

**Date:** 2026-10-29 · **Chair:** 📋 Ingrid (prosjektleder) · **Present:** 💻 Jonas (utvikler), 💼 Mats (selger)
**Mandate from the group:** "50% of 7d limit! Start again and make something fantastic" (still: software worth 250 000 USD).
**How it was run:** unlike meeting 1, each role ran as its own Claude Code agent. Each read the code and wrote a position paper (round 1), then answered the other two (round 2), and Ingrid decided (round 3). The summaries below are condensed from their papers.

## Round 1 – positions

**📋 Ingrid.** v0.2 is clean, but nobody has seen it work (no API key) and it looks like a form with tabs. "Fantastic" means a split screen: the dialog on the left and a lit 3D plot on the right. The reply streams in, and the building rises at the AI's dimensions; every answer visibly changes it ("Port 2,5 → 3,0 m · +18 000 kr"). All of it also works in demo mode without a key. She ranked: demo mode, live 3D, split screen with a glow on changes, streaming, visual schema fields, a pro report, white-label. Build on v0.2; cut accounts, database, payment, byggesøknad and the game layer.

**💻 Jonas.** The pure core is worth keeping. The weak points:
- Latency: the whole project is rebuilt every turn, and the browser waits for all of it.
- No ids, so there is nothing to diff or highlight.
- The app "interprets" in two places (the roof string read with `includes('sal')`, openings spread evenly), which goes against "uten regler".
- No runtime validation, and it has never been tested against Claude.

He proposed a shared contract with a validator and a demo provider; SSE streaming with a partial parser; delta turns; a parametric 3D model (a pure model plus a lazily loaded Three.js renderer, reusing ByggAPP's helpers but not its game code); structured changes with `ref_id`; and hardening. He listed exact schema additions. To verify without a key: contract tests, golden dialogs, adversarial fixtures, a fake SDK, and `npm run smoke` on the day we get a key.

**💼 Mats.** The buyer is the head of digital sales at a builders' merchant (Byggmakker, Maxbo, XL-Bygg, Montér) or a kit supplier (Mesterhus, Nordbohus, Rindalshytter). A qualified lead is worth 2–5k NOK to them. He wrote an 8-beat, 5-minute demo: their logo → "Dobbelgarasje med loft" → the 3D model rises → "1 m longer + a window" updates everything → budget ranges with *their* products → risks and Gantt → «Send til forhandler» → a cabin without a reset. Deal-makers: white-label with their catalogue as data, and the lead hand-off. What would embarrass us today: no live AI, 2D only, generic branding, a result that goes nowhere.

## Round 2 – replies

**💻 Jonas → Ingrid and Mats.** The glow needs ids and `ref_id`, so his schema additions belong in the freeze. Cap the catalogue at about 50 products in the cached prompt. No e-mail yet; a webhook plus PDF instead. A cabin needs a second fixture. A rate limit before any public URL. SSE belongs in v0.3, because the demo must travel the same path as live. Delta turns wait for v0.4, but the sections are nullable from day 0.

**💼 Mats → Ingrid and Jonas.** The glow is the change-log pitch, and the roof object plus offsets fix "my window isn't in the middle". Streaming and delta turns don't show in an offline demo. Rooms are a stretch, and hardening can wait for the pilot. brand.json must be a must-have, since it is cheap. An offline «Send til forhandler» = PDF + `lead.json` in a documented webhook format + a «Forhandlerens innboks» panel labelled «Demo – i produksjon: e-post/webhook til deres CRM».

**Facilitator note:** with no API key, the demo cannot be a recording of real Claude output. It is a hand-written dialog in the schema's format, labelled «Demo – forhåndsskrevet dialog, ikke live AI».

## Round 3 – Ingrid's decision

**MUST (v0.3)**
- **WS1:** the contract freeze (ids and `ref_id`, `offset_m`, `sill_m`, a roof object, exterior colours, nullable sections) with a validator; the hand-written garage demo (script by Mats); the `claude` and `demo` providers behind one SSE path; a rate limit; `npm run smoke`.
- **WS2:** the parametric 3D model (a pure model plus a lazily loaded renderer).
- **WS3:** the split screen, the `ref_id` glow and brand.json (name, logo, colours).
- **WS4:** «Send til forhandler» (PDF + `lead.json` + a webhook format + the inbox panel).

**STRETCH:** a catalogue of up to 50 products in the cached prompt (WS1), a cabin fixture (WS1), cancel and retry (WS3), partial parsing of `project` (WS1/WS3), a 3D snapshot in the PDF (WS2/WS4).

**Rulings:**
- SSE is in; only `reply` streams, and `project` is applied when the turn is complete.
- Delta turns are out until v0.4; sections are nullable from day 0.
- brand.json is a must-have, and the catalogue is a stretch.
- Rooms and e-mail are out.
- The cabin is a stretch.
- The rate limit is a must-have before any public URL.

**Workstreams and order:** WS1 (contract and server), WS2 (3D, `src/three/*`), WS3 (shell and UX), WS4 (tabs, report and hand-off). The gate is the contract plus the first garage fixture turns; then WS2–WS4 build in parallel against the fixtures. Contract changes go through Jonas. Ingrid integrates once.

**Definition of done:**
- `npm test` is green: every fixture validates, every `ref_id` resolves, the 3D model builds from every fixture, and no geometry appears that the JSON lacks.
- `npm run build` is clean.
- `npm run smoke` receives one complete SSE turn from the demo provider.
- A manual run of the garage flow without a key: greeting → streamed reply → the garage rises in 3D → the glow on a change → Rapport/PDF → «Send til forhandler» → the lead in the inbox.

**To the group:** "v0.3 is the first version anyone can actually watch: you describe a garage and see it built in 3D while you talk, using a clearly labelled, pre-written demo dialog until we get an API key. Then the dealer gets a finished lead with a PDF."
