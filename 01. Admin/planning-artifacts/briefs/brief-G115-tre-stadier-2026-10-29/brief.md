---
title: "Product Brief: AI-assisted construction project management simulator (three stages)"
status: final
created: 2026-10-29
updated: 2026-10-31
---

# Product Brief: Fra tomt til tak

*Working title ("From plot to roof"): an AI-assisted construction project management simulator.*

## Executive Summary

A web-based simulator, built for the IBE160 course at Høgskolen i Molde, that lets a newcomer experience a construction project as its project manager, from the client's order to handover. A fictional client needs offices for **100 employees in Oslo**, built from scratch.

One playthrough takes about 20 minutes and runs in three stages:

1. **Plan (the main part).** The student shapes the project with an AI adviser: plot, number of floors, structural system, schedule, crews, risks and reserve. The adviser suggests, explains and warns, but the student has the final say.
2. **Execute (shorter).** The plan is put to the test. A few unforeseen events hit, and the student has to choose a response to each and answer for it.
3. **Debrief (short).** The student sees where the plan held and where it broke, compared with the AI's path, and ends with a conclusion tied to the learning goals.

The three stages belong together because project management judgement is learned across the whole cycle. A plan only teaches something when you see it break, and a breakdown only teaches something when you understand why it happened.

The simulator builds on the group's existing game (v0.5). Its simulation engine, events and AI comparison are reused in stage 2; the planning stage and the debrief are new.

## The Problem

Project management is usually taught through static artefacts to fill in correctly: Gantt charts, work breakdown structures (WBS) and risk registers. Learners see what a plan looks like, but rarely how it holds up or breaks under real conditions. Planning exercises stop at the finished plan, and case studies start after the decisions have been made. Almost nobody gets to connect the whole cycle: plan, execute and look back.

For someone who is curious about how construction projects actually work, there is no safe place to try. You cannot run a building project to see what happens if you skip a risk buffer.

At the same time, AI is becoming part of how project managers work. Learners have little practice in working with AI suggestions: when to follow them, when to overrule them, and how to tell the difference.

## The Solution

### Stage 1 – Plan (about 10 minutes)

The playthrough opens in the site office, where the client presents the order: offices for 100 employees in Oslo, with a deadline and a budget. Then the planning view opens, with four steps:

1. **Plot and concept.** Choose one of three plots in Oslo, each with its own price per m² and zoning limits. The floor area needed is given by the 100 workplaces, so the student weighs footprint against floors: fewer floors need a larger, more expensive plot, while more floors need more structure, lifts and a longer frame phase. The student also chooses the structural system (for example cast-in-place concrete, precast concrete, steel or timber), which changes cost and time.
2. **Schedule and resources.** The WBS and Gantt chart follow from the concept. The student sets crew and work mode for the key disciplines, with the critical path marked.
3. **Risk and reserve.** A few known risks that depend on the plot and concept (for example contaminated ground on a central plot, or crane stops in wind on a tall building). The student chooses how to meet each one and sets a reserve in time and budget.
4. **Present the plan.** Back in the site office, the student presents the plan to the client against the targets, sees the adviser's overall assessment, and approves it. The plan becomes the baseline for stage 2.

The planning view always shows the targets (budget, completion week, risk exposure). Every choice updates the consequences at once, calculated by the same engine that runs stage 2. A **3D view on part of the screen** shows the building taking shape on the chosen plot as the student changes floors, footprint and structure. In stage 2 the same view shows the construction progressing. There is no walking around the site; the 3D view is something to look at, not to move through.

### The AI adviser

The adviser is a window in the planning view. It works in three ways:

- **Suggestions.** At each step it proposes a concrete choice and explains why, so the student experiences what it is like to draw on the AI's knowledge.
- **Warnings.** When the student makes a choice it judges to be poor, it warns and says why. Warnings are rule-based (for example "the plot does not allow eight floors" or "speeding up a task off the critical path gains no time"), so they are always correct and testable.
- **Questions.** The student can ask. Suggested-question buttons always work and give prepared answers. Free-text questions go to a language model when a key is available; the model is given the scenario, the rules and a set of approved facts, and keeps its answers within them so the student does not go off track. Without a key, a free-text question gets the nearest prepared answer.

The language model only explains; the numbers and the warnings come from the rules. The simulator therefore runs in full without a key.

### Stage 2 – Execute (about 6 minutes)

The project runs from the student's plan. Three or four unforeseen events hit (risks, opportunities, change requests), and the student decides how to respond. After every decision the student sees their own path next to the AI's recommendation, both calculated from the same state. The point is to put the plan to the test, not to be a long game.

### Stage 3 – Debrief (about 4 minutes)

