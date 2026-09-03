import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";

const loader = new THREE.TextureLoader();
const texCache = new Map();

function tex(url) {
  if (!url) return null;
  if (texCache.has(url)) return texCache.get(url);
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(url, t);
  return t;
}

function plastic(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.08,
    ...extra,
  });
}

function mesh(geo, material) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function roundedBox(w, h, d, r = 0.08) {
  return new THREE.BoxGeometry(w, h, d);
}

export function makePortalGun() {
  const g = new THREE.Group();
  const body = mesh(roundedBox(0.18, 0.22, 0.55), plastic(0x8b949c));
  body.position.z = 0.12;
  g.add(body);
  const grip = mesh(roundedBox(0.14, 0.32, 0.16), plastic(0x5c636a));
  grip.position.set(0, -0.22, -0.05);
  grip.rotation.x = 0.25;
  g.add(grip);
  const barrel = mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.34, 12), plastic(0x6a727a));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.48;
  g.add(barrel);
  const tank = mesh(new THREE.SphereGeometry(0.13, 16, 12), plastic(0x7cff3a, { emissive: 0x3cff00, emissiveIntensity: 0.85, transparent: true, opacity: 0.92 }));
  tank.position.set(0, 0.2, 0.02);
  g.add(tank);
  const light = new THREE.PointLight(0x7cff3a, 2.4, 8);
  light.position.copy(tank.position);
  g.add(light);
  const mug = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), plastic(0x444444));
  mug.position.set(0, 0.32, 0.02);
  g.add(mug);
  g.name = "gun";
  return g;
}

export function makeGreenPortal(portalTex) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    map: portalTex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40), mat);
  g.add(disc);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.72, 0.1, 8, 36),
    new THREE.MeshBasicMaterial({ color: 0xb6ff40 })
  );
  g.add(ring);
  const glow = new THREE.PointLight(0x88ff33, 3.5, 16);
  g.add(glow);
  g.userData.disc = disc;
  g.userData.ring = ring;
  return g;
}

function facePlane(url, w = 0.72, h = 0.72) {
  const t = tex(url);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: t,
      transparent: true,
      roughness: 0.55,
      metalness: 0,
    })
  );
  m.position.z = 0.42;
  m.castShadow = false;
  return m;
}

function hairSpikes(parent, color, count = 10) {
  const m = plastic(color);
  for (let i = 0; i < count; i++) {
    const spike = mesh(new THREE.ConeGeometry(0.11, 0.62, 6), m);
    const a = -0.85 + (i / (count - 1)) * 1.7;
    spike.position.set(Math.sin(a) * 0.32, 1.78 + Math.abs(Math.cos(a)) * 0.08, 0.05 + Math.cos(a) * 0.12);
    spike.rotation.z = a * 0.45;
    spike.rotation.x = -0.55;
    parent.add(spike);
  }
  const cap = mesh(new THREE.SphereGeometry(0.38, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), m);
  cap.position.set(0, 1.62, -0.02);
  parent.add(cap);
}

