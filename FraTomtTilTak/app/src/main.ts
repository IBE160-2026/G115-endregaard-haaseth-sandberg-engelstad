// Entry point for Fra tomt til tak: real dependencies in, mountApp does the rest (AD-17).
// The v0.5 game was removed in story 1.6 and is kept as the git tag `v0.5`.
import { mountApp, type AppDeps } from './ui/app';

const realDeps: AppDeps = {
  now: () => Date.now(),
  seed: () => crypto.getRandomValues(new Uint32Array(1))[0],
};

mountApp(document.querySelector<HTMLDivElement>('#app')!, realDeps);
