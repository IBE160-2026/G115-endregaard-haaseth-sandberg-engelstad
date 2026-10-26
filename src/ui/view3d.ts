// The full-screen 3D construction site: A-blokka (11 floors) over the basement complex, in the city.
// The scene reads a SceneState (see scene/visuals.ts) and never changes the game. Everything that
// moves (progress, crane, workers, trucks, weather, day and night) is presentation time only.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GameState } from '../engine/game';
import type { Scenario } from '../engine/scenario';
import {
  FLOOR_H, FLOORS, PIT, TOWER, BASEMENT_TASKS, figuresFor, sceneState, speakerSpot, taskSpot,
  type SceneState, type Spot,
} from './scene/visuals';
import { buildWorld, latticeMap, mullionMap, part, roadPoint, signMap, tiledBox } from './scene/world';
import { iconUrl } from './tabs/context';

export interface View3d {
  update(s: Scenario, g: GameState | undefined): void;
  /** Keeps the action clear of a panel covering the right side of the screen (px). */
  setInset(px: number): void;
  setActive(on: boolean): void;
  resetCamera(): void;
  dispose(): void;
}

const KIND_COLOR = { risk: '#c42b1c', opportunity: '#0f7b0f', change: '#005fb8', strategy: '#d29200' } as const;
const STALL_TEXT: Record<string, string> = {
  water: 'vann i gropa', 'pump-fail': 'pumpen sviktet', rock: 'dårlig fjell', soil: 'forurenset grunn', frost: 'frost',
  wind: 'sterk vind', facade: 'venter på fasade', electricians: 'mangler folk', integration: 'feilsøking',
};
const MAX_FIGURES = 120;
const TRUCKS = 7;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
const toV = (p: Spot) => new THREE.Vector3(p.x, p.y, p.z);

function mat(color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
}

