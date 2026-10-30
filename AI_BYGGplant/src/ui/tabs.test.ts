import { describe, expect, it } from 'vitest';
import { DIALOGS, type DemoStep } from '../contract/fixtures';
import { addUser, applyTurn, highlightIds, newSession, type Session } from '../session';
import { formatM, formatNum } from '../format';
import { footprintArea, grossArea, siteBounds, type Building, type Opening, type Project, type Roof, type Volume } from '../types';
import { isPlaced, loftKind, renderBuilding, renderElevation, renderPlan, roofText } from './building';
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
        p.building.volumes = p.building.volumes.map((v) => ({ ...v, name: v.name + XSS, exterior: v.exterior && { ...v.exterior, cladding: XSS, wall_color: XSS } }));
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
      return [...p.building.volumes.map((v) => v.id), ...p.building.openings.map((o) => o.id)];
    case 'oversikt':
      return p.building.volumes.map((v) => v.id);
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

const ROOF: Roof = { kind: 'saltak', pitch_deg: 35, ridge_along: 'lengde', overhang_m: 0.4 };

const vol = (v: Partial<Volume> = {}): Volume => ({
  id: 'hus',
  name: 'Hus',
  x_m: 0,
  y_m: 0,
  length_m: 8,
  width_m: 7,
  floors: 1,
  floor_height_m: 2.5,
  basement_floors: 0,
  roof: ROOF,
  exterior: null,
  ...v,
});

