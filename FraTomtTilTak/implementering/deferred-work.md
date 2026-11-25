# Deferred work

- source_spec: `FraTomtTilTak/implementering/spec-1-1-rule-gap-milestones.md`
  summary: Update PRD FR-32 to point at R31 as written (not "proposed in epics story 1.1") and add the "part finishes later" case to its Ikke nådd consequence.
  evidence: prd.md line 208 still says "Rule R31 (proposed in epics story 1.1)"; the PRD is a spec, so the edit belongs in a PRD pull request (CLAUDE.md, refleksjon-prd.md routing).
- source_spec: `FraTomtTilTak/implementering/spec-1-1-rule-gap-milestones.md`
  summary: Update EXPERIENCE.md milestone status (line 129) to the four R31 states, adding Planlagt and removing the [ASSUMPTION] on I fare.
  evidence: R31 notes Planlagt is an addition to EXPERIENCE.md; the UX contract was not in story 1.1's acceptance criteria. Fits story 2.7 or 4.9.
- source_spec: `FraTomtTilTak/implementering/spec-1-1-rule-gap-milestones.md`
  summary: Add a .memlog.md entry for simulation rules revision 5 (R31) in the PRD folder.
  evidence: Earlier revisions are logged there via _bmad/scripts/memlog.py; not part of story 1.1's acceptance criteria.
