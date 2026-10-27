import { describe, expect, it } from 'vitest';
import { forecast, newGame, step, triggerEvent } from '../engine/game';
import { scenario } from '../engine/scenario';
import { renderHms, renderKickoff, renderReview } from './scenes';
import { formatInt } from './format';
import { renderEvent } from './play';
import { foremanSpot, GATE_IN, OFFICE_MEET } from './scene/walk';
import { HMS_CHECKS, hmsDue, meetingLines, newStory, objectiveFor, ppeOf, reviewTasks, foremanPitch } from './story';

const at = (week: number, eventId: string) => {
  const g = newGame(scenario, 'easy', 1, { randomEvents: false });
  while (g.week < week) step(scenario, g);
  triggerEvent(scenario, g, eventId);
  return g;
};

describe('the story around the simulation', () => {
  it('names the people: Elisabeth, Hedda, Oskar and «Formann <fag>»', () => {
    const name = (id: string) => scenario.people.find(p => p.id === id)!.name;
    expect([name('pm'), name('site'), name('hms')]).toEqual(['Elisabeth', 'Hedda', 'Oskar']);
    expect([name('foreman-H'), name('foreman-I'), name('foreman-O')]).toEqual(['Formann VVS', 'Formann Elektro', 'Formann Heis']);
  });

  it('the intro: gate (Oskar), then the offices (Elisabeth), then nothing to walk to', () => {
    const g = newGame(scenario, 'easy', 1);
    const ui = newStory();
    expect(objectiveFor(scenario, g, ui)).toMatchObject({ id: 'hms', spot: GATE_IN });
    ui.hmsSeen = ['intro'];
    expect(objectiveFor(scenario, g, ui)).toMatchObject({ id: 'pm', spot: OFFICE_MEET });
    ui.phase = 'play';
    expect(objectiveFor(scenario, g, ui)).toBeNull();
  });

  it('an open challenge sends the player to the foreman of the task, until the meeting starts', () => {
    const g = at(40, 'water');
    const ui = newStory(true);
    const o = objectiveFor(scenario, g, ui)!;
    expect(o.id).toBe('foreman-E');
    expect(o.spot).toEqual(foremanSpot('E'));
    expect(o.text).toContain('Formann Betong har en utfordring');
    ui.meeting = true;
    expect(objectiveFor(scenario, g, ui)).toBeNull();
  });

  it("the meeting: who raised it, the dilemma, the foreman's input via Hedda, then Hedda's and Elisabeth's proposals", () => {
    const g = at(40, 'water');
    const lines = meetingLines(scenario, g);
    expect(lines.map(l => l.who)).toEqual(['foreman-E', 'site', 'pm', 'site', 'site', 'pm']);
    // The foreman's input goes to Elisabeth and Hedda; the player does not hear the foreman's pick.
    expect(lines[3].text).toContain('Formann Betong har gitt Elisabeth og meg sitt innspill');
    expect(lines[3].text).not.toContain('«');
    expect(lines[1].text).toContain('Grunnvann');
    expect(lines[2].text).toMatch(/^Dilemmaet er: /);
    expect(lines[5].text).toContain('Jeg anbefaler');
    // Each line in the panel, then the decision.
    expect(renderEvent(scenario, g, 0)).toContain('data-action="line-next"');
    expect(renderEvent(scenario, g, 0)).toContain('<b>Formann Betong</b>');
    expect(renderEvent(scenario, g, lines.length)).toContain('data-action="choose"');
  });

  it('HMS: at most two checks, glasses at the gate and ear defenders when the blasting starts', () => {
    expect(HMS_CHECKS.map(c => c.id)).toEqual(['intro', 'ground']);
    const ui = newStory();
    expect(ppeOf(ui)).toEqual(['helmet', 'vest', 'boots']);
    ui.hmsSeen = ['intro'];
    expect(ppeOf(ui)).toContain('glasses');
    expect(hmsDue(ui)).toBeNull(); // not before play
    ui.phase = 'play';
    ui.reviewed = 0;
    expect(hmsDue(ui)!.id).toBe('ground');
    ui.hmsSeen.push('ground');
    ui.reviewed = 5;
    expect(hmsDue(ui)).toBeNull();
    for (const c of HMS_CHECKS) expect(c.replies.some(r => r.scolded)).toBe(true);
  });

  it('the HMS check shows the missing item, then Oskar\'s answer and a stamp when told off', () => {
    const ui = { ...newStory(), hms: 'intro' };
    const open = renderHms(scenario, ui);
    expect(open).toContain('<li class="missing">✗ Vernebriller</li>');
    expect(open).toContain('data-action="hms-reply"');
    const told = renderHms(scenario, { ...ui, hmsReply: 'boss' });
    expect(told).toContain('Tilsnakk!');
    expect(told).toContain('data-action="hms-done"');
    expect(renderHms(scenario, { ...ui, hmsReply: 'sorry' })).not.toContain('Tilsnakk!');
  });

  it('the start-up meeting reviews every discipline with the foreman\'s estimate and the controls', () => {
    const g = newGame(scenario, 'easy', 1);
    const f = forecast(scenario, g);
    const html = renderKickoff(scenario, g, f, 99, []);
    for (const t of scenario.tasks) expect(html).toContain(`data-crew-task="${t.id}"`);
    expect(html).toContain('Formann VVS');
    expect(html).toContain(formatInt(21600));
    expect(html).toContain('data-action="kickoff-done"');
    expect(foremanPitch(scenario, g, f, 'F')).toBe('Kritisk linje: hver uke vi sparer, sparer hele prosjektet.');
    expect(foremanPitch(scenario, g, f, 'H')).toBe('Slakk: fart her gir ingenting.');
  });

  it('a chapter review brings the foremen of the new chapter', () => {
    const g = newGame(scenario, 'easy', 1, { randomEvents: false });
    while (g.chapter < 0) step(scenario, g);
    const ids = reviewTasks(scenario, g, { reviewed: -1 });
    expect(ids).toEqual(['C', 'D']);
    const html = renderReview(scenario, g, forecast(scenario, g), ids, 99, []);
    expect(html).toContain('Bemanningsmøte: Grunnarbeid');
    expect(html).toContain('data-action="review-done"');
  });
});
