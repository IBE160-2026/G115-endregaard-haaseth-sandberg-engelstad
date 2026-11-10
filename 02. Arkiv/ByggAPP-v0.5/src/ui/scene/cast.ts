// The named people on site: the player (Statsbygg), Elisabeth, Hedda, Oskar and the foremen.
// Low-poly articulated figures (legs, arms and head swing), built once from shared geometry.
import * as THREE from 'three';
import type { Ppe } from '../story';

export interface Look {
  skin: number;
  vest: number;
  shirt: number;
  pants: number;
  helmet: number;
  hair: number;
  hairStyle: 'pony' | 'bun' | 'short' | 'beard';
  /** A coloured band on the vest (the discipline or role). */
  band?: number;
}

export interface Character {
  /** Position on the ground and rotation (yaw) live here. */
  group: THREE.Group;
  /** Every mesh, for picking with the mouse. */
  meshes: THREE.Mesh[];
  /** Turns protective gear on (the player collects it from Oskar). */
  setPpe(items: readonly Ppe[]): void;
  /** speed: m/s on the ground; talk: 0–1 how much the arms and head move. */
  animate(dt: number, speed: number, talk: number): void;
}

const mats = new Map<number, THREE.MeshStandardMaterial>();
const matOf = (c: number) => {
  if (!mats.has(c)) mats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
  return mats.get(c)!;
};
const reflect = new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.3, metalness: 0.4, emissive: 0x404850, emissiveIntensity: 0.4 });
const dark = new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.5 });
const lens = new THREE.MeshStandardMaterial({ color: 0x9fd7ff, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.75 });

// Shared geometry: boxes are unit boxes scaled per mesh; limbs hang from their pivot.
const BOX = new THREE.BoxGeometry(1, 1, 1);
const HEAD = new THREE.SphereGeometry(0.2, 14, 10);
const HELMET = new THREE.SphereGeometry(0.235, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.52);
const BRIM = new THREE.CylinderGeometry(0.27, 0.27, 0.03, 18);
const HAND = new THREE.SphereGeometry(0.075, 8, 6);
const EAR = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12).rotateZ(Math.PI / 2);
const BUN = new THREE.SphereGeometry(0.1, 8, 6);

// Small parts (eyes, hands, hair, gear) cast no shadow; the body, legs and helmet do (see below).
function box(m: THREE.Material, w: number, h: number, d: number, x = 0, y = 0, z = 0, shadow = false): THREE.Mesh {
  const mesh = new THREE.Mesh(BOX, m);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  return mesh;
}
function mesh(geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, shadow = false): THREE.Mesh {
  const out = new THREE.Mesh(geo, m);
  out.position.set(x, y, z);
  out.castShadow = shadow;
  return out;
}

