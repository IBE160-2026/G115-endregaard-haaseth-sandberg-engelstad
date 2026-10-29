// Reads brand.json (app root) on the server; the catalogue goes into the cached system prompt.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Brand, CatalogueItem } from '../src/contract/brand.ts';
import { MAX_CATALOGUE } from './prompt.ts';

const isItem = (i: unknown): i is CatalogueItem => {
  const x = i as CatalogueItem | null;
  return !!x && typeof x.sku === 'string' && typeof x.name === 'string' && typeof x.unit === 'string' && Number.isFinite(x.price_nok);
};

/** The brand from <root>/brand.json, or null if it is missing or broken (the prompt then has no catalogue). */
export function loadBrand(root: string): Brand | null {
  const file = join(root, 'brand.json');
  if (!existsSync(file)) return null;
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as Partial<Brand>;
    if (typeof raw.company !== 'string' || typeof raw.name !== 'string') return null;
    const catalogue = (Array.isArray(raw.catalogue) ? raw.catalogue : []).filter(isItem).slice(0, MAX_CATALOGUE);
    return { ...(raw as Brand), catalogue };
  } catch {
    return null;
  }
}