The student sees where the plan held and where it broke, and how their result compares with the AI's path through the same events. It ends in a short conclusion that ties the outcome to the learning goals, so the student leaves knowing *why* things turned out as they did.

## Learning Goals

After one playthrough, the student should understand that:

- **Time costs money.** Every week of delay adds site overhead, so speeding up can pay for itself.
- **Resources have limits.** More workers give less output per person, and overtime and hired crews cost more.
- **Risk is managed, not just suffered.** A known risk can be accepted, reduced, transferred or avoided, and the cheapest choice depends on whether it actually happens. A reserve in time and budget absorbs the unknown, and a change approved late costs more than one approved early.
- **AI advice is worth weighing, not just following.** The student learns when the adviser's suggestion holds up and when their own judgement was better.

Together these cover the three areas the assignment names (scheduling, resources and risk) plus the AI's role as decision support.

## Who This Serves

**Primary: the curious newcomer.** Someone with little or no project management knowledge who is interested in how a construction project really unfolds. They need plain language, explanations at the moment they matter, and a session short enough to finish in one go: about **20 minutes** for all three stages.

**Secondary: the instructor and the examiner.** They must be able to run the simulator from the README without keys or accounts, and to follow the trail from plan to code.

**The G115 group.** This brief sets a new direction for the group's simulator. It is developed on its own branch and replaces the earlier brief only if the group adopts it.

## What Makes This Different

- **The student owns the project.** In the group's v0.5 game the plan was given and the student reacted to events. Here the student shapes the project from the plot up, so every consequence in stage 2 follows from their own choices. That ownership is what makes the learning stick: it is hard to shrug off a delay you planned yourself.
- **The plan is tested, not just filled in.** The student's own plan is run forward against unforeseen events, so the consequences of planning choices become visible.
- **The AI is grounded in the simulation.** The adviser's suggestions and warnings come from the same rules that compute the outcome, and the language model only explains within approved facts. It cannot invent numbers or lead the student off track.
- **A benchmark to learn from.** As in the group's v0.5 game, every decision is compared with the AI's path from the same state. Academic simulators such as the Virtual Construction Simulator (VCS3) compare the outcome with a fixed plan; here the benchmark is a reasoned recommendation.

## Scope

The group has about 120 hours in total over about 1.5 months, with Claude Code as the main coding labour. Scope is set in tiers so that a complete version is guaranteed first.

**Must have:**

- Stage 1 with the four steps, using discrete options (three plots, a few floor counts, three or four structural systems).
- A building-block model that turns the concept into WBS, quantities, durations and cost, with simple rules the group owns and worked examples with answers.
- The adviser's rule-based suggestions and warnings, and suggested-question buttons with prepared answers.
- A shortened stage 2 (three or four events), reusing the v0.5 engine and the comparison with the AI's path.
- A short stage 3 debrief with a conclusion tied to the learning goals.
- A decision log of every choice, with time and what the adviser recommended. It feeds the debrief and can be downloaded. This is how the simulator meets the assignment's recommendation of an audit log; see "Out" for why there is no login.
- Runs from the README without keys or accounts.

**Should have:**

- Free-text questions to a guardrailed language model, with the offline fallback.
- The AI's own plan, run through the same events as the student's, in the debrief.

**Could have:**

- A scaled-down HMS (health, safety and environment) check (for example one safety question at the start).
- Saving and resuming a playthrough.

**Out:**

- Walking around the site (replaced by the 3D view on part of the screen).
- Building one's own WBS from scratch.
- Accounts and login. The simulator is open to the public on GitHub and uses only a fictional scenario, so there is nothing confidential to protect (see addendum §4).
- Multiplayer, real scheduling file formats, and domains other than construction.

## Success Criteria

- A newcomer completes all three stages in about 20 minutes without help. Tested with 3–5 people outside the group.
- Every planning choice shows its consequence on cost, time and risk at once, and the numbers match the worked examples.
- Every adviser warning fires correctly in tests against hand-calculated cases.
- The simulator runs from the README without keys; without a key, the adviser still answers with prepared answers.
- The debrief conclusion names the learning goals the student's choices touched.

## Open Questions

- **Figures and sources.** Floor area per workplace, plot prices in Oslo, and cost and duration per structural system and floor count all need sources before the rules are written.
- **Language model.** Which model, what it costs per playthrough, and how the key is kept out of the repo (only relevant for the should-have tier).
- **What stays from v0.5 in stage 2.** Walking is cut and HMS is scaled down. Do the meetings around a 3D model of each challenge still fit in about 6 minutes?
- **Relation to the existing brief and v0.5.** If the group chooses this direction, this brief replaces the earlier one, and the change of direction is explained in the planning documents.
