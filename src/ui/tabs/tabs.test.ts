// The tab renderers return HTML strings, so they are tested without a DOM.
import manifest from '../../../assets/icons/manifest.json';
import { describe, expect, it } from 'vitest';
import { scenario } from '../../engine/scenario';
import { choose, findStory, forecast, newGame, pmPlan, runUntilDecision, setCrew, setMode, step, triggerEvent } from '../../engine/game';
import { dialogFor, noteForecastChange, renderEvent, renderFeed, renderFinal, renderFork } from '../play';
import { newStory } from '../story';
import { aiPath } from '../../engine/game';
import { formatInt, formatMnok } from '../format';
import { simulate } from '../../engine/simulate';
import { budgetOf } from '../budgetLines';
import { ganttSvg } from '../gantt';
import { renderBudget } from './budget';
import { renderBuildings } from './buildings';
import type { TabContext } from './context';
import { renderDisciplines } from './disciplines';
import { renderPeople } from './people';
import { renderSchedule } from './schedule';

const baseline = simulate(scenario);
const ctx = (modes: TabContext['modes'] = {}): TabContext =>
  ({ scenario, modes, result: simulate(scenario, modes), baseline });
const count = (html: string, s: string) => html.split(s).length - 1;

describe('Budsjett', () => {
  it('F overtime: total 282,52, 111 weeks and 95 weeks of site overhead', () => {
    const html = renderBudget(ctx({ F: 'overtime' }));
    expect(html).toContain('<b>282,52</b>');
    expect(html).toContain('<b>111</b>');
    expect(html).toContain('Rigg og drift (95 uker × 0,45)');
  });

  it('leaves the Δ cell empty for rows that did not change', () => {
    const html = renderBudget(ctx({ F: 'overtime' }));
    expect(count(html, '<td class="num delta">+')).toBe(2); // F row and Sum disipliner
  });

  it('shown lines add up to the shown sums and total', () => {
    // F + H on overtime both have half-øre labour (16.065, 13.608), which used to drift.
    for (const modes of [{}, { F: 'overtime' }, { F: 'overtime', H: 'overtime' }, { C: 'overtime', F: 'overtime', H: 'overtime', I: 'overtime' }] as const) {
      const b = budgetOf(simulate(scenario, modes));
      const cents = (x: number) => Math.round(x * 100);
      expect(cents(b.labour)).toBe(b.lines.reduce((a, l) => a + cents(l.labour), 0));
      expect(cents(b.materials)).toBe(b.lines.reduce((a, l) => a + cents(l.materials), 0));
      expect(cents(b.tasks)).toBe(cents(b.labour) + cents(b.materials));
      expect(cents(b.total)).toBe(cents(b.tasks) + cents(b.overhead));
    }
  });
});

describe('Disiplinene', () => {
  it('marks the selected mode as pressed', () => {
    const html = renderDisciplines(ctx({ F: 'hire' }));
    expect(html).toContain('data-task="F" data-mode="hire" aria-pressed="true"');
    expect(html).toContain('data-task="F" data-mode="normal" aria-pressed="false"');
  });

  it('shows the crew control with the share of the base crew', () => {
    const game = newGame(scenario, 'easy', 1, { randomEvents: false });
    setCrew(scenario, game, 'F', 24);
    const html = renderDisciplines({ ...ctx(), game, result: forecast(scenario, game) });
    expect(html).toContain('<b>24</b> <small>71 %</small>');
    expect(html).toContain('class="crew under"');
  });
});

describe('Menneskene (org chart)', () => {
  it('shows all 17 people as nodes', () => {
    expect(count(renderPeople(ctx()), 'data-person=')).toBe(17);
  });

  it('Elisabeth, Hedda and Oskar report to the owner; the foremen to Elisabeth or Hedda', () => {
    const direct = scenario.people.filter(p => p.reportsTo === 'owner').map(p => p.name);
    expect(direct).toEqual(['Elisabeth', 'Hedda', 'Oskar']);
    const foremen = scenario.people.filter(p => p.taskId);
    expect(foremen.every(p => p.reportsTo === 'pm' || p.reportsTo === 'site')).toBe(true);
    expect(scenario.people.filter(p => p.player).map(p => p.role)).toEqual(['Prosjekteier']);
  });

  it('shows details and crew controls for a selected foreman', () => {
    const game = newGame(scenario, 'easy', 1, { randomEvents: false });
    const html = renderPeople({ ...ctx(), game, selected: 'foreman-F' });
    expect(html).toContain('data-person="foreman-F" aria-pressed="true"');
    expect(html).toContain('data-crew-task="F"');
    expect(html).toContain('rapporterer til Hedda');
    expect(html).toContain('<h2>Formann Råbygg</h2>');
  });
});

