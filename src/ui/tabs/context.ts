import type { GameState } from '../../engine/game';
import type { Scenario } from '../../engine/scenario';
import type { Modes, SimulationResult } from '../../engine/simulate';

/** What every tab renders from. Tabs return HTML; events are wired in main.ts. */
export interface TabContext {
  scenario: Scenario;
  modes: Modes;
  /** The forecast to completion (or the static simulation when there is no game). */
  result: SimulationResult;
  baseline: SimulationResult;
  game?: GameState;
  /** Selected person in the org chart. */
  selected?: string;
}

/** Icon URL that also works when the app is served from a sub-path. */
export const iconUrl = (path: string) => `${import.meta.env.BASE_URL}icons/${path}`;

export const icon = (path: string, size = 32) =>
  `<img src="${iconUrl(path)}" width="${size}" height="${size}" alt="">`;

/** Critical tasks as a list – parallel critical tasks are not a chain. */
export const criticalList = (r: SimulationResult) => r.criticalPath.join(', ');
