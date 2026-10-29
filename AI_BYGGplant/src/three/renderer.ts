// The live 3D view: the building rises on a lit plot while the customer talks, and the openings a turn
// changed glow. Loaded lazily (`await import('./three/renderer')`). All geometry comes from model.ts;
// this file only turns parts into meshes, lights them and animates. Imports only three and its examples.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Opening, Project } from '../contract/types';
import { GLASS, POLY_DEPTH, buildModel, polyNormal, type BuildingModel, type Part } from './model';

export interface View {
  update(project: Project, highlight: Set<string>): void;
  /** One freshly rendered frame as a PNG data URL ('' when WebGL is unavailable). */
  snapshot(): string;
  resize(): void;
  dispose(): void;
}

type V3 = [number, number, number];
const RISE_S = 1.2;
const MORPH_S = 0.6;
const GLOW_S = 3;
const FADE_S = 3;
const IDLE_ROTATE_MS = 15000;
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

// ---------- Canvas textures (procedural, tiny) ----------
function canvasTexture(size: number, draw: (c: CanvasRenderingContext2D, s: number) => void, srgb = true): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}
function noise(c: CanvasRenderingContext2D, s: number, base: string, tones: string[], n: number, r: number, seed: number) {
  c.fillStyle = base;
  c.fillRect(0, 0, s, s);
  const rnd = rng(seed);
  for (let i = 0; i < n; i++) {
    c.fillStyle = tones[Math.floor(rnd() * tones.length)];
    c.fillRect(rnd() * s, rnd() * s, 1 + rnd() * r, 1 + rnd() * r * 2.5);
  }
}
const grassMap = () => canvasTexture(256, (c, s) => noise(c, s, '#5f8a3e', ['#6f9a48', '#557d37', '#7da653', '#4d7232', '#88ad5c'], 9000, 1.5, 11));
const gravelMap = () => canvasTexture(128, (c, s) => noise(c, s, '#a29d93', ['#8d887f', '#b7b2a8', '#7c776f', '#c4c0b7'], 3500, 1.6, 5));
/** One metre of boards: white with soft shadow lines (multiplied by the wall colour). */
const boardsMap = (vertical: boolean) => canvasTexture(256, (c, s) => {
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, s, s);
  // Tømmermannskledning-ish: a wide board and a narrow cover board, five per metre.
  for (let i = 0; i < 5; i++) {
    const p = (i * s) / 5;
    const g = vertical ? c.createLinearGradient(p, 0, p + 14, 0) : c.createLinearGradient(0, p, 0, p + 14);
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.0)');
    g.addColorStop(1, 'rgba(0,0,0,0.12)');
    c.fillStyle = g;
    if (vertical) c.fillRect(p, 0, 14, s); else c.fillRect(0, p, s, 14);
  }
});
const seamsMap = () => canvasTexture(256, (c, s) => {
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, s, s);
  c.fillStyle = 'rgba(0,0,0,0.28)';
  for (let i = 0; i < 2; i++) c.fillRect((i * s) / 2, 0, 5, s);
  c.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 2; i++) c.fillRect((i * s) / 2 + 5, 0, 2, s);
});
/** A sectional garage door: horizontal grooves about every 0.55 m. */
const sectionalMap = () => canvasTexture(256, (c, s) => {
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, s, s);
  for (let i = 0; i < 2; i++) {
    const y = (i * s) / 2;
    c.fillStyle = 'rgba(0,0,0,0.32)'; c.fillRect(0, y, s, 4);
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(0, y + 4, s, 2);
    c.fillStyle = 'rgba(0,0,0,0.06)'; c.fillRect(0, y + 40, s, 2);
  }
});
function labelTexture(text: string): { tex: THREE.CanvasTexture; aspect: number } {
  const w = 256, h = 96;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const c = canvas.getContext('2d')!;
  c.fillStyle = 'rgba(255,255,255,0.88)';
  c.beginPath();
  c.roundRect(28, 14, w - 56, h - 28, 30);
  c.fill();
  c.fillStyle = '#1f2a33';
  c.font = '600 44px "Segoe UI", system-ui, sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, aspect: w / h };
}

