// Generates the simulator's icon set (Windows 11 / Fluent style) as SVG files.
// Run: node assets/icons/generate.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

// Tile gradients per category (top, bottom).
const PALETTE = {
  people: ['#5AB0FF', '#0F6CBD'],
  buildings: ['#3CCBBA', '#0B7A75'],
  disciplines: ['#FFBE5C', '#E36A00'],
  budget: ['#76D26A', '#107C10'],
  schedule: ['#BBA4FF', '#6B4FD8'],
  risks: ['#FF8080', '#C50F1F'],
  decisions: ['#86AEFF', '#3A46C9'],
  ai: ['#E58BFF', '#5B3FD9'],
};

// Glyphs on a 24×24 grid, drawn as white strokes. `fill` parts are drawn solid.
const G = {
  // Apps (tabs)
  people: `<circle cx="9" cy="8" r="3"/><path d="M3 19.5c0-3.4 2.7-5.3 6-5.3s6 1.9 6 5.3"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.3c3 .2 5.4 1.7 5.4 5"/>`,
  buildings: `<rect x="4.5" y="3.5" width="9" height="17" rx="1"/><path d="M13.5 9.5h5a1 1 0 0 1 1 1v10M2.5 20.5h19M7.5 7h3M7.5 10.5h3M7.5 14h3M16 13h1.5M16 16.5h1.5"/>`,
  disciplines: `<rect x="3" y="8.5" width="18" height="11.5" rx="2"/><path d="M9 8.5V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5v2M3 13.5h18"/><rect x="10.5" y="12" width="3" height="3" rx=".6"/>`,
  budget: `<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M5.5 9v0M18.5 15v0"/>`,
  schedule: `<path d="M3.5 3v18h17"/><rect x="6" y="5" width="7" height="3" rx="1.5"/><rect x="9.5" y="10" width="8" height="3" rx="1.5"/><rect x="13.5" y="15" width="6" height="3" rx="1.5"/>`,

  view3d: `<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M4 7.4l8 4.6 8-4.6M12 12v9.2"/>`,
  play: `<path class="f" d="M8 5.5v13l10.5-6.5z"/>`,
  pause: `<path d="M8.5 5.5v13M15.5 5.5v13"/>`,
  stepWeek: `<path class="f" d="M5 5.5v13l9-6.5z"/><path d="M18 5.5v13"/>`,
  newGame: `<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.5H15"/>`,

  // People
  owner: `<circle cx="12" cy="7" r="3.2"/><path d="M5.5 20.5c0-3.9 2.9-6.4 6.5-6.4s6.5 2.5 6.5 6.4"/><path class="f" d="M12 14.4l-1.2 2.3 1.2 3 1.2-3z"/>`,
  manager: `<circle cx="8.5" cy="7.5" r="3"/><path d="M2.5 20c0-3.6 2.7-5.7 6-5.7 1.3 0 2.5.3 3.5.9"/><rect x="14" y="10.5" width="7" height="10" rx="1.2"/><path d="M16 10.5V9.5h3v1M16 14h3M16 17h3"/>`,
  siteManager: `<path d="M5 10.5h14M6.5 10.5a5.5 5.5 0 0 1 11 0M12 5v3M8.6 11.2a3.4 3.4 0 0 0 6.8 0M5.5 21c0-3.3 2.9-5.2 6.5-5.2s6.5 1.9 6.5 5.2M9.5 16.3l2.5 2.7 2.5-2.7"/>`,
  foreman: `<path d="M4.5 12h15M6.2 12a5.8 5.8 0 0 1 11.6 0M12 6v3.5M8.5 12.6a3.5 3.5 0 0 0 7 0M6 21c0-2.9 2.7-4.7 6-4.7s6 1.8 6 4.7"/>`,

  // Buildings
  block: `<rect x="5" y="3.5" width="14" height="17" rx="1.2"/><path d="M3 20.5h18"/>`,
  phase: `<rect x="3" y="8" width="7" height="12.5" rx="1"/><rect x="11" y="3.5" width="10" height="17" rx="1"/><path d="M2 20.5h20"/>`,
  aBlock: `<rect x="6" y="2" width="12" height="18.5" rx="1"/><path d="M3 20.5h18M6 14.5h12M6 16.5h12M6 18.5h12"/>`,
  hub: `<path d="M2.5 8h19M8 8V4h8v4"/><ellipse cx="12" cy="15.2" rx="7.5" ry="4.8"/><ellipse cx="12" cy="15.2" rx="3" ry="1.8"/><path d="M19.5 15.2h2M2.5 15.2h2"/>`,
  tower: `<rect x="7" y="2.5" width="10" height="18" rx="1"/><path d="M3 20.5h18"/>`,
  basement: `<path d="M2.5 9.5h19M8 9.5V4h8v5.5"/><rect x="4.5" y="11.5" width="15" height="4" rx=".8"/><rect x="4.5" y="17" width="15" height="4" rx=".8"/>`,
  park: `<path d="M12 21v-5.5M12 3a4.6 4.6 0 0 1 4.5 5.6 3.8 3.8 0 0 1-1.3 7H8.8a3.8 3.8 0 0 1-1.3-7A4.6 4.6 0 0 1 12 3zM4 21h16"/>`,

  // Disciplines (task IDs from the scenario)
  A: `<path d="M5 19l1-4.5L15.5 5l3.5 3.5L9.5 18z"/><path d="M13.5 7l3.5 3.5M3.5 21h17"/>`,
  C: `<path d="M12 2.8l1.9 4.6 4.7-1.6-2.2 4.4 4.4 2.3-4.8 1.1 1.2 4.8-4.4-2.4-.8 5-.8-5-4.4 2.4 1.2-4.8-4.8-1.1 4.4-2.3-2.2-4.4 4.7 1.6z"/>`,
  D: `<rect x="3.5" y="4.5" width="17" height="4" rx=".8"/><path d="M6.5 8.5v9l1 2.5 1-2.5v-9M11 8.5v9l1 2.5 1-2.5v-9M15.5 8.5v9l1 2.5 1-2.5v-9"/>`,
  E: `<path d="M2.5 7.5h19M2.5 7.5l2-2M7 7.5l2-2M11.5 7.5l2-2M16 7.5l2-2"/><rect x="4.5" y="10" width="15" height="4.5" rx=".8"/><rect x="4.5" y="16" width="15" height="4.5" rx=".8"/>`,
  F: `<path d="M6.5 21V3.5h13M6.5 3.5L3 7.5h3.5M16 3.5V8M14.5 8h3v2h-3z"/><path d="M10 21v-8h7.5v8M10 17h7.5M13.75 13v8M3 21h18"/>`,
  L: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.4"/><path d="M12 10.6c-.4-2.6.6-4.6 3-5.1M13.3 12.6c2.4 1 3.4 3 2.3 5.2M10.7 12.6c-2.1 1.6-4.3 1.6-5.6-.4"/>`,
  G: `<path d="M3.5 8.5L12 4l8.5 4.5"/><rect x="5" y="8.5" width="14" height="12" rx=".8"/><path d="M5 12.5h14M5 16.5h14M9.7 8.5v12M14.3 8.5v12"/>`,
  O: `<rect x="5.5" y="2.5" width="13" height="19" rx="1.5"/><path d="M12 2.5v19M7.3 10.5l1.5-2 1.5 2M13.7 13.5l1.5 2 1.5-2"/>`,
  H: `<path d="M12 3.2c3.2 3.8 5.3 6.8 5.3 9.6a5.3 5.3 0 0 1-10.6 0c0-2.8 2.1-5.8 5.3-9.6z"/><path d="M9.6 13.6a2.5 2.5 0 0 0 2.4 2.4"/>`,
  I: `<path d="M13.5 2.5L5.5 13.5h5.8l-1 8L18.5 10h-6z"/>`,
  K: `<rect x="3.5" y="3.5" width="13.5" height="5.5" rx="1.5"/><path d="M17 6.2h2.5v5.8H12v3.2"/><rect x="10.5" y="15.2" width="3" height="6" rx="1"/>`,
  J: `<rect x="7" y="7" width="10" height="10" rx="1.5"/><rect x="10" y="10" width="4" height="4" rx=".5"/><path d="M9.5 3.5V7M14.5 3.5V7M9.5 17v3.5M14.5 17v3.5M3.5 9.5H7M3.5 14.5H7M17 9.5h3.5M17 14.5h3.5"/>`,
  N: `<circle cx="8" cy="15.5" r="4.2"/><path d="M11 12.5l8.5-8.5M16 7.5l2.2 2.2M13.5 10l1.8 1.8"/>`,

  // Risks
  R1: `<path d="M2.5 19.5l6.5-11 4 6.2 2.6-3.7 5.9 8.5z"/><path d="M9 8.5l1 3.2-1.6 2 1.2 3.2"/>`,
  R2: `<path d="M3 14h18M3 17.5h18M3 21h18"/><path d="M12 2.8c2.1 2.5 3.4 4.3 3.4 6a3.4 3.4 0 0 1-6.8 0c0-1.7 1.3-3.5 3.4-6z"/>`,
  R3: `<path d="M2.5 6.5h10.5v10H2.5zM13 9.5h4.2l3.3 3.4v3.6H13"/><circle cx="6.2" cy="17.5" r="1.9"/><circle cx="16.8" cy="17.5" r="1.9"/>`,
  R4: `<circle cx="9.5" cy="7.5" r="3.2"/><path d="M3 20c0-3.6 2.9-5.8 6.5-5.8 1.7 0 3.2.5 4.3 1.3M16 14.5h5.5"/>`,
  R5: `<path d="M10.5 13.5L8 16a3 3 0 0 1-4.2-4.2L6.3 9.3M13.5 10.5L16 8a3 3 0 0 1 4.2 4.2l-2.5 2.5M9 3.5v2.2M3.5 9h2.2M15 20.5v-2.2M20.5 15h-2.2"/>`,

  R6: `<path d="M2 6.5h4M18 6.5h4M5 6.5v14h14v-14"/><path d="M5 12c1.4 0 1.4-1.2 2.8-1.2s1.4 1.2 2.8 1.2 1.4-1.2 2.8-1.2 1.4 1.2 2.8 1.2 1.4-1.2 2.8-1.2M5 16.5c1.4 0 1.4-1.2 2.8-1.2s1.4 1.2 2.8 1.2 1.4-1.2 2.8-1.2 1.4 1.2 2.8 1.2 1.4-1.2 2.8-1.2"/>`,
  R7: `<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M9.5 4l2.5 2.2L14.5 4M9.5 20l2.5-2.2 2.5 2.2"/>`,
  R8: `<path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h8"/>`,

  // Decisions, modes, AI, milestones
  resource: `<path d="M4 8h14.5M15 4.5L18.5 8 15 11.5M20 16H5.5M9 12.5L5.5 16 9 19.5"/>`,
  riskResponse: `<path d="M12 2.8l7.5 3v5.4c0 4.6-3.1 8.2-7.5 10.2-4.4-2-7.5-5.6-7.5-10.2V5.8z"/><path d="M8.8 12l2.3 2.3 4.3-4.5"/>`,
  normal: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.3 2"/>`,
  overtime: `<circle cx="10" cy="13" r="7.5"/><path d="M10 9v4l2.8 1.8M19.5 2.5v5.5M16.75 5.25h5.5"/>`,
  hire: `<circle cx="9" cy="7.5" r="3.2"/><path d="M2.5 20c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8M19 8v6.5M15.75 11.25h6.5"/>`,
  advisor: `<path d="M10.5 3c.7 4.6 3 6.9 7.6 7.6-4.6.7-6.9 3-7.6 7.6-.7-4.6-3-6.9-7.6-7.6 4.6-.7 6.9-3 7.6-7.6z"/><path d="M18 14.5c.3 2 1.3 3 3.3 3.3-2 .3-3 1.3-3.3 3.3-.3-2-1.3-3-3.3-3.3 2-.3 3-1.3 3.3-3.3z"/>`,
  fork: `<path d="M12 21.5V13.5M12 13.5L5.5 7M12 13.5L18.5 7M5.5 11V7h4M18.5 11V7h-4"/>`,
  milestone: `<path d="M12 3l7.5 9-7.5 9-7.5-9z"/>`,
};

