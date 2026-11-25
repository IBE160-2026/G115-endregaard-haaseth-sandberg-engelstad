import { beforeEach, describe, expect, it, vi } from 'vitest';

// The landing page needs a real DOM; here we only check that mountApp hands it the root.
vi.mock('../landing', () => ({ mountLanding: vi.fn() }));

import { mountLanding } from '../landing';
import { mountApp, type AppDeps } from './app';

const deps: AppDeps = { now: () => 0, seed: () => 115 };

describe('mountApp', () => {
  beforeEach(() => vi.mocked(mountLanding).mockClear());

  it('shows the landing page in the given root', () => {
    const root = {} as HTMLElement;
    mountApp(root, deps);
    expect(mountLanding).toHaveBeenCalledTimes(1);
    expect(mountLanding).toHaveBeenCalledWith(root);
  });

  it('ignores the old v0.5 URL parameters (?uke, ?scene)', () => {
    vi.stubGlobal('location', { search: '?uke=12&scene=walk', href: 'http://localhost/?uke=12&scene=walk' });
    try {
      const root = {} as HTMLElement;
      mountApp(root, deps);
      expect(mountLanding).toHaveBeenCalledTimes(1);
      expect(mountLanding).toHaveBeenCalledWith(root);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
