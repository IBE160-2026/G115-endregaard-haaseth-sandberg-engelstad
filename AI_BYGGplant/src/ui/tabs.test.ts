import { describe, expect, it } from 'vitest';
import { DIALOGS, type DemoStep } from '../contract/fixtures';
import { addUser, applyTurn, highlightIds, newSession, type Session } from '../session';
import type { Building, Opening, Project } from '../types';
import { loftKind, renderBuilding, renderElevation, renderPlan, roofText } from './building';
import { ganttSvg, projectWeeks } from './gantt';
import { renderTab, TAB_CSS, TABS, type TabId } from './tabs';

const XSS = '<script>alert(1)</script>';


/** Every session state along every demo dialog: [label, session]. */
function sessions(dialogs: Record<string, DemoStep[]> = DIALOGS): [string, Session][] {
  const out: [string, Session][] = [];
  for (const [name, steps] of Object.entries(dialogs)) {
    let s = newSession();
    steps.forEach((step, i) => {
      s = applyTurn(addUser(s, step.user), step.turn);
      out.push([`${name}/${String(i + 1).padStart(2, '0')}`, s]);
    });
  }
  return out;
}

/** A copy of the dialogs with markup in every text field the AI writes. */
function hostile(): Record<string, DemoStep[]> {
  const copy = structuredClone(DIALOGS);
  for (const steps of Object.values(copy)) {
    for (const st of steps) {
      st.user = `${st.user} ${XSS}`;
      const t = st.turn;
      t.reply += XSS;
      t.changes = t.changes.map((c) => ({ ...c, text: c.text + XSS }));
      t.changes.push({ section: 'annet', text: XSS, ref_id: `"><script>x</script>` });
      const p = t.project;
      p.name += XSS;
      p.type += XSS;
      p.summary += XSS;
      p.facts = p.facts?.map((f) => ({ category: f.category + XSS, label: f.label + XSS, value: f.value + XSS })) ?? null;
      p.assumptions = p.assumptions?.map((a) => a + XSS) ?? null;
      if (p.building) {
        p.building.openings = p.building.openings.map((o) => ({ ...o, label: o.label + XSS }));
        if (p.building.exterior) p.building.exterior = { ...p.building.exterior, cladding: XSS, wall_color: XSS };
      }
      p.budget = p.budget?.map((l) => ({ ...l, post: l.post + XSS, description: l.description + XSS, sku: XSS })) ?? null;
      p.risks = p.risks?.map((r) => ({ ...r, title: r.title + XSS, consequence: XSS, measure: XSS })) ?? null;
      p.schedule = p.schedule?.map((k) => ({ ...k, name: k.name + XSS })) ?? null;
    }
  }
  return copy;
}

/** The ids of every element with the class "glow". */
function glowIds(html: string): Set<string> {
  const ids = new Set<string>();
  for (const m of html.matchAll(/<[a-z]+\s[^>]*class="([^"]*)"[^>]*>/g)) {
    if (!m[1].split(/\s+/).includes('glow')) continue;
    const id = /data-(?:id|unplaced)="([^"]*)"/.exec(m[0]);
    ids.add(id ? id[1] : '(glow without an id)');
  }
  return ids;
}

const idsFor = (tab: TabId, p: Project): string[] => {
  switch (tab) {
    case 'tegning':
      return p.building.openings.map((o) => o.id);
    case 'budsjett':
      return p.budget.map((l) => l.id);
    case 'fremdrift':
      return p.schedule.map((t) => t.id);
    case 'risiko':
      return p.risks.map((r) => r.id);
    default:
      return [];
  }
};

const BAD = /\b(NaN|undefined|null|Infinity)\b|\[object Object\]/;

describe('fixtures exist', () => {
  it('has at least one dialog with steps', () => {
    expect(sessions().length).toBeGreaterThan(0);
  });
});

describe('renderTab over every fixture step', () => {
  const all = [['tom', newSession()] as [string, Session], ...sessions()];
  for (const [label, s] of all) {
    for (const t of TABS) {
      it(`${label} · ${t.id}: renders clean HTML`, () => {
        const html = renderTab(t.id, s, highlightIds(s));
        expect(html.length).toBeGreaterThan(20);
        expect(html).not.toMatch(BAD);
      });
    }
  }
});