const ICONS = [
  // [category, file, glyph, label, letter?, colour category (apps only)?]
  ['apps', 'people', 'people', 'Menneskene', null, 'people'],
  ['apps', 'buildings', 'buildings', 'Byggene', null, 'buildings'],
  ['apps', 'disciplines', 'disciplines', 'Disiplinene', null, 'disciplines'],
  ['apps', 'budget', 'budget', 'Budsjett', null, 'budget'],
  ['apps', 'schedule', 'schedule', 'Fremdriftsplan', null, 'schedule'],
  ['apps', 'view3d', 'view3d', '3D-byggeplass', null, 'buildings'],
  ['controls', 'play', 'play', 'Spill av', null, 'decisions'],
  ['controls', 'pause', 'pause', 'Pause', null, 'decisions'],
  ['controls', 'step', 'stepWeek', 'Neste uke', null, 'decisions'],
  ['controls', 'new-game', 'newGame', 'Nytt spill', null, 'decisions'],

  ['people', 'owner', 'owner', 'Prosjekteier'],
  ['people', 'project-manager', 'manager', 'Prosjektleder'],
  ['people', 'site-manager', 'siteManager', 'Site manager'],
  ['people', 'foreman', 'foreman', 'Formann'],

  // Phases as in the real project (regjeringen.no, statsbudsjettet 2027).
  ['buildings', 'bt1', 'phase', 'Byggetrinn 1 (ferdig 2026)', '1'],
  ['buildings', 'bt1-a', 'aBlock', 'BT1 – A-blokka (11 etasjer)', 'A'],
  ['buildings', 'bt1-d', 'block', 'BT1 – D-blokka (nybygg)', 'D'],
  ['buildings', 'bt1-h', 'tower', 'BT1 – Høyblokka (rehabilitert)', 'H'],
  ['buildings', 'bt1-basement', 'hub', 'BT1 – Kjelleranlegget (logistikk og rotunde)'],
  ['buildings', 'bt2', 'phase', 'Byggetrinn 2', '2'],
  ['buildings', 'bt2-c', 'block', 'BT2 del I – C-blokka (nybygg)', 'C'],
  ['buildings', 'bt2-basement', 'basement', 'BT2 del I – Kjeller 2'],
  ['buildings', 'bt2-g', 'block', 'BT2 del II – G-blokka (rehabilitering)', 'G'],
  ['buildings', 'bt3', 'phase', 'Byggetrinn 3', '3'],
  ['buildings', 'bt3-e', 'block', 'BT3 – E-blokka (nybygg)', 'E'],
  ['buildings', 'park', 'park', 'BT2/BT3 – Parken'],

  ['disciplines', 'A-design', 'A', 'A Prosjektering og byggesøknad'],
  ['disciplines', 'C-blasting', 'C', 'C Sprengning og graving'],
  ['disciplines', 'D-foundations', 'D', 'D Fundamentering og spunt'],
  ['disciplines', 'E-basement-structure', 'E', 'E Kjeller råbygg'],
  ['disciplines', 'F-office-structure', 'F', 'F Kontor råbygg'],
  ['disciplines', 'L-basement-fitout', 'L', 'L Kjeller innredning og teknikk'],
  ['disciplines', 'G-roof-facade', 'G', 'G Tak og fasade'],
  ['disciplines', 'O-lifts', 'O', 'O Heiser'],
  ['disciplines', 'H-hvac', 'H', 'H VVS'],
  ['disciplines', 'I-electrical', 'I', 'I Elkraft'],
  ['disciplines', 'K-interior', 'K', 'K Innvendige arbeider'],
  ['disciplines', 'J-automation', 'J', 'J Tele og automatisering'],
  ['disciplines', 'N-handover', 'N', 'N Prøvedrift og overlevering'],

  ['risks', 'R1-weathered-rock', 'R1', 'R1 Forvitret fjell'],
  ['risks', 'R2-contaminated-soil', 'R2', 'R2 Forurenset grunn'],
  ['risks', 'R3-facade-delivery', 'R3', 'R3 Forsinket fasadeleveranse'],
  ['risks', 'R4-electrician-shortage', 'R4', 'R4 Mangel på elektrikere'],
  ['risks', 'R5-automation-integration', 'R5', 'R5 Integrasjonsfeil automasjon'],
  ['risks', 'R6-water', 'R6', 'Vann i kjeller'],
  ['risks', 'R7-frost', 'R7', 'Frost i betongen'],
  ['risks', 'R8-wind', 'R8', 'Kranstans i sterk vind'],

  ['decisions', 'resource-allocation', 'resource', 'Ressursallokering'],
  ['decisions', 'risk-response', 'riskResponse', 'Risikorespons'],
  ['decisions', 'mode-normal', 'normal', 'Normaltid (1,0)'],
  ['decisions', 'mode-overtime', 'overtime', 'Overtid (1,3)'],
  ['decisions', 'mode-hire', 'hire', 'Ekstra innleie (1,5)'],
  ['decisions', 'decision-point', 'fork', 'Beslutningspunkt (forgrening)'],
  ['schedule', 'milestone', 'milestone', 'Milepæl'],
  ['ai', 'ai-advisor', 'advisor', 'KI-rådgiver'],
];

