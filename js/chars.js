import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";

const loader = new THREE.TextureLoader();
const cache = new Map();

export function loadTex(url) {
  if (cache.has(url)) return cache.get(url);
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter;
  cache.set(url, t);
  return t;
}

function spriteMat(url) {
  return new THREE.MeshBasicMaterial({
    map: loadTex(url),
    transparent: true,
    alphaTest: 0.12,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
}

export function createPerson(opts) {
  const g = new THREE.Group();
  const h = opts.height || 2.55;
  const w = h * 0.62;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), spriteMat(opts.front));
  front.position.y = h / 2;
  g.add(front);
  let back = null;
  if (opts.back) {
    back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), spriteMat(opts.back));
    back.position.y = h / 2;
    back.rotation.y = Math.PI;
    g.add(back);
  }
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  g.add(shadow);

  g.userData = {
    kind: opts.kind,
    label: opts.label || opts.kind,
    front,
    back,
    hp: opts.hp ?? 40,
    maxHp: opts.hp ?? 40,
    speed: opts.speed ?? 4.2,
    dmg: opts.dmg ?? 8,
    radius: 0.55,
    height: h,
    yaw: 0,
    dead: false,
    flee: 0,
    hitCd: 0,
    walkT: Math.random() * 10,
    target: null,
    cop: !!opts.cop,
    civilian: opts.civilian !== false,
  };
  return g;
}

export function faceCameraY(obj, camera) {
  const p = obj.position;
  const c = camera.position;
  obj.rotation.y = Math.atan2(c.x - p.x, c.z - p.z);
}

export function updateBillboard(person, camera) {
  const ud = person.userData;
  if (!ud.front) return;
  // Keep sprite upright, yaw toward camera so you always read the drawing,
  // but swap to back texture when camera is behind the character facing.
  faceCameraY(person, camera);
  if (ud.back) {
    const toCam = new THREE.Vector3().subVectors(camera.position, person.position);
    const fwd = new THREE.Vector3(Math.sin(ud.yaw), 0, Math.cos(ud.yaw));
    const behind = toCam.dot(fwd) < 0;
    ud.front.visible = !behind;
    ud.back.visible = behind;
    ud.back.rotation.y = 0;
  }
  if (!ud.dead && ud.walking) {
    ud.front.position.y = ud.height / 2 + Math.sin(ud.walkT * 10) * 0.04;
    if (ud.back) ud.back.position.y = ud.front.position.y;
  }
}

export const SKINS = {
  rick: { front: "assets/rick_front.png", back: "assets/rick_back.png", height: 2.7, hp: 420, speed: 11, label: "Rick Sanchez", civilian: false },
  morty: { front: "assets/morty.png", height: 2.15, hp: 50, speed: 5, label: "Morty", civilian: false },
  summer: { front: "assets/summer.png", height: 2.35, hp: 45, speed: 5, label: "Summer" },
  meeseeks: { front: "assets/meeseeks.png", height: 2.3, hp: 35, speed: 7.5, label: "Mr. Meeseeks", civilian: false },
  civ_man: { front: "assets/civ_man.png", height: 2.45, hp: 30, speed: 3.8, label: "Civilian" },
  civ_woman: { front: "assets/civ_woman.png", height: 2.4, hp: 30, speed: 3.9, label: "Civilian" },
  cop: { front: "assets/cop.png", height: 2.5, hp: 90, speed: 6.4, label: "Gromflomite", cop: true, civilian: false, dmg: 12 },
};

export function spawnSkin(kind, extra = {}) {
  const s = SKINS[kind] || SKINS.civ_man;
  return createPerson({ ...s, kind, ...extra });
}
