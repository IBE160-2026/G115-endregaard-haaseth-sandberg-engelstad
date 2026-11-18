import { describe, expect, it } from 'vitest';
import { brand, brandCss, brandTokens, contrast, FALLBACK_BRAND, forDark, mix, normalizeBrand, onColor, parseHex, rgba } from './brand';

describe('colour maths', () => {
  it('parses and mixes hex colours', () => {
    expect(parseHex('#ff8000')).toEqual([255, 128, 0]);
    expect(parseHex('red')).toBeNull();
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#123456', '#abcdef', 0)).toBe('#123456');
    expect(rgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });
  it('picks readable text on the accent', () => {
    expect(onColor('#003366')).toBe('#ffffff');
    expect(onColor('#ffd400')).toBe('#000000');
  });
  it('lightens a dark accent until it reads on a dark surface', () => {
    const c = forDark('#134a3d');
    expect(contrast(c, '#202020')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('brand tokens', () => {
  const b = normalizeBrand({ ...FALLBACK_BRAND, colors: { accent: '#c8102e', accent_dark: '#7a0a1c' } });
  it('derives soft variants for both themes', () => {
    const { light, dark } = brandTokens(b);
    expect(light['--accent']).toBe('#c8102e');
    expect(light['--accent-dark']).toBe('#7a0a1c');
    expect(light['--accent-soft']).toBe('rgba(200, 16, 46, 0.1)');
    expect(light['--on-accent']).toBe('#ffffff');
    expect(contrast(dark['--accent'], '#202020')).toBeGreaterThanOrEqual(4.5);
  });
  it('writes a stylesheet with a dark-mode block', () => {
    const css = brandCss(b);
    expect(css).toContain(':root { --accent: #c8102e;');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
  });
});

describe('normalizeBrand', () => {
  it('fills in what a brand file lacks', () => {
    const b = normalizeBrand({ name: 'Fjordhus', colors: { accent: 'blå', accent_dark: '' } });
    expect(b.name).toBe('Fjordhus');
    expect(b.colors.accent).toBe(FALLBACK_BRAND.colors.accent);
    expect(b.tagline).toBe(FALLBACK_BRAND.tagline);
    expect(b.catalogue).toEqual([]);
  });
  it('strips a leading slash from the logo path', () => {
    expect(normalizeBrand({ logo: '/brand/x.svg' }).logo).toBe('brand/x.svg');
  });
  it('loads a complete brand (brand.json or the fallback)', () => {
    expect(brand.name).toBeTruthy();
    expect(parseHex(brand.colors.accent)).not.toBeNull();
    expect(brand.logo).not.toMatch(/^\//);
  });
});
