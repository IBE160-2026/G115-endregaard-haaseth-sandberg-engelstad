# v0.3: content, consequences and AI roles

## 2026-10-27 kl. 00:12 — Trond Engelstad

### Oppgave
The user asked Kai (the game developer agent) for more content: more scenarios, more action per game, a better story and more choices. The consequences and benefits of each choice should be clearer and interactive, and the AI roles should have a bigger part in each game.

### Plan
- Kai was activated by hand (the skill was not loaded in this session) and routed the request to `bmad-build`.
- Spec: [spec-v0-3-content-consequences-ai-roles.md](../../.docs/implementation-artifacts/spec-v0-3-content-consequences-ai-roles.md). All three goals were kept in one spec, at about 2,600 tokens.
- Group decisions:
  - two targets only;
  - about 12–15 decisions per game;
  - a short fork dialog after each choice.
- A spec review found 12 gaps, all fixed before the build.
- An agent implemented the spec, and three reviewers checked the result:
  - 10 findings were patched;
  - 2 were deferred to `deferred-work.md`;
  - 18 were rejected with a reason.

### Resultat
- The Kai agent files were committed separately as `69f3ac8`. v0.3 was committed locally as `8af8112` and has not been pushed.
- 16 new events:
  - 4 strategy choices, raised when C, F, H and N start;
  - 4 change requests;
  - 3 follow-ups;
  - 5 new risks and opportunities.
- A prologue and 6 chapters; delayed consequences; changes to a task's hours.
- Option previews show the effect now and later, the forecast, and Δ against today. A fork card follows each choice, and the final report compares the player, the AI path and the story solution.
- Three AI voices at every decision, and a message feed.
- 162 tests pass and `npm run build` succeeds. The story path averages about 14 decisions per game.
- `G115_Changelog.md`, `G115_Dilemmas.md` and the README are updated, and the version is 0.3.0.

### Åpne punkter
- Not played in the browser yet. Check the strategy dialogs, option previews, fork card, feed and final report in light and dark theme.
- The group should check all prices, delays and chances of the new events, and the 9 v0.2 event chances that were lowered.
- Scenario buttons now fire each event once, which reverses v0.2. The group must decide whether risks should still be repeatable.
- Deferred: dedicated icons for the v0.3 events, and a DOM test for resuming play after the fork card.
