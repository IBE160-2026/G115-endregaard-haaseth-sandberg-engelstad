---
title: "DESIGN: Fra tomt til tak"
status: draft
created: 2026-10-31
updated: 2026-10-31
sources:
  - ../../prds/prd-fra-tomt-til-tak-2026-10-31/prd.md
  - ../../briefs/brief-G115-tre-stadier-2026-10-29/brief.md
  - ../../briefs/brief-G115-tre-stadier-2026-10-29/addendum.md
  - ../../../../ByggAPP/G115_FinalPrompt.md
  - .working/direction-verktoy.html
name: Fra tomt til tak
description: Desktop web simulator where a newcomer plans and runs an office-building project. Visual direction "Prosjektverktøy" - light, calm Fluent-style project software with a framed 3D view and a named adviser.
colors:
  # Surfaces
  surface-app: '#f3f3f3'        # Mica-light app background
  surface-bar: '#fbfbfb'        # top bar (targets)
  surface-nav: '#f7f7f7'        # step navigation rail
  surface-card: '#ffffff'
  surface-sunken: '#f3f3f3'     # adviser message bubble, neutral fills
  border-subtle: '#e5e5e5'      # card borders, dividers
  border-row: '#f0f0f0'         # table row rules
  border-control: '#d1d1d1'     # inputs, secondary buttons, chips
  track: '#8a8a8a'              # slider track, radio ring, input underline
  # Ink
  ink-primary: '#1b1b1b'        # 16:1 on white
  ink-secondary: '#5f5f5f'      # 6.4:1 on white
  ink-body-muted: '#3d3d3d'
  ink-disabled: '#6e6e6e'
  # Accent (Fluent light accent, carried over from v0.5)
  accent: '#005fb8'
  accent-strong: '#003e7a'      # text on accent-subtle, current step, chip text
  accent-subtle: '#e8f1fb'      # current step fill, hover fills
  on-accent: '#ffffff'
  # Status
  good: '#0f7b0f'
  good-subtle: '#dff6dd'
  warning: '#9d5d00'
  warning-text: '#7a4800'
  warning-subtle: '#fff4ce'
  bad: '#c42b1c'
  bad-text: '#a52317'
  bad-subtle: '#fde7e9'
  bad-border: '#f4bfc4'
  neutral-subtle: '#ebebeb'
  disabled-fill: '#e0e0e0'
  # 3D view palette
  view-sky: '#eaf2fa'
  view-plot: '#dfe8d8'
  view-plot-edge: '#7c9a72'
  view-building-front: '#c9d6e3'
  view-building-side: '#9fb2c6'
  view-building-roof: '#e6edf4'
  view-window: '#7f97ae'
typography:
  display:
    fontFamily: 'Segoe UI Variable Display, Segoe UI, system-ui, sans-serif'
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  title:
    fontFamily: 'Segoe UI Variable Display, Segoe UI, system-ui, sans-serif'
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.25'
  card-title:
    fontFamily: 'Segoe UI Variable Text, Segoe UI, system-ui, sans-serif'
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
  body:
    fontFamily: 'Segoe UI Variable Text, Segoe UI, system-ui, sans-serif'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.45'
  caption:
    fontFamily: 'Segoe UI Variable Text, Segoe UI, system-ui, sans-serif'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  key-figure:
    fontFamily: 'Segoe UI Variable Display, Segoe UI, system-ui, sans-serif'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.2'
    note: 'font-variant-numeric: tabular-nums'
  number:
    fontFamily: 'Segoe UI Variable Text, Segoe UI, system-ui, sans-serif'
    fontSize: 14px
    fontWeight: '600'
    note: 'font-variant-numeric: tabular-nums; used in tables and number fields'
rounded:
  sm: 4px       # buttons, inputs, badges, chips, InfoBar
  md: 6px       # adviser message bubbles
  lg: 8px       # cards, key-figure cards, adviser window
  full: 9999px  # avatar, step numbers, slider thumb
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  nav-width: 220px
  form-column: 420px
  adviser-width: 330px
  adviser-inset: 20px
  key-figure-min: 210px