export function createView3d(container: HTMLElement): View3d {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  const overlay = document.createElement('div');
  overlay.className = 'scene-overlay';
  container.appendChild(overlay);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc9d9ef, 220, 700);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 2000);
  camera.position.set(80, 62, 88);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 12, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 30;
  controls.maxDistance = 320;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.autoRotateSpeed = 0.35;

  const hemi = new THREE.HemisphereLight(0xdfeaff, 0x4d5a45, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 10, far: 500 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  const world = buildWorld(scene);

  // ---------- Materials (shared) ----------
  const M = {
    pitWall: mat(0x6e5a46, { flatShading: true }),
    earth: mat(0x8a6a4a, { flatShading: true }),
    concrete: mat(0xc9c6bf),
    precast: mat(0xe4e1da),
    slab: mat(0xb0aca4),
    formwork: mat(0xf7630c, { roughness: 0.6 }),
    core: mat(0x8f8c86),
    coreDone: mat(0x005fb8, { roughness: 0.5 }),
    roof: mat(0x5d6670),
    unit: mat(0xaeb6bf, { metalness: 0.4, roughness: 0.5 }),
    solar: mat(0x16325c, { metalness: 0.5, roughness: 0.25 }),
    water: new THREE.MeshStandardMaterial({ color: 0x2f7fd0, transparent: true, opacity: 0.78, roughness: 0.05, metalness: 0.1 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffc861, emissiveIntensity: 1.2 }),
    charger: new THREE.MeshStandardMaterial({ color: 0x0f7b0f, emissive: 0x0f7b0f, emissiveIntensity: 0.6 }),
    pump: mat(0x005fb8, { metalness: 0.3, roughness: 0.4 }),
    yellow: mat(0xf2b81c, { roughness: 0.55 }),
    dark: mat(0x2d3238, { roughness: 0.6 }),
    art: new THREE.MeshStandardMaterial({ color: 0xc0392b, emissive: 0x5a1a12, emissiveIntensity: 0.4 }),
    bollard: mat(0x4a4f55, { metalness: 0.6, roughness: 0.4 }),
    redLight: new THREE.MeshBasicMaterial({ color: 0xff2a2a }),
  };
  const glassMap = mullionMap();
  glassMap.repeat.set(1, 1);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x7fc4f0, map: glassMap, transparent: true, opacity: 0.62, roughness: 0.08, metalness: 0.35, envMapIntensity: 1 });
  const lattice = latticeMap();
  const latticeMat = new THREE.MeshStandardMaterial({ map: lattice, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });

  // ---------- The site: every part is created once and driven by the shown progress ----------
  const site = new THREE.Group();
  scene.add(site);
  const add = <T extends THREE.Object3D>(o: T, parent: THREE.Object3D = site) => { parent.add(o); return o; };

  // Pit walls and the rock that is blasted out as C progresses.
  const D = PIT.depth;
  add(part(M.pitWall, PIT.w, D, 0.8, 0, -D, -PIT.d / 2));
  add(part(M.pitWall, PIT.w, D, 0.8, 0, -D, PIT.d / 2));
  add(part(M.pitWall, 0.8, D, PIT.d, -PIT.w / 2, -D, 0));
  add(part(M.pitWall, 0.8, D, PIT.d, PIT.w / 2, -D, 0));
  const earth = add(part(M.earth, PIT.w - 0.8, D, PIT.d - 0.8, 0, -D, 0));

  // The excavator in the pit while C runs.
  const digger = add(new THREE.Group());
  digger.add(part(M.dark, 3.4, 0.8, 4.2, 0, 0, 0));
  digger.add(part(M.yellow, 3, 1.8, 3, 0, 0.8, 0.3));
  const arm = digger.add(new THREE.Group());
  arm.position.set(0, 2, -1.2);
  arm.add(part(M.yellow, 0.5, 0.5, 5, 0, 0, -2.5));
  arm.add(part(M.dark, 1.2, 1, 1, 0, -0.8, -5));

  // D: foundation slab and piles.
  const footing = add(part(M.slab, PIT.w - 1.2, 0.8, PIT.d - 1.2, 0, -D, 0));
  const piles: THREE.Mesh[] = [];
  for (let i = -2; i <= 2; i++) for (const z of [-6, 6]) piles.push(add(part(M.concrete, 0.9, 2, 0.9, i * 6.5, -D - 2, z)));

  // E: the two basement levels (walls rising, then the slabs).
  const bWalls = [
    add(part(M.concrete, PIT.w - 2, D, 0.6, 0, -D, -PIT.d / 2 + 1.2)),
    add(part(M.concrete, PIT.w - 2, D, 0.6, 0, -D, PIT.d / 2 - 1.2)),
    add(part(M.concrete, 0.6, D, PIT.d - 2.4, -PIT.w / 2 + 1.2, -D, 0)),
    add(part(M.concrete, 0.6, D, PIT.d - 2.4, PIT.w / 2 - 1.2, -D, 0)),
  ];
  const midSlab = add(part(M.slab, PIT.w - 2, 0.4, PIT.d - 2.4, 0, -D / 2, 0));
  const topSlab = add(part(M.slab, PIT.w - 2, 0.4, PIT.d - 2.4, 0, -0.4, 0));
  // L: lights in the basement, and charging points if the owner approved them.
  const bLights = Array.from({ length: 8 }, (_, i) => add(part(M.lamp, 2.6, 0.2, 0.5, -14 + i * 4, -D / 2 - 0.7, 0, false)));
  const chargers = Array.from({ length: 6 }, (_, i) => add(part(M.charger, 0.6, 1.4, 0.4, -12 + i * 4.5, -D / 2 + 0.4, PIT.d / 2 - 2.2, false)));
  const pump = add(new THREE.Group());
  pump.add(part(M.pump, 2, 1.6, 1.6, PIT.w / 2 - 3, -D + 0.2, -PIT.d / 2 + 3));
  pump.add(part(M.pump, 0.4, D + 1.5, 0.4, PIT.w / 2 - 2.2, -D + 0.2, -PIT.d / 2 + 3));
  pump.add(part(M.pump, 6, 0.4, 0.4, PIT.w / 2 + 0.8, 1.2, -PIT.d / 2 + 3));

  // F, G, H/I/K/J: the floors of the tower.
  const glassGeo = tiledBox(TOWER.w + 0.4, FLOOR_H - 0.5, TOWER.d + 0.4, 2.6, FLOOR_H - 0.5);
  interface Floor { group: THREE.Group; slab: THREE.Mesh; columns: THREE.Mesh[]; form: THREE.Mesh; glass: THREE.Mesh; inside: THREE.Mesh; insideMat: THREE.MeshStandardMaterial }
  const floors: Floor[] = [];
  for (let i = 0; i < FLOORS; i++) {
    const y = i * FLOOR_H;
    const group = add(new THREE.Group());
    group.position.y = y;
    const slab = add(part(M.slab, TOWER.w, 0.5, TOWER.d, 0, 0, 0), group);
    const columns: THREE.Mesh[] = [];
    for (const x of [-TOWER.w / 2 + 0.6, -TOWER.w / 6, TOWER.w / 6, TOWER.w / 2 - 0.6]) for (const z of [-TOWER.d / 2 + 0.6, TOWER.d / 2 - 0.6]) {
      columns.push(add(part(M.concrete, 0.7, FLOOR_H, 0.7, x, 0.5, z), group));
    }
    const form = add(part(M.formwork, TOWER.w + 1.2, 1, TOWER.d + 1.2, 0, 0.5, 0, false), group);
    const glass = add(new THREE.Mesh(glassGeo, glassMat), group);
    glass.position.y = 0.5;
    glass.castShadow = true;
    const insideMat = new THREE.MeshStandardMaterial({ color: 0xfff4dc, emissive: 0xffc861, emissiveIntensity: 0 });
    const inside = add(part(insideMat, TOWER.w - 2.4, FLOOR_H - 1.4, TOWER.d - 2.4, 0, 0.6, 0, false), group);
    floors.push({ group, slab, columns, form, glass, inside, insideMat });
  }
  const core = add(part(M.core, 4.4, 1, 4.4, 0, 0, 0));
  const lift = add(part(M.coreDone, 2, 2.6, 0.5, 0, 0, -2.5, false));
  const roof = add(new THREE.Group());
  roof.position.y = FLOORS * FLOOR_H;
  roof.add(part(M.roof, TOWER.w + 0.8, 0.6, TOWER.d + 0.8, 0, 0, 0));
  roof.add(part(M.roof, TOWER.w + 0.8, 1.2, 0.3, 0, 0.6, TOWER.d / 2 + 0.25));
  roof.add(part(M.roof, TOWER.w + 0.8, 1.2, 0.3, 0, 0.6, -TOWER.d / 2 - 0.25));
  const units = add(new THREE.Group(), roof);
  units.add(part(M.unit, 6, 2.4, 4, -6, 0.6, 0));
  units.add(part(M.unit, 4, 1.8, 3, 4, 0.6, 2));
  const modules = add(part(M.unit, 5, 3, 5, 8, 0.6, -3), roof);
  const solar = add(new THREE.Group(), roof);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    const pnl = part(M.solar, 2.6, 0.12, 1.6, -9 + c * 3.2, 1.2, -5 + r * 2.4, false);
    pnl.rotation.x = -0.35;
    solar.add(pnl);
  }
  const bollards = add(new THREE.Group());
  for (let i = 0; i < 9; i++) bollards.add(part(M.bollard, 0.6, 1, 0.6, -10 + i * 2.5, 0, TOWER.d / 2 + 9));
  const art = add(part(M.art, 3, FLOORS * FLOOR_H - 4, 0.4, -7, 0.5, TOWER.d / 2 + 0.6));

  // The tower crane: lattice mast, jib with trolley, hook and load.
  const crane = add(new THREE.Group());
  crane.position.set(TOWER.w / 2 + 6, 0, -TOWER.d / 2 - 2);
  const mastH = FLOORS * FLOOR_H + 14;
  const mast = add(new THREE.Mesh(tiledBox(2, mastH + D, 2, 2, 2), latticeMat), crane);
  mast.position.y = -D;
  const slew = add(new THREE.Group(), crane);
  slew.position.y = mastH;
  slew.add(new THREE.Mesh(tiledBox(46, 1.6, 1.6, 1.6, 1.6), latticeMat).translateX(15));
  slew.add(part(M.yellow, 3, 2.4, 2.6, 0, 0, 0));
  slew.add(part(M.dark, 12, 0.8, 1.2, -9, 0.4, 0));
  slew.add(part(M.concrete, 3, 2.6, 2.2, -13, -1, 0));
  slew.add(new THREE.Mesh(tiledBox(1.4, 6, 1.4, 1.4, 1.4), latticeMat));
  const tipLight = add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), M.redLight), slew);
  tipLight.position.set(37.5, 1.6, 0);
  const topLight = add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), M.redLight), slew);
  topLight.position.set(0, 6.4, 0);
  const trolley = add(part(M.dark, 1.6, 0.6, 1.6, 20, -0.6, 0, false), slew);
  const cable = add(part(M.dark, 0.08, 1, 0.08, 20, 0, 0, false), slew);
  const hook = add(new THREE.Group(), slew);
  const loadSlab = add(part(M.precast, 6, 0.4, 2.4, 0, -0.4, 0), hook);
  const loadGlass = add(part(glassMat, 4, 3, 0.3, 0, -3, 0), hook);

  // Water in the pit.
  const water = add(part(M.water, PIT.w - 1.6, 1, PIT.d - 1.6, 0, -D + 0.1, 0, false));

  // ---------- Workers (instanced figures in hi-vis; hired workers in Fluent blue) ----------
  const bodyGeo = new THREE.CapsuleGeometry(0.42, 1.1, 2, 6).translate(0, 0.98, 0);
  const headGeo = new THREE.SphereGeometry(0.36, 8, 6).translate(0, 2.1, 0);
  const bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ roughness: 0.7 }), MAX_FIGURES);
  const helmets = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), MAX_FIGURES);
  bodies.count = helmets.count = 0;
  // The figures move every frame, so a bounding sphere computed once would cull them wrongly.
  bodies.frustumCulled = helmets.frustumCulled = false;
  scene.add(bodies, helmets);
  const VEST = new THREE.Color(0xf7630c);
  const HIRED = new THREE.Color(0x0078d4);
  interface Figure { taskId: string; hired: boolean; pos: THREE.Vector3; to: THREE.Vector3; wait: number; speed: number; yaw: number }
  let figures: Figure[] = [];

  // ---------- Trucks on the ring road ----------
  interface Truck { group: THREE.Group; t: number; speed: number; drum?: THREE.Mesh }
  const truckCab = mat(0xf3f3f3);
  const truckBlue = mat(0x005fb8);
  const trucks: Truck[] = Array.from({ length: TRUCKS }, (_, i) => {
    const group = add(new THREE.Group(), scene);
    group.add(part(i % 2 ? truckBlue : truckCab, 2.4, 2.4, 2.2, 3.2, 0.5, 0));
    group.add(part(M.dark, 7.2, 0.6, 2.3, 0, 0.2, 0));
    let drum: THREE.Mesh | undefined;
    if (i % 3 === 1) {
      drum = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 4, 10), M.concrete);
      drum.rotation.z = Math.PI / 2 - 0.2;
      drum.position.set(-0.8, 2.1, 0);
      group.add(drum);
    } else {
      group.add(part(M.yellow, 4.4, 1.2, 2.3, -0.9, 0.8, 0));
      group.add(part(i % 3 === 2 ? glassMat : M.earth, 4, 0.8, 2, -0.9, 2, 0));
    }
    group.scale.setScalar(0.85);
    return { group, t: i / TRUCKS, speed: 0.012 + (i % 3) * 0.002, drum };
  });

  // ---------- Particles: blasting dust, snow, welding sparks and fireworks ----------
  function points(count: number, color: number, size: number, additive = false) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const m = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.9, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    const p = new THREE.Points(geo, m);
    p.frustumCulled = false;
    scene.add(p);
    return { p, pos: geo.getAttribute('position') as THREE.BufferAttribute, vel: new Float32Array(count * 3), m };
  }
  const dust = points(260, 0xcdbfa8, 1.4);
  const snow = points(1600, 0xffffff, 0.5);
  const sparks = points(80, 0xffd27a, 0.45, true);
  const fireworks = points(600, 0xffffff, 1.1, true);
  fireworks.p.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(600 * 3), 3));
  fireworks.m.vertexColors = true;
  fireworks.m.needsUpdate = true;
  for (let i = 0; i < 1600; i++) snow.pos.setXYZ(i, (Math.random() - 0.5) * 260, Math.random() * 90, (Math.random() - 0.5) * 260);
  let dustLife = 0;
  let nextBlast = 2;
  let fireLife = 0;
  let nextFire = 0.5;
  let shake = 0;

  // ---------- Beacons: red over stalls, coloured by kind over the open decision ----------
  interface Beacon { group: THREE.Group; ring: THREE.Mesh; beam: THREE.Mesh; sign: THREE.Sprite; ringMat: THREE.MeshBasicMaterial; beamMat: THREE.MeshBasicMaterial }
  const signs = new Map<string, THREE.SpriteMaterial>();
  const signFor = (text: string, color: string) => {
    const key = text + color;
    if (!signs.has(key)) signs.set(key, new THREE.SpriteMaterial({ map: signMap(text, color), depthTest: false, transparent: true }));
    return signs.get(key)!;
  };
  const beacons: Beacon[] = Array.from({ length: 6 }, () => {
    const group = add(new THREE.Group(), scene);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc42b1c, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.4, 32).rotateX(-Math.PI / 2), ringMat);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xc42b1c, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 40, 12, 1, true).translate(0, 20, 0), beamMat);
    const sign = new THREE.Sprite(signFor('!', '#c42b1c'));
    sign.scale.setScalar(5);
    sign.renderOrder = 10;
    group.add(ring, beam, sign);
    group.visible = false;
    return { group, ring, beam, sign, ringMat, beamMat };
  });

  // ---------- State ----------
  let target: SceneState = sceneState({ tasks: [] } as unknown as Scenario, undefined);
  let scenarioRef: Scenario | null = null;
  const shown: Record<string, number> = {};
  let floodShown = 0;
  let inset = 0;
  let width = 1;
  let height = 1;
  let lastFocus = '';
  let camTween: { from: number; to: number; t: number } | null = null;
  let lastInteraction = -1e9;
  let seed = -1;
  let logSeen = 0;
  let siteHeight = 0;

  controls.addEventListener('start', () => { lastInteraction = performance.now(); camTween = null; });

  // ---------- HTML overlay: task tags, the decision label and speech bubbles ----------
  interface Tag { el: HTMLElement; spot: THREE.Vector3; ttl?: number; born?: number }
  let tags: Tag[] = [];
  let bubbles: Tag[] = [];
  const tagLayer = document.createElement('div');
  const bubbleLayer = document.createElement('div');
  overlay.append(tagLayer, bubbleLayer);

  function rebuildTags(s: Scenario) {
    tagLayer.innerHTML = '';
    tags = [];
    for (const id of target.active) {
      const task = s.tasks.find(t => t.id === id)!;
      const stall = target.stalled.find(x => x.taskId === id);
      const el = document.createElement('div');
      el.className = `tag${stall ? ' stalled' : ''}`;
      const pct = Math.round((target.progress[id] ?? 0) * 100);
      el.innerHTML = `<b>${id}</b><span>${task.name}</span><i>${stall ? `står · ${STALL_TEXT[stall.cause ?? ''] ?? 'stans'}` : `${pct} %`}</i>`;
      tagLayer.append(el);
      tags.push({ el, spot: new THREE.Vector3() });
      el.dataset.task = id;
    }
    if (target.focus) {
      const el = document.createElement('div');
      el.className = `tag focus kind-${target.focus.kind}`;
      el.innerHTML = `<b>!</b><span>${target.focus.title}</span>`;
      el.dataset.task = target.focus.taskId;
      el.dataset.focus = '1';
      tagLayer.append(el);
      tags.push({ el, spot: new THREE.Vector3() });
    }
  }

  function addBubble(s: Scenario, from: string, text: string) {
    const person = s.people.find(p => p.id === from);
    const el = document.createElement('div');
    el.className = `bubble${from === 'pm' ? ' pm' : from === 'site' ? ' site' : ''}`;
    const name = person ? (person.taskId ? `${person.role} ${person.taskId}` : person.role) : from;
    const short = text.length > 140 ? `${text.slice(0, 137)}…` : text;
    el.innerHTML = `${person ? `<img src="${iconUrl(person.icon)}" alt="" width="28" height="28">` : ''}<div><b>${name}</b><p>${short}</p></div>`;
    bubbleLayer.append(el);
    bubbles.push({ el, spot: toV(speakerSpot(from, shown)).add(new THREE.Vector3(0, 4, 0)), ttl: 7000, born: performance.now() });
    while (bubbles.length > 3) bubbles.shift()!.el.remove();
  }

  // ---------- Applying the shown progress to the meshes ----------
  const v3 = new THREE.Vector3();
  function applyProgress(t: number) {
    const p = shown;
    const C = p.C ?? 0, Dd = p.D ?? 0, E = p.E ?? 0, L = p.L ?? 0, F = p.F ?? 0, G = p.G ?? 0, O = p.O ?? 0;
    const has = (f: string) => target.features.includes(f as never);

    const earthH = D * (1 - C);
    earth.visible = earthH > 0.05;
    earth.scale.y = Math.max(0.01, earthH);
    digger.visible = target.active.includes('C');
    digger.position.set(-6 + Math.sin(t * 0.13) * 5, -D + earthH, 2 + Math.cos(t * 0.09) * 3);
    digger.rotation.y = Math.sin(t * 0.4) * 0.8;
    arm.rotation.x = -0.35 + Math.sin(t * 1.6) * 0.3;

    footing.visible = Dd > 0;
    footing.scale.y = Math.max(0.01, 0.8 * Dd);
    for (const pile of piles) { pile.visible = Dd > 0; pile.scale.y = Math.max(0.01, 1.6 * Dd); pile.position.y = -D; }

    for (const w of bWalls) { w.visible = E > 0; w.scale.y = Math.max(0.01, D * E); }
    midSlab.visible = E >= 0.5;
    topSlab.visible = E >= 0.999;
    const lights = Math.round(L * bLights.length);
    bLights.forEach((l, i) => { l.visible = i < lights; });
    chargers.forEach(c => { c.visible = has('charging') && L > 0.3; });
    pump.visible = has('pump') && !target.done;

    const fLevel = F * FLOORS;
    const gLevel = G * FLOORS;
    const litLevel = (((p.H ?? 0) + (p.I ?? 0) + (p.K ?? 0) + (p.J ?? 0)) / 4) * FLOORS;
    const night = nightNow;
    floors.forEach((f, i) => {
      const frac = clamp01(fLevel - i);
      f.group.visible = frac > 0;
      if (!f.group.visible) return;
      for (const c of f.columns) { c.scale.y = Math.max(0.01, (FLOOR_H - 0.5) * ease(frac)); c.material = has('prefab') ? M.precast : M.concrete; }
      f.slab.material = has('prefab') ? M.precast : M.slab;
      f.form.visible = frac < 1 && !has('prefab');
      f.form.scale.y = Math.max(0.01, (FLOOR_H - 0.5) * frac);
      const g = clamp01(gLevel - i);
      f.glass.visible = g > 0;
      f.glass.scale.y = Math.max(0.01, ease(g));
      const lit = clamp01(litLevel - i);
      f.inside.visible = frac >= 1;
      f.insideMat.emissiveIntensity = lit * (0.25 + night * 1.6);
      f.insideMat.color.setRGB(0.55 + lit * 0.45, 0.55 + lit * 0.4, 0.55 + lit * 0.3);
    });
    const built = fLevel * FLOOR_H;
    core.visible = built > 0.1;
    core.scale.y = Math.max(0.01, built + (G >= 1 ? 2 : 0));
    core.material = O >= 0.999 ? M.coreDone : M.core;
    lift.visible = O > 0 && built > 4;
    lift.position.y = (Math.sin(t * 0.5) * 0.5 + 0.5) * Math.max(0, built - 3) * clamp01(O * 3);
    roof.visible = G >= 0.999;
    units.visible = (p.H ?? 0) > 0.5;
    modules.visible = has('modules') && (p.H ?? 0) > 0;
    solar.visible = has('solar');
    bollards.visible = has('security') && F > 0.5;
    art.visible = target.done;
    siteHeight = Math.max(built, 0);

    // The crane: slews and lifts while working, stands still (blinking) when stopped, sways in wind.
    crane.visible = target.crane !== 'off';
    if (crane.visible) {
      const working = target.crane === 'working';
      const sway = target.windy ? Math.sin(t * 2.3) * 0.05 : 0;
      if (working) slew.rotation.y = Math.sin(t * 0.22) * 1.3 + 0.6;
      slew.rotation.z = sway;
      const reach = working ? 14 + (Math.sin(t * 0.37) * 0.5 + 0.5) * 18 : 20;
      trolley.position.x = reach;
      const top = slew.position.y;
      const loadY = working ? siteHeight + 3 + (Math.sin(t * 0.6) * 0.5 + 0.5) * (top - siteHeight - 8) : top - 10;
      const drop = Math.max(2, top - loadY);
      cable.position.set(reach, -drop, 0);
      cable.scale.y = drop;
      hook.position.set(reach, -drop, 0);
      hook.rotation.z = target.windy ? Math.sin(t * 3.1) * 0.25 : 0;
      const glassJob = target.active.includes('G') && !target.active.includes('F');
      loadSlab.visible = working && !glassJob;
      loadGlass.visible = working && glassJob;
      const blink = target.crane === 'stopped' ? (Math.sin(t * 8) > 0 ? 1 : 0) : (Math.sin(t * 3) > 0.6 ? 1 : 0.25);
      M.redLight.color.setRGB(blink, blink * 0.16, blink * 0.16);
    }

    water.visible = floodShown > 0.02;
    water.scale.y = Math.max(0.01, floodShown * 2.6);
    water.position.y = -D + 0.1 + Math.sin(t * 1.2) * 0.05;
  }

  // ---------- Workers ----------
  const zone = new THREE.Vector3();
  function zoneFor(taskId: string, out: THREE.Vector3): { rx: number; rz: number } {
    out.copy(toV(taskSpot(taskId, shown)));
    if (BASEMENT_TASKS.includes(taskId)) {
      out.set(0, taskId === 'C' ? -D * (1 - (shown.C ?? 0)) : taskId === 'L' ? -D / 2 + 0.2 : -D + 0.8 * (shown.D ?? 0), 0);
      return { rx: PIT.w / 2 - 2.5, rz: PIT.d / 2 - 2.5 };
    }
    if (taskId === 'A') return { rx: 5, rz: 5 };
    if (taskId === 'N') return { rx: 9, rz: 3 };
    out.y = (taskId === 'F' ? Math.floor((shown.F ?? 0) * FLOORS) : Math.floor(out.y / FLOOR_H)) * FLOOR_H + 0.5;
    out.y = Math.min(out.y, (FLOORS - 1) * FLOOR_H + 0.5);
    out.x = 0; out.z = 0;
    return { rx: TOWER.w / 2 - 1.2, rz: TOWER.d / 2 - 1.2 };
  }
  function pickTarget(f: Figure) {
    const r = zoneFor(f.taskId, zone);
    f.to.set(zone.x + (Math.random() * 2 - 1) * r.rx, zone.y, zone.z + (Math.random() * 2 - 1) * r.rz);
  }
  function syncFigures() {
    const want = figuresFor(target.crews, MAX_FIGURES);
    const next: Figure[] = [];
    const pool = [...figures];
    for (const w of want) {
      const i = pool.findIndex(f => f.taskId === w.taskId && f.hired === w.hired);
      if (i >= 0) { next.push(pool.splice(i, 1)[0]); continue; }
      // New workers walk in from the gate.
      const f: Figure = { taskId: w.taskId, hired: w.hired, pos: new THREE.Vector3((Math.random() - 0.5) * 8, 0, 42), to: new THREE.Vector3(), wait: 0, speed: 2 + Math.random() * 1.5, yaw: Math.PI };
      pickTarget(f);
      next.push(f);
    }
    figures = next;
    bodies.count = helmets.count = figures.length;
    figures.forEach((f, i) => bodies.setColorAt(i, f.hired ? HIRED : VEST));
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  }
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const figScale = new THREE.Vector3(1.25, 1.25, 1.25);
  function moveFigures(dt: number, t: number) {
    const stalled = new Set(target.stalled.map(x => x.taskId));
    figures.forEach((f, i) => {
      const r = zoneFor(f.taskId, zone);
      // Keep them on the current level as the work moves up the tower.
      if (Math.abs(f.to.y - zone.y) > 0.5) { f.to.y = zone.y; if (Math.abs(f.pos.y - zone.y) > 0.5) f.pos.set(zone.x + (Math.random() * 2 - 1) * r.rx, zone.y, zone.z + (Math.random() * 2 - 1) * r.rz); }
      if (!stalled.has(f.taskId)) {
        v3.subVectors(f.to, f.pos);
        v3.y = 0;
        const dist = v3.length();
        if (dist < 0.3) {
          f.wait -= dt;
          if (f.wait <= 0) { pickTarget(f); f.wait = 0.5 + Math.random() * 2.5; }
        } else {
          v3.multiplyScalar(Math.min(dist, f.speed * dt) / dist);
          f.pos.add(v3);
          f.yaw = Math.atan2(v3.x, v3.z);
        }
        f.pos.y += (f.to.y - f.pos.y) * Math.min(1, dt * 4);
      }
      q.setFromAxisAngle(up, f.yaw);
      const bob = stalled.has(f.taskId) ? 0 : Math.abs(Math.sin(t * 8 + i)) * 0.12;
      m4.compose(v3.set(f.pos.x, f.pos.y + bob, f.pos.z), q, figScale);
      bodies.setMatrixAt(i, m4);
      helmets.setMatrixAt(i, m4);
    });
    bodies.instanceMatrix.needsUpdate = true;
    helmets.instanceMatrix.needsUpdate = true;
  }

  // ---------- Trucks ----------
  function moveTrucks(dt: number) {
    const a = target.active;
    const want = target.done ? 2 : 2 + (a.includes('C') ? 3 : 0) + (a.includes('F') || a.includes('E') ? 1 : 0) + (a.includes('G') ? 1 : 0);
    trucks.forEach((tr, i) => {
      tr.group.visible = i < want;
      if (!tr.group.visible) return;
      const halted = target.stalled.length > 0 && i >= 2 ? 0.35 : 1;
      tr.t += tr.speed * dt * halted;
      const p = roadPoint(tr.t, i % 2);
      tr.group.position.set(p.x, -0.1, p.z);
      tr.group.rotation.y = -p.heading;
      if (tr.drum) tr.drum.rotation.x += dt * 2;
    });
  }

  // ---------- Particles ----------
  function blast() {
    dustLife = 2.4;
    shake = 0.6;
    const y = -D * (1 - (shown.C ?? 0)) + 0.5;
    for (let i = 0; i < dust.pos.count; i++) {
      dust.pos.setXYZ(i, -6 + (Math.random() - 0.5) * 6, y, 2 + (Math.random() - 0.5) * 6);
      const a = Math.random() * Math.PI * 2;
      const sp = 3 + Math.random() * 9;
      dust.vel[i * 3] = Math.cos(a) * sp; dust.vel[i * 3 + 1] = 6 + Math.random() * 12; dust.vel[i * 3 + 2] = Math.sin(a) * sp;
    }
  }
  function launchFirework() {
    fireLife = 2.6;
    const cx = (Math.random() - 0.5) * 50;
    const cy = FLOORS * FLOOR_H + 18 + Math.random() * 20;
    const cz = (Math.random() - 0.5) * 30;
    const colors = fireworks.p.geometry.getAttribute('color') as THREE.BufferAttribute;
    const palette = [[0, 0.47, 0.83], [0.38, 0.8, 1], [1, 1, 1], [0.06, 0.48, 0.06], [1, 0.75, 0.2]];
    for (let i = 0; i < fireworks.pos.count; i++) {
      const burst = i % 3;
      fireworks.pos.setXYZ(i, cx + burst * 14 - 14, cy - burst * 4, cz);
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), sp = 10 + Math.random() * 6;
      fireworks.vel[i * 3] = r * Math.cos(th) * sp; fireworks.vel[i * 3 + 1] = u * sp; fireworks.vel[i * 3 + 2] = r * Math.sin(th) * sp;
      const c = palette[(burst + Math.floor(Math.random() * 2)) % palette.length];
      colors.setXYZ(i, c[0], c[1], c[2]);
    }
    colors.needsUpdate = true;
  }
  function stepParticles(dt: number, t: number) {
    // Blasting during C: a bang every few seconds (time is presentation only).
    const blasting = target.active.includes('C') && !target.stalled.some(x => x.taskId === 'C');
    nextBlast -= dt;
    if (blasting && nextBlast <= 0) { blast(); nextBlast = 4 + Math.random() * 3; }
    dust.p.visible = dustLife > 0;
    if (dustLife > 0) {
      dustLife -= dt;
      for (let i = 0; i < dust.pos.count; i++) {
        dust.vel[i * 3 + 1] -= 9.8 * dt * 0.6;
        dust.vel[i * 3] *= 0.98; dust.vel[i * 3 + 2] *= 0.98;
        dust.pos.setXYZ(i, dust.pos.getX(i) + dust.vel[i * 3] * dt, dust.pos.getY(i) + dust.vel[i * 3 + 1] * dt, dust.pos.getZ(i) + dust.vel[i * 3 + 2] * dt);
      }
      dust.pos.needsUpdate = true;
      dust.m.opacity = clamp01(dustLife / 2.4) * 0.85;
    }

    const snowing = target.season === 'winter' || target.frost;
    snow.p.visible = snowing;
    if (snowing) {
      const wind = target.windy ? 8 : 1;
      for (let i = 0; i < snow.pos.count; i++) {
        let y = snow.pos.getY(i) - dt * (3 + (i % 5));
        let x = snow.pos.getX(i) + dt * wind + Math.sin(t + i) * dt * 0.5;
        if (y < -2) y = 90;
        if (x > 130) x = -130;
        snow.pos.setXY(i, x, y);
      }
      snow.pos.needsUpdate = true;
    }

    // Welding sparks at the top of the structure while F runs.
    const welding = target.active.includes('F') && target.crane === 'working';
    sparks.p.visible = welding;
    if (welding) {
      const y = Math.floor((shown.F ?? 0) * FLOORS) * FLOOR_H + 1.2;
      for (let i = 0; i < sparks.pos.count; i++) {
        if (Math.random() < 0.08) sparks.pos.setXYZ(i, (Math.random() - 0.5) * TOWER.w, y + Math.random() * 2, (Math.random() > 0.5 ? 1 : -1) * TOWER.d / 2);
        else sparks.pos.setY(i, sparks.pos.getY(i) - dt * 3);
      }
      sparks.pos.needsUpdate = true;
      sparks.m.opacity = 0.5 + Math.random() * 0.5;
    }

    // Fireworks when the building is finished within both targets.
    fireworks.p.visible = target.onTarget && fireLife > 0;
    if (target.onTarget) {
      nextFire -= dt;
      if (nextFire <= 0) { launchFirework(); nextFire = 2.2; }
      if (fireLife > 0) {
        fireLife -= dt;
        for (let i = 0; i < fireworks.pos.count; i++) {
          fireworks.vel[i * 3 + 1] -= 6 * dt;
          fireworks.pos.setXYZ(i, fireworks.pos.getX(i) + fireworks.vel[i * 3] * dt, fireworks.pos.getY(i) + fireworks.vel[i * 3 + 1] * dt, fireworks.pos.getZ(i) + fireworks.vel[i * 3 + 2] * dt);
        }
        fireworks.pos.needsUpdate = true;
        fireworks.m.opacity = clamp01(fireLife / 1.5);
      }
    }
  }

  // ---------- Beacons ----------
  function placeBeacons(t: number) {
    const list: { spot: Spot; color: string; big: boolean; text: string }[] = [];
    if (target.focus) list.push({ spot: taskSpot(target.focus.taskId, shown), color: KIND_COLOR[target.focus.kind], big: true, text: target.focus.kind === 'opportunity' ? '+' : target.focus.kind === 'strategy' ? '?' : '!' });
    for (const st of target.stalled) {
      if (target.focus?.taskId === st.taskId) continue;
      list.push({ spot: taskSpot(st.taskId, shown), color: '#c42b1c', big: false, text: '!' });
    }
    beacons.forEach((b, i) => {
      const item = list[i];
      b.group.visible = !!item;
      if (!item) return;
      b.group.position.set(item.spot.x, item.spot.y, item.spot.z);
      const pulse = (Math.sin(t * (item.big ? 5 : 3)) * 0.5 + 0.5);
      const s = (item.big ? 1.4 : 0.9) * (1 + pulse * 0.35);
      b.ring.scale.set(s, 1, s);
      b.ringMat.color.set(item.color);
      b.ringMat.opacity = 0.45 + pulse * 0.5;
      b.beamMat.color.set(item.color);
      b.beamMat.opacity = (item.big ? 0.3 : 0.16) + pulse * 0.1;
      b.sign.material = signFor(item.text, item.color);
      b.sign.position.y = (item.big ? 12 : 8) + Math.sin(t * 2) * 0.6;
      b.sign.scale.setScalar(item.big ? 6 : 4);
    });
  }

  // ---------- Overlay positions ----------
  const proj = new THREE.Vector3();
  function placeOverlay(now: number) {
    const place = (el: HTMLElement, world: THREE.Vector3) => {
      proj.copy(world).project(camera);
      const behind = proj.z > 1;
      const x = (proj.x * 0.5 + 0.5) * width;
      const y = (-proj.y * 0.5 + 0.5) * height;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.visibility = behind || x < -50 || x > width + 50 ? 'hidden' : 'visible';
    };
    for (const tg of tags) {
      const id = tg.el.dataset.task!;
      tg.spot.copy(toV(taskSpot(id, shown)));
      tg.spot.y += tg.el.dataset.focus ? 15 : 3;
      place(tg.el, tg.spot);
    }
    bubbles = bubbles.filter(b => {
      const age = now - b.born!;
      if (age > b.ttl!) { b.el.remove(); return false; }
      b.el.style.opacity = String(age > b.ttl! - 800 ? (b.ttl! - age) / 800 : 1);
      return true;
    });
    // Newest bubble on top, older ones stacked above it.
    bubbles.forEach((b, i) => {
      place(b.el, b.spot);
      b.el.style.marginTop = `${-(bubbles.length - 1 - i) * 64}px`;
    });
  }

  // ---------- Camera ----------
  const desired = new THREE.Vector3(0, 12, 0);
  function defaultDistance() {
    return width < 700 ? 175 : 125;
  }
  function focusCamera() {
    const key = target.focus ? `${target.focus.eventId}:${target.focus.taskId}` : target.done ? 'done' : '';
    if (key === lastFocus) return;
    lastFocus = key;
    const dist = camera.position.distanceTo(controls.target);
    camTween = { from: dist, to: target.focus ? (width < 700 ? 110 : 75) : target.done ? defaultDistance() + 10 : defaultDistance(), t: 0 };
  }

  // ---------- Resize, inset and the render loop ----------
  function resize() {
    width = container.clientWidth;
    height = container.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    applyInset();
  }
  function applyInset() {
    const full = width + inset;
    camera.aspect = full / height;
    if (inset > 0) camera.setViewOffset(full, height, inset, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  let nightNow = 0;
  let raf = 0;
  let last = performance.now();
  const start = last;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const t = (now - start) / 1000;

    // Progress eases towards the game state, so a new week grows instead of popping.
    const k = 1 - Math.exp(-dt * 5);
    for (const id of Object.keys(target.progress)) {
      const goal = target.progress[id];
      const cur = shown[id] ?? goal;
      shown[id] = Math.abs(goal - cur) < 1e-4 ? goal : cur + (goal - cur) * k;
    }
    floodShown += ((target.flooded ? 1 : 0) - floodShown) * (1 - Math.exp(-dt * 1.5));

    // Day and night: a two-minute cycle; winter days are shorter (this is Oslo).
    const cycle = (t / 120 + 0.12) % 1;
    const dayLen = target.season === 'winter' ? 0.42 : target.season === 'summer' ? 0.62 : 0.52;
    const sunUp = Math.sin(((cycle) / dayLen) * Math.PI);
    const daylight = cycle < dayLen ? clamp01(sunUp * 2.2) : 0;
    nightNow += ((1 - daylight) - nightNow) * Math.min(1, dt * 2);
    const ang = cycle < dayLen ? (cycle / dayLen) * Math.PI : Math.PI;
    sun.position.set(Math.cos(ang) * 160, 30 + Math.sin(ang) * 150, 60);
    sun.intensity = 0.15 + daylight * 2.3;
    sun.color.setHSL(0.09, 0.6, 0.6 + daylight * 0.35);
    hemi.intensity = 0.35 + daylight * 0.75;
    world.setLight(nightNow, target.season === 'winter' ? 1 : target.frost ? 0.6 : 0);

    applyProgress(t);
    moveFigures(dt, t);
    moveTrucks(dt);
    stepParticles(dt, t);
    placeBeacons(t);

    // Camera: follows the story (the open decision, else the top of the building) unless the player drags.
    const idle = now - lastInteraction > 9000;
    if (target.focus) desired.copy(toV(taskSpot(target.focus.taskId, shown)));
    else desired.set(0, Math.max(6, Math.min(siteHeight, FLOORS * FLOOR_H) * 0.55), 0);
    controls.target.lerp(desired, 1 - Math.exp(-dt * 2));
    if (camTween) {
      camTween.t = Math.min(1, camTween.t + dt / 1.6);
      const d = camTween.from + (camTween.to - camTween.from) * ease(camTween.t);
      v3.subVectors(camera.position, controls.target).setLength(d);
      camera.position.copy(controls.target).add(v3);
      if (camTween.t >= 1) camTween = null;
    }
    controls.autoRotate = idle && !target.focus;
    controls.update();

    if (shake > 0) {
      shake = Math.max(0, shake - dt);
      const a = shake * 0.6;
      camera.position.x += (Math.random() - 0.5) * a;
      camera.position.y += (Math.random() - 0.5) * a;
    }
    placeOverlay(now);
    renderer.render(scene, camera);
  };
  loop();

  return {
    update(s, g) {
      const first = scenarioRef === null;
      scenarioRef = s;
      const prevActive = target.active.join();
      const prevFocus = target.focus?.eventId;
      const prevStalls = target.stalled.map(x => x.taskId + x.cause).join();
      const prevPct = target.active.map(id => Math.round((target.progress[id] ?? 0) * 100)).join();
      target = sceneState(s, g);
      if (first) Object.assign(shown, target.progress);
      if (!g || g.seed !== seed) {
        // A new game (or none): start the site from scratch, without old bubbles.
        Object.assign(shown, target.progress);
        seed = g?.seed ?? -1;
        logSeen = g ? Math.max(0, g.log.length - 1) : 0;
        bubbles.forEach(b => b.el.remove());
        bubbles = [];
        lastFocus = '__';
      }
      if (g) {
        for (const entry of g.log.slice(logSeen)) addBubble(s, entry.from ?? 'pm', entry.text);
        logSeen = g.log.length;
      }
      const pct = target.active.map(id => Math.round((target.progress[id] ?? 0) * 100)).join();
      if (prevActive !== target.active.join() || prevFocus !== target.focus?.eventId || prevStalls !== target.stalled.map(x => x.taskId + x.cause).join() || pct !== prevPct) rebuildTags(s);
      world.gravel.color.set(target.done ? 0x7fae63 : 0xa08e73);
      world.parkTrees.forEach(t => { t.visible = target.done; });
      world.fence.visible = !target.done;
      if (target.done) earth.visible = false;
      syncFigures();
      focusCamera();
    },
    setInset(px) {
      if (px === inset) return;
      inset = px;
      applyInset();
    },
    setActive(on) {
      cancelAnimationFrame(raf);
      if (on) { last = performance.now(); loop(); }
    },
    resetCamera() {
      lastInteraction = -1e9;
      camTween = { from: camera.position.distanceTo(controls.target), to: defaultDistance(), t: 0 };
    },
    dispose() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      overlay.remove();
    },
  };
}

