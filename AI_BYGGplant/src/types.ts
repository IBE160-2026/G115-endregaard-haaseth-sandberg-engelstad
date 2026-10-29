// The shape Claude answers in. The app has no building rules of its own: every question,
// fact, budget line and task comes from the AI, and the app only draws it.

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
export type Wall = 'front' | 'bak' | 'venstre' | 'hoyre' | 'ukjent';

export interface Question {
  text: string;
  /** Short suggested answers the user can click (may be empty). */
  options: string[];
}

export interface Fact {
  category: string;
  label: string;
  value: string;
}

export interface Opening {
  kind: OpeningKind;
  label: string;
  count: number;
  width_m: number | null;
  height_m: number | null;
  wall: Wall;
  /** 1 = ground floor. */
  floor: number;
}

export interface Building {
  length_m: number | null;
  width_m: number | null;
  floors: number | null;
  floor_height_m: number | null;
  roof: string | null;
  openings: Opening[];
}

export interface BudgetLine {
  post: string;
  description: string;
  amount_nok: number;
  /** How sure the AI is, as ± % of the amount. */
  uncertainty_pct: number;
}

export type Level = 'lav' | 'middels' | 'hoy';

export interface Risk {
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

export interface AiTurn {
  /** Short reply to what the user just said. */
  reply: string;
  phase: Phase;
  /** What this turn changed in the project, one short line each (empty when nothing changed). */
  changes: string[];
  questions: Question[];
  /** The whole project as it stands after this turn (replaces the previous one). */
  project: Project;
}

/** What the browser sends: the dialog so far, text only. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const emptyProject = (): Project => ({
  name: '',
  type: '',
  summary: '',
  facts: [],
  building: { length_m: null, width_m: null, floors: null, floor_height_m: null, roof: null, openings: [] },
  budget: [],
  schedule: [],
  risks: [],
  assumptions: [],
});