components:
  button-primary:
    background: '{colors.accent}'
    foreground: '{colors.on-accent}'
    radius: '{rounded.sm}'
    padding: '7px 16px'
    typography: '{typography.card-title}'
  button-secondary:
    background: '{colors.surface-card}'
    foreground: '{colors.ink-primary}'
    border: '1px solid {colors.border-control}'
    radius: '{rounded.sm}'
  button-disabled:
    background: '{colors.disabled-fill}'
    foreground: '{colors.ink-disabled}'
    radius: '{rounded.sm}'
  top-bar:
    background: '{colors.surface-bar}'
    border-bottom: '1px solid {colors.border-subtle}'
  key-figure-card:
    background: '{colors.surface-card}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.lg}'
    min-width: '{spacing.key-figure-min}'
    label: '{typography.caption}'
    value: '{typography.key-figure}'
    meter-track: '{colors.neutral-subtle}'
    meter-fill: '{colors.accent}'
  step-nav-item-current:
    background: '{colors.accent-subtle}'
    foreground: '{colors.accent-strong}'
    indicator: '3px bar {colors.accent}'
    number-fill: '{colors.accent}'
  step-nav-item-done:
    number-fill: '{colors.good}'
    number-foreground: '{colors.on-accent}'
  step-nav-item-upcoming:
    number-border: '1px solid {colors.ink-disabled}'
    foreground: '{colors.ink-body-muted}'
  card:
    background: '{colors.surface-card}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.lg}'
    padding: '16px 18px'
    shadow: '0 1px 2px rgba(0,0,0,.04)'
  number-field:
    border: '1px solid {colors.border-control}'
    underline: '2px solid {colors.accent}'
    underline-error: '2px solid {colors.bad}'
    radius: '{rounded.sm}'
    typography: '{typography.number}'
  slider:
    track: '{colors.track}'
    fill: '{colors.accent}'
    fill-error: '{colors.bad}'
    thumb: '20px {colors.surface-card} ring, 12px {colors.accent} core'
  radio:
    ring: '{colors.track}'
    selected: '5px {colors.accent} ring'
  consequence-table:
    header: '{typography.caption} {colors.ink-secondary}'
    row-rule: '1px solid {colors.border-row}'
    value: '{typography.number}'
    row-error-foreground: '{colors.bad-text}'
  badge-ok:
    background: '{colors.good-subtle}'
    foreground: '{colors.good}'
    radius: '{rounded.sm}'
  badge-warn:
    background: '{colors.warning-subtle}'
    foreground: '{colors.warning-text}'
    radius: '{rounded.sm}'
  badge-bad:
    background: '{colors.bad-subtle}'
    foreground: '{colors.bad-text}'
    radius: '{rounded.sm}'
  badge-neutral:
    background: '{colors.neutral-subtle}'
    foreground: '{colors.ink-body-muted}'
    radius: '{rounded.sm}'
  infobar-error:
    background: '{colors.bad-subtle}'
    border: '1px solid {colors.bad-border}'
    icon: '{colors.bad}'
    radius: '{rounded.sm}'
  infobar-warning:
    background: '{colors.warning-subtle}'
    border: '1px solid {colors.warning}'
    icon: '{colors.warning}'
    radius: '{rounded.sm}'
  view-3d-card:
    background: 'gradient {colors.view-sky} to {colors.view-plot}'
    header: '{typography.card-title}'
    footer: '{typography.caption}'
    radius: '{rounded.lg}'
    limit-line: '1px dashed {colors.warning}'
    limit-line-breached: '1.5px dashed {colors.bad}'
  adviser-window:
    background: '{colors.surface-card}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.lg}'
    width: '{spacing.adviser-width}'
    shadow: '0 8px 24px rgba(0,0,0,.16)'
  adviser-avatar:
    size: '34px'
    radius: '{rounded.full}'
    fallback-background: '{colors.accent}'
  adviser-message:
    background: '{colors.surface-sunken}'
    radius: '{rounded.md}'
    basis-line: '{typography.caption} {colors.ink-secondary}'
  adviser-message-warning:
    background: '{colors.bad-subtle}'
    border-left: '3px solid {colors.bad}'
    radius: '{rounded.md}'
  chip:
    background: '{colors.surface-bar}'
    foreground: '{colors.accent-strong}'
    border: '1px solid {colors.border-control}'
    radius: '{rounded.sm}'
    typography: '{typography.caption}'
  path-card:
    background: '{colors.surface-card}'
    border: '1px solid {colors.border-subtle}'
    radius: '{rounded.lg}'
  gantt-bar-plan:
    fill: '{colors.accent-subtle}'
    border: '1px solid {colors.accent}'
  gantt-bar-actual:
    fill: '{colors.accent}'
  gantt-bar-late:
    fill: '{colors.bad}'
  gantt-critical:
    marker: '2px {colors.accent-strong} outline'
  bridge-bar-increase:
    fill: '{colors.bad}'
  bridge-bar-decrease:
    fill: '{colors.good}'
  bridge-bar-total:
    fill: '{colors.ink-secondary}'
---

## Brand & Style

