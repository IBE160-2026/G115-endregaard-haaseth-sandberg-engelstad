- source_spec: `AI_BYGGplant/.docs/implementation-artifacts/spec-v0-5-generate-only-what-is-asked.md`
  summary: Rewrite the four demo dialogs (fixtures/) so they clarify size, roof and pitch, and style before drawing a volume, like the new system prompt.
  evidence: fixtures/garage/02.json draws a volume with an assumed 35° saltak and adds port-1 after the user gave only a size; boligblokk, enebolig and lagerhall step 2 do the same.
- source_spec: `AI_BYGGplant/.docs/implementation-artifacts/spec-v0-5-generate-only-what-is-asked.md`
  summary: Consider a server- or client-side check that flags a live turn adding volumes or openings before the basic choices are settled.
  evidence: in live mode the fix rests only on prompt wording; unverified until the app is run against Claude (would be medium if Claude ignores the rule).
