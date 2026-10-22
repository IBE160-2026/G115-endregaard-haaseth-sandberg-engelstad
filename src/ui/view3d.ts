// 3D view of the construction stage: A-blokka as built (11 floors) over the basement complex.
// The scene is rebuilt from the tasks' progress every time the week changes.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { progress, type GameState } from '../engine/game';
import type { Scenario } from '../engine/scenario';

const FLOORS = 11;
const FLOOR_H = 4.5; // 50 m / 11 floors
const PIT = { w: 34, d: 24, depth: 8 };
const TOWER = { w: 26, d: 16 };
const BASEMENT_TASKS = ['C', 'D', 'E', 'L'];

const mat = {
  ground: new THREE.MeshStandardMaterial({ color: 0x7d8a6a, roughness: 1 }),
  park: new THREE.MeshStandardMaterial({ color: 0x5f9e4f, roughness: 1 }),
  earth: new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 1 }),
  pitWall: new THREE.MeshStandardMaterial({ color: 0x6e5a46, roughness: 1 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xbfbcb6, roughness: 0.9 }),
  slab: new THREE.MeshStandardMaterial({ color: 0xa7a39c, roughness: 0.9 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x7fb6d9, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.55 }),
  light: new THREE.MeshStandardMaterial({ color: 0xffe4a3, emissive: 0xffc861, emissiveIntensity: 0.9 }),
  core: new THREE.MeshStandardMaterial({ color: 0x8f8c86 }),
  coreDone: new THREE.MeshStandardMaterial({ color: 0x0f6cbd }),
  crane: new THREE.MeshStandardMaterial({ color: 0xf2b81c, roughness: 0.6 }),
  water: new THREE.MeshStandardMaterial({ color: 0x2f7fd0, transparent: true, opacity: 0.7, roughness: 0.1 }),
  art: new THREE.MeshStandardMaterial({ color: 0xc0392b, emissive: 0x5a1a12, emissiveIntensity: 0.4 }),
};

const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y + h / 2, z);
  return mesh;
};

export interface View3d {
  update(s: Scenario, g: GameState | undefined): void;
  /** Stops or restarts the render loop (while the window is hidden). */
  setActive(on: boolean): void;
  dispose(): void;
}

