// Life on the site: the material yard, toilets, skips, floodlights, the pit railing, the signboard,
// a mobile crane and a concrete pump that work in the early phases, and scaffolding that climbs
// with the tower. Built once; update() shows what the current phase needs.
import * as THREE from 'three';
import { FLOOR_H, FLOORS, PIT, TOWER, type SceneState } from './visuals';
import { UNIT, part, tiledBox } from './world';

export interface Props {
  update(t: number, s: SceneState, p: Record<string, number>, night: number): void;
}

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function buildProps(parent: THREE.Object3D): Props {
  const root = new THREE.Group();
  parent.add(root);
  const mat = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
  const M = {
    pallet: mat(0x9c7a4f), brick: mat(0xb5523a), rebar: mat(0x6d4a36, { metalness: 0.5, roughness: 0.6 }), form: mat(0xf7630c, { roughness: 0.6 }),
    pipe: mat(0x8d99a6, { metalness: 0.6, roughness: 0.4 }), loo: mat(0x0078d4), looRoof: mat(0xf3f3f3), skip: mat(0xf2b81c, { roughness: 0.6 }),
    dark: mat(0x2d3238, { roughness: 0.6 }), yellow: mat(0xf2b81c, { roughness: 0.55 }), white: mat(0xf3f3f3), black: mat(0x1b1b1b),
    lamp: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff1c9, emissiveIntensity: 0 }), cone: mat(0xff5a1f, { roughness: 0.5 }),
  };
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const instanced = (m: THREE.Material, items: [number, number, number, number, number, number, number?][]) => {
    const mesh = new THREE.InstancedMesh(UNIT, m, items.length);
    items.forEach(([x, y, z, w, h, d, yaw = 0], i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w, h, d));
      mesh.setMatrixAt(i, m4);
    });
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };

  // The material yard (south-west): pallets of bricks, rebar bundles, formwork panels and pipes.
  const pallets: [number, number, number, number, number, number][] = [];
  const bricks: [number, number, number, number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const x = -30 + (i % 3) * 3.4, z = 30 + Math.floor(i / 3) * 3.2;
    pallets.push([x, 0, z, 2.4, 0.3, 2.4]);
    bricks.push([x, 0.3, z, 2.1, 0.9 + (i % 2) * 0.5, 2.1]);
  }
  instanced(M.pallet, pallets);
  instanced(M.brick, bricks);
  instanced(M.rebar, Array.from({ length: 8 }, (_, i) => [-18 + (i % 2) * 0.5, 0.1 + Math.floor(i / 2) * 0.32, 33, 0.3, 0.3, 9] as [number, number, number, number, number, number]));
  instanced(M.form, Array.from({ length: 7 }, (_, i) => [-14.5, i * 0.18, 29, 3, 0.15, 2.4] as [number, number, number, number, number, number]));
  const pipeGeo = new THREE.CylinderGeometry(0.35, 0.35, 6, 12).rotateX(Math.PI / 2);
  const pipes = new THREE.InstancedMesh(pipeGeo, M.pipe, 6);
  for (let i = 0; i < 6; i++) {
    m4.makeTranslation(-24 + (i % 3) * 0.75, 0.35 + Math.floor(i / 3) * 0.65, 37.5);
    pipes.setMatrixAt(i, m4);
  }
  pipes.castShadow = true;
  root.add(pipes);

  // Portable toilets and skips by the site hut; cones at the gate.
  for (let i = 0; i < 3; i++) {
    root.add(part(M.loo, 1.3, 2.3, 1.3, 42 + i * 1.6, 0, 31));
    root.add(part(M.looRoof, 1.4, 0.15, 1.4, 42 + i * 1.6, 2.3, 31));
  }
  for (const [x, z] of [[38, -30], [44, -24]]) {
    root.add(part(M.skip, 5.5, 1.8, 2.6, x, 0, z));
    root.add(part(M.dark, 5, 0.4, 2.2, x, 1.5, z));
  }
  const coneGeo = new THREE.ConeGeometry(0.3, 0.8, 10).translate(0, 0.4, 0);
  for (const x of [-8, -5.5, 5.5, 8]) {
    const c = new THREE.Mesh(coneGeo, M.cone);
    c.position.set(x, 0, 44.5);
    c.castShadow = true;
    root.add(c);
  }

  // The signboard outside the fence.
  const signTex = canvasTex(1024, 512, c => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, 1024, 512);
    c.fillStyle = '#005fb8'; c.fillRect(0, 0, 1024, 120);
    c.fillStyle = '#ffffff'; c.font = 'bold 64px "Segoe UI", system-ui, sans-serif'; c.fillText('REGJERINGSKVARTALET', 40, 84);
    c.fillStyle = '#1b1b1b'; c.font = 'bold 54px "Segoe UI", system-ui, sans-serif'; c.fillText('A-blokka · 11 etasjer', 40, 210);
    c.font = '40px "Segoe UI", system-ui, sans-serif'; c.fillText('Byggherre: Statsbygg', 40, 290);
    c.fillText('Prosjektleder: Elisabeth · Site manager: Hedda', 40, 350);
    c.fillStyle = '#0f7b0f'; c.fillText('HMS: Oskar. Verneutstyr påbudt!', 40, 440);
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.7 }));
  board.position.set(-17, 4.2, 42.4);
  root.add(board);
  root.add(part(M.dark, 0.3, 6.5, 0.3, -21, 0, 42.2), part(M.dark, 0.3, 6.5, 0.3, -13, 0, 42.2));

  // Floodlight masts at the pit corners; they light up at night.
  const lamps: THREE.Mesh[] = [];
  for (const [x, z] of [[-PIT.w / 2 - 6, -PIT.d / 2 - 6], [PIT.w / 2 + 6, -PIT.d / 2 - 6], [-PIT.w / 2 - 6, PIT.d / 2 + 8], [PIT.w / 2 + 6, PIT.d / 2 + 8]]) {
    root.add(part(M.dark, 0.35, 14, 0.35, x, 0, z));
    const head = part(M.lamp, 2.4, 0.8, 0.6, x, 14, z, false);
    head.lookAt(0, 0, 0);
    lamps.push(head);
    root.add(head);
  }

  // The railing round the pit (yellow and black), until the basement is covered.
  const railing = new THREE.Group();
  const posts: [number, number, number, number, number, number][] = [];
  const rw = PIT.w / 2 + 0.6, rd = PIT.d / 2 + 0.6;
  for (let x = -rw; x <= rw + 0.01; x += 2.5) posts.push([x, 0, -rd, 0.12, 1.1, 0.12], [x, 0, rd, 0.12, 1.1, 0.12]);
  for (let z = -rd; z <= rd + 0.01; z += 2.5) posts.push([-rw, 0, z, 0.12, 1.1, 0.12], [rw, 0, z, 0.12, 1.1, 0.12]);
  const postMesh = new THREE.InstancedMesh(UNIT, M.yellow, posts.length);
  posts.forEach(([x, y, z, w, h, d], i) => { m4.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d)); postMesh.setMatrixAt(i, m4); });
  railing.add(postMesh);
  for (const y of [0.5, 1.0]) {
    railing.add(part(M.yellow, 2 * rw, 0.08, 0.08, 0, y, -rd, false), part(M.yellow, 2 * rw, 0.08, 0.08, 0, y, rd, false));
    railing.add(part(M.yellow, 0.08, 0.08, 2 * rd, -rw, y, 0, false), part(M.yellow, 0.08, 0.08, 2 * rd, rw, y, 0, false));
  }
  root.add(railing);

  // A mobile crane west of the pit: the boom slews and lifts while the basement is built.
  const mobile = new THREE.Group();
  mobile.position.set(-PIT.w / 2 - 7, 0, -4);
  mobile.add(part(M.yellow, 3, 1.4, 9, 0, 0.5, 0), part(M.dark, 3.2, 0.7, 9.2, 0, 0, 0), part(M.white, 2.6, 1.6, 2.2, 0, 1.9, 3.2));
  const boomPivot = new THREE.Group();
  boomPivot.position.set(0, 2.2, -1.5);
  const boom = new THREE.Group();
  boom.add(part(M.yellow, 0.9, 0.9, 22, 0, 0, -11));
  // The hook hangs from the tip and stays vertical while the boom lifts.
  const tip = new THREE.Group();
  tip.position.set(0, 0, -22);
  boom.add(tip);
  const cable = part(M.dark, 0.06, 1, 0.06, 0, -1, 0, false);
  const hookLoad = part(M.form, 2.4, 0.3, 1.2, 0, -10, 0);
  tip.add(cable, hookLoad);
  boomPivot.add(boom);
  mobile.add(boomPivot);
  root.add(mobile);

  // A concrete pump truck north of the pit (clear of the foremen's meeting spots), its arm towards the tower.
  const pump = new THREE.Group();
  pump.position.set(17, 0, -29);
  pump.rotation.y = Math.PI;
  pump.add(part(M.white, 2.6, 2.4, 2.4, 0, 0.6, 4), part(M.dark, 2.8, 0.7, 10, 0, 0, 0), part(mat(0x0078d4), 2.6, 1.6, 6, 0, 0.7, -1));
  const pumpArm = new THREE.Group();
  pumpArm.position.set(0, 2.4, -2);
  const seg1 = new THREE.Group();
  seg1.add(part(M.dark, 0.5, 0.5, 12, 0, 0, -6));
  const seg2 = new THREE.Group();
  seg2.position.set(0, 0, -12);
  seg2.add(part(M.dark, 0.4, 0.4, 10, 0, 0, -5));
  seg1.add(seg2);
  pumpArm.add(seg1);
  pump.add(pumpArm);
  root.add(pump);

  // Scaffolding round the tower: between the glazed floors and the top of the structure.
  const scaffTex = canvasTex(64, 64, c => {
    c.clearRect(0, 0, 64, 64);
    c.strokeStyle = '#c7ccd2'; c.lineWidth = 5;
    c.strokeRect(2, 2, 60, 60);
    c.beginPath(); c.moveTo(2, 62); c.lineTo(62, 2); c.stroke();
    c.fillStyle = '#f7630c'; c.fillRect(0, 54, 64, 8);
  });
  scaffTex.wrapS = scaffTex.wrapT = THREE.RepeatWrapping;
  const scaffMat = new THREE.MeshStandardMaterial({ map: scaffTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 });
  // One unit high; the texture repeats with the height so the bays keep their size.
  // The top and bottom faces are hidden, so the scaffold never covers the floor being cast.
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const scaffold = new THREE.Mesh(tiledBox(TOWER.w + 3, 1, TOWER.d + 3, 2.25, 1), [scaffMat, scaffMat, hidden, hidden, scaffMat, scaffMat]);
  scaffold.castShadow = true;
  root.add(scaffold);

  return {
    update(t, s, p, night) {
      const a = s.active;
      for (const l of lamps) (l.material as THREE.MeshStandardMaterial).emissiveIntensity = night > 0.4 ? 3 : 0.1;
      railing.visible = (p.E ?? 0) < 0.999;

      mobile.visible = (a.includes('C') || a.includes('D') || a.includes('E')) && !s.done;
      const working = mobile.visible && !s.stalled.some(x => x.taskId === 'D' || x.taskId === 'E');
      if (working) {
        mobile.rotation.y = Math.sin(t * 0.18) * 0.6 - 0.3;
        boomPivot.rotation.x = 0.55 + Math.sin(t * 0.3) * 0.12;
        tip.rotation.x = -boomPivot.rotation.x;
        const lift = 6 + (Math.sin(t * 0.5) * 0.5 + 0.5) * 6;
        cable.scale.y = lift;
        cable.position.y = -lift;
        hookLoad.position.y = -lift - 0.3;
      }

      pump.visible = (a.includes('E') || a.includes('F')) && !s.done;
      if (pump.visible) {
        const reach = a.includes('F') ? 0.25 + Math.min(1, (p.F ?? 0) * 1.4) * 0.5 : 0.2;
        seg1.rotation.x = reach + Math.sin(t * 0.4) * 0.03;
        seg2.rotation.x = -reach * 1.6 - 0.5;
      }

      const built = (p.F ?? 0) * FLOORS * FLOOR_H;
      const glazed = (p.G ?? 0) * FLOORS * FLOOR_H;
      const show = built > 2 && (p.G ?? 0) < 0.999;
      scaffold.visible = show;
      if (show) {
        const bottom = Math.min(glazed, built);
        scaffold.position.y = bottom;
        scaffold.scale.y = Math.max(0.01, built + 1.5 - bottom);
        scaffTex.repeat.y = scaffold.scale.y / (FLOOR_H / 2);
      }
    },
  };
}
