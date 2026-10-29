// The static world around the site: sky, streets, the city blocks, Høyblokka, trees, fence and site huts.
// Built once; only lighting-related values change with the time of day and the season.
import * as THREE from 'three';
import { PIT, SPOTS } from './visuals';

/** A unit box with its base at y = 0, shared by every simple part of the scene. */
export const UNIT = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);

export function part(m: THREE.Material, w: number, h: number, d: number, x = 0, y = 0, z = 0, shadow = true): THREE.Mesh {
  const mesh = new THREE.Mesh(UNIT, m);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  return mesh;
}

/** A box geometry whose texture repeats once per `tile` metres on every side. */
export function tiledBox(w: number, h: number, d: number, tileW: number, tileH: number): THREE.BoxGeometry {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  // Faces in BoxGeometry order: +x, −x, +y, −y, +z, −z (4 vertices each).
  const size = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v;
    uv.setXY(i, uv.getX(i) * size[f][0] / tileW, uv.getY(i) * size[f][1] / tileH);
  }
  return geo;
}

function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Four by four office windows per tile, some of them lit at night (the emissive map). */
const windowsMap = () => canvasTexture(256, 256, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, 256, 256);
  c.fillStyle = '#7f93a8';
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) c.fillRect(x * 64 + 14, y * 64 + 18, 36, 30);
});
const windowsGlow = () => canvasTexture(256, 256, c => {
  c.fillStyle = '#000'; c.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    if (rnd() < 0.45) continue;
    c.fillStyle = rnd() < 0.7 ? '#ffd28a' : '#cfe6ff';
    c.fillRect(x * 64 + 14, y * 64 + 18, 36, 30);
  }
});

/** A steel lattice for the crane (alpha-tested, so it is cheap and readable from far away). */
export const latticeMap = () => canvasTexture(64, 64, c => {
  c.clearRect(0, 0, 64, 64);
  c.strokeStyle = '#f2b81c'; c.lineWidth = 6;
  c.strokeRect(3, 3, 58, 58);
  c.beginPath(); c.moveTo(3, 3); c.lineTo(61, 61); c.moveTo(61, 3); c.lineTo(3, 61); c.stroke();
});

/** Mullions for the curtain wall of the new tower. */
export const mullionMap = () => canvasTexture(64, 64, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, 64, 64);
  c.fillStyle = '#4c5866'; c.fillRect(0, 0, 64, 4); c.fillRect(0, 0, 4, 64);
});

