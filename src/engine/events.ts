// Event catalogue: challenges the AI roles raise, with the owner's options.
// All prices and delays are proposals for the team to check (like Appendix A).
import type { Mode } from './scenario';

/** A consequence that lands some weeks after the choice (state, not chance). */
export interface LaterEffect {
  /** Weeks after the choice. */
  weeks: number;
  /** MNOK added when it lands. */
  cost: number;
  /** Weeks the task stands still when it lands (cost only if the task is finished). */
  delay: number;
  /** The task it hits (default: the decision's task). */
  taskId?: string;
  /** What happens, for the feed and the preview. */
  text: string;
}

export interface EventOption {
  id: string;
  label: string;
  /** Extra cost, MNOK (negative for a saving). */
  cost: number;
  /** Weeks the affected task stands still (drying, waiting, rework). */
  delay: number;
  /** Optional change to how the affected task is worked from now on. */
  setMode?: Mode;
  /** Change to the task's remaining hours, as a fraction (−0.2 = 20 % fewer hours). */
  work?: number;
  /** A consequence that lands later. */
  later?: LaterEffect;
  note: string;
}

/**
 * risk: costs something. opportunity: saves money at the cost of time.
 * change: a change request (approve now, or defer/decline and pay later).
 * strategy: a planning choice that always comes when a key discipline starts.
 */
export type EventKind = 'risk' | 'opportunity' | 'change' | 'strategy';

export const KIND_LABEL: Record<EventKind, string> = {
  risk: 'Risiko', opportunity: 'Mulighet', change: 'Endringsønske', strategy: 'Strategivalg',
};

export interface EventDef {
  id: string;
  kind: EventKind;
  title: string;
  icon: string;
  /** Person who raises the challenge. */
  raisedBy: string;
  /** The event hits the first of these tasks that is not finished. */
  taskIds: string[];
  description: string;
  /** Can the owner start it with a scenario button? */
  button: boolean;
  /** Chance per week while the task is active (0 = only by button or trigger). Fires at most once. */
  chance: number;
  /** 'start': always raised (no roll) in the week the task becomes ready. */
  trigger?: 'start';
  /** A follow-up: can only fire after this earlier choice. */
  requires?: { eventId: string; optionId: string };
  /** A custom one-line dilemma (otherwise worked out from the options). */
  dilemma?: string;
  options: EventOption[];
}