export function createCharacter(look: Look, scale = 1.3): Character {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  group.scale.setScalar(scale);
  const meshes: THREE.Mesh[] = [];
  const keep = <T extends THREE.Mesh>(m: T, parent: THREE.Object3D) => { parent.add(m); meshes.push(m); return m; };

  // Legs: trousers and boots, pivoting at the hip.
  const legs = [-0.14, 0.14].map(x => {
    const hip = new THREE.Group();
    hip.position.set(x, 0.95, 0);
    keep(box(matOf(look.pants), 0.2, 0.84, 0.22, 0, -0.42, 0, true), hip);
    keep(box(dark, 0.22, 0.14, 0.32, 0, -0.88, 0.04), hip);
    body.add(hip);
    return hip;
  });

  // Torso: the hi-vis vest with reflective bands and an optional coloured band.
  keep(box(matOf(look.vest), 0.56, 0.68, 0.32, 0, 1.28, 0, true), body);
  keep(box(reflect, 0.575, 0.05, 0.335, 0, 1.12, 0), body);
  keep(box(reflect, 0.575, 0.05, 0.335, 0, 1.34, 0), body);
  if (look.band !== undefined) keep(box(matOf(look.band), 0.2, 0.12, 0.02, 0.14, 1.5, 0.17), body);

  // Arms: sleeves in the shirt colour, hands (or gloves) at the end.
  const handMat = matOf(look.skin);
  const gloveMat = matOf(0x8a6b45);
  const hands: THREE.Mesh[] = [];
  const arms = [-0.37, 0.37].map(x => {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 1.56, 0);
    keep(box(matOf(look.shirt), 0.15, 0.6, 0.17, 0, -0.3, 0), shoulder);
    hands.push(keep(mesh(HAND, handMat, 0, -0.64, 0), shoulder));
    body.add(shoulder);
    return shoulder;
  });

  // Head: face, eyes, hair, the helmet with its brim.
  const head = new THREE.Group();
  head.position.set(0, 1.62, 0);
  body.add(head);
  keep(box(matOf(look.skin), 0.12, 0.08, 0.12, 0, 0.04, 0), head);
  keep(mesh(HEAD, matOf(look.skin), 0, 0.24, 0), head);
  keep(box(dark, 0.05, 0.05, 0.02, -0.07, 0.27, 0.185), head);
  keep(box(dark, 0.05, 0.05, 0.02, 0.07, 0.27, 0.185), head);
  const hair = matOf(look.hair);
  if (look.hairStyle === 'pony') keep(box(hair, 0.12, 0.32, 0.1, 0, 0.14, -0.22), head);
  if (look.hairStyle === 'bun') keep(mesh(BUN, hair, 0, 0.3, -0.22), head);
  if (look.hairStyle === 'beard') keep(box(hair, 0.3, 0.12, 0.08, 0, 0.12, 0.15), head);
  if (look.hairStyle === 'short') keep(box(hair, 0.36, 0.08, 0.3, 0, 0.3, -0.05), head);
  keep(mesh(HELMET, matOf(look.helmet), 0, 0.3, 0, true), head);
  keep(mesh(BRIM, matOf(look.helmet), 0, 0.31, 0.02), head);

  // Protective gear the player collects: glasses, ear defenders, chin strap.
  const glasses = new THREE.Group();
  glasses.add(box(lens, 0.32, 0.07, 0.03, 0, 0.27, 0.2), box(dark, 0.34, 0.02, 0.035, 0, 0.31, 0.2));
  const ears = new THREE.Group();
  ears.add(mesh(EAR, matOf(0xf2b81c), -0.22, 0.24, 0), mesh(EAR, matOf(0xf2b81c), 0.22, 0.24, 0), box(dark, 0.46, 0.03, 0.04, 0, 0.47, 0));
  const strap = new THREE.Group();
  strap.add(box(dark, 0.03, 0.26, 0.03, -0.17, 0.2, 0.02), box(dark, 0.03, 0.26, 0.03, 0.17, 0.2, 0.02), box(dark, 0.3, 0.03, 0.06, 0, 0.07, 0.1));
  for (const g of [glasses, ears, strap]) { g.visible = false; head.add(g); }

  let phase = Math.random() * 10;
  let t = Math.random() * 10;
  return {
    group,
    meshes,
    setPpe(items) {
      glasses.visible = items.includes('glasses');
      ears.visible = items.includes('ears');
      strap.visible = items.includes('strap');
      for (const h of hands) h.material = items.includes('gloves') ? gloveMat : handMat;
    },
    animate(dt, speed, talk) {
      t += dt;
      const walk = Math.min(1, speed / 2.5);
      phase += dt * (4 + speed * 2.2);
      const swing = Math.sin(phase) * 0.7 * walk;
      legs[0].rotation.x = swing;
      legs[1].rotation.x = -swing;
      arms[0].rotation.x = -swing * 0.8;
      arms[1].rotation.x = swing * 0.8;
      body.position.y = Math.abs(Math.cos(phase)) * 0.06 * walk + Math.sin(t * 1.6) * 0.008;
      // Talking: the right hand gestures and the head nods.
      if (talk > 0) {
        arms[1].rotation.x = -0.9 * talk + Math.sin(t * 5) * 0.25 * talk;
        arms[1].rotation.z = 0.25 * talk;
        head.rotation.x = Math.sin(t * 3.2) * 0.08 * talk;
      } else {
        arms[1].rotation.z = 0;
        head.rotation.x *= 0.9;
      }
      head.rotation.y = walk > 0.1 ? 0 : Math.sin(t * 0.5) * 0.25 * (1 - talk);
    },
  };
}

/** The looks of the named roles; foremen get their discipline colour on the vest. */
export const LOOKS: Record<string, Look> = {
  owner: { skin: 0xe8b996, vest: 0xd8ff3a, shirt: 0x1f3d6f, pants: 0x1f2a3a, helmet: 0xffffff, hair: 0x4a3426, hairStyle: 'short', band: 0x005fb8 },
  pm: { skin: 0xf0c4a2, vest: 0xd8ff3a, shirt: 0x31465e, pants: 0x2b2f3a, helmet: 0xffffff, hair: 0x6b3f23, hairStyle: 'pony', band: 0x005fb8 },
  site: { skin: 0xf3cfb0, vest: 0xf7630c, shirt: 0x3a3f47, pants: 0x30343c, helmet: 0xffffff, hair: 0xe0c27a, hairStyle: 'bun', band: 0xffffff },
  hms: { skin: 0xd9a27e, vest: 0x4fd14f, shirt: 0x24502c, pants: 0x2a2f2a, helmet: 0x1f9d3a, hair: 0x7a4a2a, hairStyle: 'beard', band: 0xffffff },
};

const FOREMAN_BANDS: Record<string, number> = {
  A: 0x7a5af8, C: 0xc42b1c, D: 0x8a6a4a, E: 0x8f8c86, F: 0x6d6d6d, L: 0x0f7b0f, G: 0x60cdff,
  O: 0x005fb8, H: 0x2f7fd0, I: 0xf2b81c, K: 0xb58b5a, J: 0x9b59b6, N: 0x0f7b0f,
};

export function foremanLook(taskId: string): Look {
  const n = taskId.charCodeAt(0);
  return {
    skin: [0xe8b996, 0xc68a62, 0xf0c4a2, 0x9c6b4a][n % 4],
    vest: 0xf7630c,
    shirt: 0x2d3238,
    pants: 0x2f3b4c,
    helmet: 0xf2b81c,
    hair: [0x2b1d14, 0x6b4f3a, 0xb08a5a][n % 3],
    hairStyle: n % 3 === 0 ? 'beard' : 'short',
    band: FOREMAN_BANDS[taskId] ?? 0xffffff,
  };
}