/** Roblox-like R15 blocky-smooth avatar */
export function r15(opts) {
  const g = new THREE.Group();
  const s = opts.scale || 1;
  g.scale.setScalar(s);
  const skin = opts.skin ?? 0xf0c8a0;
  const shirt = opts.shirt ?? 0x3aa8c8;
  const pants = opts.pants ?? 0x4a3828;
  const coat = opts.coat;

  const hip = mesh(roundedBox(0.95, 0.28, 0.52), plastic(pants));
  hip.position.y = 1.05;
  g.add(hip);

  const torso = mesh(roundedBox(1.05, 1.15, 0.55), plastic(shirt));
  torso.position.y = 1.72;
  g.add(torso);
  if (coat) {
    const c = mesh(roundedBox(1.28, 1.35, 0.7), plastic(coat));
    c.position.y = 1.62;
    g.add(c);
    const colL = mesh(roundedBox(0.22, 0.55, 0.12), plastic(coat));
    colL.position.set(-0.28, 2.28, 0.34);
    colL.rotation.x = -0.25;
    const colR = colL.clone();
    colR.position.x = 0.28;
    g.add(colL, colR);
  }

  const legL = mesh(roundedBox(0.38, 1.05, 0.42), plastic(pants));
  const legR = legL.clone();
  legL.position.set(-0.24, 0.52, 0);
  legR.position.set(0.24, 0.52, 0);
  const footL = mesh(roundedBox(0.4, 0.16, 0.55), plastic(0x2a2a2a));
  const footR = footL.clone();
  footL.position.set(-0.24, 0.08, 0.06);
  footR.position.set(0.24, 0.08, 0.06);
  g.add(legL, legR, footL, footR);

  const armL = mesh(roundedBox(0.32, 1.05, 0.32), plastic(coat || skin));
  const armR = armL.clone();
  armL.position.set(-0.72, 1.62, 0);
  armR.position.set(0.72, 1.62, 0);
  g.add(armL, armR);

  const head = mesh(new THREE.SphereGeometry(0.42, 20, 16), plastic(skin));
  head.position.y = 2.52;
  g.add(head);
  if (opts.face) {
    const f = facePlane(opts.face);
    f.position.set(0, 2.52, 0.22);
    g.add(f);
  }
  if (opts.hair === "rick") hairSpikes(g, 0x6ad4f0, 11);
  if (opts.hair === "brown") {
    const bang = mesh(roundedBox(0.78, 0.2, 0.62), plastic(0x5a3a22));
    bang.position.set(0, 2.82, 0.02);
    g.add(bang);
  }
  if (opts.hair === "gold") {
    const bang = mesh(roundedBox(0.8, 0.22, 0.6), plastic(0xd8b24a));
    bang.position.set(0, 2.84, 0.02);
    g.add(bang);
  }
  if (opts.patch) {
    const p = mesh(roundedBox(0.3, 0.18, 0.08), plastic(0x111111));
    p.position.set(-0.16, 2.54, 0.38);
    g.add(p);
  }

  g.userData.parts = { torso, head, legL, legR, armL, armR };
  g.userData.radius = 0.85 * s;
  g.userData.height = 2.9 * s;
  g.userData.kind = opts.id;
  g.userData.label = opts.label || opts.id;
  return g;
}

