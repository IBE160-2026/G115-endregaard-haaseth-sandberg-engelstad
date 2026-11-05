// The dialog state and what is sent to the AI. Pure, so it can be tested without a browser. Owner: WS1.
import { budgetTotal } from './budget';
import {
  emptyBuilding,
  emptyProject,
  mergeProject,
  type AiTurn,
  type Change,
  type ChatMessage,
  type Phase,
  type Project,
  type Question,
} from './contract/types';

export const GREETING = 'Hei, hva skal bygges?';

export type Entry =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; questions: Question[] };

/** One AI turn in the change log: what the user asked, what changed, and the budget before and after. */
export interface ChangeEntry {
  turn: number;
  request: string;
  changes: Change[];
  totalBefore: number;
  totalAfter: number;
}

export interface Session {
  entries: Entry[];
  project: Project;
  phase: Phase;
  log: ChangeEntry[];
}

export const newSession = (): Session => ({
  entries: [{ role: 'assistant', text: GREETING, questions: [] }],
  project: emptyProject(),
  phase: 'oppstart',
  log: [],
});

/** The ids the newest turn changed (what the 3D model and the tabs make glow). */
export const highlightIds = (s: Session): Set<string> =>
  new Set((s.log.at(-1)?.changes ?? []).flatMap((c) => (c.ref_id ? [c.ref_id] : [])));

let generated = 0;
/** v0.2 data has no ids; give each item one so the contract holds. */
const withId = <T extends object>(item: T, prefix: string): T & { id: string } =>
  'id' in item && typeof item.id === 'string' ? (item as T & { id: string }) : { ...item, id: `${prefix}-${++generated}` };

/** Fills in what older saved sessions (v0.1/v0.2) or imported files lack. */
export function normalizeSession(raw: unknown): Session {
  const s = raw as Partial<Session> | null;
  if (!s || !Array.isArray(s.entries) || !s.project) throw new Error('Ikke en gyldig prosjektfil.');
  const old = s.project as Partial<Project> & { building?: Record<string, unknown> };
  type Building = Project['building'];
  type Opening = Building['openings'][number];
  const raw0 = (old.building ?? {}) as Record<string, unknown>;
  // v0.4 data already has volumes; older data (v0.1–v0.3) had one box on the building itself.
  if (Array.isArray(raw0.volumes)) {
    const b = { ...emptyBuilding(), ...raw0 } as Building;
    return finish(s, old, b);
  }
  const ob = raw0 as { length_m?: number | null; width_m?: number | null; floors?: number | null; floor_height_m?: number | null; roof?: unknown; exterior?: Building['exterior']; terrain_slope_pct?: number | null; openings?: unknown[] };
  // v0.2 kept the roof as free text; it becomes 'annet' rather than a guess.
  const roof = ob.roof && typeof ob.roof === 'object' ? (ob.roof as Building['volumes'][number]['roof']) : ob.roof ? { kind: 'annet' as const, pitch_deg: null, ridge_along: 'lengde' as const, overhang_m: null } : null;
  const hasBox = [ob.length_m, ob.width_m, ob.floors].some((n) => n != null);
  const volumes: Building['volumes'] = hasBox
    ? [{ id: 'hoved', name: 'Hovedbygg', x_m: 0, y_m: 0, length_m: ob.length_m ?? null, width_m: ob.width_m ?? null, floors: ob.floors ?? null, floor_height_m: ob.floor_height_m ?? null, basement_floors: 0, roof, exterior: null }]
    : [];
  // v0.2 openings had a count; each physical opening becomes its own entry.
  const openings = (ob.openings ?? []).flatMap((o) => {
    const { count, ...rest } = o as Opening & { count?: number };
    const wall = (rest.wall as string) === 'ukjent' ? 'front' : rest.wall;
    const n = Math.max(1, Math.min(count ?? 1, 40));
    // Copies of one v0.2 entry must not share its id.
    return Array.from({ length: n }, (_, i) =>
      // Defaults first: the spread keeps any value the saved data already has.
      withId({ ...({ offset_m: null, sill_m: null } as Partial<Opening>), ...rest, wall, volume_id: 'hoved', ...(i > 0 ? { id: undefined } : {}) } as Opening, 'apning'),
    );
  });
  return finish(s, old, { volumes, exterior: ob.exterior ?? null, terrain_slope_pct: ob.terrain_slope_pct ?? null, openings });
}

function finish(s: Partial<Session>, old: Partial<Project>, building: Project['building']): Session {
  const project: Project = {
    ...emptyProject(),
    ...old,
    building,
    budget: (old.budget ?? []).map((l) => withId({ ...({ sku: null } as Partial<typeof l>), ...l, uncertainty_pct: l.uncertainty_pct ?? 0 }, 'post')),
    risks: (old.risks ?? []).map((r) => withId(r, 'risiko')),
  } as Project;
  const log = (Array.isArray(s.log) ? s.log : []).map((e) => ({
    ...e,
    changes: e.changes.map((c) => (typeof c === 'string' ? { section: 'annet' as const, text: c, ref_id: null } : c)),
  }));
  return { entries: s.entries ?? [], project, phase: s.phase ?? 'oppstart', log };
}

/** An assistant turn as the AI will read it back: the reply and the questions it asked. */
const assistantText = (e: Extract<Entry, { role: 'assistant' }>) =>
  [e.text, ...e.questions.map((q) => `- ${q.text}`)].join('\n');

/**
 * The messages for the next request. The greeting is the app's, so the API dialog starts
 * with the user's first answer. The current project goes with the newest user message only,
 * so the AI always edits the latest version without the history repeating it every turn.
 */
export function toApiMessages(s: Session): ChatMessage[] {
  const messages: ChatMessage[] = s.entries
    .slice(1)
    .map((e) => (e.role === 'user' ? { role: 'user', content: e.text } : { role: 'assistant', content: assistantText(e) }));
  if (messages.length) {
    messages[0] = { role: 'user', content: `${GREETING}\n\n${messages[0].content}` };
    const last = messages[messages.length - 1];
    if (last.role === 'user' && s.entries.length > 2) {
      last.content = `${last.content}\n\n[Prosjektet slik det står nå, som JSON]\n${JSON.stringify(s.project)}`;
    }
  }
  return messages;
}

export function applyTurn(s: Session, turn: AiTurn): Session {
  const request = [...s.entries].reverse().find((e) => e.role === 'user')?.text ?? '';
  const project = mergeProject(s.project, turn.project);
  const log = turn.changes.length
    ? [
        ...s.log,
        { turn: s.log.length + 1, request, changes: turn.changes, totalBefore: budgetTotal(s.project), totalAfter: budgetTotal(project) },
      ]
    : s.log;
  return {
    entries: [...s.entries, { role: 'assistant', text: turn.reply, questions: turn.questions }],
    project,
    phase: turn.phase,
    log,
  };
}

export const addUser = (s: Session, text: string): Session => ({ ...s, entries: [...s.entries, { role: 'user', text }] });
