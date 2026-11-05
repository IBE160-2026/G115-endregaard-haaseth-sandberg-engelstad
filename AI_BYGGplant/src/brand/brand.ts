// White-label: the supplier's name, logo and colours come from brand.json (WS1 owns the file).
// The colour maths is pure so it can be tested; applyBrand is the only part that touches the DOM.
import type { Brand } from '../contract/brand';
import { hexColor } from '../contract/types';
import brandJson from '../../brand.json';

/** Fills the gaps if brand.json lacks a field, so the app still starts. Fictional, like the demo brand. */
export const FALLBACK_BRAND: Brand = {
  name: 'AI Byggplan',
  company: 'Demo Byggsystem AS',
  tagline: 'Beskriv bygget – se det reise seg mens du snakker',
  logo: 'brand/logo.svg',
  colors: { accent: '#1f6f5c', accent_dark: '#134a3d' },
  dealer: { name: 'Demo-forhandler', email: 'post@example.no', phone: '+47 00 00 00 00' },
  catalogue: [],
};


/** Fills in what a brand file lacks, so a half-written brand.json cannot break the shell. */
export function normalizeBrand(raw: Partial<Brand> | null | undefined): Brand {
  const b = raw ?? {};
  const str = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v : fallback);
  return {
    name: str(b.name, FALLBACK_BRAND.name),
    company: str(b.company, FALLBACK_BRAND.company),
    tagline: str(b.tagline, FALLBACK_BRAND.tagline),
    logo: str(b.logo, FALLBACK_BRAND.logo).replace(/^\/+/, ''),
    colors: {
      accent: hexColor(b.colors?.accent) ?? FALLBACK_BRAND.colors.accent,
      accent_dark: hexColor(b.colors?.accent_dark) ?? hexColor(b.colors?.accent) ?? FALLBACK_BRAND.colors.accent_dark,
    },
    dealer: { ...FALLBACK_BRAND.dealer, ...(b.dealer ?? {}) },
    catalogue: Array.isArray(b.catalogue) ? b.catalogue : [],
  };
}

export const brand: Brand = normalizeBrand(brandJson as Partial<Brand>);

// ---- colour maths ----

type Rgb = [number, number, number];

export function parseHex(hex: string): Rgb | null {
  const h = hexColor(hex);
  return h ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb : null;
}

export const toHex = (c: Rgb) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;

/** a → b by t (0 = a, 1 = b). */
export function mix(a: string, b: string, t: number): string {
  const x = parseHex(a) ?? [0, 0, 0];
  const y = parseHex(b) ?? [0, 0, 0];
  return toHex(x.map((v, i) => v + (y[i] - v) * t) as Rgb);
}

export const rgba = (hex: string, alpha: number) => `rgba(${(parseHex(hex) ?? [0, 0, 0]).join(', ')}, ${alpha})`;

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const c = (parseHex(hex) ?? [0, 0, 0]).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white text, whichever reads better on the colour. */
export const onColor = (bg: string) => (contrast(bg, '#ffffff') >= contrast(bg, '#000000') ? '#ffffff' : '#000000');

/** Lightens a colour until it reads on a dark surface (contrast ≥ 4.5 against #202020). */
export function forDark(hex: string): string {
  for (let t = 0; t <= 1; t += 0.05) {
    const c = mix(hex, '#ffffff', t);
    if (contrast(c, '#202020') >= 4.5) return c;
  }
  return '#ffffff';
}

export type Tokens = Record<string, string>;

/** The CSS custom properties for the light and the dark theme. */
export function brandTokens(b: Brand): { light: Tokens; dark: Tokens } {
  const accent = b.colors.accent;
  const deep = b.colors.accent_dark;
  const light: Tokens = {
    '--accent': accent,
    '--accent-dark': deep,
    '--accent-hover': mix(accent, deep, 0.5),
    '--accent-soft': rgba(accent, 0.1),
    '--accent-softer': rgba(accent, 0.05),
    '--accent-line': rgba(accent, 0.35),
    '--accent-glow': rgba(accent, 0.55),
    '--accent-text': contrast(accent, '#ffffff') >= 4.5 ? accent : deep,
    '--on-accent': onColor(accent),
    '--backdrop-tint': rgba(accent, 0.22),
    '--backdrop-tint-2': rgba(mix(accent, '#f4b860', 0.6), 0.18),
  };
  const da = forDark(accent);
  const dark: Tokens = {
    '--accent': da,
    '--accent-dark': mix(da, '#000000', 0.25),
    '--accent-hover': mix(da, '#ffffff', 0.15),
    '--accent-soft': rgba(da, 0.16),
    '--accent-softer': rgba(da, 0.07),
    '--accent-line': rgba(da, 0.4),
    '--accent-glow': rgba(da, 0.6),
    '--accent-text': da,
    '--on-accent': onColor(da),
    '--backdrop-tint': rgba(deep, 0.45),
    '--backdrop-tint-2': rgba(mix(deep, '#6b4a1c', 0.5), 0.3),
  };
  return { light, dark };
}

const block = (sel: string, t: Tokens) => `${sel} { ${Object.entries(t).map(([k, v]) => `${k}: ${v};`).join(' ')} }`;

/** A stylesheet that overrides the default accent in both themes. */
export function brandCss(b: Brand): string {
  const { light, dark } = brandTokens(b);
  return `${block(':root', light)}\n@media (prefers-color-scheme: dark) { ${block(':root', dark)} }`;
}

/** The public URL of a file under assets/ (served from the base path). */
export const assetUrl = (path: string) => `${import.meta.env?.BASE_URL ?? '/'}${path.replace(/^\/+/, '')}`;

/** Colours, title and favicon. */
export function applyBrand(b: Brand, doc: Document = document) {
  let style = doc.getElementById('brand-css');
  if (!style) {
    style = doc.createElement('style');
    style.id = 'brand-css';
    doc.head.append(style);
  }
  style.textContent = brandCss(b);
  doc.title = b.name;
  let icon = doc.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!icon) {
    icon = doc.createElement('link');
    icon.rel = 'icon';
    doc.head.append(icon);
  }
  icon.type = b.logo.endsWith('.svg') ? 'image/svg+xml' : '';
  icon.href = assetUrl(b.logo);
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', b.colors.accent);
}