// ---------- Geometry from parts (model frame → world: z mirrored so «venstre» is on the viewer's left) ----------
interface Arrays { pos: number[]; nor: number[]; uv: number[] }
const mirror = (p: V3): V3 => [p[0], p[1], -p[2]];
function sub(a: V3, b: V3): V3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a: V3, b: V3): V3 { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function unit(a: V3): V3 { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

/** Planar UVs in metres, picked by the face normal, so textures run on across panels. */
function tri(out: Arrays, a: V3, b: V3, c: V3, roofAlongX: boolean | null) {
  const n = unit(cross(sub(b, a), sub(c, a)));
  const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
  for (const p of [a, b, c]) {
    out.pos.push(p[0], p[1], p[2]);
    out.nor.push(n[0], n[1], n[2]);
    if (roofAlongX !== null && ay >= Math.max(ax, az)) out.uv.push(roofAlongX ? p[0] : p[2], roofAlongX ? p[2] : p[0]);
    else if (ay >= ax && ay >= az) out.uv.push(p[0], p[2]);
    else if (ax >= az) out.uv.push(p[2], p[1]);
    else out.uv.push(p[0], p[1]);
  }
}
/** A convex polygon (world points, outward normal by winding) extruded `depth` behind its face. */
function prism(out: Arrays, top: V3[], depth: number, uvRoof: boolean | null) {
  const n = unit(polyNormal(top));
  const bot = top.map((p) => [p[0] - n[0] * depth, p[1] - n[1] * depth, p[2] - n[2] * depth] as V3);
  for (let i = 1; i + 1 < top.length; i++) {
    tri(out, top[0], top[i], top[i + 1], uvRoof);
    tri(out, bot[0], bot[i + 1], bot[i], uvRoof);
  }
  for (let i = 0; i < top.length; i++) {
    const j = (i + 1) % top.length;
    tri(out, top[i], bot[i], bot[j], uvRoof);
    tri(out, top[i], bot[j], top[j], uvRoof);
  }
}
function partInto(out: Arrays, p: Part, uvRoof: boolean | null) {
  if (p.box) {
    const { x, y, z, w, h, d } = p.box;
    if (w <= 0 || h <= 0 || d <= 0) return;
    const z0 = -(z + d), z1 = -z, yt = y + h;
    let top: V3[] = [[x, yt, z0], [x + w, yt, z0], [x + w, yt, z1], [x, yt, z1]];
    if (polyNormal(top)[1] < 0) top = top.reverse();
    prism(out, top, h, uvRoof);
  } else if (p.poly) {
    prism(out, p.poly.points.map(mirror).reverse(), POLY_DEPTH[p.kind], uvRoof);
  }
}
function geometry(a: Arrays): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(a.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(a.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(a.uv, 2));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

function hasWebGL2(): boolean {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

/** A view that draws nothing (no WebGL at all): the app keeps working without 3D. */
function nullView(container: HTMLElement): View {
  container.classList.add('three-unavailable');
  return { update() {}, snapshot: () => '', resize() {}, dispose() { container.classList.remove('three-unavailable'); } };
}

export function createView(container: HTMLElement): View {
  const forcedLow = typeof location !== 'undefined' && new URLSearchParams(location.search).get('kvalitet') === 'lav';
  const low = forcedLow || !hasWebGL2();
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !low, powerPreference: 'high-performance' });
  } catch {
    return nullView(container);
  }
  renderer.setPixelRatio(low ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !low;
  // PCFSoftShadowMap was removed in three r18x; PCF plus a shadow radius gives the soft edge.
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.touchAction = 'none';
  container.appendChild(canvas);

  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(d: T) => { disposables.push(d); return d; };

  const scene = new THREE.Scene();
  const HORIZON = new THREE.Color('#dfe8ef');
  scene.background = HORIZON;
  scene.fog = new THREE.Fog(HORIZON, 40, 160);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = keep(pmrem.fromScene(new RoomEnvironment(), 0.04));
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.45;
  pmrem.dispose();

  // Sky: a soft vertical gradient on a big inside-out sphere (no fog on it).
  const skyMat = keep(new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#6fa4d8') }, horizon: { value: HORIZON.clone() }, bottom: { value: new THREE.Color('#c9d3c4') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(horizon, top, pow(smoothstep(0.0, 0.8, h), 0.7)) : mix(horizon, bottom, smoothstep(0.0, -0.2, h));
      gl_FragColor = vec4(c, 1.0); }`,
  }));
  const skyGeo = keep(new THREE.SphereGeometry(450, 32, 16));
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.renderOrder = -1;
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xe3eeff, 0x56663f, 1.0);
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
  sun.castShadow = !low;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(hemi, sun, sun.target);

  // The plot: a lawn that fades into the fog.
  const grass = keep(grassMap());
  grass.repeat.set(30, 30);
  const groundGeo = keep(new THREE.CircleGeometry(220, 64).rotateX(-Math.PI / 2));
  const groundMat = keep(new THREE.MeshStandardMaterial({ map: grass, roughness: 0.95, color: '#ffffff' }));
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1200);
  camera.position.set(14, 9, 18);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 4;
  controls.maxDistance = 90;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI * 0.47; // never under the ground
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;

  // Shared textures and materials (one set per view; colours change per update).
  const gravel = keep(gravelMap());
  gravel.repeat.set(1 / 2, 1 / 2);
  const boardsV = keep(boardsMap(true));
  const boardsH = keep(boardsMap(false));
  const seams = keep(seamsMap());
  const sectional = keep(sectionalMap());
  const M = {
    wall: keep(new THREE.MeshStandardMaterial({ roughness: 0.82 })),
    roof: keep(new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.15, map: seams })),
    trim: keep(new THREE.MeshStandardMaterial({ roughness: 0.55 })),
    slab: keep(new THREE.MeshStandardMaterial({ color: '#b4b0a8', roughness: 0.9 })),
    ground: keep(new THREE.MeshStandardMaterial({ map: gravel, roughness: 1 })),
  };
  const glassBase = keep(new THREE.MeshPhysicalMaterial({
    color: GLASS, metalness: 0.15, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2.2, reflectivity: 0.6,
  }));

  // ---------- State ----------
  let accent = new THREE.Color('#2f7d4f');
  const readAccent = () => {
    const v = getComputedStyle(container).getPropertyValue('--accent').trim();
    try { if (v) accent = new THREE.Color(v); } catch { /* keep the fallback */ }
  };
  let building: THREE.Group | null = null;
  let buildingRes: { dispose(): void }[] = [];
  let dims: THREE.Group | null = null;
  let dimsRes: { dispose(): void }[] = [];
  let model: BuildingModel | null = null;
  let lastKey = '';
  let lastHighlight = '';
  let anim: { start: number; dur: number; from: V3 } | null = null;
  const glows: { mat: THREE.MeshStandardMaterial; outline: THREE.Box3Helper; start: number }[] = [];
  let frameAnim: { start: number; fromT: THREE.Vector3; toT: THREE.Vector3; fromP: THREE.Vector3; toP: THREE.Vector3 } | null = null;
  let lastInteraction = 0;
  const now = () => performance.now() / 1000;

  const clearGroup = (g: THREE.Group | null, res: { dispose(): void }[]) => {
    if (g) scene.remove(g);
    for (const r of res) r.dispose();
    res.length = 0;
  };

  /** Camera position and target that frame the bounds in a pleasant 3/4 view from the front-left. */
  function framing(): { target: THREE.Vector3; pos: THREE.Vector3 } {
    const b = model && !model.empty ? model.bounds : { w: 8, h: 3, d: 7 };
    const r = 0.5 * Math.hypot(b.w + 1, b.h, b.d + 1);
    const aspect = Math.max(0.3, camera.aspect);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    let dist = (r / Math.sin(fov / 2)) * 1.08;
    if (aspect < 1) dist /= Math.max(0.45, aspect);
    const target = new THREE.Vector3(0, b.h * 0.38, 0);
    const dir = new THREE.Vector3(-0.62, 0.42, 1).normalize();
    return { target, pos: target.clone().addScaledVector(dir, dist) };
  }
  function reframe(animate: boolean) {
    const f = framing();
    controls.maxDistance = Math.max(30, f.pos.distanceTo(f.target) * 3);
    if (!animate) {
      controls.target.copy(f.target);
      camera.position.copy(f.pos);
      frameAnim = null;
      return;
    }
    frameAnim = { start: now(), fromT: controls.target.clone(), toT: f.target, fromP: camera.position.clone(), toP: f.pos };
  }
  function fitLights() {
    const b = model && !model.empty ? model.bounds : { w: 8, h: 3, d: 7 };
    const r = Math.hypot(b.w, b.d) / 2 + 7; // the drive reaches 6 m out
    sun.target.position.set(0, 0, 0);
    sun.position.set(-0.55 * r * 2.2, 1.1 * r * 2.2, 0.75 * r * 2.2);
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 0.5, far: r * 6 });
    sun.shadow.camera.updateProjectionMatrix();
    const fogBase = Math.max(30, r * 4);
    (scene.fog as THREE.Fog).near = fogBase;
    (scene.fog as THREE.Fog).far = fogBase * 4;
  }

  function buildDims(m: BuildingModel) {
    clearGroup(dims, dimsRes);
    dims = new THREE.Group();
    const { w: L, d: W } = m.bounds;
    const tickMat = keep2(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 }), dimsRes);
    const tickGeo = keep2(new THREE.BoxGeometry(1, 1, 1), dimsRes);
    const n = Math.floor(L + 1e-6) + 1;
    const ticks = new THREE.InstancedMesh(tickGeo, tickMat, n + 1);
    const mtx = new THREE.Matrix4();
    const zf = W / 2 + 1.1;
    for (let i = 0; i < n; i++) {
      const big = i === 0 || i === n - 1;
      mtx.compose(new THREE.Vector3(-L / 2 + i, 0.015, zf), new THREE.Quaternion(), new THREE.Vector3(0.03, 0.02, big ? 0.45 : 0.25));
      ticks.setMatrixAt(i, mtx);
    }
    mtx.compose(new THREE.Vector3(0, 0.015, zf), new THREE.Quaternion(), new THREE.Vector3(L, 0.02, 0.025));
    ticks.setMatrixAt(n, mtx);
    dims.add(ticks);
    const label = (text: string, x: number, z: number) => {
      const { tex, aspect } = labelTexture(text);
      dimsRes.push(tex);
      const mat = keep2(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }), dimsRes);
      const s = new THREE.Sprite(mat);
      const size = Math.max(0.55, Math.min(1.2, Math.max(L, W) * 0.09));
      s.scale.set(size * aspect, size, 1);
      s.position.set(x, 0.45, z);
      s.renderOrder = 10;
      dims!.add(s);
    };
    const nf = (v: number) => `${(Math.round(v * 10) / 10).toFixed(1).replace('.', ',')} m`;
    label(nf(L), 0, zf + 0.5);
    label(nf(W), -L / 2 - 1.4, 0);
    scene.add(dims);
  }
  function keep2<T extends { dispose(): void }>(d: T, list: { dispose(): void }[]) { list.push(d); return d; }

  function buildMeshes(project: Project, m: BuildingModel) {
    clearGroup(building, buildingRes);
    glows.length = 0;
    building = new THREE.Group();
    const b = project.building;
    // Cosmetic hint read from the AI's text (the only one): «stående»/«liggende» board direction.
    const cladding = (b.exterior?.cladding ?? '').toLowerCase();
    M.wall.map = cladding.includes('stående') ? boardsV : cladding.includes('liggende') ? boardsH : null;
    M.wall.needsUpdate = true;
    const roofAlongX = b.roof?.ridge_along !== 'bredde';
    const groups = new Map<string, { mat: THREE.Material; arrays: Arrays; shadow: boolean }>();
    const openings = new Map<string, Opening>(b.openings.map((o) => [o.id, o]));
    for (const p of m.parts) {
      if (p.refId) {
        const op = openings.get(p.refId);
        const a: Arrays = { pos: [], nor: [], uv: [] };
        partInto(a, p, null);
        const geo = keep2(geometry(a), buildingRes);
        let mat: THREE.MeshStandardMaterial;
        if (op?.kind === 'vindu') mat = glassBase.clone();
        else mat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.5, metalness: 0.1, map: op?.kind === 'port' ? sectional : null });
        buildingRes.push(mat);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = mesh.receiveShadow = !low;
        mesh.userData.refId = p.refId;
        building.add(mesh);
        continue;
      }
      const key = `${p.kind === 'gable' ? 'wall' : p.kind === 'frame' ? 'trim' : p.kind}|${p.color}`;
      let g = groups.get(key);
      if (!g) {
        const base = p.kind === 'gable' ? M.wall : p.kind === 'frame' ? M.trim : M[p.kind as keyof typeof M] ?? M.trim;
        base.color.set(p.color);
        if (p.kind === 'ground' || p.kind === 'slab') base.color.set(p.kind === 'ground' ? '#ffffff' : p.color);
        g = { mat: base, arrays: { pos: [], nor: [], uv: [] }, shadow: p.kind !== 'ground' };
        groups.set(key, g);
      }
      partInto(g.arrays, p, p.kind === 'roof' ? roofAlongX : null);
    }
    for (const g of groups.values()) {
      const mesh = new THREE.Mesh(keep2(geometry(g.arrays), buildingRes), g.mat);
      mesh.castShadow = g.shadow && !low;
      mesh.receiveShadow = !low;
      building.add(mesh);
    }
    // The model's origin is the front-left corner; centre the building on the plot (world z is mirrored).
    building.position.set(-m.bounds.w / 2, 0, m.bounds.d / 2);
    scene.add(building);
  }

  function startGlow(highlight: Set<string>) {
    if (!building) return;
    readAccent();
    const t0 = now();
    for (const child of building.children) {
      const mesh = child as THREE.Mesh;
      if (!mesh.userData.refId || !highlight.has(mesh.userData.refId)) continue;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const box = mesh.geometry.boundingBox!.clone().expandByScalar(0.1);
      const outline = new THREE.Box3Helper(box, accent);
      const lm = outline.material as THREE.LineBasicMaterial;
      lm.transparent = true;
      lm.depthTest = false;
      outline.renderOrder = 5;
      buildingRes.push(outline.geometry, lm);
      building.add(outline);
      glows.push({ mat, outline, start: t0 });
    }
  }

  function tickGlows(t: number) {
    for (const g of glows) {
      const e = t - g.start;
      let k: number;
      if (e < GLOW_S) k = 0.45 + 0.4 * Math.pow(Math.sin(e * Math.PI * 1.2), 2);
      else k = Math.max(0, 0.45 * (1 - (e - GLOW_S) / FADE_S));
      g.mat.emissive.copy(accent);
      g.mat.emissiveIntensity = k;
      (g.outline.material as THREE.LineBasicMaterial).opacity = Math.min(1, k * 2);
      g.outline.visible = k > 0.01;
    }
    for (let i = glows.length - 1; i >= 0; i--) if (t - glows[i].start > GLOW_S + FADE_S) glows.splice(i, 1);
  }

  function tickAnim(t: number) {
    if (!building || !anim) return;
    const k = easeOut((t - anim.start) / anim.dur);
    building.scale.set(
      anim.from[0] + (1 - anim.from[0]) * k,
      anim.from[1] + (1 - anim.from[1]) * k,
      anim.from[2] + (1 - anim.from[2]) * k,
    );
    if (dims) dims.visible = k > 0.85;
    if (k >= 1) { anim = null; building.scale.set(1, 1, 1); if (dims) dims.visible = true; }
  }

  // ---------- Loop: paused while the container or the tab is hidden ----------
  let raf = 0;
  let visible = true;
  const render = () => renderer.render(scene, camera);
  const loop = () => {
    raf = 0;
    if (!visible || document.hidden) return;
    const t = now();
    if (frameAnim) {
      const k = easeOut((t - frameAnim.start) / 0.9);
      controls.target.lerpVectors(frameAnim.fromT, frameAnim.toT, k);
      camera.position.lerpVectors(frameAnim.fromP, frameAnim.toP, k);
      if (k >= 1) frameAnim = null;
    }
    if (!controls.autoRotate && performance.now() - lastInteraction > IDLE_ROTATE_MS) controls.autoRotate = true;
    controls.update();
    tickAnim(t);
    tickGlows(t);
    render();
    raf = requestAnimationFrame(loop);
  };
  const wake = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };

  const onStart = () => { controls.autoRotate = false; frameAnim = null; lastInteraction = performance.now(); };
  const onEnd = () => { lastInteraction = performance.now(); };
  controls.addEventListener('start', onStart);
  controls.addEventListener('end', onEnd);
  const onDbl = () => { reframe(true); };
  canvas.addEventListener('dblclick', onDbl);
  const onVis = () => wake();
  document.addEventListener('visibilitychange', onVis);
  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); wake(); })
    : null;
  io?.observe(container);

  function resize() {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    const wasAspect = camera.aspect;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (Math.abs(wasAspect - camera.aspect) > 0.2 && !lastInteraction) reframe(false);
    wake();
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  ro?.observe(container);
  resize();
  fitLights();
  reframe(false);
  wake();

  return {
    update(project, highlight) {
      const key = JSON.stringify(project.building);
      const hKey = [...highlight].sort().join('|');
      const changed = key !== lastKey;
      if (changed) {
        const prev = model;
        const next = buildModel(project.building);
        lastKey = key;
        model = next;
        if (next.empty) {
          clearGroup(building, buildingRes);
          clearGroup(dims, dimsRes);
          building = dims = null;
          glows.length = 0;
          anim = null;
        } else {
          buildMeshes(project, next);
          buildDims(next);
          if (!prev || prev.empty) {
            anim = { start: now(), dur: RISE_S, from: [1, 0.001, 1] }; // the building rises
          } else {
            const f = (a: number, b: number) => (b > 0 ? a / b : 1);
            const from: V3 = [f(prev.bounds.w, next.bounds.w), f(prev.bounds.h, next.bounds.h), f(prev.bounds.d, next.bounds.d)];
            anim = from.some((v) => Math.abs(v - 1) > 1e-3) ? { start: now(), dur: MORPH_S, from } : null;
          }
          if (anim) tickAnim(anim.start);
        }
        const boundsChanged = !prev || prev.empty !== next.empty || JSON.stringify(prev.bounds) !== JSON.stringify(next.bounds);
        if (boundsChanged) {
          fitLights();
          reframe(!!prev && !prev.empty);
        }
      }
      if (changed || hKey !== lastHighlight) {
        lastHighlight = hKey;
        if (highlight.size) startGlow(highlight);
      }
      wake();
    },
    snapshot() {
      const saved = building ? building.scale.clone() : null;
      if (building) building.scale.set(1, 1, 1);
      const dimsVis = dims?.visible;
      if (dims) dims.visible = true;
      controls.update();
      render();
      const url = canvas.toDataURL('image/png'); // same task as the render, so no preserveDrawingBuffer needed
      if (building && saved) building.scale.copy(saved);
      if (dims && dimsVis !== undefined) dims.visible = dimsVis;
      return url;
    },
    resize,
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('dblclick', onDbl);
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
      controls.dispose();
      clearGroup(building, buildingRes);
      clearGroup(dims, dimsRes);
      for (const d of disposables) d.dispose();
      scene.environment = null;
      renderer.dispose();
      canvas.remove();
    },
  };
}
