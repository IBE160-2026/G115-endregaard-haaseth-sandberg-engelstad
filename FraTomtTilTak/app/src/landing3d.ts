// Real-time 3D for the landing page: the office building rises with the scroll.
// Loaded lazily; landing.ts keeps the flat SVG as the fallback when WebGL is missing.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const clamp = (x: number): number => Math.max(0, Math.min(1, x));
const ss = (a: number, b: number, t: number): number => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };

// Building: 7 floors of 4 m on a footprint of about 24 x 14 m (329 m² in the rules).
const FLOORS = 7, FH = 4, W = 24, D = 14;
const COLS_X = [-12, -6, 0, 6, 12], COLS_Z = [-7, 0, 7];

export interface Building3D { setU(u: number): void; dispose(): void }

export function mountBuilding3D(host: HTMLElement): Building3D {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border-radius:4px';
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  scene.fog = new THREE.Fog(0x2a241d, 90, 220);

  // Dusk sky as a gradient dome.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x1f2735) }, mid: { value: new THREE.Color(0x8a6a4f) }, low: { value: new THREE.Color(0xe0a76a) } },
      vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 p; void main(){ float h = p.y; vec3 c = h > 0.08 ? mix(mid, top, smoothstep(0.08, 0.6, h)) : mix(low, mid, smoothstep(-0.05, 0.08, h)); gl_FragColor = vec4(c, 1.0); }',
    }),
  );
  scene.add(sky);

  scene.add(new THREE.HemisphereLight(0xb9c6da, 0x3b2f22, 0.55));
  const sun = new THREE.DirectionalLight(0xffcf98, 2.6);
  sun.position.set(-45, 32, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 });
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const mat = {
    ground: new THREE.MeshStandardMaterial({ color: 0x2b2a22, roughness: 1 }),
    gravel: new THREE.MeshStandardMaterial({ color: 0x8b8070, roughness: 1 }),
    grass: new THREE.MeshStandardMaterial({ color: 0x5c6b3b, roughness: 1 }),
    pit: new THREE.MeshStandardMaterial({ color: 0x4a3c2c, roughness: 1 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xc4bcae, roughness: 0.85 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8a8580, metalness: 0.7, roughness: 0.45 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xdccdb4, roughness: 0.7 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1b2631, metalness: 0.2, roughness: 0.12, transparent: true, opacity: 0.3, depthWrite: false }),
    warm: new THREE.MeshStandardMaterial({ color: 0x15110c, emissive: 0xffa94d, emissiveIntensity: 0 }),
    neighbour: new THREE.MeshStandardMaterial({ color: 0x4d463c, roughness: 0.9 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x1f1e1b, roughness: 1 }),
    stake: new THREE.MeshStandardMaterial({ color: 0xc8a96a, emissive: 0xc8a96a, emissiveIntensity: 0.6 }),
    crane: new THREE.MeshStandardMaterial({ color: 0xe0a51c, metalness: 0.3, roughness: 0.5 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x5f7240, roughness: 0.9 }),
  };
  const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0, parent: THREE.Object3D = scene): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };

  // Ground, plot and site surface.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat.ground);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const site = box(44, 0.1, 34, mat.gravel, 0, 0.05, 0);
  const lawn = box(44, 0.12, 34, mat.grass, 0, 0.06, 0);

  // Streets and the neighbouring city block, so the site sits in a town.
  box(400, 0.06, 12, mat.asphalt, 0, 0.03, 25);
  box(12, 0.06, 400, mat.asphalt, -30, 0.03, 0);
  for (const [x, z, w, d, h] of [
    [-62, -16, 26, 22, 20], [-24, -58, 22, 18, 28], [6, -46, 34, 20, 18], [46, -42, 26, 22, 30],
    [54, 2, 20, 26, 16], [62, 42, 26, 20, 22], [92, -14, 28, 28, 32], [-90, -50, 30, 24, 24],
  ]) box(w, h, d, mat.neighbour, x, h / 2, z);

  // Stakes and string line marking the footprint (stage 1).
  const stakes = new THREE.Group(); scene.add(stakes);
  for (const [x, z] of [[-12, -7], [12, -7], [12, 7], [-12, 7]]) box(0.25, 1.2, 0.25, mat.stake, x, 0.6, z, stakes);
  box(W, 0.06, 0.06, mat.stake, 0, 0.9, -7, stakes); box(W, 0.06, 0.06, mat.stake, 0, 0.9, 7, stakes);
  box(0.06, 0.06, D, mat.stake, -12, 0.9, 0, stakes); box(0.06, 0.06, D, mat.stake, 12, 0.9, 0, stakes);

  // Excavation and foundation slab.
  const pit = box(W + 4, 0.14, D + 4, mat.pit, 0, 0.07, 0);
  const slab = box(W + 1, 0.8, D + 1, mat.concrete, 0, 0.4, 0);

  // Steel frame and floor slabs, one group per floor.
  const frames: THREE.Group[] = [];
  for (let f = 0; f < FLOORS; f++) {
    const g = new THREE.Group(); g.position.y = 0.8 + f * FH; scene.add(g);
    for (const x of COLS_X) for (const z of COLS_Z) box(0.45, FH, 0.45, mat.steel, x, FH / 2, z, g);
    for (const z of COLS_Z) box(W, 0.5, 0.35, mat.steel, 0, FH - 0.25, z, g);
    for (const x of COLS_X) box(0.35, 0.5, D, mat.steel, x, FH - 0.25, 0, g);
    box(W + 0.6, 0.3, D + 0.6, mat.concrete, 0, FH, 0, g);
    frames.push(g);
  }

  // Facade per floor: stone band, glass, and a warm-lit interior behind it.
  const facades: THREE.Group[] = [];
  const lights: THREE.MeshStandardMaterial[] = [];
  for (let f = 0; f < FLOORS; f++) {
    const g = new THREE.Group(); g.position.y = 0.8 + f * FH; scene.add(g);
    box(W + 0.8, 0.9, D + 0.8, mat.stone, 0, 0.45, 0, g);
    box(W + 0.4, FH - 0.9, D + 0.4, mat.glass, 0, 0.9 + (FH - 0.9) / 2, 0, g);
    const lit = mat.warm.clone(); lights.push(lit);
    box(W - 0.6, FH - 1.2, D - 0.6, lit, 0, 0.9 + (FH - 1.2) / 2, 0, g);
    for (const x of [-12, -8, -4, 0, 4, 8, 12]) for (const z of [-D / 2 - 0.25, D / 2 + 0.25]) box(0.18, FH - 0.9, 0.18, mat.stone, x, 0.9 + (FH - 0.9) / 2, z, g);
    for (const z of [-7, -3.5, 0, 3.5, 7]) for (const x of [-W / 2 - 0.25, W / 2 + 0.25]) box(0.18, FH - 0.9, 0.18, mat.stone, x, 0.9 + (FH - 0.9) / 2, z, g);
    facades.push(g);
  }
  const roof = new THREE.Group(); roof.position.y = 0.8 + FLOORS * FH; scene.add(roof);
  box(W + 0.8, 1.0, D + 0.8, mat.stone, 0, 0.5, 0, roof);
  box(6, 2.4, 4, mat.concrete, -5, 1.6, 0, roof);
  box(3, 1.6, 3, mat.steel, 5, 1.2, 2, roof);

  // Tower crane.
  const crane = new THREE.Group(); crane.position.set(18, 0, -12); scene.add(crane);
  const H = 42;
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]]) box(0.22, H, 0.22, mat.crane, x, H / 2, z, crane);
  for (let y = 2; y < H; y += 3) { box(1.8, 0.14, 0.14, mat.crane, 0, y, -0.8, crane); box(1.8, 0.14, 0.14, mat.crane, 0, y, 0.8, crane); box(0.14, 0.14, 1.8, mat.crane, -0.8, y, 0, crane); box(0.14, 0.14, 1.8, mat.crane, 0.8, y, 0, crane); }
  const jib = new THREE.Group(); jib.position.y = H; crane.add(jib);
  box(36, 1.0, 1.0, mat.crane, -12, 0.6, 0, jib);
  box(4, 3, 4, mat.concrete, 9, 0.2, 0, jib);
  box(2.2, 2.2, 2.2, mat.crane, 1.6, -1.2, 0, jib);
  box(0.6, 5, 0.6, mat.crane, 0, 3, 0, jib);
  const hook = box(0.08, 14, 0.08, mat.steel, -20, -6.5, 0, jib);

  // Trees around the finished building.
  const trees: THREE.Group[] = [];
  for (const [x, z, s] of [[-17, 10, 1.1], [-19, -5, 0.9], [16, 11, 1], [7, 13, 0.8], [-6, 13.5, 0.85], [19, 3, 0.95], [-20, 4, 0.8]]) {
    const t = new THREE.Group(); t.position.set(x, 0, z); scene.add(t);
    box(0.35, 3, 0.35, mat.trunk, 0, 1.5, 0, t);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), mat.leaf);
    crown.position.y = 4.4; crown.castShadow = true; t.add(crown);
    t.userData.s = s; trees.push(t);
  }

  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 900);
  let u = 0;
  let needs = true;

  const resize = (): void => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix(); needs = true;
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const apply = (time: number): void => {
    const p2 = ss(1.5, 3.0, u), p4s = 5.5, p5 = ss(7.0, 8.5, u), p6 = ss(8.5, 10, u);
    site.visible = p6 < 1; lawn.visible = p6 > 0;
    lawn.position.y = 0.06 + (1 - p6) * -0.2;
    stakes.visible = u < 2.2;
    pit.visible = u > 1.4 && u < 3.2; pit.scale.y = 1; pit.position.y = 0.07 - (1 - p2) * 0.2;
    const ps = ss(2.0, 3.0, u); slab.visible = ps > 0; slab.scale.y = Math.max(ps, 0.001); slab.position.y = 0.4 * ps;
    frames.forEach((g, f) => {
      const q = ss(3.0 + f * 0.34, 3.5 + f * 0.34, u);
      g.visible = q > 0; g.position.y = 0.8 + f * FH + (1 - q) * 6; g.scale.setScalar(1);
    });
    facades.forEach((g, f) => {
      const q = ss(p4s + f * 0.2, p4s + 0.35 + f * 0.2, u);
      g.visible = q > 0; g.scale.set(1, Math.max(q, 0.001), 1);
    });
    roof.visible = u > 6.9;
    lights.forEach((m, f) => { m.emissiveIntensity = 0.9 * ss(7.0 + ((f * 37) % 7) * 0.18, 7.5 + ((f * 37) % 7) * 0.18, u); });
    const craneOn = u > 1.6 && u < 9.2;
    crane.visible = craneOn; crane.position.y = -ss(8.4, 9.2, u) * 46 + (1 - ss(1.6, 2.6, u)) * -46;
    jib.rotation.y = 0.6 + Math.sin(time * 0.00018) * 0.9;
    hook.scale.y = 1;
    trees.forEach((t, i) => { const q = ss(8.6 + i * 0.15, 9.2 + i * 0.15, u); t.visible = q > 0; t.scale.setScalar(Math.max(q, 0.001) * (t.userData.s as number)); });
    sun.intensity = 2.6 - p5 * 0.9;
    renderer.toneMappingExposure = 1.05 - p5 * 0.1;

    const a = -0.95 + u * 0.085;
    const r = 112 - ss(0, 10, u) * 10;
    camera.position.set(Math.sin(a) * r, 30 + u * 0.8, Math.cos(a) * r);
    camera.lookAt(0, 8 + ss(3, 7, u) * 6, 0);
  };

  let running = true;
  let visible = true;
  const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; }, { threshold: 0 });
  io.observe(host);
  const loop = (time: number): void => {
    if (!running) return;
    if (visible && (needs || (u > 1.6 && u < 9.2))) { apply(time); renderer.render(scene, camera); needs = false; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  return {
    setU(next: number) { if (next !== u) { u = next; needs = true; } },
    dispose() { running = false; ro.disconnect(); io.disconnect(); renderer.dispose(); pmrem.dispose(); renderer.domElement.remove(); },
  };
}