export function createCharacter(id) {
  const faces = {
    rick: "assets/face_rick.jpg",
    council_rick: "assets/face_rick.jpg",
    purge_rick: "assets/face_rick.jpg",
    toxic_rick: "assets/face_rick.jpg",
    morty: "assets/face_morty.jpg",
    evil_morty: "assets/face_evilmorty.jpg",
    president_morty: "assets/face_evilmorty.jpg",
    meeseeks: "assets/face_meeseeks.jpg",
    meeseeks_king: "assets/face_meeseeks.jpg",
    scary_terry: "assets/face_terry.jpg",
    dream_claw: "assets/face_terry.jpg",
    summer: "assets/face_summer.jpg",
  };

  let g;
  if (id === "rick" || id === "council_rick" || id === "purge_rick" || id === "toxic_rick") {
    g = r15({
      id,
      label: id === "rick" ? "Rick Sanchez" : id.replaceAll("_", " "),
      skin: 0xe8c4a0,
      shirt: id === "toxic_rick" ? 0x66aa33 : 0x2db3d4,
      pants: 0x5a4030,
      coat: id === "toxic_rick" ? 0x88cc44 : id === "purge_rick" ? 0xaa2222 : 0xf4f7fb,
      hair: "rick",
      face: faces.rick,
      scale: id === "rick" ? 1.08 : 1.0,
    });
    if (id === "rick") {
      const gun = makePortalGun();
      gun.position.set(0.78, 1.45, 0.42);
      gun.rotation.set(-0.15, Math.PI, 0.1);
      g.add(gun);
      g.userData.gun = gun;
    }
  } else if (id === "morty" || id === "evil_morty" || id === "president_morty") {
    g = r15({
      id,
      label: id === "morty" ? "Morty" : "Evil Morty",
      shirt: id === "morty" ? 0xf0d24a : 0x1a1a1a,
      pants: 0x3a5a9a,
      hair: "brown",
      face: faces[id] || faces.morty,
      patch: id !== "morty",
      scale: 0.9,
    });
  } else if (id === "meeseeks" || id === "meeseeks_king") {
    g = r15({
      id,
      label: "Mr. Meeseeks",
      skin: 0x3ec4f0,
      shirt: 0x2ab0e0,
      pants: 0x2ab0e0,
      face: faces.meeseeks,
      scale: id === "meeseeks_king" ? 1.55 : 1.0,
    });
  } else if (id === "scary_terry" || id === "dream_claw") {
    g = r15({
      id,
      label: "Scary Terry",
      skin: 0x55cc55,
      shirt: 0x228822,
      pants: 0x115511,
      face: faces.scary_terry,
      scale: id === "scary_terry" ? 1.35 : 1.05,
    });
  } else if (id === "summer") {
    g = r15({ id, label: "Summer", shirt: 0xe8789a, pants: 0x3a3a88, hair: "gold", face: faces.summer });
  } else if (id === "gromflomite") {
    g = r15({ id, label: "Gromflomite", skin: 0x88aa44, shirt: 0x445522, pants: 0x334411, scale: 1.1 });
    const ant = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), plastic(0x334422));
    ant.position.set(-0.16, 2.95, 0);
    const ant2 = ant.clone();
    ant2.position.x = 0.16;
    g.add(ant, ant2);
  } else if (id === "tammy") {
    g = r15({ id, label: "Tammy", shirt: 0xc45a7a, pants: 0x222222, hair: "brown", face: faces.summer, scale: 1.05 });
  } else if (id === "unity" || id === "unity_drone") {
    g = r15({
      id,
      label: "Unity",
      shirt: 0xc070e0,
      pants: 0x663377,
      hair: "gold",
      face: faces.summer,
      scale: id === "unity" ? 1.2 : 1,
    });
  } else if (id === "abradolf") {
    g = r15({ id, label: "Abradolf Lincler", shirt: 0x553322, pants: 0x222, hair: "brown", face: faces.rick, scale: 1.2 });
  } else if (id === "zeep" || id === "zeep_guard") {
    g = r15({ id, label: "Zeep", skin: 0xcce8d8, shirt: 0x44aa88, pants: 0x226655, scale: id === "zeep" ? 1 : 0.85 });
  } else if (id === "cromulon") {
    g = new THREE.Group();
    const head = mesh(new THREE.SphereGeometry(2.3, 24, 18), plastic(0xffdd55));
    head.position.y = 2.4;
    g.add(head);
    const face = facePlane(faces.morty, 2.2, 2.2);
    face.position.set(0, 2.4, 2.05);
    g.add(face);
    g.userData.parts = { head };
    g.userData.radius = 2.5;
    g.userData.height = 5;
    g.userData.kind = id;
    g.userData.label = "Cromulon";
  } else if (id === "jerry") {
    g = r15({ id, label: "Jerry", shirt: 0x3a6aaa, pants: 0x4a4a4a, hair: "brown", face: faces.morty, scale: 1.02 });
  } else if (id === "birdperson") {
    g = r15({ id, label: "Birdperson", skin: 0xc8a070, shirt: 0x5a3a22, pants: 0x3a2818, scale: 1.2 });
  } else {
    g = r15({ id, shirt: 0x777777 });
  }
  return g;
}

export function animateWalk(g, t, moving) {
  const p = g.userData.parts;
  if (!p?.legL) return;
  const a = moving ? Math.sin(t * 11) * 0.7 : 0;
  p.legL.rotation.x = a;
  p.legR.rotation.x = -a;
  if (p.armL) {
    p.armL.rotation.x = -a * 0.55;
    p.armR.rotation.x = a * 0.55;
  }
}

export { tex };
