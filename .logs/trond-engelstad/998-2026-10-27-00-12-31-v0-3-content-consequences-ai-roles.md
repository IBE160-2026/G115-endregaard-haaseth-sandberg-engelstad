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

## 2026-10-27 kl. 00:16 — Trond Engelstad

### Oppgave
Play-test v0.3 in the browser ("test spill").

### Plan
- Ran `npm run dev` (port 5199) and drove headless Edge with `playwright-core` from the scratchpad. Nothing was installed in the repo.
- Played two full games on Medium at 4×. In each game the first choice went against the advice; after that the advice was followed. The PM staffing plan was not used.

### Resultat
- No JS errors in either game. One game had 15 decisions, finishing in week 113 at 296,23 MNOK; the other had 15 decisions, finishing in week 117 at 294,77 MNOK.
- All four decision types appeared: strategy choices, risks, opportunities and change requests. One follow-up appeared (the hired pump failed after "lei midlertidig pumpe").
- Checked with screenshots, all correct:
  - the strategy dialog, the three voices, and the option previews with Δ against today;
  - the fork card with two columns;
  - the feed, with chapters, starts and finishes, consequences and "Prognosen er endret";
  - the final report, which compares you, the AI path and the story, and lists every decision;
  - dark theme, and the 3D window at week 113.

### Åpne punkter
- Balance: following the advice without the PM staffing plan ended about 12–13 MNOK over budget in both games. In one game the AI path was also over budget (284,80). The group should decide whether that is too hard.