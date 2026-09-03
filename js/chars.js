import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";

const mat = (color, extra = {}) =>
  new THREE.MeshLambertMaterial({ color, ...extra });

function box(w, h, d, color, y = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.y = y;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function sph(r, color, y = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), mat(color));
  m.position.y = y;
  m.castShadow = true;
  return m;
}

function limbPair(parent, x, y, w, h, d, color, name) {
  const L = box(w, h, d, color, y);
  L.position.x = -x;
  L.name = name + "L";
  const R = box(w, h, d, color, y);
  R.position.x = x;
  R.name = name + "R";
  parent.add(L, R);
  return [L, R];
}

export function humanoid(opts) {
  const g = new THREE.Group();
  g.userData.kind = opts.id;
  const s = opts.scale || 1;
  g.scale.setScalar(s);

  const skin = opts.skin || 0xf0d0a8;
  const shirt = opts.shirt || 0x3aa0c8;
  const pants = opts.pants || 0x4a3a28;
  const coat = opts.coat;

  const torso = box(0.9, 1.05, 0.5, shirt, 1.35);
  g.add(torso);
  if (coat) {
    const c = box(1.15, 1.2, 0.62, coat, 1.32);
    g.add(c);
  }
  const hips = box(0.85, 0.35, 0.45, pants, 0.78);
  g.add(hips);
  const [legL, legR] = limbPair(g, 0.22, 0.35, 0.28, 0.7, 0.32, pants, "leg");
  const [armL, armR] = limbPair(g, 0.62, 1.3, 0.24, 0.85, 0.24, coat || skin, "arm");

  const head = sph(0.42, skin, 2.15);
  head.name = "head";
  g.add(head);
  // eyes
  const eyeM = mat(0xffffff);
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), eyeM);
  const eR = eL.clone();
  eL.position.set(-0.13, 2.18, 0.32);
  eR.position.set(0.13, 2.18, 0.32);
  const pL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mat(opts.pupil || 0x222266));
  const pR = pL.clone();
  pL.position.set(-0.13, 2.18, 0.4);
  pR.position.set(0.13, 2.18, 0.4);
  g.add(eL, eR, pL, pR);

  if (opts.mouth) {
    const mouth = box(0.22, 0.05, 0.06, 0x331111, 1.95);
    mouth.position.z = 0.36;
    g.add(mouth);
  }

  g.userData.parts = { torso, head, legL, legR, armL, armR };
  g.userData.hp = opts.hp || 100;
  g.userData.maxHp = opts.hp || 100;
  g.userData.radius = 0.7 * s;
  g.userData.height = 2.4 * s;
  return g;
}

function spikes(parent, color, n = 8) {
  for (let i = 0; i < n; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 5), mat(color));
    const a = (i / n) * Math.PI * 1.2 - 0.6;
    c.position.set(Math.sin(a) * 0.28, 2.48 + (i % 3) * 0.04, Math.cos(a) * 0.12);
    c.rotation.z = a * 0.35;
    c.rotation.x = -0.5;
    parent.add(c);
  }
}

export function makePortalGun() {
  const g = new THREE.Group();
  g.add(box(0.18, 0.18, 0.7, 0x9aa7b0, 0));
  const tank = sph(0.16, 0x40ffe6);
  tank.position.set(0, 0.12, -0.1);
  g.add(tank);
  const glow = new THREE.PointLight(0x40ffe6, 1.4, 6);
  glow.position.copy(tank.position);
  g.add(glow);
  const barrel = box(0.1, 0.1, 0.45, 0x667788);
  barrel.position.z = 0.45;
  g.add(barrel);
  return g;
}

