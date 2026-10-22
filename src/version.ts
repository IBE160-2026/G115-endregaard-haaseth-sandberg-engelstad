// The simulator version shown in the game, taken from package.json (0.2.0 → "v0.2").
import { version } from '../package.json';

export const VERSION = `v${version.split('.').slice(0, 2).join('.')}`;
