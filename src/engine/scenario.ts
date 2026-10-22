// Scenario "Regjeringskvartalet Light" – data from Appendix A of the product brief.

export type Mode = 'normal' | 'overtime' | 'hire';

export interface Task {
  id: string;
  name: string;
  icon: string;
  predecessors: string[];
  /** Own crew at normal time. */
  crew: number;
  /** Work content in hours – does not change with the mode. */
  hours: number;
  /** All-in hourly rate, NOK. */
  rate: number;
  /** Materials and equipment, MNOK – the same in every mode. */
  materials: number;
}

export interface Person {
  id: string;
  role: string;
  description: string;
  icon: string;
  /** Set for foremen: the discipline they lead. */
  taskId?: string;
}

export interface Building {
  id: string;
  name: string;
  phase: string;
  kind: string;
  status: string;
  icon: string;
  /** Set for the buildings the scenario simulates. */
  simulation?: { areaM2: number; taskIds: string[] };
}

export interface Scenario {
  name: string;
  hoursPerWeek: number;
  overtimeHoursPerWeek: number;
  factors: Record<Mode, number>;
  /** Share of the own crew added as hired workers (rounded up). */
  hireShare: number;
  overhead: { fromWeek: number; perWeek: number };
  tasks: Task[];
  people: Person[];
  buildings: Building[];
}

const TRADE = 600;
const ENGINEER = 1000;

const tasks: Task[] = [
  { id: 'A', name: 'Prosjektering og byggesøknad', icon: 'disciplines/A-design.svg', predecessors: [], crew: 36, hours: 21600, rate: ENGINEER, materials: 3.4 },
  { id: 'C', name: 'Sprengning og graving', icon: 'disciplines/C-blasting.svg', predecessors: ['A'], crew: 14, hours: 6300, rate: TRADE, materials: 10.22 },
  { id: 'D', name: 'Fundamentering og spunt', icon: 'disciplines/D-foundations.svg', predecessors: ['C'], crew: 16, hours: 4800, rate: TRADE, materials: 7.12 },
  { id: 'E', name: 'Kjeller råbygg', icon: 'disciplines/E-basement-structure.svg', predecessors: ['D'], crew: 30, hours: 15750, rate: TRADE, materials: 12.55 },
  { id: 'F', name: 'Kontor råbygg', icon: 'disciplines/F-office-structure.svg', predecessors: ['E'], crew: 34, hours: 25500, rate: TRADE, materials: 19.7 },
  { id: 'L', name: 'Kjeller innredning og teknikk', icon: 'disciplines/L-basement-fitout.svg', predecessors: ['E'], crew: 8, hours: 3000, rate: TRADE, materials: 3.2 },
  { id: 'G', name: 'Tak og fasade', icon: 'disciplines/G-roof-facade.svg', predecessors: ['F'], crew: 30, hours: 15750, rate: TRADE, materials: 18.55 },
  { id: 'O', name: 'Heiser', icon: 'disciplines/O-lifts.svg', predecessors: ['F'], crew: 6, hours: 1800, rate: TRADE, materials: 5.92 },
  { id: 'H', name: 'VVS', icon: 'disciplines/H-hvac.svg', predecessors: ['G'], crew: 32, hours: 21600, rate: TRADE, materials: 19.04 },
  { id: 'I', name: 'Elkraft', icon: 'disciplines/I-electrical.svg', predecessors: ['G'], crew: 32, hours: 19200, rate: TRADE, materials: 14.48 },
  { id: 'K', name: 'Innvendige arbeider', icon: 'disciplines/K-interior.svg', predecessors: ['G'], crew: 30, hours: 18000, rate: TRADE, materials: 9.2 },
  { id: 'J', name: 'Tele og automatisering', icon: 'disciplines/J-automation.svg', predecessors: ['I'], crew: 18, hours: 6750, rate: TRADE, materials: 8.95 },
  { id: 'N', name: 'Prøvedrift og overlevering', icon: 'disciplines/N-handover.svg', predecessors: ['H', 'J', 'K', 'L', 'O'], crew: 10, hours: 1500, rate: ENGINEER, materials: 0.5 },
];

const foremanIcon = (t: Task) => `people/foreman-${t.icon.slice('disciplines/'.length)}`;

const people: Person[] = [
  { id: 'owner', role: 'Prosjekteier', description: 'Statsbygg (byggherre). Eier budsjettet og godkjenner endringer.', icon: 'people/owner.svg' },
  { id: 'pm', role: 'Prosjektleder', description: 'Studenten. Tar beslutningene om plan, ressurser og risiko.', icon: 'people/project-manager.svg' },
  { id: 'site', role: 'Site manager', description: 'Leder byggeplassen og koordinerer formennene.', icon: 'people/site-manager.svg' },
  ...tasks.map(t => ({
    id: `foreman-${t.id}`,
    role: 'Formann',
    description: t.name,
    icon: foremanIcon(t),
    taskId: t.id,
  })),
];

const OFFICE_TASKS = ['A', 'F', 'G', 'O', 'H', 'I', 'K', 'J', 'N'];
const BASEMENT_TASKS = ['C', 'D', 'E', 'L'];

const buildings: Building[] = [
  { id: 'bt1-a', name: 'A-blokka', phase: 'Byggetrinn 1', kind: 'Nybygg', status: 'Ferdig 2026', icon: 'buildings/bt1-a.svg', simulation: { areaM2: 11000, taskIds: OFFICE_TASKS } },
  { id: 'bt1-d', name: 'D-blokka', phase: 'Byggetrinn 1', kind: 'Nybygg', status: 'Ferdig 2026', icon: 'buildings/bt1-d.svg' },
  { id: 'bt1-h', name: 'Høyblokka', phase: 'Byggetrinn 1', kind: 'Rehabilitering', status: 'Ferdig 2026', icon: 'buildings/bt1-h.svg' },
  { id: 'bt1-basement', name: 'Kjelleranlegget', phase: 'Byggetrinn 1', kind: 'Kjeller', status: 'Ferdig 2026', icon: 'buildings/bt1-basement.svg', simulation: { areaM2: 4000, taskIds: BASEMENT_TASKS } },
  { id: 'bt2-c', name: 'C-blokka', phase: 'Byggetrinn 2 del I', kind: 'Nybygg', status: 'Under bygging', icon: 'buildings/bt2-c.svg' },
  { id: 'bt2-basement', name: 'Kjeller 2', phase: 'Byggetrinn 2 del I', kind: 'Kjeller', status: 'Under bygging', icon: 'buildings/bt2-basement.svg' },
  { id: 'bt2-g', name: 'G-blokka', phase: 'Byggetrinn 2 del II', kind: 'Rehabilitering', status: 'Foreslått oppstart 2027', icon: 'buildings/bt2-g.svg' },
  { id: 'bt3-e', name: 'E-blokka', phase: 'Byggetrinn 3', kind: 'Nybygg', status: 'Prosjektering', icon: 'buildings/bt3-e.svg' },
  { id: 'park', name: 'Parken', phase: 'Byggetrinn 2 og 3', kind: 'Uteområde', status: 'Vestre del i BT2, resten i BT3', icon: 'buildings/park.svg' },
];

export const scenario: Scenario = {
  name: 'Regjeringskvartalet Light',
  hoursPerWeek: 37.5,
  overtimeHoursPerWeek: 45,
  factors: { normal: 1.0, overtime: 1.3, hire: 1.5 },
  hireShare: 0.5,
  overhead: { fromWeek: 16, perWeek: 0.45 },
  tasks,
  people,
  buildings,
};