export function createView3d(container: HTMLElement): View3d {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 1000);
  camera.position.set(70, 55, 80);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 14, 0);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.49;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x556655, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(40, 80, 30);
  scene.add(sun);

  // The ground around the pit is static.
  const rim = 60;
  const ground = new THREE.Group();
  ground.add(box(rim * 2, 0.2, rim - PIT.d / 2, mat.ground, 0, -0.2, -(rim / 2 + PIT.d / 4)));
  ground.add(box(rim * 2, 0.2, rim - PIT.d / 2, mat.ground, 0, -0.2, rim / 2 + PIT.d / 4));
  ground.add(box(rim - PIT.w / 2, 0.2, PIT.d, mat.ground, -(rim / 2 + PIT.w / 4), -0.2, 0));
  ground.add(box(rim - PIT.w / 2, 0.2, PIT.d, mat.ground, rim / 2 + PIT.w / 4, -0.2, 0));
  scene.add(ground);

  let site = new THREE.Group();
  let crane: THREE.Group | null = null;
  scene.add(site);

  function build(s: Scenario, g: GameState | undefined) {
    scene.remove(site);
    site.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
    site = new THREE.Group();
    crane = null;
    const p = g ? progress(s, g) : Object.fromEntries(s.tasks.map(t => [t.id, 0]));
    const done = (id: string) => p[id] >= 1 - 1e-9;

    // Pit walls, and earth that is dug out as C progresses.
    site.add(box(PIT.w, PIT.depth, 0.6, mat.pitWall, 0, -PIT.depth, -PIT.d / 2));
    site.add(box(PIT.w, PIT.depth, 0.6, mat.pitWall, 0, -PIT.depth, PIT.d / 2));
    site.add(box(0.6, PIT.depth, PIT.d, mat.pitWall, -PIT.w / 2, -PIT.depth, 0));
    site.add(box(0.6, PIT.depth, PIT.d, mat.pitWall, PIT.w / 2, -PIT.depth, 0));
    const earth = PIT.depth * (1 - p.C);
    if (earth > 0.05) site.add(box(PIT.w, earth, PIT.d, mat.earth, 0, -PIT.depth, 0));

    // D: foundation slab and piles.
    if (p.D > 0) {
      site.add(box(PIT.w - 1, 0.8 * p.D, PIT.d - 1, mat.slab, 0, -PIT.depth, 0));
      for (let i = -2; i <= 2; i++) for (const z of [-6, 6]) site.add(box(0.8, 2 * p.D, 0.8, mat.concrete, i * 6.5, -PIT.depth - 2 * p.D, z));
    }
    // E: two basement levels rising from the bottom of the pit.
    if (p.E > 0) {
      const h = PIT.depth * p.E;
      site.add(box(PIT.w - 1.4, h, 0.5, mat.concrete, 0, -PIT.depth, -PIT.d / 2 + 1));
      site.add(box(PIT.w - 1.4, h, 0.5, mat.concrete, 0, -PIT.depth, PIT.d / 2 - 1));
      if (p.E >= 0.5) site.add(box(PIT.w - 1.4, 0.4, PIT.d - 2, mat.slab, 0, -PIT.depth / 2, 0));
      if (done('E')) site.add(box(PIT.w - 1.4, 0.4, PIT.d - 2, mat.slab, 0, -0.4, 0));
    }
    // L: basement fit-out lights.
    if (p.L > 0) {
      const n = Math.round(p.L * 6);
      for (let i = 0; i < n; i++) site.add(box(3, 0.2, 0.6, mat.light, -12 + i * 5, -PIT.depth / 2 - 0.6, 0));
    }

    // F: floors of the structure; G: facade; H/I/K/J: lit interiors; O: lift core.
    const floors = Math.floor(p.F * FLOORS + 1e-9);
    const glazed = Math.floor(p.G * FLOORS + 1e-9);
    const lit = Math.floor(((p.H + p.I + p.K + p.J) / 4) * FLOORS + 1e-9);
    for (let i = 0; i < floors; i++) {
      const y = i * FLOOR_H;
      site.add(box(TOWER.w, 0.5, TOWER.d, mat.slab, 0, y, 0));
      for (const x of [-TOWER.w / 2 + 0.5, 0, TOWER.w / 2 - 0.5]) for (const z of [-TOWER.d / 2 + 0.5, TOWER.d / 2 - 0.5]) {
        site.add(box(0.6, FLOOR_H, 0.6, mat.concrete, x, y, z));
      }
      if (i < lit) site.add(box(TOWER.w - 2, FLOOR_H - 1.2, TOWER.d - 2, mat.light, 0, y + 0.6, 0));
      if (i < glazed) site.add(box(TOWER.w + 0.3, FLOOR_H - 0.5, TOWER.d + 0.3, mat.glass, 0, y + 0.5, 0));
    }
    if (floors > 0) site.add(box(4, floors * FLOOR_H, 4, done('O') ? mat.coreDone : mat.core, 0, 0, 0));
    if (done('G')) site.add(box(TOWER.w + 0.6, 0.6, TOWER.d + 0.6, mat.slab, 0, FLOORS * FLOOR_H, 0));

    // The tower crane stands from the start of F until the facade is closed.
    if (g && g.tasks[s.tasks.findIndex(t => t.id === 'F')].start !== null && !done('G')) {
      crane = new THREE.Group();
      const mastH = FLOORS * FLOOR_H + 12;
      crane.add(box(1.6, mastH, 1.6, mat.crane, 0, -PIT.depth, 0));
      const jib = box(40, 1, 1.2, mat.crane, 10, mastH - PIT.depth, 0);
      crane.add(jib);
      crane.add(box(1, 1, 6, mat.crane, -8, mastH - PIT.depth - 1, 0));
      crane.position.set(TOWER.w / 2 + 6, 0, -TOWER.d / 2 - 4);
      crane.rotation.y = (g.week % 24) / 24 * Math.PI * 2;
      site.add(crane);
    }

    // Water in the pit while a basement task stands still because of it (or the decision is pending).
    const flooded = g && (g.pending?.eventId === 'water'
      || BASEMENT_TASKS.some(id => {
        const t = g.tasks[s.tasks.findIndex(x => x.id === id)];
        return t.start !== null && t.finish === null && t.stallCause === 'water';
      }));
    if (flooded) site.add(box(PIT.w - 1, 2.2, PIT.d - 1, mat.water, 0, -PIT.depth + 0.2, 0));

    // Finished: the park, and the artwork «AAkhA» in the entrance.
    if (g?.done) {
      site.add(box(rim * 2, 0.05, rim * 2 - 10, mat.park, 0, 0.01, 0));
      site.add(box(3, FLOORS * FLOOR_H - 2, 0.3, mat.art, -6, 1, TOWER.d / 2 + 0.4));
    }
    scene.add(site);
  }

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);

  function background() {
    const css = getComputedStyle(container).getPropertyValue('--layer').trim() || '#f3f3f3';
    scene.background = new THREE.Color(css);
  }

  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  };
  loop();
  const setActive = (on: boolean) => {
    cancelAnimationFrame(raf);
    if (on) loop();
  };

  return {
    update(s, g) {
      background();
      build(s, g);
      resize();
    },
    setActive,
    dispose() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
