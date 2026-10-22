// Event catalogue: challenges the AI roles raise, with the owner's options.
// All prices and delays are proposals for the team to check (like Appendix A).
import type { Mode } from './scenario';

export interface EventOption {
  id: string;
  label: string;
  /** Extra cost, MNOK. */
  cost: number;
  /** Weeks the affected task stands still (drying, waiting, rework). */
  delay: number;
  /** Optional change to how the affected task is worked from now on. */
  setMode?: Mode;
  note: string;
}

export interface EventDef {
  id: string;
  title: string;
  icon: string;
  /** Person who raises the challenge and recommends an option. */
  raisedBy: string;
  /** The event hits the first of these tasks that is not finished. */
  taskIds: string[];
  description: string;
  /** Can the owner start it with a scenario button? */
  button: boolean;
  /** Chance per week while the task is active (0 = only by button). Fires at most once. */
  chance: number;
  options: EventOption[];
}

export const EVENTS: EventDef[] = [
  {
    id: 'water', title: 'Vann i kjeller', icon: 'risks/R6-water.svg', raisedBy: 'site', taskIds: ['C', 'D', 'E', 'L'], button: true, chance: 0.06,
    description: 'Grunnvann trenger inn i byggegropen etter kraftig regn. Arbeidet i kjelleren må stoppe til vannet er borte og betongen er tørr.',
    options: [
      { id: 'pump', label: 'Installer fast pumpe', cost: 0.8, delay: 2, note: 'Pumpe og drenering, 2 uker tørking.' },
      { id: 'rent', label: 'Lei midlertidig pumpe', cost: 0.3, delay: 4, note: 'Billigere nå, men lengre tørketid.' },
      { id: 'wait', label: 'Avvent og la det tørke', cost: 1.2, delay: 6, note: 'Ingen pumpe. Fuktskader må utbedres etterpå.' },
    ],
  },
  {
    id: 'rock', title: 'Forvitret fjell', icon: 'risks/R1-weathered-rock.svg', raisedBy: 'foreman-D', taskIds: ['D'], button: true, chance: 0.12,
    description: 'Deler av fjellet under fundamentene er forvitret og tåler ikke lasten, slik det skjedde under Høyblokka.',
    options: [
      { id: 'refound', label: 'Ny fundamentering i sonen', cost: 6, delay: 4, note: 'Sikker løsning, men dyr og tidkrevende.' },
      { id: 'grout', label: 'Injisering og bolting', cost: 3.5, delay: 2, note: 'Styrker fjellet der det står.' },
      { id: 'piles', label: 'Omprosjekter til peler', cost: 2, delay: 3, note: 'Billigere, men krever ny prosjektering.' },
    ],
  },
  {
    id: 'soil', title: 'Forurenset grunn', icon: 'risks/R2-contaminated-soil.svg', raisedBy: 'foreman-C', taskIds: ['C'], button: true, chance: 0.1,
    description: 'Gravemassene inneholder forurensning fra gammel bebyggelse i sentrum.',
    options: [
      { id: 'deposit', label: 'Kjør til godkjent deponi', cost: 4, delay: 1, note: 'Rask, men deponiavgiften er høy.' },
      { id: 'clean', label: 'Rens massene på stedet', cost: 2.5, delay: 3, note: 'Billigere, men tar tid.' },
      { id: 'survey', label: 'Stopp og kartlegg først', cost: 1, delay: 4, note: 'Minst kostnad, mest ventetid.' },
    ],
  },
  {
    id: 'frost', title: 'Frost i betongen', icon: 'risks/R7-frost.svg', raisedBy: 'foreman-E', taskIds: ['E'], button: true, chance: 0.08,
    description: 'Kuldeperiode. Betongen herder ikke under 5 °C uten tiltak.',
    options: [
      { id: 'heat', label: 'Vinterstøp med oppvarming', cost: 0.6, delay: 0, note: 'Telt og varme, ingen stans.' },
      { id: 'pause', label: 'Pause støpingen', cost: 0, delay: 2, note: 'Venter på mildvær.' },
    ],
  },
  {
    id: 'wind', title: 'Kranstans i sterk vind', icon: 'risks/R8-wind.svg', raisedBy: 'foreman-F', taskIds: ['F'], button: true, chance: 0.08,
    description: 'Vindkast over grensen for tårnkranen. Råbygget står uten løft.',
    options: [
      { id: 'mobile', label: 'Lei mobilkran for kritiske løft', cost: 0.5, delay: 1, note: 'Holder de viktigste løftene i gang.' },
      { id: 'wait', label: 'Vent til vinden løyer', cost: 0, delay: 2, note: 'Ingen ekstra kostnad.' },
    ],
  },
  {
    id: 'facade', title: 'Forsinket fasadeleveranse', icon: 'risks/R3-facade-delivery.svg', raisedBy: 'foreman-G', taskIds: ['G'], button: true, chance: 0.1,
    description: 'Leverandøren av fasadeelementene melder kapasitetsproblemer.',
    options: [
      { id: 'wait', label: 'Vent på leveransen', cost: 0, delay: 4, note: 'Ingen ekstra kostnad.' },
      { id: 'supplier', label: 'Bytt til ny leverandør', cost: 3, delay: 1, note: 'Dyrt, men raskt.' },
      { id: 'resequence', label: 'Monter i annen rekkefølge', cost: 1, delay: 2, note: 'Starter med fasadene som er levert.' },
    ],
  },
  {
    id: 'electricians', title: 'Mangel på elektrikere', icon: 'risks/R4-electrician-shortage.svg', raisedBy: 'foreman-I', taskIds: ['I'], button: true, chance: 0.1,
    description: 'Flere elektrikere er tatt ut til et annet prosjekt.',
    options: [
      { id: 'accept', label: 'Aksepter forsinkelsen', cost: 0, delay: 3, note: 'Jobber videre med færre folk.' },
      { id: 'hire', label: 'Lei inn fra byrå', cost: 0, delay: 0, setMode: 'hire', note: 'Ekstra innleie (1,5) resten av disiplinen.' },
      { id: 'overtime', label: 'Kjør overtid', cost: 0, delay: 1, setMode: 'overtime', note: 'Overtid (1,3) resten av disiplinen.' },
    ],
  },
  {
    id: 'integration', title: 'Integrasjonsfeil i automasjonen', icon: 'risks/R5-automation-integration.svg', raisedBy: 'foreman-J', taskIds: ['J'], button: true, chance: 0.12,
    description: 'SD-anlegget og adgangskontrollen snakker ikke sammen.',
    options: [
      { id: 'debug', label: 'Feilsøk selv', cost: 0, delay: 2, note: 'Egen kompetanse, tar tid.' },
      { id: 'specialist', label: 'Hent leverandørens spesialist', cost: 0.6, delay: 1, note: 'Rask hjelp, timepris.' },
      { id: 'standard', label: 'Bytt til standardprotokoll', cost: 1.5, delay: 0, note: 'Løser det med en gang.' },
    ],
  },
];

export const eventById = (id: string) => {
  const e = EVENTS.find(e => e.id === id);
  if (!e) throw new Error(`Unknown event ${id}`);
  return e;
};
