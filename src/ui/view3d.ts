// The full-screen 3D construction site: A-blokka (11 floors) over the basement complex, in the city.
// The scene reads a SceneState (see scene/visuals.ts) and never changes the game. Everything that
// moves (progress, crane, workers, trucks, weather, day and night, and the people the player walks
// with) is presentation time only.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { GameState } from '../engine/game';
import type { Scenario } from '../engine/scenario';
import { OSKAR_ROUNDS, type Phase, type Ppe } from './story';
import { LOOKS, createCharacter, foremanLook, type Character } from './scene/cast';
import { buildChallenge, type Model } from './scene/challenge';
import { buildProps } from './scene/props';
import {
  FLOOR_H, FLOORS, PIT, TOWER, BASEMENT_TASKS, SPOTS, figuresFor, sceneState, speakerSpot, taskSpot,
  type SceneState, type Spot,
} from './scene/visuals';
import { GATE_IN, GATE_OUT, OFFICE_MEET, foremanSpot, meetingLayout, resolve, route, walkable, type P2 } from './scene/walk';
import { buildWorld, latticeMap, mullionMap, part, roadPoint, signMap, tiledBox } from './scene/world';
import { iconUrl } from './tabs/context';

/** A scene on site: the camera frames the people in it, round a table with the challenge model. */
export interface SceneSpec {
  kind: 'meeting' | 'kickoff' | 'hms' | 'review';
  /** Everyone in the scene; the first is the host. */
  ids: string[];
  /** The challenge shown over the table (meetings). */
  eventId?: string;
  eventKind?: string;
}

/** What main.ts tells the scene about the story (never game state). */
export interface CastState {
  phase: Phase;
  /** Where the player should go, and who waits there with a «!». */
  objective: { id: string; spot: P2; kind?: string } | null;
  scene: SceneSpec | null;
  speaker: string | null;
  ppe: Ppe[];
  /** No walking (a dialog is open). */
  locked: boolean;
  /** The intro is done: Oskar has left the gate. */
  gateChecked: boolean;
}

export interface ViewHooks {
  /** The player reached the objective. */
  onArrive(id: string): void;
  /** The named person the player stands next to changed. */
  onNear(id: string | null): void;
  /** The player clicked a person. */
  onPick(id: string): void;
}

export interface View3d {
  update(s: Scenario, g: GameState | undefined): void;
  setCast(c: CastState): void;
  /** Walks the player to the objective (or to a person). */
  goTo(id: string): void;
  /** Keeps the action clear of a panel covering the right side of the screen (px). */
  setInset(px: number): void;
  setActive(on: boolean): void;
  /** Switches between following the player and the overview of the site. */
  resetCamera(): void;
  dispose(): void;
}

const KIND_COLOR = { risk: '#c42b1c', opportunity: '#0f7b0f', change: '#005fb8', strategy: '#d29200' } as const;
const STALL_TEXT: Record<string, string> = {
  water: 'vann i gropa', 'pump-fail': 'pumpen sviktet', rock: 'dårlig fjell', soil: 'forurenset grunn', frost: 'frost',
  wind: 'sterk vind', facade: 'venter på fasade', electricians: 'mangler folk', integration: 'feilsøking',
};
const MAX_FIGURES = 170;
const TRUCKS = 7;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
const toV = (p: Spot) => new THREE.Vector3(p.x, p.y, p.z);

function mat(color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
}