describe('escaping', () => {
  for (const [label, s] of sessions(hostile())) {
    it(`${label}: no AI text becomes markup`, () => {
      const every = new Set([...idsFor('tegning', s.project), ...idsFor('budsjett', s.project), ...idsFor('risiko', s.project), ...idsFor('fremdrift', s.project)]);
      for (const t of TABS) {
        const html = renderTab(t.id, s, every);
        expect(html).not.toContain('<script');
        expect(html).not.toMatch(/"><script/);
      }
    });
  }
});

describe('glow', () => {
  for (const [label, s] of sessions()) {
    it(`${label}: the newest turn's ids glow, and only those`, () => {
      const h = highlightIds(s);
      for (const t of TABS) {
        const expected = idsFor(t.id, s.project).filter((id) => h.has(id));
        expect([...glowIds(renderTab(t.id, s, h))].sort(), t.id).toEqual([...new Set(expected)].sort());
      }
    });
    it(`${label}: every item glows when every id is highlighted; none when empty`, () => {
      for (const t of TABS) {
        const ids = idsFor(t.id, s.project);
        expect([...glowIds(renderTab(t.id, s, new Set(ids)))].sort(), t.id).toEqual([...new Set(ids)].sort());
        expect(glowIds(renderTab(t.id, s, new Set())).size).toBe(0);
      }
    });
  }
  it('TAB_CSS defines the glow class with an animation', () => {
    expect(TAB_CSS).toMatch(/\.glow[^{]*\{[^}]*animation/);
    expect(TAB_CSS).toContain('@keyframes');
  });
});


describe('garage fixtures with budget, schedule and risks', () => {
  const full = sessions().filter(([l, s]) => l.startsWith('garage') && s.project.budget.length && s.project.schedule.length && s.project.risks.length);
  it('the demo reaches a full project (fixture 05 on)', () => {
    expect(full.length).toBeGreaterThan(0);
  });
  for (const [label, s] of full) {
    it(`${label}: risks høy → lav, one SKU chip per SKU line, range, connectors`, () => {
      const order = ['hoy', 'middels', 'lav'];
      const html = renderTab('risiko', s, new Set());
      const shown = [...html.matchAll(/class="level level-([a-z]+)"/g)].map((m) => order.indexOf(m[1]));
      expect(shown).toEqual([...shown].sort((a, b) => a - b));
      const budget = renderTab('budsjett', s, new Set());
      expect((budget.match(/class="tb-sku"/g) ?? []).length).toBe(s.project.budget.filter((l) => l.sku).length);
      expect(budget).toMatch(/kr – .*kr/);
      const deps = s.project.schedule.flatMap((t) => t.depends_on.filter((d) => s.project.schedule.some((x) => x.id === d)));
      expect((renderTab('fremdrift', s, new Set()).match(/class="gt-link"/g) ?? []).length).toBe(deps.length);
    });
  }
});

describe('Endringer', () => {
  const withLog = sessions().filter(([, s]) => s.log.length > 0);
  it('lists turns newest first, with section chips and ref buttons', () => {
    const [, s] = withLog.at(-1)!;
    const html = renderTab('endringer', s, new Set());
    const turns = [...html.matchAll(/Runde (\d+)/g)].map((m) => Number(m[1]));
    expect(turns).toEqual([...turns].sort((a, b) => b - a));
    expect(turns[0]).toBe(s.log.length);
    for (const c of s.log.flatMap((e) => e.changes)) {
      if (c.ref_id) expect(html).toContain(`data-ref="${c.ref_id}"`);
    }
    expect(html).toContain('tb-sec');
  });
  it('shows a hint when there is no log', () => {
    expect(renderTab('endringer', newSession(), new Set())).toContain('class="empty"');
  });
});

// ---- the drawing ----

const opening = (o: Partial<Opening>): Opening => ({
  id: 'o1',
  kind: 'vindu',
  label: 'Vindu',
  width_m: 1,
  height_m: 1,
  wall: 'front',
  floor: 1,
  offset_m: 1.5,
  sill_m: 0.9,
  ...o,
});

const building = (b: Partial<Building> = {}): Building => ({
  length_m: 8,
  width_m: 7,
  floors: 1,
  floor_height_m: 2.5,
  roof: { kind: 'saltak', pitch_deg: 35, ridge_along: 'lengde', overhang_m: 0.4 },
  exterior: null,
  terrain_slope_pct: 0,
  openings: [],
  ...b,
});

const svgs = (html: string) => html.match(/<svg[\s\S]*?<\/svg>/g) ?? [];

describe('renderBuilding', () => {
  it('lists an opening without offset or sill under «Ikke plassert ennå» and does not draw it', () => {
    const b = building({
      openings: [opening({ id: 'placed' }), opening({ id: 'loose', label: 'Løst vindu', offset_m: null }), opening({ id: 'nosill', sill_m: null, wall: 'bak' })],
    });
    const html = renderBuilding(b, new Set());
    expect(html).toContain('Ikke plassert ennå');
    expect(html).toContain('data-unplaced="loose"');
    expect(html).toContain('data-unplaced="nosill"');
    expect(html).not.toContain('data-unplaced="placed"');
    const drawn = svgs(html).join('');
    expect(drawn).toContain('data-id="placed"');
    expect(drawn).not.toContain('data-id="loose"');
    expect(drawn).not.toContain('data-id="nosill"');
  });

  it('places an opening exactly at offset_m and shows the chain dimension', () => {
    const svg = renderElevation(building({ openings: [opening({ offset_m: 1.5, width_m: 2 })] }), 'front')!;
    // The chain: 1,5 | 2 | 4,5 along an 8 m wall.
    expect(svg).toContain('>1,5<');
    expect(svg).toContain('>4,5<');
    expect(svg).toContain('8 m');
  });

  it('draws nothing until length and width are known, but still lists the openings', () => {
    const html = renderBuilding(building({ length_m: null, openings: [opening({})] }), new Set());
    expect(svgs(html)).toHaveLength(0);
    expect(html).toContain('data-unplaced="o1"');
    expect(renderElevation(building({ width_m: null }), 'front')).toBeNull();
    expect(renderPlan(building({ width_m: null }))).toBeNull();
  });

  it('shows a helpful hint for an empty building', () => {
    expect(renderBuilding(newSession().project.building)).toContain('class="empty"');
  });

  it('puts the saltak gable on the walls the ridge ends at', () => {
    const along = building();
    expect(renderElevation(along, 'venstre')).toContain('<polyline');
    expect(renderElevation(along, 'front')).not.toContain('<polyline');
    const across = building({ roof: { kind: 'saltak', pitch_deg: 35, ridge_along: 'bredde', overhang_m: null } });
    expect(renderElevation(across, 'front')).toContain('<polyline');
    expect(renderElevation(across, 'hoyre')).not.toContain('<polyline');
  });

  it('draws every roof kind without NaN', () => {
    for (const kind of ['saltak', 'pulttak', 'valm', 'flatt', 'annet'] as const) {
      for (const ridge_along of ['lengde', 'bredde'] as const) {
        for (const pitch_deg of [null, 0, 25, 89]) {
          const b = building({ roof: { kind, pitch_deg, ridge_along, overhang_m: null }, openings: [opening({})] });
          const html = renderBuilding(b, new Set(['o1']));
          expect(html, `${kind} ${ridge_along} ${pitch_deg}`).not.toMatch(BAD);
          expect(svgs(html)).toHaveLength(5);
        }
      }
    }
  });

  it('uses hex colours from the AI and greys for anything else', () => {
    const red = renderElevation(building({ exterior: { cladding: 'Stående panel', wall_color: '#aa2211', roof_color: null, trim_color: '#ffffff' } }), 'front')!;
    expect(red).toContain('#aa2211');
    const named = renderBuilding(building({ exterior: { cladding: null, wall_color: 'rød', roof_color: null, trim_color: null } }));
    expect(named).not.toContain('rød"');
    expect(named).toContain('#d9d9d6');
    expect(named).toContain('vist grå');
  });

  describe('loft (floor = floors + 1)', () => {
    const roof = { kind: 'saltak' as const, pitch_deg: 30, ridge_along: 'lengde' as const, overhang_m: 0 };
    const b = (o: Partial<Opening>) => building({ floors: 1, floor_height_m: 2.5, roof, openings: [opening({ id: 'l', floor: 2, ...o })] });
    /** The opening's rect [x, y, w, h] in the elevation, in pixels. */
    const rect = (svg: string) => {
      const m = /data-id="l"><title>[^<]*<\/title><rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg)!;
      return m.slice(1).map(Number);
    };
    /** The wall rect gives the scale and where the top of the wall is. */
    const wall = (svg: string) => {
      const m = /<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill/.exec(svg)!;
      const [x, y, w, h] = m.slice(1).map(Number);
      return { x, top: y, ground: y + h, scale: h / 2.5, w };
    };

    it('in a gable: sill measured up from the top of the wall', () => {
      const svg = renderElevation(b({ wall: 'venstre', offset_m: 3, sill_m: 0.5, width_m: 1, height_m: 0.8 }), 'venstre')!;
      const w = wall(svg);
      const [x, y, , h] = rect(svg);
      expect(x).toBeCloseTo(w.x + 3 * w.scale, 0);
      expect(y + h).toBeCloseTo(w.top - 0.5 * w.scale, 0);
      expect(h).toBeCloseTo(0.8 * w.scale, 0);
    });

    it('on an eave wall: a roof window, sill along the roof from the eave, projected', () => {
      const svg = renderElevation(b({ wall: 'front', offset_m: 4, sill_m: 1, width_m: 0.78, height_m: 1.2 }), 'front')!;
      const w = wall(svg);
      const [x, y, , h] = rect(svg);
      const sin = Math.sin(Math.PI / 6);
      expect(x).toBeCloseTo(w.x + 4 * w.scale, 0);
      expect(y + h).toBeCloseTo(w.top - 1 * sin * w.scale, 0);
      expect(h).toBeCloseTo(1.2 * sin * w.scale, 0);
      expect(renderBuilding(b({ wall: 'front' }))).toContain('Takvinduer');
    });

    it('above the loft, or a loft under a flat roof → «Ikke plassert ennå» with a reason', () => {
      const high = renderBuilding(b({ floor: 3 }));
      expect(high).toContain('data-unplaced="l"');
      expect(high).toContain('Etasje 3 finnes ikke');
      expect(svgs(high).join('')).not.toContain('data-id="l"');
      const flat = renderBuilding(building({ floors: 1, roof: { ...roof, kind: 'flatt' }, openings: [opening({ id: 'l', floor: 2 })] }));
      expect(flat).toContain('data-unplaced="l"');
      expect(flat).toContain('ingen loftsetasje');
    });

    it('draws every fixture roof window in the roof plane once floors excludes the loft', () => {
      for (const [label, s] of sessions()) {
        const loft = s.project.building.openings.filter((o) => o.floor > 1);
        if (!loft.length) continue;
        const asContract = { ...s.project.building, floors: 1, floor_height_m: 2.7 };
        const drawn = svgs(renderBuilding(asContract)).join('');
        for (const o of loft) if (o.floor === 2) expect(drawn, `${label} ${o.id}`).toContain(`data-id="${o.id}"`);
      }
    });

    it('knows which walls are gables', () => {
      expect(loftKind(roof, 'venstre')).toBe('gable');
      expect(loftKind(roof, 'front')).toBe('plane');
      expect(loftKind({ ...roof, ridge_along: 'bredde' }, 'front')).toBe('gable');
      expect(loftKind({ ...roof, kind: 'valm' }, 'venstre')).toBe('plane');
      expect(loftKind({ ...roof, kind: 'flatt' }, 'front')).toBeNull();
      expect(loftKind(null, 'front')).toBeNull();
    });
  });

  it('describes the roof in words', () => {
    expect(roofText({ kind: 'saltak', pitch_deg: 35, ridge_along: 'lengde', overhang_m: null })).toBe('Saltak 35°, møne langs lengden');
    expect(roofText(null)).toBe('–');
  });
});

describe('gantt', () => {
  const tasks = [
    { id: 'a', name: 'Grunnarbeid', start_week: 0, duration_weeks: 2, depends_on: [] },
    { id: 'b', name: 'Reisverk', start_week: 2, duration_weeks: 3, depends_on: ['a', 'missing'] },
  ];
  it('draws a connector for each known dependency', () => {
    const svg = ganttSvg(tasks, new Set(['b']));
    expect(svg.match(/class="gt-link"/g)).toHaveLength(1);
    expect(svg).toContain('data-from="a" data-to="b"');
    expect([...glowIds(svg)]).toEqual(['b']);
  });
  it('counts the weeks', () => {
    expect(projectWeeks(tasks)).toBe(5);
    expect(projectWeeks([])).toBe(0);
  });
});