const FONT = `'Segoe UI Variable Display','Segoe UI',system-ui,sans-serif`;

function tile(id, [top, bottom], inner, size = 48) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
    <linearGradient id="${id}-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect x="3" y="4" width="42" height="42" rx="10" fill="#000" opacity=".18"/>
  <rect x="3" y="2.5" width="42" height="42" rx="10" fill="url(#${id}-bg)"/>
  <rect x="3" y="2.5" width="42" height="42" rx="10" fill="url(#${id}-sheen)"/>
  <rect x="3.5" y="3" width="41" height="41" rx="9.5" fill="none" stroke="#fff" stroke-opacity=".22"/>
  ${inner}
</svg>
`;
}

function glyph(name, { x = 10, y = 8.5, scale = 28 / 24 } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${G[name].replace(/class="f"/g, 'fill="#fff" stroke="none"')}</g>`;
}

function letterBadge(letter, cx = 24, w = 13, y = 15) {
  // Label plate on the building face.
  return `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="12.5" rx="3" fill="#fff"/><text x="${cx}" y="${y + 10.2}" text-anchor="middle" font-family="${FONT}" font-size="11" font-weight="700" fill="#0B7A75">${letter}</text>`;
}

function disciplineBadge(disc) {
  // Small orange disc with the discipline glyph, bottom-right of the foreman tile.
  const [top, bottom] = PALETTE.disciplines;
  return `<defs><linearGradient id="b-${disc}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
  <circle cx="37" cy="36" r="10" fill="url(#b-${disc})" stroke="#fff" stroke-width="2"/>
  ${glyph(disc, { x: 30, y: 29, scale: 14 / 24 })}`;
}