export function createCharacter(id) {
  let g;
  if (id === "rick" || id === "council_rick" || id === "purge_rick" || id === "toxic_rick") {
    const coat = id === "toxic_rick" ? 0x88cc44 : id === "purge_rick" ? 0xaa2222 : 0xf2f4f8;
    const shirt = id === "toxic_rick" ? 0x66aa33 : 0x3aa8c8;
    g = humanoid({
      id,
      skin: 0xe8c8a0,
      shirt,
      pants: 0x5a4030,
      coat,
      hp: id === "rick" ? 420 : 110,
      mouth: true,
      scale: id === "rick" ? 1.15 : 1.05,
    });
    spikes(g, 0x6ec8e8, 9);
    const brow = box(0.5, 0.06, 0.08, 0x3a2a20, 2.32);
    brow.position.z = 0.34;
    g.add(brow);
    if (id === "rick") {
      const gun = makePortalGun();
      gun.position.set(0.7, 1.15, 0.35);
      gun.rotation.y = Math.PI;
      gun.name = "gun";
      g.add(gun);
      const aura = new THREE.PointLight(0xb6ff40, 1.1, 10);
      aura.position.y = 1.4;
      g.add(aura);
    }
  } else if (id === "morty" || id === "evil_morty" || id === "president_morty") {
    g = humanoid({
      id,
      skin: 0xf3d2b0,
      shirt: id === "evil_morty" || id === "president_morty" ? 0x222222 : 0xf0d24a,
      pants: 0x3a5a9a,
      hp: id === "morty" ? 80 : 2200,
      scale: 0.88,
      pupil: id === "evil_morty" || id === "president_morty" ? 0x111111 : 0x334466,
    });
    const hair = box(0.7, 0.18, 0.6, 0x5a3a28, 2.42);
    g.add(hair);
    if (id !== "morty") {
      const patch = box(0.28, 0.16, 0.08, 0x111111, 2.2);
      patch.position.set(-0.16, 2.2, 0.36);
      g.add(patch);
    }
  } else if (id === "meeseeks" || id === "meeseeks_king") {
    g = humanoid({
      id,
      skin: 0x3ec4f0,
      shirt: 0x2ab0e0,
      pants: 0x2ab0e0,
      hp: id === "meeseeks_king" ? 1600 : 55,
      scale: id === "meeseeks_king" ? 1.8 : 1.0,
    });
    const smile = box(0.35, 0.08, 0.06, 0xffffff, 1.98);
    smile.position.z = 0.38;
    g.add(smile);
  } else if (id === "scary_terry" || id === "dream_claw") {
    g = humanoid({
      id,
      skin: 0x66cc66,
      shirt: 0x228822,
      pants: 0x115511,
      hp: id === "scary_terry" ? 1400 : 95,
      scale: id === "scary_terry" ? 1.6 : 1.1,
      pupil: 0xff2222,
    });
    const claw = box(0.12, 0.7, 0.12, 0xeeeeee, 1.5);
    claw.position.set(0.75, 1.5, 0.2);
    g.add(claw, claw.clone().translateX(-1.5));
  } else if (id === "gromflomite") {
    g = humanoid({ id, skin: 0x88aa44, shirt: 0x556633, pants: 0x445522, hp: 90, scale: 1.1 });
    const ant = box(0.08, 0.5, 0.08, 0x334422, 2.55);
    ant.position.x = -0.15;
    const ant2 = ant.clone();
    ant2.position.x = 0.15;
    g.add(ant, ant2);
  } else if (id === "unity" || id === "unity_drone") {
    g = humanoid({
      id,
      skin: 0xe8c8d8,
      shirt: 0xc070e0,
      pants: 0x663377,
      hp: id === "unity" ? 2400 : 70,
      scale: id === "unity" ? 1.35 : 1.0,
    });
  } else if (id === "tammy") {
    g = humanoid({ id, skin: 0xf0d0b0, shirt: 0xc45a7a, pants: 0x333333, hp: 1800, scale: 1.2 });
  } else if (id === "abradolf") {
    g = humanoid({ id, skin: 0xe8d0a8, shirt: 0x553322, pants: 0x222222, hp: 1700, scale: 1.35 });
    const stache = box(0.4, 0.08, 0.08, 0x331800, 2.02);
    stache.position.z = 0.38;
    g.add(stache);
  } else if (id === "zeep" || id === "zeep_guard") {
    g = humanoid({
      id,
      skin: 0xcce8d8,
      shirt: 0x44aa88,
      pants: 0x226655,
      hp: id === "zeep" ? 1900 : 80,
      scale: id === "zeep" ? 1.05 : 0.8,
    });
  } else if (id === "cromulon") {
    g = new THREE.Group();
    const head = sph(2.4, 0xffdd55, 2.6);
    g.add(head);
    const mouth = box(2.2, 0.7, 0.4, 0x331111, 2.1);
    mouth.position.z = 2.0;
    g.add(mouth);
    g.userData.parts = { head };
    g.userData.hp = 3200;
    g.userData.maxHp = 3200;
    g.userData.radius = 2.6;
    g.userData.height = 5;
    g.userData.kind = id;
  } else if (id === "krombopulos") {
    g = humanoid({ id, skin: 0xa8c878, shirt: 0x445533, pants: 0x334422, hp: 1500, scale: 1.2 });
  } else if (id === "phoenix") {
    g = humanoid({ id, skin: 0x99aacc, shirt: 0x334466, pants: 0x222233, coat: 0x556688, hp: 2100, scale: 1.4 });
  } else if (id === "summer") {
    g = humanoid({ id, skin: 0xf3d2b0, shirt: 0xe8789a, pants: 0x3a3a88, hp: 90, scale: 1.0 });
    g.add(box(0.72, 0.22, 0.55, 0xd8c04a, 2.45));
  } else if (id === "jerry") {
    g = humanoid({ id, skin: 0xf0d0a0, shirt: 0x3a6aaa, pants: 0x4a4a4a, hp: 25, scale: 1.05 });
  } else if (id === "birdperson") {
    g = humanoid({ id, skin: 0xc8a070, shirt: 0x5a3a22, pants: 0x3a2818, hp: 200, scale: 1.3 });
  } else if (id === "gearhead") {
    g = humanoid({ id, skin: 0x999999, shirt: 0x666666, pants: 0x444444, hp: 100, scale: 1.1 });
  } else {
    g = humanoid({ id, shirt: 0x888888, hp: 80 });
  }

  const tag = document.createElement("div");
  g.userData.label = optsName(id);
  return g;
}

function optsName(id) {
  return id.replaceAll("_", " ");
}

export function animateWalk(g, t, moving) {
  const p = g.userData.parts;
  if (!p || !p.legL) return;
  const a = moving ? Math.sin(t * 10) * 0.55 : Math.sin(t * 2) * 0.05;
  p.legL.rotation.x = a;
  p.legR.rotation.x = -a;
  if (p.armL) {
    p.armL.rotation.x = -a * 0.6;
    p.armR.rotation.x = a * 0.6;
  }
}
