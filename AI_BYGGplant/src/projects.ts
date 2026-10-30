// Several projects in one browser, plus export and import as a JSON file. Pure; main.ts does the storage.
import { newSession, normalizeSession, type Session } from './session';

export interface StoredProject {
  id: string;
  updated: string;
  session: Session;
  /** The scripted demo dialog this project plays (an AppConfig.demoDialogs id); unset = not chosen yet. */
  demo?: string;
}

export interface Store {
  active: string;
  projects: StoredProject[];
}

const FILE_TAG = 'ai-byggplant';

let counter = 0;
const newId = () => `p${Date.now().toString(36)}${(counter++).toString(36)}`;

export const projectTitle = (s: Session) => s.project.name || 'Nytt prosjekt';

export function addProject(store: Store, session = newSession()): Store {
  const p = { id: newId(), updated: new Date().toISOString(), session };
  return { active: p.id, projects: [p, ...store.projects] };
}

export const activeProject = (store: Store) => store.projects.find((p) => p.id === store.active) ?? store.projects[0];

export function updateActive(store: Store, session: Session): Store {
  return {
    ...store,
    projects: store.projects.map((p) => (p.id === store.active ? { ...p, session, updated: new Date().toISOString() } : p)),
  };
}

/** Removes the active project; there is always at least one left. */
export function removeActive(store: Store): Store {
  const projects = store.projects.filter((p) => p.id !== store.active);
  return projects.length ? { active: projects[0].id, projects } : addProject({ active: '', projects: [] });
}

/**
 * Reads the saved store. Falls back to the v0.1 single session (its own key), and to a fresh
 * project when nothing is saved or the data is broken.
 */
export function loadStore(raw: string | null, legacySession: string | null): Store {
  try {
    if (raw) {
      const s = JSON.parse(raw) as Store;
      const projects = s.projects.map((p) => ({ ...p, session: normalizeSession(p.session) }));
      if (projects.length) return { active: s.active, projects };
    }
  } catch {
    /* fall through */
  }
  try {
    if (legacySession) return addProject({ active: '', projects: [] }, normalizeSession(JSON.parse(legacySession)));
  } catch {
    /* fall through */
  }
  return addProject({ active: '', projects: [] });
}

export const exportProject = (s: Session) => JSON.stringify({ app: FILE_TAG, version: 3, session: s }, null, 2);

export function importProject(text: string): Session {
  const data = JSON.parse(text) as { app?: string; session?: unknown };
  if (data.app !== FILE_TAG) throw new Error('Filen er ikke et AI Byggplan-prosjekt.');
  return normalizeSession(data.session);
}

/** A file name from the project name: "Dobbel garasje" → "dobbel-garasje.byggplan.json". */
export const fileName = (s: Session) =>
  `${projectTitle(s).toLowerCase().replace(/[^a-z0-9æøå]+/g, '-').replace(/^-|-$/g, '') || 'prosjekt'}.byggplan.json`;