export const EVENTS: EventDef[] = [
  {
    id: 'water', kind: 'risk', title: 'Vann i kjeller', icon: 'risks/R6-water.svg', raisedBy: 'site', taskIds: ['C', 'D', 'E', 'L'], button: true, chance: 0.04,
    description: 'Grunnvann trenger inn i byggegropen etter kraftig regn. Arbeidet i kjelleren må stoppe til vannet er borte og betongen er tørr.',
    options: [
      { id: 'pump', label: 'Installer fast pumpe', cost: 0.8, delay: 2, note: 'Pumpe og drenering, 2 uker tørking.' },
      { id: 'rent', label: 'Lei midlertidig pumpe', cost: 0.3, delay: 4, note: 'Billigere nå, men lengre tørketid.' },
      { id: 'wait', label: 'Avvent og la det tørke', cost: 1.2, delay: 6, note: 'Ingen pumpe. Fuktskader må utbedres etterpå.' },
    ],
  },
  {
    id: 'rock', kind: 'risk', title: 'Forvitret fjell', icon: 'risks/R1-weathered-rock.svg', raisedBy: 'foreman-D', taskIds: ['D'], button: true, chance: 0.1,
    description: 'Deler av fjellet under fundamentene er forvitret og tåler ikke lasten, slik det skjedde under Høyblokka.',
    options: [
      { id: 'refound', label: 'Ny fundamentering i sonen', cost: 6, delay: 4, note: 'Sikker løsning, men dyr og tidkrevende.' },
      { id: 'grout', label: 'Injisering og bolting', cost: 3.5, delay: 2, note: 'Styrker fjellet der det står.' },
      { id: 'piles', label: 'Omprosjekter til peler', cost: 2, delay: 3, note: 'Billigere, men krever ny prosjektering.' },
    ],
  },
  {
    id: 'soil', kind: 'risk', title: 'Forurenset grunn', icon: 'risks/R2-contaminated-soil.svg', raisedBy: 'foreman-C', taskIds: ['C'], button: true, chance: 0.08,
    description: 'Gravemassene inneholder forurensning fra gammel bebyggelse i sentrum.',
    options: [
      { id: 'deposit', label: 'Kjør til godkjent deponi', cost: 4, delay: 1, note: 'Rask, men deponiavgiften er høy.' },
      { id: 'clean', label: 'Rens massene på stedet', cost: 2.5, delay: 3, note: 'Billigere, men tar tid.' },
      { id: 'survey', label: 'Stopp og kartlegg først', cost: 1, delay: 4, note: 'Minst kostnad, mest ventetid.' },
    ],
  },
  {
    id: 'frost', kind: 'risk', title: 'Frost i betongen', icon: 'risks/R7-frost.svg', raisedBy: 'foreman-E', taskIds: ['E'], button: true, chance: 0.07,
    description: 'Kuldeperiode. Betongen herder ikke under 5 °C uten tiltak.',
    options: [
      { id: 'heat', label: 'Vinterstøp med oppvarming', cost: 0.6, delay: 0, note: 'Telt og varme, ingen stans.' },
      { id: 'pause', label: 'Pause støpingen', cost: 0, delay: 2, note: 'Venter på mildvær.' },
    ],
  },
  {
    id: 'wind', kind: 'risk', title: 'Kranstans i sterk vind', icon: 'risks/R8-wind.svg', raisedBy: 'foreman-F', taskIds: ['F'], button: true, chance: 0.06,
    description: 'Vindkast over grensen for tårnkranen. Råbygget står uten løft.',
    options: [
      { id: 'mobile', label: 'Lei mobilkran for kritiske løft', cost: 0.5, delay: 1, note: 'Holder de viktigste løftene i gang.' },
      { id: 'wait', label: 'Vent til vinden løyer', cost: 0, delay: 2, note: 'Ingen ekstra kostnad.' },
    ],
  },
  {
    id: 'facade', kind: 'risk', title: 'Forsinket fasadeleveranse', icon: 'risks/R3-facade-delivery.svg', raisedBy: 'foreman-G', taskIds: ['G'], button: true, chance: 0.08,
    description: 'Leverandøren av fasadeelementene melder kapasitetsproblemer.',
    options: [
      { id: 'wait', label: 'Vent på leveransen', cost: 0, delay: 4, note: 'Ingen ekstra kostnad.' },
      { id: 'supplier', label: 'Bytt til ny leverandør', cost: 3, delay: 1, note: 'Dyrt, men raskt.' },
      { id: 'resequence', label: 'Monter i annen rekkefølge', cost: 1, delay: 2, note: 'Starter med fasadene som er levert.' },
    ],
  },
  {
    id: 'electricians', kind: 'risk', title: 'Mangel på elektrikere', icon: 'risks/R4-electrician-shortage.svg', raisedBy: 'foreman-I', taskIds: ['I'], button: true, chance: 0.08,
    description: 'Flere elektrikere er tatt ut til et annet prosjekt.',
    options: [
      { id: 'accept', label: 'Aksepter forsinkelsen', cost: 0, delay: 3, note: 'Jobber videre med færre folk.' },
      { id: 'hire', label: 'Lei inn fra byrå', cost: 0, delay: 0, setMode: 'hire', note: 'Ekstra innleie (1,5) resten av disiplinen.' },
      { id: 'overtime', label: 'Kjør overtid', cost: 0, delay: 1, setMode: 'overtime', note: 'Overtid (1,3) resten av disiplinen.' },
    ],
  },
  {
    id: 'integration', kind: 'risk', title: 'Integrasjonsfeil i automasjonen', icon: 'risks/R5-automation-integration.svg', raisedBy: 'foreman-J', taskIds: ['J'], button: true, chance: 0.1,
    description: 'SD-anlegget og adgangskontrollen snakker ikke sammen.',
    options: [
      { id: 'debug', label: 'Feilsøk selv', cost: 0, delay: 2, note: 'Egen kompetanse, tar tid.' },
      { id: 'specialist', label: 'Hent leverandørens spesialist', cost: 0.6, delay: 1, note: 'Rask hjelp, timepris.' },
      { id: 'standard', label: 'Bytt til standardprotokoll', cost: 1.5, delay: 0, note: 'Løser det med en gang.' },
    ],
  },
  {
    id: 'reuse', kind: 'opportunity', title: 'Gjenbruk av steinmasser', icon: 'opportunities/reuse.svg', raisedBy: 'foreman-C', taskIds: ['C'], button: true, chance: 0.08,
    description: 'Sprengsteinen kan knuses og brukes som fyllmasse i stedet for å kjøres bort. Det krever et knuseverk på plassen.',
    options: [
      { id: 'reuse', label: 'Knus og gjenbruk massene', cost: -1.6, delay: 2, note: 'Sparer transport og deponi, men knusingen tar tid.' },
      { id: 'haul', label: 'Kjør massene bort som planlagt', cost: 0, delay: 0, note: 'Ingen endring.' },
    ],
  },
  {
    id: 'steel', kind: 'opportunity', title: 'Billigere stål fra ny leverandør', icon: 'opportunities/discount.svg', raisedBy: 'pm', taskIds: ['F'], button: true, chance: 0.08,
    description: 'En ny leverandør tilbyr armering og stål billigere, men med lengre leveringstid.',
    options: [
      { id: 'switch', label: 'Bytt leverandør', cost: -2.2, delay: 3, note: 'Lavere pris, tre uker venting på første leveranse.' },
      { id: 'split', label: 'Del leveransen', cost: -0.9, delay: 1, note: 'Litt billigere, litt venting.' },
      { id: 'keep', label: 'Behold dagens leverandør', cost: 0, delay: 0, note: 'Ingen endring.' },
    ],
  },
  {
    id: 'facade-discount', kind: 'opportunity', title: 'Rabatt mot senere fasadeleveranse', icon: 'opportunities/discount.svg', raisedBy: 'foreman-G', taskIds: ['G'], button: true, chance: 0.08,
    description: 'Fasadeleverandøren gir rabatt hvis de kan levere etter en annen kunde.',
    options: [
      { id: 'accept', label: 'Ta rabatten', cost: -2.6, delay: 4, note: 'Billigere fasade, fire uker senere.' },
      { id: 'decline', label: 'Avslå', cost: 0, delay: 0, note: 'Leveransen kommer som planlagt.' },
    ],
  },

  // ---- v0.3: strategy choices, always raised when the discipline starts ----
  {
    id: 'strategy-C', kind: 'strategy', trigger: 'start', title: 'Strategi: sprengning og graving', icon: 'decisions/decision-point.svg', raisedBy: 'pm', taskIds: ['C'], button: false, chance: 0,
    description: 'Byggegropen skal sprenges ut midt i sentrum. Metoden avgjør hvor mange timer laget bruker på rensk og sikring.',
    dilemma: 'Dilemma: investere i metode nå for færre timer, eller følge grunnplanen?',
    options: [
      { id: 'plan', label: 'Følg grunnplanen', cost: 0, delay: 0, note: 'Konvensjonell sprengning med eget lag.' },
      { id: 'presplit', label: 'Kjernebor og forsiktig sprengning', cost: 0.9, delay: 2, work: -0.25, note: 'To uker planlegging, deretter mindre rensk og sikring.' },
      { id: 'overtime', label: 'Kjør overtid fra første dag', cost: 0, delay: 0, setMode: 'overtime', note: 'Gropen blir raskere ferdig, men overtidstimene koster mer.' },
    ],
  },
  {
    id: 'strategy-F', kind: 'strategy', trigger: 'start', title: 'Strategi: råbygg for kontorblokka', icon: 'decisions/decision-point.svg', raisedBy: 'pm', taskIds: ['F'], button: false, chance: 0,
    description: 'Råbygget er den største disiplinen på kritisk linje. Byggemetoden må bestemmes før første dekke.',
    dilemma: 'Dilemma: dyrere prefabrikkerte elementer og færre timer, eller plasstøp og flere uker på kritisk linje?',
    options: [
      { id: 'cast', label: 'Plasstøpt som planlagt', cost: 0, delay: 0, note: 'Kjent metode, ingen endring.' },
      { id: 'prefab', label: 'Prefabrikkerte dekker og søyler', cost: 5, delay: 2, work: -0.3, note: 'Elementene koster mer og har to ukers leveringstid, men gir 30 % færre timer.' },
      { id: 'overtime', label: 'Plasstøp med overtid', cost: 0, delay: 0, setMode: 'overtime', note: 'Raskere råbygg, overtidstimene koster mer.' },
      { id: 'cheap-form', label: 'Billig forskaling', cost: 0, delay: 0, work: 0.05, later: { weeks: 24, cost: 1.8, delay: 1, taskId: 'G', text: 'Ujevne dekkekanter må rettes før fasaden kan monteres' }, note: 'Ingen kostnad nå, men litt mer arbeid og retting senere.' },
    ],
  },
  {
    id: 'strategy-H', kind: 'strategy', trigger: 'start', title: 'Strategi: VVS-installasjon', icon: 'decisions/decision-point.svg', raisedBy: 'pm', taskIds: ['H'], button: false, chance: 0,
    description: 'VVS har slakk mot overleveringen. Lønner det seg å bruke penger på å gjøre disiplinen raskere eller billigere?',
    dilemma: 'Dilemma: en disiplin med slakk vinner ingenting på fart. Lønner det seg å investere her?',
    options: [
      { id: 'plan', label: 'Tradisjonell montasje', cost: 0, delay: 0, note: 'Rør og kanaler monteres på stedet.' },
      { id: 'modules', label: 'Prefabrikkerte tekniske moduler', cost: 1.6, delay: 1, work: -0.15, note: 'Moduler fra fabrikk, færre timer på plassen.' },
      { id: 'overtime', label: 'Kjør overtid for å bli tidlig ferdig', cost: 0, delay: 0, setMode: 'overtime', note: 'VVS blir ferdig før, men har slakk fra før.' },
    ],
  },
  {
    id: 'strategy-N', kind: 'strategy', trigger: 'start', title: 'Strategi: prøvedrift og overlevering', icon: 'decisions/decision-point.svg', raisedBy: 'pm', taskIds: ['N'], button: false, chance: 0,
    description: 'Siste etappe. Departementene vil flytte inn tidlig, men feil som ikke fanges i prøvedriften må rettes i garantitiden.',
    dilemma: 'Dilemma: raskere overlevering nå, eller grundig prøvedrift som unngår feil senere?',
    options: [
      { id: 'full', label: 'Full prøvedrift som planlagt', cost: 0, delay: 0, note: 'Alle anlegg testes samlet før overtakelse.' },
      { id: 'stages', label: 'Overlever i etapper', cost: 0.5, delay: 0, work: -0.25, note: 'Etasjene overleveres fortløpende.' },
      { id: 'short', label: 'Kort prøvedrift', cost: 0.1, delay: 0, work: -0.5, later: { weeks: 4, cost: 1.4, delay: 0, text: 'Feil som ikke ble fanget i prøvedriften rettes i garantitiden' }, note: 'Halve timene nå, men feil må rettes etter overlevering.' },
    ],
  },

  // ---- v0.3: change requests ----
  {
    id: 'change-security', kind: 'change', title: 'Endringsønske: skjerpet sikring', icon: 'decisions/resource-allocation.svg', raisedBy: 'pm', taskIds: ['F'], button: true, chance: 0.04,
    description: 'Departementene ber om skjerpet sikring i fasade og dekker. Det er enklest å bygge inn mens råbygget pågår.',
    options: [
      { id: 'approve', label: 'Godkjenn nå', cost: 1.4, delay: 1, note: 'Bygges inn i råbygget etter én ukes omprosjektering.' },
      { id: 'defer', label: 'Utsett til innredningen', cost: 0, delay: 0, later: { weeks: 30, cost: 2.4, delay: 1, taskId: 'K', text: 'Sikringen må bygges inn i ferdige vegger' }, note: 'Ingen kostnad nå, dyrere ombygging senere.' },
      { id: 'decline', label: 'Avslå', cost: 0, delay: 0, later: { weeks: 45, cost: 3.2, delay: 0, taskId: 'N', text: 'Departementet krever sikringen likevel ved overtakelse' }, note: 'Kravet kan komme tilbake ved overtakelsen.' },
    ],
  },
  {
    id: 'change-solar', kind: 'change', title: 'Endringsønske: solceller på taket', icon: 'decisions/resource-allocation.svg', raisedBy: 'foreman-G', taskIds: ['G'], button: true, chance: 0.04,
    description: 'Statsbygg vil ha solceller på taket for å nå miljømålene. Taket er åpent nå.',
    options: [
      { id: 'approve', label: 'Godkjenn nå', cost: 1.1, delay: 1, note: 'Monteres mens taket er åpent.' },
      { id: 'prepare', label: 'Klargjør nå, monter senere', cost: 0.3, delay: 0, later: { weeks: 16, cost: 1.0, delay: 0, taskId: 'N', text: 'Solcellene monteres på det ferdige taket' }, note: 'Føringer nå, panelene senere.' },
      { id: 'decline', label: 'Avslå', cost: 0, delay: 0, later: { weeks: 26, cost: 1.9, delay: 0, taskId: 'N', text: 'Taket må åpnes igjen for solceller etter krav fra Statsbygg' }, note: 'Ingen kostnad nå, men kravet kommer trolig igjen.' },
    ],
  },
  {
    id: 'change-layout', kind: 'change', title: 'Endringsønske: ny planløsning', icon: 'decisions/resource-allocation.svg', raisedBy: 'foreman-K', taskIds: ['K'], button: true, chance: 0.05,
    description: 'En leietaker vil ha åpent landskap i stedet for cellekontorer i to etasjer.',
    options: [
      { id: 'approve', label: 'Godkjenn nå', cost: 0.9, delay: 2, note: 'Tegningene endres og vegger flyttes.' },
      { id: 'overtime', label: 'Godkjenn og kjør overtid', cost: 0.9, delay: 0, setMode: 'overtime', note: 'Ingen stans, men overtid resten av disiplinen.' },
      { id: 'decline', label: 'Avslå', cost: 0, delay: 0, later: { weeks: 10, cost: 1.6, delay: 1, taskId: 'N', text: 'Leietakeren bygger om likevel, og overleveringen må vente' }, note: 'Leietakeren kan bygge om etter innflytting.' },
    ],
  },
  {
    id: 'change-charging', kind: 'change', title: 'Endringsønske: ladepunkter i kjelleren', icon: 'decisions/resource-allocation.svg', raisedBy: 'foreman-L', taskIds: ['L'], button: true, chance: 0.05,
    description: 'Statsbygg vil ha ladepunkter for elbiler i kjelleren.',
    options: [
      { id: 'approve', label: 'Godkjenn nå', cost: 0.6, delay: 2, note: 'Kabler og skap legges inn med kjellerteknikken.' },
      { id: 'decline', label: 'Avslå', cost: 0, delay: 0, later: { weeks: 30, cost: 1.3, delay: 0, taskId: 'N', text: 'Ladepunktene må ettermonteres i ferdig kjeller' }, note: 'Ettermontering blir dyrere.' },
    ],
  },

  // ---- v0.3: follow-ups, only possible after an earlier choice ----
  {
    id: 'pump-fail', kind: 'risk', title: 'Den leide pumpen svikter', icon: 'risks/R6-water.svg', raisedBy: 'site', taskIds: ['C', 'D', 'E', 'L'], button: false, chance: 0.15, requires: { eventId: 'water', optionId: 'rent' },
    description: 'Den midlertidige pumpen har stoppet, og vannet stiger igjen i gropen.',
    options: [
      { id: 'buy', label: 'Kjøp fast pumpe nå', cost: 0.8, delay: 1, note: 'Det burde vært gjort første gang.' },
      { id: 'repair', label: 'Reparer og lei en ny', cost: 0.3, delay: 3, note: 'Billig, men gropen står under vann lenger.' },
    ],
  },
  {
    id: 'grout-leak', kind: 'risk', title: 'Lekkasje gjennom injisert sone', icon: 'risks/R1-weathered-rock.svg', raisedBy: 'foreman-E', taskIds: ['E'], button: false, chance: 0.12, requires: { eventId: 'rock', optionId: 'grout' },
    description: 'Fjellet som ble injisert slipper vann gjennom mot kjellerveggen.',
    options: [
      { id: 'seal', label: 'Etterinjiser sonen', cost: 0.7, delay: 1, note: 'Tetter sprekkene.' },
      { id: 'membrane', label: 'Legg ekstra membran', cost: 1.2, delay: 0, note: 'Dyrere, men ingen stans.' },
    ],
  },
  {
    id: 'steel-quality', kind: 'risk', title: 'Kvalitetsavvik fra ny stålleverandør', icon: 'risks/R3-facade-delivery.svg', raisedBy: 'foreman-F', taskIds: ['F'], button: false, chance: 0.12, requires: { eventId: 'steel', optionId: 'switch' },
    description: 'En leveranse fra den nye leverandøren har feil sertifikater og målavvik.',
    options: [
      { id: 'reject', label: 'Avvis leveransen', cost: 0, delay: 2, note: 'Ny leveranse, men laget venter.' },
      { id: 'fix', label: 'Rett avvikene på plassen', cost: 0.6, delay: 0, note: 'Kontroll og tilpasning på plassen.' },
    ],
  },

  // ---- v0.3: more risks and opportunities ----
  {
    id: 'crane', kind: 'risk', title: 'Kranen havarerer', icon: 'risks/R8-wind.svg', raisedBy: 'site', taskIds: ['G'], button: true, chance: 0.04,
    description: 'Svingkransen på tårnkranen har sprukket. Fasadeelementene kan ikke løftes på plass.',
    options: [
      { id: 'rent', label: 'Lei mobilkran straks', cost: 0.9, delay: 1, note: 'Rask, men dyr leie.' },
      { id: 'repair', label: 'Reparer tårnkranen', cost: 0.3, delay: 3, note: 'Billig, men deler må bestilles.' },
    ],
  },
  {
    id: 'theft', kind: 'risk', title: 'Tyveri av kobberkabel', icon: 'risks/R4-electrician-shortage.svg', raisedBy: 'foreman-I', taskIds: ['I'], button: true, chance: 0.05,
    description: 'Kabeltromler er stjålet fra riggområdet i helgen.',
    options: [
      { id: 'replace', label: 'Bestill ny kabel', cost: 0.5, delay: 2, note: 'Vanlig leveringstid.' },
      { id: 'express', label: 'Ekspresslevering', cost: 0.9, delay: 0, note: 'Kabelen er på plass mandag.' },
    ],
  },
  {
    id: 'inspection', kind: 'risk', title: 'Pålegg fra Arbeidstilsynet', icon: 'risks/R2-contaminated-soil.svg', raisedBy: 'site', taskIds: ['E', 'F'], button: true, chance: 0.03,
    description: 'Tilsynet fant mangler i rekkverk og stillas og gir pålegg om utbedring.',
    options: [
      { id: 'fix', label: 'Utbedre med innleid stillaslag', cost: 0.5, delay: 0, note: 'Alt rettes på to dager.' },
      { id: 'own', label: 'La eget lag utbedre', cost: 0, delay: 1, note: 'Laget tas ut av produksjonen en uke.' },
    ],
  },
  {
    id: 'formwork', kind: 'opportunity', title: 'Gjenbruk av forskaling fra kjelleren', icon: 'opportunities/reuse.svg', raisedBy: 'foreman-F', taskIds: ['F'], button: true, chance: 0.05,
    description: 'Systemforskalingen fra kjelleren kan tilpasses kontorblokka i stedet for å leie ny.',
    options: [
      { id: 'reuse', label: 'Tilpass og gjenbruk', cost: -0.8, delay: 1, note: 'Sparer leie, en uke tilpasning.' },
      { id: 'rent', label: 'Lei ny som planlagt', cost: 0, delay: 0, note: 'Ingen endring.' },
    ],
  },
  {
    id: 'lift-crew', kind: 'opportunity', title: 'Rabatt på heismontasje', icon: 'opportunities/discount.svg', raisedBy: 'foreman-O', taskIds: ['O'], button: true, chance: 0.08,
    description: 'Heisleverandøren gir rabatt hvis montasjelaget kan komme etter et annet oppdrag.',
    options: [
      { id: 'accept', label: 'Ta rabatten', cost: -0.6, delay: 3, note: 'Tre uker senere montasje.' },
      { id: 'decline', label: 'Behold planen', cost: 0, delay: 0, note: 'Ingen endring.' },
    ],
  },
];

export const eventById = (id: string) => {
  const e = EVENTS.find(e => e.id === id);
  if (!e) throw new Error(`Unknown event ${id}`);
  return e;
};