describe('Byggene', () => {
  it('marks A-blokka and Kjelleranlegget as in the simulation', () => {
    const html = renderBuildings(ctx());
    expect(count(html, 'I simulering')).toBe(2);
    expect(count(html, 'Ikke i scenarioet')).toBe(scenario.buildings.length - 2);
  });
});

describe('Fremdriftsplan', () => {
  it('shows 111 weeks for F overtime and lists critical tasks', () => {
    const html = renderSchedule(ctx({ F: 'overtime' }));
    expect(html).toContain('<b>111 uker</b>');
    expect(html).toContain('Kritiske aktiviteter: A, C, D, E, F, G, I, J, N.');
  });

  it('puts the milestone at the finish week and outlines only changed tasks', () => {
    const svg = ganttSvg(scenario, simulate(scenario, { H: 'hire' }), baseline);
    // x(week) = 230 + week × 6 → week 114 = 914.
    expect(svg).toContain('<path d="M914 ');
    expect(count(svg, 'class="g-ghost"')).toBe(1);

    const shifted = ganttSvg(scenario, simulate(scenario, { F: 'overtime' }), baseline);
    // F is shorter; G, O, H, I, K, J, N only move. All 8 get an outline.
    expect(count(shifted, 'class="g-ghost"')).toBe(8);
  });
});

describe('icons', () => {
  it('every icon path used by the scenario exists in the icon manifest', () => {
    const files = new Set(manifest.map(m => m.file));
    const used = [...scenario.tasks.map(t => t.icon), ...scenario.people.map(p => p.icon), ...scenario.buildings.map(b => b.icon)];
    expect(used.filter(u => !files.has(u))).toEqual([]);
  });
});

describe('review follow-ups (v0.2)', () => {
  const waterGame = () => {
    const g = newGame(scenario, 'easy', 1, { randomEvents: false });
    while (g.week < 40) step(scenario, g);
    triggerEvent(scenario, g, 'water');
    choose(scenario, g, 'pump');
    return g;
  };

  it('Budsjett includes event costs in the lines and the total', () => {
    const game = waterGame();
    const result = forecast(scenario, game);
    const b = budgetOf(result);
    const cents = (x: number) => Math.round(x * 100);
    expect(cents(b.total)).toBe(cents(b.tasks) + cents(b.overhead) + cents(b.events));
    const html = renderBudget({ ...ctx(), game, result });
    expect(html).toContain('<td>Hendelser og tiltak</td><td></td><td></td><td class="num">0,80</td>');
    expect(html).toContain('<b>284,80</b>');
  });

  it('final report shows headline, week and cost difference', () => {
    const g = newGame(scenario, 'easy', 1, { randomEvents: false });
    setCrew(scenario, g, 'F', 24);
    runUntilDecision(scenario, g);
    const html = renderFinal(scenario, g);
    expect(html).toContain('Over budsjett og forsinket');
    expect(html).toContain('<b>uke 123</b><small>9 uker for sent</small>');
    expect(html).toContain('+4,05 mot mål 283,10');
  });

  it('Gantt shows done parts up to the current week and a today line', () => {
    const game = waterGame();
    const svg = ganttSvg(scenario, forecast(scenario, game), baseline, game.week);
    // A, C, D are done and E is in progress at week 40: four done overlays.
    expect(count(svg, 'class="g-done"')).toBe(4);
    expect(svg).toContain(`<line x1="${230 + 40 * 6}"`);
  });

  it('foreman details show hired workers and the active challenge', () => {
    const game = newGame(scenario, 'easy', 1, { randomEvents: false });
    setMode(scenario, game, 'F', 'hire');
    const html = renderPeople({ ...ctx(), game, result: forecast(scenario, game), selected: 'foreman-F' });
    expect(html).toContain('+ 17 innleid');
    while (game.week < 40) step(scenario, game);
    triggerEvent(scenario, game, 'water');
    const site = renderPeople({ ...ctx(), game, result: forecast(scenario, game), selected: 'site' });
    expect(site).toContain('Aktiv utfordring');
    expect(site).toContain('Vann i kjeller');
  });
});