*Fra tomt til tak* looks like a piece of calm, professional project software that happens to contain a living building. The student is cast as a project manager, so the surface borrows the posture of the tools a project manager would trust: a light background, a fixed grid, key-figure cards with tabular numbers, forms and consequence tables. Seriousness and credibility come from that restraint.

The game feel does not come from decoration. It comes from three things: the 3D view, which answers every choice at once; the adviser, "Rådgiver", who has a face and talks to the student; and numbers that move the moment a choice is made. Everything else stays quiet so those three can carry the energy.

The style is Fluent-sober and continues v0.5's Fluent colours (accent, good, bad) while dropping v0.5's glass panels over a full-screen 3D scene. [ASSUMPTION: the memlog's earlier "keep the glass panels" decision is superseded by the later choice of direction 2, which places the 3D view in its own framed card; glass had a contrast risk over the scene.]

Light mode only. [ASSUMPTION: no dark mode in v1; v0.5's dark accent `#60cdff` is not used.]

## Colors

- **Surfaces.** `{colors.surface-app}` is the canvas; cards sit on it in `{colors.surface-card}` with a `{colors.border-subtle}` hairline. The top bar (`{colors.surface-bar}`) and the step rail (`{colors.surface-nav}`) are one shade off the canvas so the frame reads as frame and the cards read as content.
- **Ink.** `{colors.ink-primary}` for all text and figures; `{colors.ink-secondary}` for labels, units, captions and the adviser's "Grunnlag" line. Both pass AA on white and on `{colors.surface-app}`.
- **Accent (`{colors.accent}`).** Means "this is interactive or current": primary buttons, the current step, slider fill, selected radio, number-field underline, meter fill, focus ring. `{colors.accent-strong}` is the text colour on accent-tinted fills. Never used for status.
- **Status colours** carry the result bands and nothing else:
  - `good` / `good-subtle` — on target (*På mål*), completed step, cost reductions in the budget bridge, met milestones.
  - `warning` / `warning-subtle` — slightly over (*Litt over*), non-blocking warnings, the zoning limit line in the 3D view before it is breached.
  - `bad` / `bad-subtle` — clearly over (*Klart over*), blocking warnings, breached limits, late portions in the Gantt chart, cost increases in the budget bridge.
- **3D palette.** Desaturated blues for the building and a pale green plot so the model sits calmly inside the card; status colours are painted onto the model only to show a problem (for example the floor above the height limit in `{colors.bad}`).

Avoid: gradients outside the 3D card, decorative use of status colours, more than one accent, colour as the only carrier of meaning (every status colour is paired with a text label).

## Typography

One family: Segoe UI Variable, falling back to Segoe UI and system-ui, matching Fluent and v0.5.

- `{typography.display}` (28 px) — only for the site-office meeting heading and the debrief result headline. [ASSUMPTION]
- `{typography.title}` (22 px) — the current step or surface name ("Konsept", "Uke 34", "Oppsummering").
- `{typography.card-title}` (14 px semibold) — card headers, button labels.
- `{typography.body}` (14 px) — forms, tables, adviser messages.
- `{typography.caption}` (12 px) — labels, units, the adviser's basis line, 3D footer figures. Never smaller than 12 px.
- `{typography.key-figure}` (20 px semibold, tabular) — values in the key-figure cards.

All figures use tabular numerals so columns line up and moving numbers do not jitter. Norwegian number formatting throughout (decimal comma, space as thousands separator, "MNOK", "uke 67").

## Layout & Spacing

4-based scale (`{spacing.1}` to `{spacing.8}`). Card padding 16–18 px; gaps between cards `{spacing.4}`.

The frame is fixed across all stages:

1. **Top bar** (full width) — project name and stage on the left, then key-figure cards for the targets, then warning count and decision log on the right. Always visible.
2. **Step rail** (`{spacing.nav-width}`, left) — where the student is. In stage 1 it lists the steps; in stages 2 and 3 its content changes (see EXPERIENCE.md).
3. **Main area** — a two-column grid: a form/decision column of `{spacing.form-column}` and a flexible column holding the 3D card. The consequence card sits under the form.
4. **Adviser window** (`{spacing.adviser-width}`) — anchored to the bottom-right corner, `{spacing.adviser-inset}` from the edges.

The main grid reserves the adviser's footprint in the bottom-right so the adviser never covers the consequence table, a primary button or the targets. [ASSUMPTION: in the direction mock the adviser overlapped the 3D card; the spine requires a reserved zone instead.]

Minimum supported viewport 1280 × 720; content max width 1440 px, centred above that. [ASSUMPTION]

## Elevation & Depth

Flat by default. Cards carry only a near-invisible shadow (`0 1px 2px rgba(0,0,0,.04)`) plus their border. The adviser window is the single floating element and has the only real shadow (`0 8px 24px rgba(0,0,0,.16)`), which tells the student it lives above the page and stays there. Dialogs (plan approval) use the same shadow over a 40 % black scrim. [ASSUMPTION]

## Shapes

Small, tool-like corners: `{rounded.sm}` (4 px) for anything you press or type into, `{rounded.lg}` (8 px) for containers. `{rounded.full}` only for the adviser's face, step numbers and the slider thumb. No pills for buttons.

## Components

- **Key-figure card** — label (caption, secondary), value in `{typography.key-figure}` with the target in smaller secondary text ("150,4 / 171 MNOK"), a 4 px meter, and a band badge when a result exists. The meter fill takes the band colour when the value is past the target.
- **Step-rail item** — numbered circle + label + optional caption ("Pågår · ca. 3 min"). Current: `{colors.accent-subtle}` fill, 3 px accent bar on the left, filled accent number. Done: green number with a check. Upcoming: outlined number.
- **Form controls** — Fluent-style slider with tick labels under it (current tick bold in `{colors.accent-strong}`), number field with an accent underline (red underline in error), radio list with row rules and an optional right-aligned note.
- **Consequence table** — two columns (post, value), right-aligned tabular values, an inline band badge after a value that is compared with a target. An offending row turns `{colors.bad-text}`.
- **Primary action row** — primary button ("Neste: Tidsplan") left of a secondary "Tilbake". Disabled primary uses `button-disabled` and is always accompanied by a visible reason.
- **InfoBar** — Fluent InfoBar at the top of the form card: icon, bold lead ("Over høydegrensen."), one sentence. `infobar-error` for blocking problems, `infobar-warning` for advice the student may override. [ASSUMPTION: the memlog names the Fluent error banner for warnings; the yellow variant for non-blocking warnings is inferred so that a red banner always means "cannot continue".]
- **3D card** — header (title + live description, e.g. "7 etasjer · stål · fotavtrykk 329 m²", or a band badge), the canvas, and a footer of 2–3 key measures. The zoning height limit is drawn as a dashed line labelled "grense"; a dimension line in `{colors.accent}` shows the building height.
- **Adviser window** — header with face, name "Rådgiver" and a status caption ("Forslag", "Varsel", "Forberedte svar"); a message list; 3–5 chips with suggested questions; a free-text input with a primary "Send" button. No minimise or close controls. Warning messages use `adviser-message-warning`. Every message ends in a caption-sized "Grunnlag: …" line. The face is a simple illustrated portrait, with the initial "R" on accent as fallback. [ASSUMPTION: illustration style is not yet chosen.]
- **Event card (stage 2)** — a card in the form column: what happened (title + 1–2 sentences), then 2–4 option rows. Each option shows "nå", "senere" and a one-line delta ("+2 uker · +1,7 MNOK", tabular). The option Rådgiver recommends carries a small `badge-neutral` "Rådgiver anbefaler". [ASSUMPTION]
- **Path comparison** — two `path-card`s side by side, "Din vei" and "AI-veien", each with completion week and final cost against the targets and a band badge.
- **Gantt chart** — six main-part rows; planned bars as accent-outlined light bars, actual bars in accent, the late portion in `{colors.bad}`, the critical path marked with an `{colors.accent-strong}` outline and the label "kritisk linje". Target week as a vertical dashed line; milestones as diamonds.
- **Budget bridge** — waterfall from target cost to final cost: four cause bars in the fixed FR-24 order, increases in `{colors.bad}`, decreases in `{colors.good}`, start and end totals in `{colors.ink-secondary}`, each labelled with its MNOK value. The reserve is a separate line below the chart, not a bar.
- **Chip** — 12 px, accent-strong text on a near-white fill, `{rounded.sm}`. Used only for suggested questions.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Keep the targets visible in the top bar on every screen | Hide targets behind a tab or tooltip |
| Use status colours only for bands, warnings and limits, always with a text label | Use red or green decoratively or as the only signal |
| Use tabular numerals and Norwegian formatting for every figure | Mix decimal points and commas, or show unformatted raw numbers |
| Keep the 3D view inside its framed card | Lay UI panels over the 3D scene (the v0.5 glass HUD) |
| Show a reason next to every disabled primary button | Disable "Neste" silently |
| Keep the adviser window open and unobstructed in its corner | Add minimise/close controls, or let it cover figures or buttons |
| Reserve `display` type for the meeting and the debrief headline | Use large type for ordinary step titles |