const opening = (o: Partial<Opening>): Opening => ({
  id: 'o1',
  volume_id: 'hus',
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

/** One volume (overrides in `v`) plus building fields. */
const building = (b: Partial<Building> = {}, v: Partial<Volume> = {}): Building => ({
  volumes: [vol(v)],
  exterior: null,
  terrain_slope_pct: 0,
  openings: [],
  ...b,
});

/** A 10 × 8 m two-storey house with a 6 × 6 m one-storey garage attached on its right (høyre) side. */
const houseAndGarage = (openings: Opening[] = []): Building => ({
  volumes: [
    vol({ id: 'hus', name: 'Hus', length_m: 10, width_m: 8, floors: 2 }),
    vol({ id: 'garasje', name: 'Garasje', x_m: 10, y_m: 0, length_m: 6, width_m: 6, floors: 1, roof: { kind: 'flatt', pitch_deg: null, ridge_along: 'lengde', overhang_m: null } }),
  ],
  exterior: null,
  terrain_slope_pct: 0,
  openings,
});

const svgs = (html: string) => html.match(/<svg[\s\S]*?<\/svg>/g) ?? [];
const num4 = (m: RegExpExecArray | null) => (m ? m.slice(1, 5).map(Number) : null);
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A volume's rect in the site plan: [x, y, w, h] in pixels. */
const planRect = (svg: string, id: string) =>
  num4(new RegExp(`data-id="${reEsc(id)}"><title>[^<]*</title><rect x="([-\\d.]+)" y="([-\\d.]+)" width="([\\d.]+)" height="([\\d.]+)"`).exec(svg));

/** Where a volume's group starts in an elevation (-1 if absent). */
const volAt = (svg: string, id: string) => svg.search(new RegExp(`class="dw-vol(?: glow)?" data-id="${reEsc(id)}"`));

/** A volume's wall rect in an elevation: [x, y, w, h]. */
const wallRect = (svg: string, id: string) => {
  const at = volAt(svg, id);
  return at < 0 ? null : num4(/<rect class="dw-wall" x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(svg.slice(at)));
};

/** An opening's rect: [x, y, w, h]. */
const openRect = (svg: string, id: string) =>
  num4(new RegExp(`data-id="${reEsc(id)}"><title>[^<]*</title><rect x="([-\\d.]+)" y="([-\\d.]+)" width="([\\d.]+)" height="([\\d.]+)"`).exec(svg));

const m2 = (n: number) => `${formatNum(Math.round(n * 10) / 10)} m²`;

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

  it('lists openings on an unknown volume or a floor the volume lacks, with the reason', () => {
    const b = building(
      {
        openings: [
          opening({ id: 'ghost', volume_id: 'nope' }),
          opening({ id: 'cellar', floor: 0 }),
          opening({ id: 'deep', floor: -1 }),
          opening({ id: 'ok0', floor: 0, wall: 'bak' }),
        ],
      },
      { basement_floors: 1 },
    );
    const html = renderBuilding(b);
    expect(html).toContain('«nope» finnes ikke');
    expect(html).toContain('data-unplaced="ghost"');
    expect(html).toContain('data-unplaced="deep"');
    expect(html).toContain('har 1 kjelleretasje');
    expect(html).not.toContain('data-unplaced="cellar"');
    expect(html).not.toContain('data-unplaced="ok0"');
    const noCellar = renderBuilding(building({ openings: [opening({ id: 'cellar', floor: 0 })] }));
    expect(noCellar).toContain('data-unplaced="cellar"');
    expect(noCellar).toContain('ingen kjeller');
  });

  it('places an opening exactly at offset_m and shows the chain dimension', () => {
    const svg = renderElevation(building({ openings: [opening({ offset_m: 1.5, width_m: 2 })] }), 'front')!;
    // The chain: 1,5 | 2 | 4,5 along an 8 m wall.
    expect(svg).toContain('>1,5<');
    expect(svg).toContain('>4,5<');
    expect(svg).toContain(formatM(8));
  });

  it('draws nothing until a volume is sized, but still lists the volume and the openings', () => {
    const html = renderBuilding(building({ openings: [opening({})] }, { length_m: null }), new Set());
    expect(svgs(html)).toHaveLength(0);
    expect(html).toContain('data-unplaced="o1"');
    expect(html).toContain('Bygningskropper');
    expect(html).not.toMatch(BAD);
    expect(renderElevation(building({}, { width_m: null }), 'front')).toBeNull();
    expect(renderPlan(building({}, { width_m: null }))).toBeNull();
  });

  it('shows a helpful hint for an empty building', () => {
    expect(renderBuilding(newSession().project.building)).toContain('class="empty"');
  });

  it('puts the saltak gable on the walls the ridge ends at', () => {
    const along = building();
    expect(renderElevation(along, 'venstre')).toContain('<polyline');
    expect(renderElevation(along, 'front')).not.toContain('<polyline');
    const across = building({}, { roof: { kind: 'saltak', pitch_deg: 35, ridge_along: 'bredde', overhang_m: null } });
    expect(renderElevation(across, 'front')).toContain('<polyline');
    expect(renderElevation(across, 'hoyre')).not.toContain('<polyline');
  });

  it('draws every roof kind without NaN, with a site plan and four elevations', () => {
    for (const kind of ['saltak', 'pulttak', 'valm', 'flatt', 'annet'] as const) {
      for (const ridge_along of ['lengde', 'bredde'] as const) {
        for (const pitch_deg of [null, 0, 25, 89]) {
          const b = building({ openings: [opening({})] }, { roof: { kind, pitch_deg, ridge_along, overhang_m: null } });
          const html = renderBuilding(b, new Set(['o1', 'hus']));
          expect(html, `${kind} ${ridge_along} ${pitch_deg}`).not.toMatch(BAD);
          expect(svgs(html)).toHaveLength(5);
        }
      }
    }
  });

  it('uses hex colours from the AI and greys for anything else; a volume may override them', () => {
    const red = renderElevation(building({ exterior: { cladding: 'Stående panel', wall_color: '#aa2211', roof_color: null, trim_color: '#ffffff' } }), 'front')!;
    expect(red).toContain('#aa2211');
    const named = renderBuilding(building({ exterior: { cladding: null, wall_color: 'rød', roof_color: null, trim_color: null } }));
    expect(named).not.toContain('rød"');
    expect(named).toContain('#d9d9d6');
    expect(named).toContain('vist grå');
    const two = houseAndGarage();
    two.exterior = { cladding: null, wall_color: '#aa2211', roof_color: null, trim_color: null };
    two.volumes[1].exterior = { cladding: null, wall_color: '#123456', roof_color: null, trim_color: null };
    const front = renderElevation(two, 'front')!;
    expect(front.slice(volAt(front, 'hus'))).toMatch(/class="dw-wall"[^>]*fill="#aa2211"/);
    expect(front.slice(volAt(front, 'garasje'), volAt(front, 'hus') > volAt(front, 'garasje') ? volAt(front, 'hus') : undefined)).toMatch(/class="dw-wall"[^>]*fill="#123456"/);
  });

  describe('site plan with several volumes', () => {
    it('draws one rectangle per sized volume, at its position and to scale, with overall dimensions', () => {
      const b = houseAndGarage();
      b.volumes.push(vol({ id: 'bod', name: 'Bod', length_m: null, x_m: 20 }));
      const svg = renderPlan(b)!;
      expect((svg.match(/class="dw-vol"/g) ?? []).length).toBe(2);
      const [hx, hy, hw, hh] = planRect(svg, 'hus')!;
      const [gx, gy, gw, gh] = planRect(svg, 'garasje')!;
      const scale = hw / 10;
      expect(hh).toBeCloseTo(8 * scale, 0);
      expect(gw).toBeCloseTo(6 * scale, 0);
      expect(gh).toBeCloseTo(6 * scale, 0);
      expect(gx).toBeCloseTo(hx + hw, 0); // attached on the right
      expect(gy + gh).toBeCloseTo(hy + hh, 0); // both start at the front (the bottom)
      expect(svg).toContain(`>${formatM(16)}<`);
      expect(svg).toContain(`>${formatM(8)}<`);
      expect(svg).toContain('Hus');
      expect(svg).toContain('Garasje');
      expect(svg).toContain('6 × 6 m');
      expect(svg).toContain('2 etg.');
      expect(svg).not.toContain('Bod');
      const html = renderBuilding(b);
      expect(html).toContain('«Bod» mangler mål');
      expect(html).toContain('data-id="bod"'); // in the Bygningskropper card
    });

    it('puts a volume further back higher up in the plan', () => {
      const b: Building = { ...houseAndGarage(), volumes: [vol({ id: 'a', length_m: 10, width_m: 5 }), vol({ id: 'b', x_m: 2, y_m: 5, length_m: 4, width_m: 5 })] };
      const svg = renderPlan(b)!;
      const [ax, ay, aw] = planRect(svg, 'a')!;
      const [bx, by, , bh] = planRect(svg, 'b')!;
      expect(by + bh).toBeCloseTo(ay, 0);
      expect(bx).toBeCloseTo(ax + (2 * aw) / 10, 0);
    });

    it('shows basement floors as «U» and marks the openings on the outer walls', () => {
      const b = building({ openings: [opening({ id: 'w', wall: 'hoyre', offset_m: 1 })] }, { basement_floors: 1, floors: 2 });
      const svg = renderPlan(b)!;
      expect(svg).toContain('2 etg. + 1 U');
      expect(svg).toContain('data-id="w"');
    });

    it('draws the ridge of a saltak and the fall arrow of a pulttak per volume', () => {
      const b = houseAndGarage();
      b.volumes[1].roof = { kind: 'pulttak', pitch_deg: 10, ridge_along: 'lengde', overhang_m: null };
      const svg = renderPlan(b)!;
      expect(svg).toContain('stroke-dasharray="6 4"');
      expect(svg).toMatch(/<polygon points="[^"]+" fill="#7d7d7d"\/>/);
    });
  });

  describe('elevations of several volumes', () => {
    /** The house in front, an annex 4 m wide behind it, 3 m from the house's left corner. */
    const behind = (): Building => ({
      ...houseAndGarage(),
      volumes: [vol({ id: 'hus', name: 'Hus', length_m: 10, width_m: 8, floors: 1 }), vol({ id: 'anneks', name: 'Anneks', x_m: 3, y_m: 8, length_m: 4, width_m: 4, floors: 2 })],
    });

    it('draws a volume further back first (behind) and lighter, at its position along the side', () => {
      const svg = renderElevation(behind(), 'front')!;
      expect(volAt(svg, 'anneks')).toBeGreaterThan(-1);
      expect(volAt(svg, 'anneks')).toBeLessThan(volAt(svg, 'hus'));
      expect(svg).toMatch(/data-id="anneks" opacity="0\.\d+"/);
      expect(svg).not.toMatch(/data-id="hus" opacity/);
      const [hx, , hw] = wallRect(svg, 'hus')!;
      const [ax, , aw] = wallRect(svg, 'anneks')!;
      const scale = hw / 10;
      expect(ax).toBeCloseTo(hx + 3 * scale, 0);
      expect(aw).toBeCloseTo(4 * scale, 0);
      expect(svg).toContain(`>${formatM(10)}<`);
    });

    it('mirrors the back and walks the sides from their left corner seen from outside', () => {
      const b = behind();
      const bak = renderElevation(b, 'bak')!;
      expect(volAt(bak, 'hus')).toBeLessThan(volAt(bak, 'anneks')); // now the house is behind
      const [hx, , hw] = wallRect(bak, 'hus')!;
      expect(wallRect(bak, 'anneks')![0]).toBeCloseTo(hx + 3 * (hw / 10), 0); // 10 − 3 − 4 = 3 from the left
      // Venstre: from the back to the front, so the annex (at the back) is on the left.
      const ven = renderElevation(b, 'venstre')!;
      const [vx, , vw] = wallRect(ven, 'hus')!;
      const [ax] = wallRect(ven, 'anneks')!;
      expect(ax).toBeLessThan(vx);
      expect(vx).toBeCloseTo(ax + 4 * (vw / 8), 0);
      // Høyre: from the front to the back, so the annex is on the right.
      const hoy = renderElevation(b, 'hoyre')!;
      expect(wallRect(hoy, 'anneks')![0]).toBeGreaterThan(wallRect(hoy, 'hus')![0]);
      expect(ven).toContain(`>${formatM(12)}<`);
    });

    it('draws basement floors dashed below the ground line, with their openings', () => {
      const b = building({ openings: [opening({ id: 'k', floor: 0, sill_m: 1.6, height_m: 0.6, offset_m: 2 })] }, { basement_floors: 1, floor_height_m: 2.5 });
      const svg = renderElevation(b, 'front')!;
      expect(svg).toMatch(/class="dw-basement"[^>]*stroke-dasharray/);
      const [wx, wy, , wh] = wallRect(svg, 'hus')!;
      const ground = wy + wh;
      const scale = wh / 2.5;
      const [x, y, , h] = openRect(svg, 'k')!;
      expect(y).toBeGreaterThan(ground);
      expect(y + h).toBeCloseTo(ground + (2.5 - 1.6) * scale, 0);
      expect(x).toBeCloseTo(wx + 2 * scale, 0);
      expect(renderPlan(b)).not.toContain('data-id="k"');
      expect(renderBuilding(b)).toContain('>U1<');
    });

    it('lists an opening on a wall shared with another volume and does not draw it', () => {
      const b = houseAndGarage([
        opening({ id: 'shared', wall: 'hoyre', offset_m: 1 }), // y 1–2 m: the garage stands there
        opening({ id: 'free', wall: 'hoyre', offset_m: 7 }), // y 7–8 m: behind the garage
        opening({ id: 'above', wall: 'hoyre', offset_m: 1, floor: 2 }), // above the garage
        opening({ id: 'gshared', volume_id: 'garasje', wall: 'venstre', offset_m: 1 }),
      ]);
      const html = renderBuilding(b);
      expect(html).toContain('data-unplaced="shared"');
      expect(html).toContain('data-unplaced="gshared"');
      expect(html).toContain('deles med Garasje');
      expect(html).toContain('deles med Hus');
      expect(html).not.toContain('data-unplaced="free"');
      expect(html).not.toContain('data-unplaced="above"');
      const drawn = svgs(html).join('');
      expect(drawn).not.toContain('data-id="shared"');
      expect(drawn).not.toContain('data-id="gshared"');
      expect(drawn).toContain('data-id="free"');
      expect(drawn).toContain('data-id="above"');
    });
  });

  it('makes a volume glow in the plan, the elevations and the card', () => {
    const b = houseAndGarage([opening({ id: 'o1' })]);
    const html = renderBuilding(b, new Set(['garasje']));
    expect([...glowIds(html)]).toEqual(['garasje']);
    expect((html.match(/class="dw-vol glow" data-id="garasje"/g) ?? []).length).toBe(5);
    expect(html).toMatch(/class="dw-row glow" data-id="garasje"/);
    expect(renderTab('oversikt', { ...newSession(), project: { ...newSession().project, building: b } }, new Set(['garasje']))).toMatch(/class="dw-row glow" data-id="garasje"/);
  });

  it('shows the overall size, footprint, BRA and number of volumes', () => {
    const b = houseAndGarage([opening({})]);
    b.volumes[0].basement_floors = 1;
    const html = renderBuilding(b);
    expect(html).toContain(`${formatM(16)} × ${formatM(8)}`);
    expect(html).toContain(m2(116)); // 80 + 36
    expect(html).toContain(m2(196)); // 160 + 36
    expect(html).toContain('BRA (ca.)');
    expect(html).toMatch(/<span>Bygningskropper<\/span><b>2<\/b>/);
    expect(html).toMatch(/<span>Etasjer<\/span><b>2<\/b>/);
    expect(html).toContain('<th>Bygningskropp</th>');
    const s = { ...newSession(), project: { ...newSession().project, building: b } };
    const ov = renderTab('oversikt', s, new Set());
    expect(ov).toContain('16 × 8 m');
    expect(ov).toContain('2 + kjeller');
    expect(ov).toContain('2 bygningskropper');
  });

  it('stays clean with half-known volumes (no NaN, undefined or null)', () => {
    const b: Building = {
      volumes: [
        vol({ floor_height_m: null, roof: null, basement_floors: 2 }),
        vol({ id: 'b', name: 'B', x_m: 8, length_m: 4, floors: null }),
        vol({ id: 'c', name: 'C', x_m: 8, y_m: 7, roof: { kind: 'valm', pitch_deg: null, ridge_along: 'bredde', overhang_m: null } }),
        vol({ id: 'd', name: 'D', x_m: Number.NaN }),
      ],
      exterior: null,
      terrain_slope_pct: null,
      openings: [opening({ floor: -1 }), opening({ id: 'x', volume_id: 'b' }), opening({ id: 'y', volume_id: 'c', floor: Number.NaN })],
    };
    const html = renderBuilding(b, new Set(['hus', 'b', 'o1']));
    expect(html).not.toMatch(BAD);
    expect(svgs(html)).toHaveLength(5);
  });

  it('escapes volume names and ids everywhere', () => {
    const b = houseAndGarage([opening({ id: 'shared', wall: 'hoyre', offset_m: 1 }), opening({ id: 'g', volume_id: XSS })]);
    b.volumes[0].name = XSS;
    b.volumes[1].name = `${XSS}"><img src=x onerror=1>`;
    b.volumes[1].id = `"><script>y</script>`;
    b.volumes.push(vol({ id: 'z', name: XSS, length_m: null }));
    const html = renderBuilding(b, new Set(b.volumes.map((v) => v.id)));
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    const s = { ...newSession(), project: { ...newSession().project, building: b } };
    expect(renderTab('oversikt', s, new Set())).not.toContain('<script');
  });

  describe('KPIs over every fixture step', () => {
    for (const [label, s] of sessions()) {
      it(`${label}: footprint and gross area from the contract helpers`, () => {
        const b = s.project.building;
        const draw = renderTab('tegning', s, new Set());
        const ov = renderTab('oversikt', s, new Set());
        if (footprintArea(b) > 0) {
          expect(draw).toContain(m2(footprintArea(b)));
          expect(draw).toContain(m2(grossArea(b)));
          expect(ov).toContain(`Grunnflate ${m2(footprintArea(b))}`);
          const bb = siteBounds(b)!;
          expect(ov).toContain(`${formatNum(bb.x1 - bb.x0)} × ${formatNum(bb.y1 - bb.y0)} m`);
        }
        if (b.volumes.length) expect(draw).toMatch(new RegExp(`<span>Bygningskropper</span><b>${b.volumes.length}</b>`));
      });
    }
  });

  describe('loft (floor = floors + 1)', () => {
    const roof = { kind: 'saltak' as const, pitch_deg: 30, ridge_along: 'lengde' as const, overhang_m: 0 };
    const b = (o: Partial<Opening>) => building({ openings: [opening({ id: 'l', floor: 2, ...o })] }, { floors: 1, floor_height_m: 2.5, roof });
    const wall = (svg: string) => {
      const [x, y, w, h] = wallRect(svg, 'hus')!;
      return { x, top: y, ground: y + h, scale: h / 2.5, w };
    };

    it('in a gable: sill measured up from the top of the wall', () => {
      const svg = renderElevation(b({ wall: 'venstre', offset_m: 3, sill_m: 0.5, width_m: 1, height_m: 0.8 }), 'venstre')!;
      const w = wall(svg);
      const [x, y, , h] = openRect(svg, 'l')!;
      expect(x).toBeCloseTo(w.x + 3 * w.scale, 0);
      expect(y + h).toBeCloseTo(w.top - 0.5 * w.scale, 0);
      expect(h).toBeCloseTo(0.8 * w.scale, 0);
    });

    it('on an eave wall: a roof window, sill along the roof from the eave, projected', () => {
      const svg = renderElevation(b({ wall: 'front', offset_m: 4, sill_m: 1, width_m: 0.78, height_m: 1.2 }), 'front')!;
      const w = wall(svg);
      const [x, y, , h] = openRect(svg, 'l')!;
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
      const flat = renderBuilding(building({ openings: [opening({ id: 'l', floor: 2 })] }, { floors: 1, roof: { ...roof, kind: 'flatt' } }));
      expect(flat).toContain('data-unplaced="l"');
      expect(flat).toContain('ingen loftsetasje');
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

  it('draws every fixture opening that the contract places', () => {
    for (const [label, s] of sessions()) {
      const b = s.project.building;
      const drawn = svgs(renderBuilding(b)).join('');
      for (const o of b.openings) if (isPlaced(o, b)) expect(drawn, `${label} ${o.id}`).toContain(`data-id="${o.id}"`);
    }
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