describe('dilemmas, PM plan and story (v0.2)', () => {
  it('the event dialog shows the dilemma line', () => {
    const g = newGame(scenario, 'easy', 1, { randomEvents: false });
    while (g.week < 40) step(scenario, g);
    triggerEvent(scenario, g, 'water');
    expect(renderEvent(scenario, g)).toContain('<p class="dilemma">Dilemma: «Lei midlertidig pumpe» er billigst');
  });

  it('Disiplinene offers the project manager plan with a button', () => {
    const game = newGame(scenario, 'easy', 1, { randomEvents: false });
    const plan = pmPlan(scenario, game);
    const html = renderDisciplines({ ...ctx(), game, result: forecast(scenario, game), plan });
    expect(html).toContain('Elisabeth foreslår:');
    expect(html).toContain('data-action="pm-plan"');
  });

  it('the final report tells how the story could be solved', () => {
    const story = findStory(scenario, 'medium', 2024);
    const g = newGame(scenario, 'medium', story.seed, { randomEvents: false });
    runUntilDecision(scenario, g);
    const html = renderFinal(scenario, g, story);
    expect(html).toContain('Historiens løsning');
    expect(html).toContain('Elisabeth bemanner');
    expect(html).toContain(`uke ${story.weeks}`);
  });
});

