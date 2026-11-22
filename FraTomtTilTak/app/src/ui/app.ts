// The app's single entry point (AD-17). main.ts passes the real dependencies;
// tests will pass fakes. Until the new app is built it shows the landing page.
import { mountLanding } from '../landing';

/** Everything with an effect that the app needs from outside. Grows with the stories. */
export interface AppDeps {
  /** Wall-clock time in ms, only for the decision log's `at`. */
  now(): number;
  /** The seed for a new playthrough: an unsigned 32-bit integer (0 to 2^32 − 1), as mulberry32 takes. */
  seed(): number;
}

export function mountApp(root: HTMLElement, _deps: AppDeps): void {
  mountLanding(root);
}
