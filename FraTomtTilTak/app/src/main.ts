// Landing page for Fra tomt til tak while the new app is built.
// The v0.5 game code under src/ is no longer started from here and is removed in story 1.6;
// the v0.5 game itself is kept as the git tag `v0.5`.
// The look is the "filmisk" concept (2026-11-22), not yet adopted in DESIGN.md.
import { mountLanding } from './landing';

mountLanding(document.querySelector<HTMLDivElement>('#app')!);
