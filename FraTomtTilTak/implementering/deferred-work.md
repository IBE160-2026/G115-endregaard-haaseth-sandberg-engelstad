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
- source_spec: `FraTomtTilTak/implementering/spec-1-2-rule-gap-site-capacity-and-the-crew-stepper.md`
  summary: R27 and R28 do not say whether the student "followed" an AI hire recommendation when they hire with a different h than the AI's h = 12.
  evidence: R25 ranks hiring at h = 12 while R27/R28/R30 use the student's h (simulation-rules R21, revision 6); the follow rule needs a group decision before Epic 4/5 implement R27.
- source_spec: `FraTomtTilTak/implementering/spec-1-2-rule-gap-site-capacity-and-the-crew-stepper.md`
  summary: Decide whether the forecast shown for the hire option on the event card (R24) follows the crew stepper's h or always shows h = 12.
  evidence: R25 ranks at h = 12 and the stepper changes h (R21, EXPERIENCE crew stepper row); neither the rules nor UX say what the card shows. Needed by stories 4.3 and 4.7.
- source_spec: `FraTomtTilTak/implementering/spec-1-2-rule-gap-site-capacity-and-the-crew-stepper.md`
  summary: PRD FR-33 still says R32 and S36 are "proposed in epics story 1.2", and epics.md says the new ids do not exist in the rules yet.
  evidence: prd.md FR-33 and epics.md line 28; the wording is out of date once this PR merges. Kept out of story 1.2's scope; PRD edits go through their own PR.
- source_spec: `FraTomtTilTak/implementering/spec-1-2-rule-gap-site-capacity-and-the-crew-stepper.md`
  summary: R32's adviser capacity record (once per event) has no worked example to become a test.
  evidence: FR-31 asks for an example per rule; example (f) only covers the cap on h. Add it with the adviser rules (story 3.2) or the hiring story (4.3).
- source_spec: `spec-1-6-remove-the-v0-5-code.md`
  summary: Add a lasting test that no non-parked file imports a parked or removed v0.5 module (tsc pulls an imported parked file back in and fails).
  evidence: Only a one-time grep checks it today; the import-direction scan planned in story 1.10 should cover parked paths too.
- source_spec: `FraTomtTilTak/implementering/spec-1-5-rule-gap-worked-examples-for-r15-r29-and-r30.md`
  summary: R20, R22 and R23 are worked in examples (c) and (d) but never named by id there, and R11 appears only inside the range "R10–R12", so the story 1.11 coverage test (test titles start with the R id) needs an explicit mapping for them.
  evidence: A grep of §4 finds no "R20", "R22" or "R23"; overtime, the E5 alternative and the E8 change request appear in examples (c) and (d). §5 item 20 now says so.
- source_spec: `FraTomtTilTak/implementering/spec-1-5-rule-gap-worked-examples-for-r15-r29-and-r30.md`
  summary: R30 does not say which two options the stage 1 closeness check compares, and the closeness table in example (k) may pick the wrong pair (unverified, medium).
  evidence: At 5 floors precast 196.545 (week 67) and steel 199.079 (week 65) differ by 2.534 < S42 3.420 in the same week band, yet the table compares precast with CLT (3.515) and says "recommends precast firmly". At 4 and 6 floors cast-in-place pairs within 3.420 are left out. A group decision on the compared pair (cheapest two, closest pair in a band, or the student's choice against the best) settles it before story 3.2 implements the rule.
