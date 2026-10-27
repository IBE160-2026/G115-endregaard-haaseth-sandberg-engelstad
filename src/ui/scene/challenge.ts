// The challenge as a small 3D model over the meeting table: water in the pit, cracked rock, a crane
// in the wind, a late facade truck … One model per event, built from primitives when the meeting
// starts and disposed of when it ends. Animation is presentation only.
import * as THREE from 'three';

export interface Model {
  group: THREE.Group;
  update(t: number): void;
  dispose(): void;
}

const C = {
  water: 0x2f8fe0, rock: 0x7b746c, dirt: 0x8a6a4a, concrete: 0xc9c6bf, orange: 0xf7630c, yellow: 0xf2b81c,
  dark: 0x2d3238, red: 0xe0402f, green: 0x3fcf4f, blue: 0x005fb8, glass: 0x7fc4f0, white: 0xf4f6f8, steel: 0x8d99a6, toxic: 0x9bff3a,
};

export function buildChallenge(eventId: string, kind: string): Model {
  const group = new THREE.Group();
  const owned: (THREE.BufferGeometry | THREE.Material)[] = [];
  const anims: ((t: number) => void)[] = [];
  const mat = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
    owned.push(m);
    return m;
  };
  const geo = <T extends THREE.BufferGeometry>(g: T) => { owned.push(g); return g; };
  const add = (m: THREE.Object3D, parent: THREE.Object3D = group) => { parent.add(m); return m; };
  const box = (color: number, w: number, h: number, d: number, x = 0, y = 0, z = 0, extra?: THREE.MeshStandardMaterialParameters, parent?: THREE.Object3D) => {
    const m = new THREE.Mesh(geo(new THREE.BoxGeometry(w, h, d)), mat(color, extra));
    m.position.set(x, y + h / 2, z);
    m.castShadow = true;
    return add(m, parent) as THREE.Mesh;
  };
  const cyl = (color: number, r: number, h: number, x = 0, y = 0, z = 0, extra?: THREE.MeshStandardMaterialParameters, parent?: THREE.Object3D) => {
    const m = new THREE.Mesh(geo(new THREE.CylinderGeometry(r, r, h, 16)), mat(color, extra));
    m.position.set(x, y + h / 2, z);
    return add(m, parent) as THREE.Mesh;
  };
  const rockAt = (x: number, y: number, z: number, s: number, color = C.rock) => {
    const m = new THREE.Mesh(geo(new THREE.IcosahedronGeometry(s, 0)), mat(color, { flatShading: true }));
    m.position.set(x, y, z);
    m.rotation.set(x * 3, z * 2, y);
    return add(m) as THREE.Mesh;
  };
  /** A small pit: four walls and a floor. */
  const pit = (w = 2, d = 1.4, h = 0.6) => {
    box(C.dirt, w, 0.08, d, 0, 0, 0);
    box(C.concrete, w, h, 0.08, 0, 0, -d / 2);
    box(C.concrete, w, h, 0.08, 0, 0, d / 2);
    box(C.concrete, 0.08, h, d, -w / 2, 0, 0);
    box(C.concrete, 0.08, h, d, w / 2, 0, 0);
  };
  /** A tower of n floors (slabs and glass). */
  const tower = (n: number, glass = 0, x = 0, z = 0) => {
    for (let i = 0; i < n; i++) {
      box(C.concrete, 1, 0.05, 0.7, x, i * 0.2, z);
      if (i < glass) box(C.glass, 0.98, 0.15, 0.68, x, i * 0.2 + 0.05, z, { transparent: true, opacity: 0.7, metalness: 0.3 });
    }
  };
  /** Falling drops (rain, snow, water), reused in a loop. */
  const drops = (n: number, color: number, w: number, top: number, speed: number, size = 0.03) => {
    const g = geo(new THREE.SphereGeometry(size, 6, 4));
    const m = mat(color, { emissive: color, emissiveIntensity: 0.4 });
    const list = Array.from({ length: n }, (_, i) => {
      const d = new THREE.Mesh(g, m);
      d.position.set((Math.random() - 0.5) * w, Math.random() * top, (Math.random() - 0.5) * w * 0.7);
      add(d);
      return { d, off: i / n };
    });
    anims.push(t => { for (const { d, off } of list) d.position.y = top - (((t * speed + off) % 1) * top); });
  };
  /** A price tag (a saving): a green tag that bobs. */
  const tag = (x: number, y: number, z: number, color = C.green) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    box(color, 0.36, 0.24, 0.04, 0, 0, 0, { emissive: color, emissiveIntensity: 0.5 }, g);
    box(C.white, 0.06, 0.06, 0.05, -0.12, 0.09, 0, {}, g);
    add(g);
    anims.push(t => { g.position.y = y + Math.sin(t * 2) * 0.05; g.rotation.y = Math.sin(t) * 0.4; });
  };
  /** A warning sign: a red disc with a white bar that pulses. */
  const warn = (x: number, y: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const disc = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 20).rotateX(Math.PI / 2)), mat(C.red, { emissive: C.red, emissiveIntensity: 0.8 }));
    g.add(disc);
    box(C.white, 0.04, 0.14, 0.04, 0, -0.06, 0.02, {}, g);
    add(g);
    anims.push(t => { g.scale.setScalar(1 + Math.sin(t * 6) * 0.1); });
  };
  /** A clock: time passes (waiting). */
  const clock = (x: number, y: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.add(new THREE.Mesh(geo(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 24).rotateX(Math.PI / 2)), mat(C.white)));
    const hand = new THREE.Mesh(geo(new THREE.BoxGeometry(0.02, 0.16, 0.02).translate(0, 0.08, 0)), mat(C.dark));
    hand.position.z = 0.03;
    g.add(hand);
    add(g);
    anims.push(t => { hand.rotation.z = -t * 2; });
  };
  const person = (x: number, z: number, color = C.orange, crossed = false) => {
    box(color, 0.12, 0.22, 0.08, x, 0, z);
    box(0xf0c4a2, 0.1, 0.1, 0.1, x, 0.22, z);
    box(C.yellow, 0.12, 0.04, 0.12, x, 0.32, z);
    if (crossed) {
      const a = box(C.red, 0.04, 0.5, 0.04, x, -0.05, z + 0.08, { emissive: C.red, emissiveIntensity: 0.7 });
      a.rotation.z = 0.8;
      const b = box(C.red, 0.04, 0.5, 0.04, x, -0.05, z + 0.08, { emissive: C.red, emissiveIntensity: 0.7 });
      b.rotation.z = -0.8;
    }
  };
  const crane = (h = 1.4) => {
    box(C.yellow, 0.06, h, 0.06, -0.6, 0, 0);
    const jib = new THREE.Group();
    jib.position.set(-0.6, h, 0);
    box(C.yellow, 1.4, 0.05, 0.05, 0.5, 0, 0, {}, jib);
    box(C.concrete, 0.2, 0.12, 0.1, -0.25, -0.06, 0, {}, jib);
    box(C.dark, 0.01, 0.5, 0.01, 1.0, -0.5, 0, {}, jib);
    box(C.concrete, 0.3, 0.06, 0.15, 1.0, -0.56, 0, {}, jib);
    add(jib);
    return jib;
  };
  const truck = (cargo: number) => {
    const g = new THREE.Group();
    box(C.blue, 0.3, 0.26, 0.3, 0.42, 0, 0, {}, g);
    box(C.dark, 0.9, 0.06, 0.3, 0.05, 0, 0, {}, g);
    box(cargo, 0.6, 0.3, 0.26, -0.05, 0.06, 0, { transparent: cargo === C.glass, opacity: 0.8 }, g);
    for (const x of [-0.25, 0.4]) for (const z of [-0.16, 0.16]) {
      const w = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12).rotateX(Math.PI / 2)), mat(C.dark));
      w.position.set(x, 0.0, z);
      g.add(w);
    }
    add(g);
    return g;
  };

  switch (eventId) {
    case 'water': case 'pump-fail': {
      pit();
      const w = box(C.water, 1.84, 0.3, 1.24, 0, 0.08, 0, { transparent: true, opacity: 0.8, roughness: 0.05, emissive: C.water, emissiveIntensity: 0.25 });
      anims.push(t => { w.scale.y = 0.7 + Math.sin(t * 1.4) * 0.3; });
      drops(40, C.water, 2.4, 1.6, 0.9);
      cyl(C.blue, 0.12, 0.25, 0.7, 0.6, -0.5);
      if (eventId === 'pump-fail') warn(0.7, 1.0, -0.5);
      break;
    }
    case 'rock': case 'grout-leak': {
      for (let i = 0; i < 9; i++) rockAt(-0.8 + (i % 3) * 0.8, 0.2 + Math.floor(i / 3) * 0.05, -0.4 + Math.floor(i / 3) * 0.4, 0.3);
      const slab = box(C.concrete, 1.8, 0.12, 1, 0, 0.55, 0);
      anims.push(t => { slab.rotation.z = Math.sin(t * 1.3) * 0.08; });
      for (let i = 0; i < 4; i++) {
        const crack = box(C.red, 0.04, 0.02, 0.6, -0.5 + i * 0.35, 0.42, 0, { emissive: C.red, emissiveIntensity: 1 });
        crack.rotation.y = i * 0.7;
      }
      if (eventId === 'grout-leak') drops(20, C.water, 1.6, 0.5, 1.4);
      break;
    }
    case 'soil': {
      const pile = new THREE.Mesh(geo(new THREE.ConeGeometry(0.8, 0.7, 8)), mat(C.dirt, { flatShading: true }));
      pile.position.y = 0.35;
      add(pile);
      const blobs = Array.from({ length: 6 }, (_, i) => rockAt(Math.cos(i) * 0.45, 0.2 + (i % 3) * 0.12, Math.sin(i) * 0.45, 0.09, C.toxic));
      for (const b of blobs) (b.material as THREE.MeshStandardMaterial).emissive.set(C.toxic);
      anims.push(t => blobs.forEach((b, i) => { (b.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + Math.sin(t * 3 + i) * 0.4; }));
      cyl(C.yellow, 0.16, 0.4, 0.95, 0, 0.3);
      warn(0.95, 0.65, 0.3);
      break;
    }
    case 'frost': {
      box(C.concrete, 1.6, 0.4, 1, 0, 0, 0);
      cyl(C.white, 0.08, 1.1, 0.95, 0, 0);
      const red = cyl(C.red, 0.05, 0.6, 0.95, 0.06, 0, { emissive: C.red, emissiveIntensity: 0.6 });
      anims.push(t => { red.scale.y = 0.35 + (Math.sin(t) * 0.5 + 0.5) * 0.4; red.position.y = 0.06 + 0.3 * red.scale.y; });
      drops(40, C.white, 2.4, 1.8, 0.35, 0.04);
      break;
    }
    case 'wind': case 'crane': {
      tower(4);
      const jib = crane(1.5);
      anims.push(t => { jib.rotation.z = Math.sin(t * 3) * 0.06; if (eventId === 'crane') jib.rotation.y = 0.3; });
      const streaks = Array.from({ length: 6 }, (_, i) => box(C.white, 0.6, 0.02, 0.02, 0, 0.4 + i * 0.22, -0.5 + (i % 3) * 0.4, { transparent: true, opacity: 0.7, emissive: C.white, emissiveIntensity: 0.6 }));
      if (eventId === 'wind') anims.push(t => streaks.forEach((s, i) => { s.position.x = ((t * 1.5 + i * 0.37) % 2.4) - 1.2; }));
      else { streaks.forEach(s => { s.visible = false; }); warn(-0.6, 1.8, 0); }
      break;
    }
    case 'facade': case 'facade-discount': {
      tower(5, 2, -0.4);
      const tr = truck(C.glass);
      tr.position.set(0.7, 0, 0.6);
      anims.push(t => { tr.position.x = 0.9 + Math.sin(t * 0.8) * 0.15; });
      if (eventId === 'facade') clock(0.7, 0.9, 0.6);
      else tag(0.7, 0.9, 0.6);
      break;
    }
    case 'electricians': {
      for (let i = 0; i < 5; i++) person(-0.8 + i * 0.4, 0, C.yellow, i >= 3);
      box(C.dark, 1.8, 0.03, 0.03, 0, 0.7, -0.3, { emissive: C.yellow, emissiveIntensity: 0.6 });
      break;
    }
    case 'theft': {
      const drum = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 20).rotateX(Math.PI / 2)), mat(0xb87333, { metalness: 0.7, roughness: 0.3 }));
      drum.position.set(-0.4, 0.35, 0);
      add(drum);
      const ghost = new THREE.Mesh(drum.geometry, mat(C.white, { transparent: true, opacity: 0.2 }));
      ghost.position.set(0.5, 0.35, 0);
      add(ghost);
      warn(0.5, 0.95, 0);
      anims.push(t => { drum.rotation.z = t; });
      break;
    }
    case 'integration': {
      box(C.dark, 0.4, 0.8, 0.3, -0.6, 0, 0, { emissive: C.blue, emissiveIntensity: 0.2 });
      box(C.steel, 0.5, 0.7, 0.08, 0.6, 0, 0);
      const a = box(C.blue, 0.4, 0.05, 0.05, -0.25, 0.5, 0, { emissive: C.blue, emissiveIntensity: 0.8 });
      const b = box(C.blue, 0.4, 0.05, 0.05, 0.25, 0.5, 0, { emissive: C.blue, emissiveIntensity: 0.8 });
      anims.push(t => { const gap = 0.05 + (Math.sin(t * 4) * 0.5 + 0.5) * 0.12; a.position.x = -0.22 - gap; b.position.x = 0.22 + gap; });
      drops(12, C.yellow, 0.4, 0.7, 2.5, 0.025);
      break;
    }
    case 'reuse': {
      box(C.yellow, 0.7, 0.5, 0.5, -0.4, 0, 0);
      box(C.dark, 0.5, 0.25, 0.4, -0.4, 0.5, 0);
      const pile = new THREE.Mesh(geo(new THREE.ConeGeometry(0.45, 0.4, 7)), mat(C.rock, { flatShading: true }));
      pile.position.set(0.6, 0.2, 0);
      add(pile);
      const rocks = Array.from({ length: 4 }, (_, i) => rockAt(-0.4, 1, 0, 0.08 + i * 0.01));
      anims.push(t => rocks.forEach((r, i) => { const k = (t * 0.7 + i / 4) % 1; r.position.set(-0.4 + k * 0.1, 1 - k * 0.5, 0); r.rotation.x = t * 3; }));
      tag(0.6, 0.8, 0);
      break;
    }
    case 'steel': case 'steel-quality': {
      for (let i = 0; i < 5; i++) box(C.steel, 1.8, 0.08, 0.14, 0, i * 0.1, -0.3 + (i % 2) * 0.2, { metalness: 0.7, roughness: 0.35 });
      if (eventId === 'steel') tag(0.6, 0.8, 0.2);
      else warn(0.6, 0.8, 0.2);
      break;
    }
    case 'formwork': {
      for (let i = 0; i < 6; i++) box(C.orange, 1.4, 0.06, 0.8, 0, i * 0.08, 0);
      const arrow = new THREE.Mesh(geo(new THREE.TorusGeometry(0.45, 0.04, 6, 24, Math.PI * 1.6)), mat(C.green, { emissive: C.green, emissiveIntensity: 0.6 }));
      arrow.position.y = 0.9;
      arrow.rotation.x = Math.PI / 2;
      add(arrow);
      anims.push(t => { arrow.rotation.z = t; });
      tag(0.8, 0.6, 0.3);
      break;
    }
    case 'inspection': {
      for (let i = 0; i < 4; i++) for (const x of [-0.6, 0.6]) box(C.steel, 0.04, 0.4, 0.04, x, i * 0.4, 0);
      for (let i = 1; i <= 4; i++) box(C.orange, 1.24, 0.04, 0.3, 0, i * 0.4 - 0.02, 0);
      const rail = box(C.yellow, 1.24, 0.03, 0.03, 0, 1.3, 0.15);
      anims.push(t => { rail.rotation.z = Math.sin(t * 2) * 0.25; });
      warn(0, 1.9, 0.2);
      break;
    }
    case 'lift-crew': {
      box(C.concrete, 0.6, 1.6, 0.06, 0, 0, -0.3);
      const car = box(C.blue, 0.5, 0.4, 0.5, 0, 0, 0);
      anims.push(t => { car.position.y = (Math.sin(t) * 0.5 + 0.5) * 1.1; });
      tag(0.6, 0.9, 0.2);
      break;
    }
    case 'strategy-C': {
      pit(2, 1.4, 0.3);
      for (let i = 0; i < 6; i++) rockAt(-0.7 + i * 0.28, 0.2, 0, 0.16);
      const drill = cyl(C.yellow, 0.05, 0.9, 0.3, 0.4, -0.2);
      anims.push(t => { drill.position.y = 0.3 + Math.sin(t * 6) * 0.05; });
      break;
    }
    case 'strategy-F': {
      const floors = Array.from({ length: 6 }, (_, i) => box(C.concrete, 1.2, 0.06, 0.8, 0, i * 0.24, 0));
      anims.push(t => floors.forEach((f, i) => { f.visible = ((t * 1.2) % 7) > i; }));
      crane(1.8);
      break;
    }
    case 'strategy-H': {
      tower(4, 4);
      for (let i = 0; i < 3; i++) {
        const duct = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 10).rotateZ(Math.PI / 2)), mat(C.steel, { metalness: 0.7, roughness: 0.3 }));
        duct.position.set(0, 0.12 + i * 0.2, 0.42);
        add(duct);
      }
      box(C.steel, 0.4, 0.3, 0.3, 0.8, 0, 0.3);
      break;
    }
    case 'strategy-N': {
      tower(6, 6);
      const key = new THREE.Group();
      key.position.set(0.85, 0.9, 0.3);
      key.add(new THREE.Mesh(geo(new THREE.TorusGeometry(0.1, 0.03, 6, 16)), mat(C.yellow, { metalness: 0.8, roughness: 0.2, emissive: C.yellow, emissiveIntensity: 0.3 })));
      const bit = new THREE.Mesh(geo(new THREE.BoxGeometry(0.3, 0.04, 0.04).translate(0.25, 0, 0)), mat(C.yellow, { metalness: 0.8, roughness: 0.2 }));
      key.add(bit);
      add(key);
      anims.push(t => { key.rotation.y = t * 1.5; });
      break;
    }
    case 'change-solar': {
      box(C.concrete, 1.4, 0.5, 1, 0, 0, 0);
      for (let i = 0; i < 6; i++) {
        const p = box(0x16325c, 0.38, 0.03, 0.26, -0.45 + (i % 3) * 0.45, 0.55, -0.2 + Math.floor(i / 3) * 0.4, { metalness: 0.5, roughness: 0.2, emissive: 0x2050a0, emissiveIntensity: 0.3 });
        p.rotation.x = -0.35;
      }
      const sun = new THREE.Mesh(geo(new THREE.SphereGeometry(0.16, 12, 8)), mat(C.yellow, { emissive: C.yellow, emissiveIntensity: 1.2 }));
      add(sun);
      anims.push(t => { sun.position.set(Math.cos(t * 0.6) * 0.9, 1.3 + Math.sin(t * 0.6) * 0.15, -0.4); });
      break;
    }
    case 'change-security': {
      tower(4, 4);
      const shield = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 6).rotateX(Math.PI / 2)), mat(C.blue, { emissive: C.blue, emissiveIntensity: 0.6, metalness: 0.4 }));
      shield.position.set(0, 1.2, 0.45);
      add(shield);
      anims.push(t => { shield.rotation.z = Math.sin(t) * 0.2; });
      break;
    }
    case 'change-layout': {
      box(C.concrete, 1.6, 0.04, 1.1, 0, 0, 0);
      const walls = Array.from({ length: 3 }, (_, i) => box(C.white, 0.04, 0.35, 1, -0.4 + i * 0.4, 0.04, 0));
      anims.push(t => walls.forEach((w, i) => { w.visible = Math.sin(t * 0.9) > -0.2 || i === 0; w.position.x = -0.4 + i * 0.4 + Math.sin(t * 0.9) * 0.1 * i; }));
      break;
    }
    case 'change-charging': {
      box(C.concrete, 1.8, 0.04, 1, 0, 0, 0);
      box(C.blue, 0.7, 0.25, 0.36, -0.3, 0.06, 0.1);
      box(C.glass, 0.4, 0.15, 0.32, -0.32, 0.31, 0.1, { transparent: true, opacity: 0.8 });
      const charger = box(C.green, 0.14, 0.5, 0.12, 0.6, 0.04, -0.2, { emissive: C.green, emissiveIntensity: 0.6 });
      anims.push(t => { (charger.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + (Math.sin(t * 4) * 0.5 + 0.5) * 0.8; });
      break;
    }
    default: {
      tower(3, kind === 'opportunity' ? 3 : 1);
      if (kind === 'opportunity') tag(0.7, 0.8, 0.3); else warn(0.7, 0.9, 0.3);
    }
  }

  return {
    group,
    update(t) { for (const a of anims) a(t); },
    dispose() {
      group.removeFromParent();
      for (const o of owned) o.dispose();
    },
  };
}
