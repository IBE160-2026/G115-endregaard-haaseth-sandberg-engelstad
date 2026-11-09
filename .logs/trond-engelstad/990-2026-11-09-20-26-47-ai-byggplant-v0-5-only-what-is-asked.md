# AI_BYGGplant v0.5 – generate only what is asked

## 2026-11-09 kl. 20:26 — Trond Engelstad

### Oppgave
"appen fungerer ikke som tenkt.Jeg skulle bygge en liten hytte, og det ble valgt  12 etasjers lelighetsbygg. den skal generere det som blir forespurt. ikke mer. Sørrelse, takvinkel , stil og slike ting må avklares før den generere. ta rollen som en prosjektleder for bygg."

### Plan
- Cause: the app ran in demo mode (no API key), and the demo provider played a scripted dialog whatever the user typed.
- bmad-build, one-shot route: [spec](../../AI_BYGGplant/.docs/implementation-artifacts/spec-v0-5-generate-only-what-is-asked.md). Demo steps play only for their own scripted line, and free text gets an honest reply. The system prompt makes Claude a prosjektleder who draws nothing until the basic choices are settled.
- One Blind Hunter review: 10 findings. 7 patched, 1 kept on purpose, 1 rejected, 1 deferred (see the spec's Review Triage Log).

### Resultat
- Commit 9922deb (local, not pushed). New `src/contract/script.ts` shared by the demo provider and «Neste demo-replikk». Changed `server/providers/demo.ts`, `server/prompt.ts`, `src/main.ts`, `src/ui/chat.ts` and `src/ui/shell.ts`, plus tests. Version 0.5.0, with G115_Changelog.md and G115_Dilemmas.md updated.
- 565 tests, tsc, build and smoke pass. "En liten hytte" sent to the demo API on localhost:5174 returned the honest reply with 0 volumes and 0 changes.

### Åpne punkter
- The demo dialogs (fixtures/) still draw a volume before roof and style are settled; rewrite them to clarify first, like the prompt.
- The new prompt rules are unproven until the app runs against Claude with a real key.
