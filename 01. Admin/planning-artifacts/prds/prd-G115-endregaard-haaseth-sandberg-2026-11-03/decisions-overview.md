# Decisions to finish the ByggAPP PRD

A short overview of what the group must decide before the PRD can be marked final. Taken from §10 of [prd.md](prd.md), most important first. For each point: approve, change or reject.

## 1. Decide first (these block the next steps)

| # | Decision | In brief | Recommended |
|---|---|---|---|
| **P-7** | Language model or rule-based AI? | The brief promises a language model; v0.5 has rule-based AI. This decides what the whole app is. | **Rule-based.** Solves the instructor's concerns about key, cost and testing, and it is already built. |
| **P-15** | How the work is split into releases | The instructor asked for a small first version. | **R1** demo game, **R2** ordinary games, **R3** 3D game experience. |
| **P-18** | The brief's risk model or v0.5's? | Appendix A and the code calculate risk in different ways. | **Both:** the demo game follows Appendix A, ordinary games follow v0.5. Keeps the hand calculations and the tested code. |
| **P-21** | How the AI assesses a risk that may happen | Must be decided before the demo game can be built. | Assume **the risk happens**, using Appendix A's figures, and show both cases in the comparison. |
| **P-6** | How the AI picks the best option | The group already decided this on 22 October. | **Confirm:** the option that misses both targets by the least. |
| **P-2** | Overtime supplement 1.3 or 1.4? | 1.3 is below the legal minimum supplement of 40 %. | **1.4.** The teaching points still hold. Decide it last, since it changes the worked examples. |

## 2. Needed to build the first version (R1)

| # | Decision | Recommended |
|---|---|---|
| **P-5** | Prices for the risk responses at DP3 and for the other risks | The group sets these. At least R3 (facade delivery) is needed. |
| **P-10** | Which risks happen in the demo game | The group decides. User story UJ-1 assumes the weathered-rock risk (R1) happens. |
| **P-3** | A delay costs site overhead, not the task's weekly cost | Keep it; this is how v0.5 already works. |
| **P-19** | Where the rules v0.5 added are written down | A new Appendix B to the brief, with one worked example per event kind. |

## 3. Quick confirmations (can be approved together)

- **P-4:** write the crowding rule into the brief. The rule is already decided.
- **P-17:** the student plays the project owner, as in v0.5.
- **P-14:** construction is the only domain, as the instructor recommended.
- **P-1:** the model follows Appendix A's size; the 11 floors are presentation only.
- **P-8:** the comparison shows one Gantt chart and before → after numbers.
- **P-9:** risk exposure is the sum of possible delay and cost per open risk.
- **P-11:** no save and resume.
- **P-12:** add tests for the click flow.
- **P-13:** the game UI in Norwegian, documentation in English.
- **P-16:** one learning question after user tests.
- **P-20:** the order of the remaining work, as in PRD §7.1.
- **P-22:** the chapters serve as milestones.

## After the decisions

1. Write the decisions into the PRD as approved.
2. Update the product brief (PRD §7.2).
3. Run the PRD's final review and mark it `final`.
