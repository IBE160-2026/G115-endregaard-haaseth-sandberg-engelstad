# Deferred work

- source_spec: `spec-1-6-remove-the-v0-5-code.md`
  summary: Add a lasting test that no non-parked file imports a parked or removed v0.5 module (tsc pulls an imported parked file back in and fails).
  evidence: Only a one-time grep checks it today; the import-direction scan planned in story 1.10 should cover parked paths too.