export function createView3d(container: HTMLElement, hooks: ViewHooks): View3d {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  const overlay = document.createElement('div');
  overlay.className = 'scene-overlay';
  container.appendChild(overlay);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc9d9ef, 220, 700);
  // Soft reflections from a studio environment: metal, glass and helmets read as materials.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 2000);
  camera.position.set(80, 62, 88);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 12, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 9;
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

  // Post-processing: a soft bloom makes lamps, beacons and lit windows glow, most of all at night.
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.3, 0.45, 0.86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const world = buildWorld(scene);
  const props = buildProps(scene);

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

  // ---------- Workers: instanced figures in hi-vis whose legs and arms swing (hired in Fluent blue) ----------
  const inst = (geo: THREE.BufferGeometry, m: THREE.Material, n: number) => {
    const mesh = new THREE.InstancedMesh(geo, m, n);
    mesh.count = 0;
    mesh.castShadow = true;
    // The figures move every frame, so a bounding sphere computed once would cull them wrongly.
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  };
  const vestMat = new THREE.MeshStandardMaterial({ roughness: 0.7 });
  const torsos = inst(new THREE.BoxGeometry(0.56, 0.68, 0.32).translate(0, 1.28, 0), vestMat, MAX_FIGURES);
  const legs = inst(new THREE.BoxGeometry(0.2, 0.92, 0.22).translate(0, -0.46, 0), new THREE.MeshStandardMaterial({ color: 0x2f3b4c, roughness: 0.8 }), MAX_FIGURES * 2);
  const arms = inst(new THREE.BoxGeometry(0.15, 0.62, 0.17).translate(0, -0.31, 0), new THREE.MeshStandardMaterial({ roughness: 0.7 }), MAX_FIGURES * 2);
  const heads = inst(new THREE.SphereGeometry(0.2, 10, 8).translate(0, 1.86, 0), new THREE.MeshStandardMaterial({ color: 0xe0ac86, roughness: 0.6 }), MAX_FIGURES);
  const helmets = inst(new THREE.SphereGeometry(0.245, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55).translate(0, 1.93, 0), new THREE.MeshStandardMaterial({ roughness: 0.35 }), MAX_FIGURES);
  const VEST = new THREE.Color(0xf7630c);
  const HIRED = new THREE.Color(0x0078d4);
  const YARD = new THREE.Color(0xd8ff3a);
  const HELMET_OWN = new THREE.Color(0xf2b81c);
  const HELMET_HIRED = new THREE.Color(0xffffff);
  interface Figure { taskId: string; hired: boolean; pos: THREE.Vector3; to: THREE.Vector3; wait: number; speed: number; yaw: number; phase: number; moving: number }
  let figures: Figure[] = [];
  /** Workers who are not on a discipline: the yard, the site hut and the flagman at the gate. */
  const AMBIENT: { taskId: string; n: number }[] = [{ taskId: '_yard', n: 4 }, { taskId: '_hut', n: 3 }, { taskId: '_gate', n: 1 }];

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

  // ---------- The cast: the player, Elisabeth, Hedda, Oskar and the foremen ----------
  interface Actor { id: string; c: Character; pos: THREE.Vector3; yaw: number; path: P2[]; speed: number; talk: number; wait: number }
  const actors = new Map<string, Actor>();
  const cast = new THREE.Group();
  scene.add(cast);
  let castState: CastState = { phase: 'play', objective: null, scene: null, speaker: null, ppe: [], locked: true, gateChecked: false };
  function actor(id: string): Actor {
    let a = actors.get(id);
    if (!a) {
      const look = id.startsWith('foreman-') ? foremanLook(id.slice(8)) : LOOKS[id];
      const c = createCharacter(look);
      for (const m of c.meshes) m.userData.actor = id;
      cast.add(c.group);
      a = { id, c, pos: new THREE.Vector3(), yaw: 0, path: [], speed: 0, talk: 0, wait: 0 };
      actors.set(id, a);
      placeHome(a);
    }
    return a;
  }
  const player = () => actor('owner');
  /** Where each person stands when nothing is going on. */
  function home(id: string): P2 {
    if (id === 'owner') return GATE_OUT;
    if (id === 'pm') return { x: OFFICE_MEET.x - 1.6, z: OFFICE_MEET.z + 0.8 };
    if (id === 'site') return { x: OFFICE_MEET.x + 1.4, z: OFFICE_MEET.z + 1.4 };
    if (id === 'hms') return castState.gateChecked ? { x: SPOTS.hut.x - 4, z: SPOTS.hut.z - 4 } : { x: GATE_IN.x + 2.4, z: GATE_IN.z - 0.6 };
    return foremanSpot(id.slice(8));
  }
  function placeHome(a: Actor) {
    const h = home(a.id);
    a.pos.set(h.x, 0, h.z);
    a.path = [];
    // Face the site (the player at the gate faces the site too).
    a.yaw = a.id === 'hms' && !castState.gateChecked ? 0 : Math.atan2(-h.x, -h.z);
  }
  const keys = new Set<string>();
  const KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'];
  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (!KEYS.includes(k)) return;
    const el = e.target as HTMLElement;
    if (down && (el.closest?.('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey)) return;
    if (down) { keys.add(k); if (k.startsWith('arrow')) e.preventDefault(); } else keys.delete(k);
  };
  const keyDown = onKey(true);
  const keyUp = onKey(false);
  const blur = () => keys.clear();
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', blur);

  /** Moves an actor along its path; returns the speed. */
  function walkPath(a: Actor, dt: number, max: number): number {
    while (a.path.length && Math.hypot(a.path[0].x - a.pos.x, a.path[0].z - a.pos.z) < 0.2) a.path.shift();
    if (!a.path.length) return 0;
    const goal = a.path[0];
    const dx = goal.x - a.pos.x, dz = goal.z - a.pos.z;
    const dist = Math.hypot(dx, dz);
    const step = Math.min(dist, max * dt);
    const r = resolve({ x: a.pos.x + (dx / dist) * step, z: a.pos.z + (dz / dist) * step });
    a.pos.x = r.x;
    a.pos.z = r.z;
    turnTo(a, Math.atan2(dx, dz), dt);
    return max;
  }
  function turnTo(a: Actor, yaw: number, dt: number) {
    let d = yaw - a.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    a.yaw += d * Math.min(1, dt * 10);
  }
  const face = (a: Actor, p: P2, dt: number) => turnTo(a, Math.atan2(p.x - a.pos.x, p.z - a.pos.z), dt);

  // The scene in progress: positions, the table with the challenge model, and the camera shot.
  interface Staging { key: string; center: P2; spots: Record<string, P2>; view: P2; model: Model | null }
  let staging: Staging | null = null;
  const table = new THREE.Group();
  const holoMat = new THREE.MeshBasicMaterial({ color: 0x60cdff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  table.add(part(new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.5 }), 0.3, 1.05, 0.3, 0, 0, 0));
  // A dark plan table, so the bright model over it reads clearly.
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.08, 32), new THREE.MeshStandardMaterial({ color: 0x1f2a3a, roughness: 0.35, metalness: 0.4 }));
  top.position.y = 1.08;
  top.castShadow = top.receiveShadow = true;
  const holoDisc = new THREE.Mesh(new THREE.RingGeometry(0.3, 1.15, 40).rotateX(-Math.PI / 2), holoMat);
  holoDisc.position.y = 1.13;
  const holoCone = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 2.2, 32, 1, true), holoMat.clone());
  (holoCone.material as THREE.MeshBasicMaterial).opacity = 0.08;
  holoCone.position.y = 2.25;
  const holo = new THREE.Group();
  holo.position.y = 1.2;
  holo.scale.setScalar(1.15);
  table.add(top, holoDisc, holoCone, holo);
  table.visible = false;
  scene.add(table);
  const KIND_HEX: Record<string, number> = { risk: 0xc42b1c, opportunity: 0x0f7b0f, change: 0x60cdff, strategy: 0xd29200 };

  function stage(spec: SceneSpec | null) {
    const key = spec ? `${spec.kind}:${spec.ids.join(',')}:${spec.eventId ?? ''}` : '';
    if (key === (staging?.key ?? '')) return;
    staging?.model?.dispose();
    staging = null;
    table.visible = false;
    if (!spec) {
      // The scene ends: the orbit camera takes over from where the shot was.
      controls.enabled = true;
      controls.target.copy(look);
      return;
    }
    const p = player().pos;
    let center: P2, spots: Record<string, P2>, view: P2;
    if (spec.kind === 'meeting' || spec.kind === 'kickoff') {
      const host = spec.kind === 'meeting' ? foremanSpot(spec.ids[0].slice(8)) : OFFICE_MEET;
      ({ center, spots, view } = meetingLayout(host, spec.ids));
      // The start-up meeting is filmed from the site side, with the site offices behind the people.
      if (spec.kind === 'kickoff') { const l = Math.hypot(center.x, center.z) || 1; view = { x: -center.x / l, z: -center.z / l }; }
    } else {
      // Oskar (or the team) comes to where the player stands.
      ({ center, spots, view } = meetingLayout({ x: p.x * 0.98, z: p.z * 0.98 }, spec.ids));
    }
    for (const id of Object.keys(spots)) spots[id] = resolve(spots[id]);
    for (const id of spec.ids) {
      const a = actor(id);
      // Whoever is far away comes straight into the shot, from just outside it.
      const d = Math.hypot(spots[id].x - a.pos.x, spots[id].z - a.pos.z);
      if (d > 14) {
        const ox = spots[id].x - center.x, oz = spots[id].z - center.z, ol = Math.hypot(ox, oz) || 1;
        const r = resolve({ x: spots[id].x + (ox / ol) * 4, z: spots[id].z + (oz / ol) * 4 });
        a.pos.set(r.x, 0, r.z);
      }
      a.path = route({ x: a.pos.x, z: a.pos.z }, spots[id]);
    }
    let model: Model | null = null;
    if (spec.kind === 'meeting' || spec.kind === 'kickoff') {
      model = buildChallenge(spec.eventId ?? 'strategy-F', spec.eventKind ?? 'strategy');
      holo.add(model.group);
      table.position.set(center.x, 0, center.z);
      table.visible = true;
      const tint = spec.kind === 'kickoff' ? 0x60cdff : KIND_HEX[spec.eventKind ?? 'risk'] ?? 0x60cdff;
      holoMat.color.setHex(tint);
      (holoCone.material as THREE.MeshBasicMaterial).color.setHex(tint);
    }
    staging = { key, center, spots, view, model };
    controls.enabled = false;
  }

  // The «!» over whoever waits for the player, a ring where to go, and an arrow at the player's feet.
  const bang = new THREE.Sprite();
  bang.renderOrder = 12;
  bang.scale.setScalar(2.2);
  scene.add(bang);
  const goalRing = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf7630c, transparent: true, opacity: 0.8, depthWrite: false }));
  goalRing.position.y = 0.05;
  scene.add(goalRing);
  const arrowShape = new THREE.Shape([new THREE.Vector2(0, 1.4), new THREE.Vector2(0.75, 0.2), new THREE.Vector2(0.28, 0.2), new THREE.Vector2(0.28, -0.6), new THREE.Vector2(-0.28, -0.6), new THREE.Vector2(-0.28, 0.2), new THREE.Vector2(-0.75, 0.2)]);
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf7630c, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
  scene.add(arrow);
  const clickRing = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.6, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
  clickRing.position.y = 0.05;
  scene.add(clickRing);
  const speakRing = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x60cdff, transparent: true, opacity: 0.9, depthWrite: false }));
  speakRing.position.y = 0.06;
  scene.add(speakRing);

  // Walking by clicking: a click (not a drag) on the ground walks there; on a person, picks them.
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let downAt: { x: number; y: number; t: number } | null = null;
  const onDown = (e: PointerEvent) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; };
  const onUp = (e: PointerEvent) => {
    const d = downAt;
    downAt = null;
    if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 400) return;
    if (seed < 0 || castState.locked || staging) return;
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(cast.children, true).find(h => h.object.userData.actor && h.object.userData.actor !== 'owner');
    if (hit) { hooks.onPick(hit.object.userData.actor); return; }
    const pt = ray.ray.intersectPlane(ground, v3);
    if (!pt) return;
    const r = resolve({ x: pt.x, z: pt.z });
    player().path = route({ x: player().pos.x, z: player().pos.z }, r);
    clickRing.position.set(r.x, 0.05, r.z);
    (clickRing.material as THREE.MeshBasicMaterial).opacity = 1;
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);

  let near: string | null = null;
  let arrivedKey = '';
  let followTimer = 0;
  const fwd = new THREE.Vector3();
  const side = new THREE.Vector3();
  function moveCast(dt: number, t: number) {
    cast.visible = seed >= 0;
    if (seed < 0) return;
    const pl = player();
    const sc = castState.scene;

    // The player: keys (relative to the camera), else the clicked or automatic path.
    let speed = 0;
    if (!castState.locked && !staging) {
      fwd.subVectors(controls.target, camera.position).setY(0).normalize();
      side.crossVectors(fwd, up).normalize();
      let mx = 0, mz = 0;
      if (keys.has('w') || keys.has('arrowup')) { mx += fwd.x; mz += fwd.z; }
      if (keys.has('s') || keys.has('arrowdown')) { mx -= fwd.x; mz -= fwd.z; }
      if (keys.has('d') || keys.has('arrowright')) { mx += side.x; mz += side.z; }
      if (keys.has('a') || keys.has('arrowleft')) { mx -= side.x; mz -= side.z; }
      const len = Math.hypot(mx, mz);
      if (len > 0) {
        pl.path = [];
        speed = keys.has('shift') ? 11 : 7;
        const r = resolve({ x: pl.pos.x + (mx / len) * speed * dt, z: pl.pos.z + (mz / len) * speed * dt });
        pl.pos.x = r.x;
        pl.pos.z = r.z;
        turnTo(pl, Math.atan2(mx, mz), dt);
      } else speed = walkPath(pl, dt, autoSpeed);
    } else if (staging) speed = walkPath(pl, dt, 4);

    // Elisabeth and Hedda: wait at the offices until the start-up meeting, then follow the player.
    followTimer -= dt;
    for (const id of ['pm', 'site']) {
      const a = actor(id);
      let s = 0;
      if (staging && staging.spots[id]) s = walkPath(a, dt, 4.5);
      else if (castState.phase === 'play') {
        const behind = id === 'pm' ? 1.7 : -1.7;
        fwd.set(Math.sin(pl.yaw), 0, Math.cos(pl.yaw));
        const goal = resolve({ x: pl.pos.x - fwd.x * 2.6 + fwd.z * behind, z: pl.pos.z - fwd.z * 2.6 - fwd.x * behind });
        const dist = Math.hypot(goal.x - a.pos.x, goal.z - a.pos.z);
        if (followTimer <= 0) a.path = dist > 1 ? route({ x: a.pos.x, z: a.pos.z }, goal) : [];
        s = walkPath(a, dt, Math.min(12, 2 + dist * 1.6));
        if (!s) face(a, { x: pl.pos.x, z: pl.pos.z }, dt);
      } else {
        if (!a.path.length && Math.hypot(home(id).x - a.pos.x, home(id).z - a.pos.z) > 0.5) a.path = route({ x: a.pos.x, z: a.pos.z }, home(id));
        s = walkPath(a, dt, 3);
        if (!s) face(a, pl.pos.distanceTo(a.pos) < 14 ? { x: pl.pos.x, z: pl.pos.z } : { x: 0, z: 0 }, dt);
      }
      a.speed = s;
    }
    if (followTimer <= 0) followTimer = 0.4;

    // Oskar: guards the gate until the first check, then walks his rounds.
    const os = actor('hms');
    if (staging?.spots.hms) os.speed = walkPath(os, dt, 6);
    else if (!castState.gateChecked) {
      if (!os.path.length && os.pos.distanceTo(v3.set(home('hms').x, 0, home('hms').z)) > 0.5) os.path = route({ x: os.pos.x, z: os.pos.z }, home('hms'));
      os.speed = walkPath(os, dt, 3);
      if (!os.speed) face(os, { x: pl.pos.x, z: pl.pos.z }, dt);
    } else {
      // His rounds: walk to a spot, look at whoever is there and tell them off, then on to the next.
      if (!os.path.length) {
        const stop = OSKAR_ROUNDS[oskarStop];
        if (oskarRemark && stop) {
          oskarRemark = false;
          if (scenarioRef && !staging) addBubble(scenarioRef, 'hms', stop.line);
          oskarTalk = 3.5;
          os.wait = 6;
        }
        if (stop) face(os, stop.look, dt);
        os.wait -= dt;
        if (os.wait <= 0) {
          const has = (n?: string) => !n || (n === 'crane' ? target.crane !== 'off' : n === 'pump' ? target.active.some(id => id === 'E' || id === 'F') : (shown.E ?? 0) < 0.999);
          for (let k = 1; k <= OSKAR_ROUNDS.length; k++) {
            const next = (oskarStop + k) % OSKAR_ROUNDS.length;
            if (has(OSKAR_ROUNDS[next].needs)) { oskarStop = next; break; }
          }
          os.path = route({ x: os.pos.x, z: os.pos.z }, OSKAR_ROUNDS[oskarStop].spot);
          oskarRemark = true;
        }
      }
      os.speed = walkPath(os, dt, 2.2);
    }
    oskarTalk = Math.max(0, oskarTalk - dt);

    // Foremen: at their spot next to their work while the discipline runs (or a challenge waits).
    const wanted = new Set(target.active.map(id => `foreman-${id}`));
    if (castState.objective?.id.startsWith('foreman-')) wanted.add(castState.objective.id);
    if (sc) for (const id of sc.ids) if (id.startsWith('foreman-')) wanted.add(id);
    for (const id of wanted) actor(id);
    for (const a of actors.values()) {
      if (!a.id.startsWith('foreman-')) continue;
      a.c.group.visible = wanted.has(a.id);
      if (!a.c.group.visible) { placeHome(a); continue; }
      if (staging?.spots[a.id]) a.speed = walkPath(a, dt, 4);
      else {
        const h = home(a.id);
        if (!a.path.length && Math.hypot(h.x - a.pos.x, h.z - a.pos.z) > 0.5) a.path = route({ x: a.pos.x, z: a.pos.z }, h);
        a.speed = walkPath(a, dt, 3);
        if (!a.speed) face(a, pl.pos.distanceTo(a.pos) < 10 ? { x: pl.pos.x, z: pl.pos.z } : { x: 0, z: 0 }, dt);
      }
    }

    // In a scene everyone who has arrived faces the table (the host faces the player).
    if (staging) {
      for (const id of Object.keys(staging.spots)) {
        const a = actor(id);
        if (!a.path.length) face(a, id === sc?.ids[0] && sc.kind === 'hms' ? { x: pl.pos.x, z: pl.pos.z } : staging.center, dt);
      }
      staging.model?.update(t);
      holo.rotation.y = t * 0.35;
      holoDisc.rotation.y = -t * 0.5;
    }

    // Animate and place every figure.
    pl.speed = speed;
    for (const a of actors.values()) {
      const talking = castState.speaker === a.id || (a.id === 'hms' && oskarTalk > 0) ? 1 : 0;
      a.talk += (talking - a.talk) * Math.min(1, dt * 6);
      a.c.setPpe(a.id === 'owner' ? castState.ppe : NPC_PPE);
      a.c.animate(dt, a.speed, a.talk);
      a.c.group.position.copy(a.pos);
      a.c.group.rotation.y = a.yaw;
    }

    // Arriving at the objective, and who the player stands next to.
    const o = castState.objective;
    if (o && !staging && !castState.locked) {
      const k = `${o.id}:${o.spot.x}:${o.spot.z}`;
      if (k !== arrivedKey && Math.hypot(pl.pos.x - o.spot.x, pl.pos.z - o.spot.z) < 3.4) {
        arrivedKey = k;
        pl.path = [];
        hooks.onArrive(o.id);
      }
    }
    if (!o) arrivedKey = '';
    let best: string | null = null;
    let bestD = 3.6;
    if (!staging) for (const a of actors.values()) {
      if (a.id === 'owner' || !a.c.group.visible) continue;
      const d = a.pos.distanceTo(pl.pos);
      if (d < bestD) { best = a.id; bestD = d; }
    }
    if (best !== near) { near = best; hooks.onNear(best); }

    // Markers: «!» over whoever waits, the ring where to go, the arrow at the player's feet.
    const waiting = o ? actors.get(o.id) : undefined;
    bang.visible = !!o && !staging;
    goalRing.visible = arrow.visible = bang.visible;
    if (o && bang.visible) {
      const hex = o.kind ? (KIND_HEX[o.kind] ?? 0xf7630c) : 0x005fb8;
      bang.material = signFor('!', `#${new THREE.Color(hex).getHexString()}`);
      const at = waiting?.c.group.visible ? waiting.pos : v3.set(o.spot.x, 0, o.spot.z);
      bang.position.set(at.x, 4.4 + Math.abs(Math.sin(t * 3)) * 0.5, at.z);
      goalRing.position.set(o.spot.x, 0.05, o.spot.z);
      goalRing.scale.setScalar(1 + Math.sin(t * 4) * 0.12);
      (goalRing.material as THREE.MeshBasicMaterial).color.setHex(hex);
      (arrow.material as THREE.MeshBasicMaterial).color.setHex(hex);
      const dist = Math.hypot(o.spot.x - pl.pos.x, o.spot.z - pl.pos.z);
      arrow.visible = dist > 6;
      const yaw = Math.atan2(o.spot.x - pl.pos.x, o.spot.z - pl.pos.z);
      arrow.position.set(pl.pos.x + Math.sin(yaw) * 2.4, 0.08, pl.pos.z + Math.cos(yaw) * 2.4);
      arrow.rotation.y = yaw;
      arrow.scale.setScalar(1 + Math.sin(t * 5) * 0.08);
    }
    const sp = castState.speaker ? actors.get(castState.speaker) : undefined;
    speakRing.visible = !!sp && !!staging;
    if (sp) speakRing.position.set(sp.pos.x, 0.06, sp.pos.z);
    const cm = clickRing.material as THREE.MeshBasicMaterial;
    cm.opacity = Math.max(0, cm.opacity - dt * 1.5);
    clickRing.scale.setScalar(1 + (1 - cm.opacity) * 1.5);
  }
  let autoSpeed = 9;
  /** Oskar's rounds: the stop he walks to, whether he still has to say something there, and how long he talks. */
  let oskarStop = 0;
  let oskarRemark = false;
  let oskarTalk = 0;
  /** Everyone else is already fully equipped (Oskar sees to that). */
  const NPC_PPE: Ppe[] = ['helmet', 'vest', 'boots', 'glasses', 'gloves'];

  // ---------- HTML overlay: task tags, the decision label and speech bubbles ----------
  interface Tag { el: HTMLElement; spot: THREE.Vector3; ttl?: number; born?: number; who?: string }
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
    const name = person?.name ?? from;
    const short = text.length > 140 ? `${text.slice(0, 137)}…` : text;
    el.innerHTML = `${person ? `<img src="${iconUrl(person.icon)}" alt="" width="28" height="28">` : ''}<div><b>${name}</b><p>${short}</p></div>`;
    bubbleLayer.append(el);
    bubbles.push({ el, spot: toV(speakerSpot(from, shown)).add(new THREE.Vector3(0, 4, 0)), ttl: 7000, born: performance.now(), who: from });
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
    if (taskId === '_yard') { out.set(-24, 0, 32); return { rx: 8, rz: 4 }; }
    if (taskId === '_hut') { out.set(34, 0, 27); return { rx: 7, rz: 2.5 }; }
    if (taskId === '_gate') { out.set(4, 0, 40.5); return { rx: 1.5, rz: 0.6 }; }
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
    const ambient = seed >= 0 && !target.done ? AMBIENT.flatMap(a => Array.from({ length: a.n }, () => ({ taskId: a.taskId, hired: false }))) : [];
    const want = [...ambient, ...figuresFor(target.crews, MAX_FIGURES - ambient.length)];
    const next: Figure[] = [];
    const pool = [...figures];
    for (const w of want) {
      const i = pool.findIndex(f => f.taskId === w.taskId && f.hired === w.hired);
      if (i >= 0) { next.push(pool.splice(i, 1)[0]); continue; }
      // New workers walk in from the gate; the yard and hut crews are already at their posts.
      const f: Figure = { taskId: w.taskId, hired: w.hired, pos: new THREE.Vector3((Math.random() - 0.5) * 8, 0, 42), to: new THREE.Vector3(), wait: 0, speed: 2 + Math.random() * 1.5, yaw: Math.PI, phase: Math.random() * 10, moving: 0 };
      pickTarget(f);
      if (w.taskId.startsWith('_')) f.pos.copy(f.to);
      next.push(f);
    }
    figures = next;
    torsos.count = heads.count = helmets.count = figures.length;
    legs.count = arms.count = figures.length * 2;
    figures.forEach((f, i) => {
      const vest = f.hired ? HIRED : f.taskId.startsWith('_') ? YARD : VEST;
      torsos.setColorAt(i, vest);
      arms.setColorAt(i * 2, vest);
      arms.setColorAt(i * 2 + 1, vest);
      helmets.setColorAt(i, f.hired ? HELMET_HIRED : HELMET_OWN);
    });
    for (const m of [torsos, arms, helmets]) if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }
  const m4 = new THREE.Matrix4();
  const limb = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const figScale = new THREE.Vector3(1.25, 1.25, 1.25);
  function moveFigures(dt: number, t: number) {
    const stalled = new Set(target.stalled.map(x => x.taskId));
    figures.forEach((f, i) => {
      const r = zoneFor(f.taskId, zone);
      // Keep them on the current level as the work moves up the tower.
      if (Math.abs(f.to.y - zone.y) > 0.5) { f.to.y = zone.y; if (Math.abs(f.pos.y - zone.y) > 0.5) f.pos.set(zone.x + (Math.random() * 2 - 1) * r.rx, zone.y, zone.z + (Math.random() * 2 - 1) * r.rz); }
      let moving = 0;
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
          moving = 1;
        }
        f.pos.y += (f.to.y - f.pos.y) * Math.min(1, dt * 4);
      }
      f.moving += (moving - f.moving) * Math.min(1, dt * 8);
      f.phase += dt * (3 + f.moving * 6);
      const swing = Math.sin(f.phase) * 0.65 * f.moving;
      // Standing still on a working discipline: hammering (the right arm goes up and down).
      const work = !moving && !stalled.has(f.taskId) && !f.taskId.startsWith('_') ? 1 : 0;
      q.setFromAxisAngle(up, f.yaw);
      const bob = Math.abs(Math.cos(f.phase)) * 0.07 * f.moving;
      m4.compose(v3.set(f.pos.x, f.pos.y + bob, f.pos.z), q, figScale);
      torsos.setMatrixAt(i, m4);
      heads.setMatrixAt(i, m4);
      helmets.setMatrixAt(i, m4);
      for (const side of [0, 1]) {
        const sx = side ? 0.14 : -0.14;
        limb.makeRotationX(side ? -swing : swing).setPosition(sx, 0.95, 0);
        legs.setMatrixAt(i * 2 + side, limb.premultiply(m4));
        const ax = side ? 0.37 : -0.37;
        const armAngle = side && work ? -1.6 + Math.abs(Math.sin(t * 6 + i)) * 0.9 : side ? swing * 0.8 : -swing * 0.8;
        limb.makeRotationX(armAngle).setPosition(ax, 1.56, 0);
        arms.setMatrixAt(i * 2 + side, limb.premultiply(m4));
      }
    });
    for (const m of [torsos, heads, helmets, legs, arms]) m.instanceMatrix.needsUpdate = true;
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
      // In a scene the camera is close to the people: the beacons would only be in the way.
      b.group.visible = !!item && !staging;
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
    tagLayer.style.display = staging ? 'none' : '';
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
    // Newest bubble on top, older ones stacked above it; a bubble follows the person who speaks.
    // In a scene the speech panel carries the words, so the bubbles step aside.
    bubbles.forEach((b, i) => {
      const a = b.who ? actors.get(b.who) : undefined;
      if (a?.c.group.visible) b.spot.set(a.pos.x, 4.2, a.pos.z);
      place(b.el, b.spot);
      b.el.style.marginTop = `${-(bubbles.length - 1 - i) * 64}px`;
      if (staging) b.el.style.visibility = 'hidden';
    });
    // Name tags over the named people (the speaker is lit up in a scene).
    for (const a of actors.values()) {
      let el = names.get(a.id);
      if (!el) {
        el = document.createElement('div');
        el.className = `nametag who-${a.id.startsWith('foreman-') ? 'foreman' : a.id}`;
        el.textContent = a.id === 'owner' ? 'Du' : (scenarioRef?.people.find(p => p.id === a.id)?.name ?? a.id);
        nameLayer.append(el);
        names.set(a.id, el);
      }
      const inScene = !!staging?.spots[a.id];
      const show = seed >= 0 && a.c.group.visible && (inScene || (!staging && a.pos.distanceTo(camera.position) < 90));
      el.classList.toggle('speaking', castState.speaker === a.id);
      el.classList.toggle('waiting', castState.objective?.id === a.id && !staging);
      if (!show) { el.style.visibility = 'hidden'; continue; }
      proj.set(a.pos.x, 3.1, a.pos.z);
      place(el, proj);
    }
  }
  const nameLayer = document.createElement('div');
  overlay.append(nameLayer);
  const names = new Map<string, HTMLElement>();

  // ---------- Camera: follow the player, the overview of the site, or a scene's shot ----------
  const desired = new THREE.Vector3(0, 12, 0);
  const look = new THREE.Vector3(0, 12, 0);
  const camGoal = new THREE.Vector3();
  const lookGoal = new THREE.Vector3();
  const prevTarget = new THREE.Vector3();
  let camMode: 'follow' | 'overview' = 'overview';
  function defaultDistance() {
    return camMode === 'follow' ? (width < 700 ? 46 : 34) : width < 700 ? 175 : 125;
  }
  function focusCamera() {
    if (camMode === 'follow') return;
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
    composer.setSize(width, height);
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
    moveCast(dt, t);
    props.update(t, target, shown, nightNow);
    bloom.strength = 0.22 + nightNow * 0.55;

    if (staging) {
      // A scene: a slow dolly to a shot from the side of the circle, looking at the table.
      // The look point sits below the people, so they stand in the upper half, clear of the panel.
      const c = staging.center;
      const sp = castState.speaker && staging.spots[castState.speaker] ? actors.get(castState.speaker) : undefined;
      if (sp) {
        // Someone speaks: a closer shot of them, from in front, with the table between.
        const dx = c.x - sp.pos.x, dz = c.z - sp.pos.z, dl = Math.hypot(dx, dz) || 1;
        const sideX = -dz / dl, sideZ = dx / dl;
        // 45° off the line to the table, so the model on it does not cover the speaker.
        const near = width < 700 ? 10 : 7.5;
        camGoal.set(sp.pos.x + (dx / dl + sideX) * near * 0.71, 4.4, sp.pos.z + (dz / dl + sideZ) * near * 0.71);
        // Never from inside a hut or the pit: then from the scene's own side instead.
        if (!walkable({ x: camGoal.x, z: camGoal.z }, 1.5)) camGoal.set(sp.pos.x + staging.view.x * near, 4.4, sp.pos.z + staging.view.z * near);
        // Looking a little below the face keeps the speaker clear of the panel at the bottom.
        lookGoal.set(sp.pos.x, 0.9, sp.pos.z);
      } else {
        const far = width < 700 ? 21 : 16;
        camGoal.set(c.x + staging.view.x * far, 7.5, c.z + staging.view.z * far);
        lookGoal.set(c.x, 0.2, c.z);
      }
      // A cut when the shot is far away, a slow dolly when it is close.
      const kk = camera.position.distanceTo(camGoal) > 25 || look.distanceTo(lookGoal) > 12 ? 1 : 1 - Math.exp(-dt * 2.2);
      camera.position.lerp(camGoal, kk);
      look.lerp(lookGoal, kk);
      camera.lookAt(look);
    } else {
      // Follow the player, or (overview) the story: the open decision, else the top of the building.
      const idle = now - lastInteraction > 9000;
      prevTarget.copy(controls.target);
      if (seed >= 0 && camMode === 'follow') {
        const p = player().pos;
        desired.set(p.x, 2, p.z);
        controls.target.lerp(desired, 1 - Math.exp(-dt * 6));
        // The camera moves with its target, so the player stays in the same place on screen.
        camera.position.add(v3.subVectors(controls.target, prevTarget));
      } else {
        if (target.focus) desired.copy(toV(taskSpot(target.focus.taskId, shown)));
        else desired.set(0, Math.max(6, Math.min(siteHeight, FLOORS * FLOOR_H) * 0.55), 0);
        controls.target.lerp(desired, 1 - Math.exp(-dt * 2));
      }
      if (camTween) {
        camTween.t = Math.min(1, camTween.t + dt / 1.6);
        const d = camTween.from + (camTween.to - camTween.from) * ease(camTween.t);
        v3.subVectors(camera.position, controls.target).setLength(d);
        camera.position.copy(controls.target).add(v3);
        if (camTween.t >= 1) camTween = null;
      }
      controls.autoRotate = camMode === 'overview' && idle && !target.focus;
      controls.update();
      look.copy(controls.target);
    }

    if (shake > 0) {
      shake = Math.max(0, shake - dt);
      const a = shake * 0.6;
      camera.position.x += (Math.random() - 0.5) * a;
      camera.position.y += (Math.random() - 0.5) * a;
    }
    placeOverlay(now);
    composer.render(dt);
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
        // Everyone back to their place; the player at the gate, the camera behind them.
        for (const a of actors.values()) placeHome(a);
        if (g) {
          camMode = 'follow';
          const p = player().pos;
          controls.target.set(p.x, 2, p.z);
          camera.position.set(p.x + 6, 15, p.z + 28);
          camTween = null;
        } else camMode = 'overview';
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
    setCast(c) {
      castState = c;
      stage(c.scene);
    },
    goTo(id) {
      if (seed < 0 || castState.locked || staging) return;
      const pl = player();
      const from = { x: pl.pos.x, z: pl.pos.z };
      const o = castState.objective;
      if (o && (id === 'objective' || id === o.id)) pl.path = route(from, o.spot);
      else {
        const a = actors.get(id);
        if (!a) return;
        // Stop a couple of metres short, on the side the player comes from.
        const d = Math.max(0.01, Math.hypot(from.x - a.pos.x, from.z - a.pos.z));
        pl.path = route(from, resolve({ x: a.pos.x + ((from.x - a.pos.x) / d) * 2.2, z: a.pos.z + ((from.z - a.pos.z) / d) * 2.2 }));
      }
      autoSpeed = 9;
      if (camMode !== 'follow') this.resetCamera();
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
      if (seed >= 0) camMode = camMode === 'follow' ? 'overview' : 'follow';
      lastFocus = '__';
      camTween = { from: camera.position.distanceTo(controls.target), to: defaultDistance(), t: 0 };
    },
    dispose() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur);
      controls.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      overlay.remove();
    },
  };
}