/** A rendered label for beacons and signs. */
export const signMap = (text: string, bg: string, fg = '#fff') => {
  const tex = canvasTexture(128, 128, c => {
    c.fillStyle = bg; c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.fill();
    c.fillStyle = fg; c.font = 'bold 84px "Segoe UI", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 64, 70);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
};

// Deterministic randomness, so the city looks the same every game.
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

/** Four boxes around a rectangular hole. */
function frame(group: THREE.Group, m: THREE.Material, outerW: number, outerD: number, holeW: number, holeD: number, y: number, h: number) {
  const side = (outerD - holeD) / 2;
  group.add(part(m, outerW, h, side, 0, y, -(holeD / 2 + side / 2), false));
  group.add(part(m, outerW, h, side, 0, y, holeD / 2 + side / 2, false));
  const end = (outerW - holeW) / 2;
  group.add(part(m, end, h, holeD, -(holeW / 2 + end / 2), y, 0, false));
  group.add(part(m, end, h, holeD, holeW / 2 + end / 2, y, 0, false));
}

/** The ring road the trucks drive on: a rectangle around the site. */
export const ROAD = { x: 62, z: 50, width: 9 };

/** A point on the ring road, t in 0–1 going round. */
export function roadPoint(t: number, lane = 0): { x: number; z: number; heading: number } {
  const { x: X, z: Z } = ROAD;
  const r = lane * 2.2;
  const len = 4 * X + 4 * Z;
  let d = (((t % 1) + 1) % 1) * len;
  if (d < 2 * X) return { x: -X + d, z: Z - r, heading: 0 };
  d -= 2 * X;
  if (d < 2 * Z) return { x: X - r, z: Z - d, heading: Math.PI / 2 };
  d -= 2 * Z;
  if (d < 2 * X) return { x: X - d, z: -Z + r, heading: Math.PI };
  d -= 2 * X;
  return { x: -X + r, z: -Z + d, heading: -Math.PI / 2 };
}

export interface World {
  group: THREE.Group;
  /** The site gravel: turns into the park when the building is finished. */
  gravel: THREE.MeshStandardMaterial;
  parkTrees: THREE.InstancedMesh[];
  fence: THREE.Object3D;
  /** Time of day (0 = day, 1 = night) and snow cover (0–1). */
  setLight(night: number, snow: number): void;
}

const SKY = {
  dayTop: new THREE.Color('#4a78c9'), dayBottom: new THREE.Color('#c9d9ef'),
  nightTop: new THREE.Color('#0e1626'), nightBottom: new THREE.Color('#1f3d6f'),
};

export function buildWorld(scene: THREE.Scene): World {
  const group = new THREE.Group();

  // Sky dome with the Fluent wallpaper blues: a gradient that darkens at night.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: SKY.dayTop.clone() }, bottom: { value: SKY.dayBottom.clone() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.6 + 0.15, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, h), 1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), skyMat);
  scene.add(sky);

  const grass = new THREE.MeshStandardMaterial({ color: 0x8aa37a, roughness: 1 });
  const grassDay = grass.color.clone();
  const pavement = new THREE.MeshStandardMaterial({ color: 0xb9b6ae, roughness: 1 });
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x3d4248, roughness: 0.95 });
  const gravel = new THREE.MeshStandardMaterial({ color: 0xa08e73, roughness: 1 });
  const marking = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.8 });
  const rock = new THREE.MeshStandardMaterial({ color: 0x6f6a64, roughness: 1, flatShading: true });

  // Ground with a hole for the building pit; the site gravel inside the fence.
  frame(group, grass, 900, 900, 112, 92, -0.4, 0.2);
  frame(group, gravel, 112, 92, PIT.w, PIT.d, -0.2, 0.2);
  group.add(part(rock, PIT.w + 2, 1, PIT.d + 2, 0, -PIT.depth - 1.2, 0, false));

  // The ring road with dashed lane markings, and pavements outside it.
  const { x: X, z: Z, width: W } = ROAD;
  for (const z of [-Z, Z]) group.add(part(asphalt, 2 * X + W, 0.1, W, 0, -0.2, z, false));
  for (const x of [-X, X]) group.add(part(asphalt, W, 0.1, 2 * Z - W, x, -0.2, 0, false));
  for (const z of [-Z - W / 2 - 3, Z + W / 2 + 3]) group.add(part(pavement, 2 * X + W + 12, 0.15, 6, 0, -0.2, z, false));
  const dashes = new THREE.InstancedMesh(UNIT, marking, 80);
  const m4 = new THREE.Matrix4();
  let n = 0;
  for (let i = 0; i < 80; i++) {
    const p = roadPoint(i / 80, 0.5);
    m4.compose(new THREE.Vector3(p.x, -0.09, p.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.heading), new THREE.Vector3(2.4, 0.02, 0.25));
    dashes.setMatrixAt(n++, m4);
  }
  group.add(dashes);

  // The city: blocks of offices around the site, with windows that light up at night.
  const glow = windowsGlow();
  const wmap = windowsMap();
  const facades = [0xd7d0c4, 0xc4c9cf, 0xb7aa98, 0xe2ded6, 0x9aa1a8].map(c => {
    const map = wmap.clone(); map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ color: c, map, emissiveMap: glow, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.85 });
  });
  const rand = rng(42);
  const cityMats = [...facades];
  for (let gx = -230; gx <= 230; gx += 36) for (let gz = -230; gz <= 230; gz += 36) {
    if (Math.abs(gx) < 100 && Math.abs(gz) < 96) continue; // the site, the road and Høyblokka
    if (rand() < 0.12) continue; // a square
    const count = 1 + Math.floor(rand() * 3);
    for (let b = 0; b < count; b++) {
      const w = 10 + rand() * 12;
      const d = 10 + rand() * 12;
      const far = Math.hypot(gx, gz) / 230;
      const h = 8 + rand() * (10 + far * 26);
      const geo = tiledBox(w, h, d, 12.8, 14.4);
      const mesh = new THREE.Mesh(geo, cityMats[Math.floor(rand() * cityMats.length)]);
      mesh.position.set(gx + (rand() - 0.5) * 12, -0.3, gz + (rand() - 0.5) * 12);
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
    }
  }

  // Høyblokka: the 17-storey slab next to the site, under rehabilitation.
  const hoy = new THREE.Mesh(tiledBox(62, 68, 13, 13.6, 16), facades[0]);
  hoy.position.set(-6, -0.3, -72);
  hoy.castShadow = hoy.receiveShadow = true;
  group.add(hoy);
  const scaffold = new THREE.MeshStandardMaterial({ color: 0xd9dde2, transparent: true, opacity: 0.35, roughness: 1 });
  group.add(part(scaffold, 63, 69, 14, -6, -0.3, -72, false));

  // Trees along the streets (instanced: one draw for the trunks, one for the crowns).
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4f3a });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x4f8a3f, flatShading: true });
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.4, 6).translate(0, 1.2, 0);
  const crownGeo = new THREE.IcosahedronGeometry(2.2, 0).translate(0, 3.8, 0);
  const treeSpots: [number, number][] = [];
  for (let i = -X - 6; i <= X + 6; i += 9) { treeSpots.push([i, Z + W / 2 + 3]); treeSpots.push([i, -Z - W / 2 - 3]); }
  for (let i = -Z + 6; i <= Z - 6; i += 9) { treeSpots.push([X + W / 2 + 4, i]); treeSpots.push([-X - W / 2 - 4, i]); }
  const trees = (spots: [number, number][], scale = 1) => {
    const t = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
    const c = new THREE.InstancedMesh(crownGeo, crownMat, spots.length);
    spots.forEach(([x, z], i) => {
      const s = scale * (0.8 + ((i * 37) % 10) / 25);
      m4.compose(new THREE.Vector3(x, -0.2, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
      t.setMatrixAt(i, m4);
      c.setMatrixAt(i, m4);
    });
    t.castShadow = c.castShadow = true;
    return [t, c];
  };
  trees(treeSpots).forEach(t => group.add(t));

  // The park that replaces the site when the building is handed over (hidden until then).
  const parkSpots: [number, number][] = [];
  const pr = rng(9);
  for (let i = 0; i < 26; i++) {
    const x = (pr() - 0.5) * 100;
    const z = (pr() - 0.5) * 80;
    if (Math.abs(x) < 18 && Math.abs(z) < 14) continue;
    parkSpots.push([x, z]);
  }
  const parkTrees = trees(parkSpots, 1.1);
  parkTrees.forEach(t => { t.visible = false; group.add(t); });

  // Site fence with a gate towards the entrance (south).
  const fence = new THREE.Group();
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0xe9ecef, transparent: true, opacity: 0.7, roughness: 0.6 });
  const fenceBlue = new THREE.MeshStandardMaterial({ color: 0x005fb8, roughness: 0.6 });
  const FW = 104, FD = 84;
  fence.add(part(fenceMat, FW, 2.2, 0.2, 0, 0, -FD / 2, false));
  fence.add(part(fenceMat, 0.2, 2.2, FD, -FW / 2, 0, 0, false));
  fence.add(part(fenceMat, 0.2, 2.2, FD, FW / 2, 0, 0, false));
  fence.add(part(fenceMat, FW / 2 - 8, 2.2, 0.2, -(FW / 4 + 4), 0, FD / 2, false));
  fence.add(part(fenceMat, FW / 2 - 8, 2.2, 0.2, FW / 4 + 4, 0, FD / 2, false));
  // A blue band along the fence (the hoarding), in the Fluent accent colour.
  fence.add(part(fenceBlue, FW / 2 - 8, 0.6, 0.25, -(FW / 4 + 4), 1.2, FD / 2, false));
  fence.add(part(fenceBlue, FW / 2 - 8, 0.6, 0.25, FW / 4 + 4, 1.2, FD / 2, false));
  group.add(fence);

  // Site offices (the Prosjektleder's stacked containers) and the site manager's hut.
  const cont = [0x005fb8, 0xf3f3f3, 0x3a7bd5].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
  const o = SPOTS.office;
  for (let lvl = 0; lvl < 2; lvl++) for (let i = 0; i < 3; i++) {
    fence.add(part(cont[(i + lvl) % 3], 2.6, 2.6, 6.2, o.x - 3 + i * 2.7, lvl * 2.6, o.z));
  }
  const hutMat = new THREE.MeshStandardMaterial({ color: 0xf7630c, roughness: 0.7 });
  fence.add(part(hutMat, 6, 2.6, 2.6, SPOTS.hut.x, 0, SPOTS.hut.z));
  fence.add(part(cont[1], 6, 2.6, 2.6, SPOTS.hut.x + 6.4, 0, SPOTS.hut.z));

  // Street lights: poles with heads that glow at night.
  const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xffd28a, emissiveIntensity: 0 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4f55 });
  const lampSpots = treeSpots.filter((_, i) => i % 3 === 0);
  const poles = new THREE.InstancedMesh(UNIT, poleMat, lampSpots.length);
  const heads = new THREE.InstancedMesh(UNIT, lampHeadMat, lampSpots.length);
  lampSpots.forEach(([x, z], i) => {
    m4.compose(new THREE.Vector3(x + 2, -0.2, z), new THREE.Quaternion(), new THREE.Vector3(0.2, 6, 0.2));
    poles.setMatrixAt(i, m4);
    m4.compose(new THREE.Vector3(x + 2, 5.8, z), new THREE.Quaternion(), new THREE.Vector3(0.8, 0.3, 0.8));
    heads.setMatrixAt(i, m4);
  });
  group.add(poles, heads);

  scene.add(group);

  const snowColor = new THREE.Color(0xf4f7fb);
  return {
    group, gravel, parkTrees, fence,
    setLight(night, snow) {
      skyMat.uniforms.top.value.copy(SKY.dayTop).lerp(SKY.nightTop, night);
      skyMat.uniforms.bottom.value.copy(SKY.dayBottom).lerp(SKY.nightBottom, night);
      for (const m of facades) m.emissiveIntensity = Math.max(0, night - 0.2) * 2.4;
      lampHeadMat.emissiveIntensity = night > 0.45 ? 2 : 0;
      grass.color.copy(grassDay).lerp(snowColor, snow * 0.6);
      if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(skyMat.uniforms.bottom.value);
    },
  };
}
