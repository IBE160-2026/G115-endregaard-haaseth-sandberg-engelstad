// The v0.3 contract (frozen in team meeting 2, 2026-10-29). Owner: WS1 (Jonas).
// Claude answers every turn in this shape; the app has no building rules and only draws it.
// Changes go through WS1: schema.ts, these types and the fixtures change together.

export type Phase = 'oppstart' | 'tomt' | 'bygg' | 'apninger' | 'materialer' | 'budsjett' | 'detaljer';

export const PHASES: { id: Phase; label: string }[] = [
  { id: 'oppstart', label: 'Oppstart' },
  { id: 'tomt', label: 'Tomt og terreng' },
  { id: 'bygg', label: 'Størrelse og etasjer' },
  { id: 'apninger', label: 'Dører, vinduer og porter' },
  { id: 'materialer', label: 'Materialer og teknikk' },
  { id: 'budsjett', label: 'Budsjett og fremdrift' },
  { id: 'detaljer', label: 'Detaljer og endringer' },
];

export type OpeningKind = 'dor' | 'vindu' | 'port' | 'annet';
/** Seen from outside. The front is the long side along `length_m`; venstre/høyre are the short sides. */
export type Wall = 'front' | 'bak' | 'venstre' | 'hoyre';
export type RoofKind = 'saltak' | 'pulttak' | 'valm' | 'flatt' | 'annet';
export type Level = 'lav' | 'middels' | 'hoy';
export type Section = 'tomt' | 'bygg' | 'apninger' | 'materialer' | 'budsjett' | 'fremdrift' | 'risiko' | 'annet';

export interface Question {
  text: string;
  /** Short suggested answers the user can click (may be empty). */
  options: string[];
}

export interface Change {
  section: Section;
  /** One short line, e.g. «Lengde 7 → 8 m». */
  text: string;
  /** The id of the opening, budget line, risk or task this change is about, or null. */
  ref_id: string | null;
}

export interface Fact {
  category: string;
  label: string;
  value: string;
}

export interface Roof {
  kind: RoofKind;
  pitch_deg: number | null;
  /** Which way the ridge runs (saltak/valm), or which way the slope falls along (pulttak). */
  ridge_along: 'lengde' | 'bredde';
  overhang_m: number | null;
}

export interface Exterior {
  cladding: string | null;
  /** Colours as #rrggbb; anything else is drawn neutral grey. */
  wall_color: string | null;
  roof_color: string | null;
  trim_color: string | null;
}

/** One physical opening (two windows are two entries). */
export interface Opening {
  id: string;
  kind: OpeningKind;
  label: string;
  width_m: number | null;
  height_m: number | null;
  wall: Wall;
  /** 1 = ground floor. */
  floor: number;
  /** From the wall's left corner (seen from outside) to the opening's left edge. Null = not decided. */
  offset_m: number | null;
  /** From the floor to the bottom of the opening. Null = not decided. */
  sill_m: number | null;
}

export interface Building {
  length_m: number | null;
  width_m: number | null;
  floors: number | null;
  floor_height_m: number | null;
  roof: Roof | null;
  exterior: Exterior | null;
  /** Terrain slope across the plot in %, if known. */
  terrain_slope_pct: number | null;
  openings: Opening[];
}

export interface BudgetLine {
  id: string;
  post: string;
  description: string;
  amount_nok: number;
  /** How sure the AI is, as ± % of the amount. */
  uncertainty_pct: number;
  /** The supplier's product number, when the line comes from the brand's catalogue. */
  sku: string | null;
}

export interface Risk {
  id: string;
  title: string;
  probability: Level;
  consequence: string;
  measure: string;
  /** What it costs if it happens. */
  cost_nok: number;
}

export interface Task {
  id: string;
  name: string;
  start_week: number;
  duration_weeks: number;
  depends_on: string[];
}

/** The whole project as the app keeps it. */
export interface Project {
  name: string;
  type: string;
  summary: string;
  facts: Fact[];
  building: Building;
  budget: BudgetLine[];
  schedule: Task[];
  risks: Risk[];
  assumptions: string[];
}

/**
 * The project as the AI returns it. A section that is null means "unchanged" (delta turns, v0.4).
 * In v0.3 the prompt still asks for every section; mergeProject keeps the previous one on null.
 */
export interface ProjectPatch {
  name: string;
  type: string;
  summary: string;
  facts: Fact[] | null;
  building: Building | null;
  budget: BudgetLine[] | null;
  schedule: Task[] | null;
  risks: Risk[] | null;
  assumptions: string[] | null;
}

export interface AiTurn {
  /** Short reply to what the user just said. Streams first. */
  reply: string;
  questions: Question[];
  phase: Phase;
  /** What this turn changed, one line each (empty when nothing changed). */
  changes: Change[];
  project: ProjectPatch;
}

/** What the browser sends: the dialog so far, text only. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const emptyBuilding = (): Building => ({
  length_m: null,
  width_m: null,
  floors: null,
  floor_height_m: null,
  roof: null,
  exterior: null,
  terrain_slope_pct: null,
  openings: [],
});

export const emptyProject = (): Project => ({
  name: '',
  type: '',
  summary: '',
  facts: [],
  building: emptyBuilding(),
  budget: [],
  schedule: [],
  risks: [],
  assumptions: [],
});

export function mergeProject(prev: Project, patch: ProjectPatch): Project {
  return {
    name: patch.name,
    type: patch.type,
    summary: patch.summary,
    facts: patch.facts ?? prev.facts,
    building: patch.building ?? prev.building,
    budget: patch.budget ?? prev.budget,
    schedule: patch.schedule ?? prev.schedule,
    risks: patch.risks ?? prev.risks,
    assumptions: patch.assumptions ?? prev.assumptions,
  };
}

/** Every id a change's ref_id may point at. */
export function projectIds(p: Project): Set<string> {
  return new Set([
    ...p.building.openings.map((o) => o.id),
    ...p.budget.map((l) => l.id),
    ...p.risks.map((r) => r.id),
    ...p.schedule.map((t) => t.id),
  ]);
}

/** #rrggbb or null; the app never guesses a colour from a name. */
export const hexColor = (c: string | null | undefined) => (c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : null);