const manifest = [];
const write = (category, file, svg, label) => {
  const rel = `${category}/${file}.svg`;
  mkdirSync(join(OUT, category), { recursive: true });
  writeFileSync(join(OUT, rel), svg);
  manifest.push({ category, file: rel, label });
};

for (const [category, file, g, label, letter, appColour] of ICONS) {
  const colours = PALETTE[appColour ?? category];
  if (!colours) throw new Error(`No palette for ${category}/${file}`);
  // On the two-building glyph, the plate sits on the taller building.
  const inner = letter ? glyph(g) + letterBadge(letter, g === 'phase' ? 28.7 : 24, g === 'tower' ? 9 : 13, g === 'aBlock' ? 12.5 : 15) : glyph(g);
  write(category, file, tile(file, colours, inner), label);
}

// One foreman per discipline: the foreman glyph with the discipline as a badge.
for (const [category, file, disc, label] of ICONS.filter(i => i[0] === 'disciplines')) {
  const inner = glyph('foreman', { x: 7, y: 6 }) + disciplineBadge(disc);
  write('people', `foreman-${file}`, tile(`foreman-${file}`, PALETTE.people, inner), `Formann – ${label.slice(2)}`);
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

// Preview sheet styled as a Windows 11 window (follows the system light/dark theme).
const SECTIONS = [
  ['apps', 'Apper (faner)'],
  ['controls', 'Spillkontroller'],
  ['people', 'Menneskene'],
  ['buildings', 'Byggene'],
  ['disciplines', 'Disiplinene'],
  ['risks', 'Risikoer'],
  ['decisions', 'Beslutninger og arbeidsmodus'],
  ['schedule', 'Fremdriftsplan'],
  ['ai', 'KI'],
];
const cards = cat => manifest.filter(m => m.category === cat)
  .map(m => `<figure><img src="${m.file}" width="48" height="48" alt=""><figcaption>${m.label}</figcaption></figure>`).join('\n');
writeFileSync(join(OUT, 'preview.html'), `<!doctype html>
<html lang="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Simulator-ikoner</title>
<style>
  :root { --desk:#dfe7f2; --win:#f3f3f3; --card:#fbfbfb; --stroke:rgba(0,0,0,.08); --text:#1b1b1b; --sub:#5f5f5f; --accent:#0f6cbd; }
  @media (prefers-color-scheme: dark) { :root { --desk:#1a2433; --win:#202020; --card:#2b2b2b; --stroke:rgba(255,255,255,.08); --text:#fff; --sub:#c5c5c5; --accent:#4cc2ff; } }
  * { box-sizing:border-box; }
  body { margin:0; min-height:100vh; padding:32px 16px; background:radial-gradient(ellipse at 20% 0%, #9fb9e0 0%, transparent 60%), var(--desk); font-family:'Segoe UI Variable Text','Segoe UI',system-ui,sans-serif; color:var(--text); }
  .window { max-width:1100px; margin:0 auto; background:var(--win); border:1px solid var(--stroke); border-radius:8px; box-shadow:0 8px 32px rgba(0,0,0,.28); overflow:hidden; }
  .titlebar { display:flex; align-items:center; gap:10px; height:40px; padding-left:14px; font-size:12px; }
  .titlebar img { width:16px; height:16px; }
  .titlebar .caption { margin-left:auto; display:flex; }
  .titlebar .caption span { width:46px; height:40px; display:grid; place-items:center; font-size:10px; color:var(--sub); }
  main { padding:8px 28px 28px; }
  h1 { font:600 28px 'Segoe UI Variable Display','Segoe UI',sans-serif; margin:4px 0 20px; }
  h2 { font:600 14px 'Segoe UI Variable Text','Segoe UI',sans-serif; margin:24px 0 8px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:4px; }
  figure { margin:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding:14px 8px; background:var(--card); border:1px solid var(--stroke); border-radius:6px; text-align:center; }
  figcaption { font-size:12px; color:var(--sub); line-height:1.3; }
</style>
</head>
<body>
<div class="window">
  <div class="titlebar"><img src="apps/schedule.svg" alt=""> Regjeringskvartalet Light – ikoner<div class="caption"><span>&#x2014;</span><span>&#x25A1;</span><span>&#x2715;</span></div></div>
  <main>
    <h1>Brikkene i simulatoren</h1>
    ${SECTIONS.map(([cat, title]) => `<h2>${title}</h2>\n<div class="grid">\n${cards(cat)}\n</div>`).join('\n')}
  </main>
</div>
</body>
</html>
`);
console.log(`Wrote ${manifest.length} icons to ${OUT}`);