describe('v0.3 renderers: decision dialog, fork card, feed, final report, routing', () => {
  const at = (week: number, eventId: string) => {
    const g = newGame(scenario, 'easy', 1, { randomEvents: false });
    while (g.week < week) step(scenario, g);
    triggerEvent(scenario, g, eventId);
    return g;
  };

  it("the dialog shows the kind, Elisabeth's and Hedda's proposals (the foreman's only as input) and a preview for every option", () => {
    const g = at(40, 'water');
    const html = renderEvent(scenario, g);
    expect(html).toContain('<span class="chip kind kind-risk">Risiko</span>');
    expect(count(html, 'class="voice official"') + count(html, 'class="voice"')).toBe(2);
    expect(count(html, 'class="voice-pick"')).toBe(2);
    expect(html).toContain('<b>Hedda</b> <span class="chip">meldte saken</span>');
    expect(html).toContain('Formann Betong ga Elisabeth og Hedda sitt innspill');
    expect(html).not.toContain('<b>Formann Betong</b>');
    // The foreman's pick (the cheapest now) is not shown to the player.
    expect(html).not.toContain('Anbefaler «Lei midlertidig pumpe»');
    expect(html).toContain('Anbefaler «Installer fast pumpe»');
    // Every option shows its forecast and Δ against today's forecast; the recommended one is also marked.
    for (const o of g.pending!.outcomes) expect(html).toContain(`uke <b>${o.weeks}</b>`);
    expect(html).toContain(`<b>${formatMnok(g.pending!.outcomes[0].total)}</b> MNOK`);
    expect(count(html, '<span class="chip chip-on">anbefalt</span>')).toBe(1);
    expect(count(html, 'mot i dag</em>')).toBe(3);
    // Today 114 weeks / 283.10. Pump: +2 weeks, 0.8 + 2 × 0.45. Rent: +4 weeks, 0.3 + 4 × 0.45.
    expect(html).toContain('<em class="delta">Δ +2 uker, +1,70 MNOK mot i dag</em><span class="chip chip-on">anbefalt</span>');
    expect(html).toContain('<em class="delta">Δ +4 uker, +2,10 MNOK mot i dag</em>');
    expect(html).toContain('Prognose i dag:');
  });

  it('a change request shows what deferring costs later', () => {
    const html = renderEvent(scenario, at(55, 'change-security'));
    expect(html).toContain('Endringsønske</span>');
    expect(html).toContain('<i>Senere:</i> Om 30 uker: +2,40 MNOK, K står 1 uke. Sikringen må bygges inn i ferdige vegger.');
    expect(html).toContain('<i>Nå:</i> +1,40 MNOK · F står 1 uke');
  });

  it('a strategy choice shows the work change', () => {
    const g = newGame(scenario, 'easy', 4);
    runUntilDecision(scenario, g);
    const html = renderEvent(scenario, g);
    expect(html).toContain('Strategivalg</span>');
    expect(html).toContain('−25 % timer igjen på C');
    expect(html).toContain('<b>Elisabeth</b> <span class="chip">meldte saken</span>');
  });

  it('the fork card: two columns and Δ when the player differs; one column when followed', () => {
    const g = at(40, 'water');
    choose(scenario, g, 'wait');
    const html = renderFork(scenario, g.decisions[0]);
    expect(count(html, 'class="fork-col"')).toBe(2);
    expect(html).toContain('Elisabeths anbefaling');
    expect(html).toContain('Ditt valg gir +4 uker, +2,20 MNOK mot anbefalingen.');
    expect(html).toContain('data-action="fork-continue"');
    const same = at(40, 'water');
    choose(scenario, same, 'pump');
    const one = renderFork(scenario, same.decisions[0]);
    expect(one).toContain('Du fulgte anbefalingen.');
    expect(count(one, 'class="fork-col"')).toBe(1);
  });

  it('the feed shows messages from the roles with the week, newest first, and the chapter', () => {
    expect(renderFeed(scenario, undefined)).toContain('kommer her når spillet starter');
    const g = newGame(scenario, 'easy', 1, { randomEvents: false });
    while (g.week < 20) step(scenario, g);
    const html = renderFeed(scenario, g);
    expect(html).toContain('Kapittel: <b>Grunnarbeid</b>');
    expect(html).toContain('<b>Formann Sprengning</b> <small>Uke 16</small><p>C Sprengning og graving starter.</p>');
    expect(html.indexOf('Kapittel 1')).toBeLessThan(html.indexOf('Velkommen'));
    // The header reads the latest chapter announced, not the task state.
    g.chapter = 4;
    expect(renderFeed(scenario, g)).toContain('Kapittel: <b>Teknikk og innredning</b>');
    g.chapter = -1;
    expect(renderFeed(scenario, g)).toContain('Prolog: prosjektering');
  });

  it('forecast-change messages: add, merge from the first baseline, remove, or nothing', () => {
    const base = { weeks: 114, total: 283.1 };
    const start = [{ week: 10, text: 'x', from: 'site' }];
    const none = noteForecastChange(start, 20, base, base, null);
    expect(none.log).toBe(start);
    const one = noteForecastChange(start, 20, base, { weeks: 111, total: 282.515 }, null);
    expect(one.log).toHaveLength(2);
    expect(one.log[1]).toEqual({ week: 20, from: 'pm', text: 'Prognosen er endret: uke 114 → 111, 283,10 → 282,52 MNOK.' });
    const two = noteForecastChange(one.log, 20, { weeks: 111, total: 282.515 }, { weeks: 108, total: 282.95 }, one.note);
    expect(two.log).toHaveLength(2);
    expect(two.log[1].text).toBe('Prognosen er endret: uke 114 → 108, 283,10 → 282,95 MNOK.');
    const back = noteForecastChange(two.log, 20, { weeks: 108, total: 282.95 }, base, two.note);
    expect(back.log).toEqual(start);
    expect(back.note).toBeNull();
  });

  it('Disiplinene and Menneskene use the game total hours when a strategy changed them', () => {
    const game = newGame(scenario, 'easy', 1, { randomEvents: false });
    while (game.week < 55) step(scenario, game); // F: 5 weeks × 1,275 h = 6,375 h done
    const F = game.tasks.find(t => t.id === 'F')!;
    F.work = 17850; // after prefab (25,500 × 0.7)
    const result = forecast(scenario, game);
    const share = Math.round((6375 / 17850) * 100); // 36 %
    const disc = renderDisciplines({ ...ctx(), game, result });
    expect(disc).toContain(`<td class="num">${formatInt(17850)}</td>`);
    expect(disc).toContain(`title="${share} %"><i style="width:${share}%"></i>`);
    const people = renderPeople({ ...ctx(), game, result, selected: 'foreman-F' });
    expect(people).toMatch(new RegExp(`data-person="foreman-F"[^]*?<div class="progress" aria-hidden="true"><i style="width:${share}%"></i></div>`));
    expect(people).toContain(`${share} % ferdig.`);
  });

  it('the final report: player vs AI path vs story, and every decision with its Δ', () => {
    const story = findStory(scenario, 'medium', 2024);
    const g = newGame(scenario, 'medium', story.seed);
    while (!g.done) {
      runUntilDecision(scenario, g);
      if (g.pending) choose(scenario, g, g.pending.outcomes[g.pending.outcomes.length - 1].optionId);
    }
    const ai = aiPath(scenario, 'medium', story.seed);
    const html = renderFinal(scenario, g, story, ai);
    expect(html).toContain('<th scope="col">Du</th><th scope="col">AI-veien</th><th scope="col">Historiens løsning</th>');
    expect(html).toContain(`uke ${ai.weeks}`);
    expect(html).toContain(`${formatMnok(ai.total)} MNOK`);
    expect(html).toContain('Den kan møte andre hendelser enn du gjorde.');
    expect(count(html, '<li><b>Uke ')).toBe(g.decisions.length);
    expect(g.decisions.length).toBeGreaterThanOrEqual(4);
    const differed = g.decisions.find(d => !d.followed);
    if (differed) expect(html).toContain('· Δ ');
  });

  it('routing: start → walk to the foreman → meeting → fork (until Avslutt) → review → final', () => {
    const ui = { ...newStory(true), forkSeen: 0, finalSeen: false };
    expect(dialogFor(undefined, ui)).toBe('start');
    const g = at(40, 'water');
    ui.reviewed = g.chapter;
    // The decision waits on site until the player has walked to the foreman.
    expect(dialogFor(g, ui)).toBeNull();
    ui.meeting = true;
    expect(dialogFor(g, ui)).toBe('event');
    choose(scenario, g, 'pump');
    expect(dialogFor(g, ui)).toBe('fork');
    ui.forkSeen = g.decisions.length;
    ui.meeting = false;
    expect(dialogFor(g, ui)).toBeNull();
    // A new chapter opens a staffing review.
    while (g.chapter === ui.reviewed) step(scenario, g);
    expect(dialogFor(g, ui)).toBe('review');
    ui.reviewed = 99;
    runUntilDecision(scenario, g);
    expect(dialogFor(g, ui)).toBe('final');
    expect(dialogFor(g, { ...ui, finalSeen: true })).toBeNull();
    expect(dialogFor(g, { ...ui, finalSeen: true, talk: 'pm' })).toBe('talk');
  });

  it('routing in the intro: walking first, then the HMS check, then the start-up meeting', () => {
    const g = newGame(scenario, 'easy', 1);
    const ui = { ...newStory(), forkSeen: 0, finalSeen: false };
    expect(dialogFor(g, ui)).toBeNull();
    expect(dialogFor(g, { ...ui, hms: 'intro' })).toBe('hms');
    expect(dialogFor(g, { ...ui, phase: 'kickoff' as const })).toBe('kickoff');
  });

  it('Menneskene: every voice is alerted, shows its pick and reason, and its latest messages', () => {
    const game = at(40, 'water');
    const result = forecast(scenario, game);
    const tree = renderPeople({ ...ctx(), game, result, selected: 'foreman-E' });
    expect(count(tree, 'class="alert"')).toBe(3);
    // The foreman's view is input to Elisabeth and Hedda, not a recommendation to the player.
    expect(tree).toContain('Har gitt Elisabeth og Hedda sitt innspill');
    expect(tree).not.toContain('koster 0,30 MNOK nå');
    expect(renderPeople({ ...ctx(), game, result, selected: 'site' })).toContain('Anbefaler «Installer fast pumpe»');
    expect(tree).toContain('<h3>Siste meldinger</h3>');
    expect(tree).toContain('E Kjeller råbygg starter.');
  });
});
