import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";
import { DIMS, FOES, BOSSES, QUESTS } from "./data.js";
import { createCharacter, animateWalk, makeGreenPortal, tex } from "./chars.js";

const GAP = 500;
const $ = (s) => document.querySelector(s);

const state = {
  hp: 420,
  maxHp: 420,
  xp: 0,
  level: 1,
  cash: 40,
  dim: 0,
  selectedDim: 0,
  quest: 0,
  unlocked: { earth: true, citadel: true, meeseeks: true },
  kills: {},
  bosses: {},
};

let scene, camera, renderer, clock, raycaster;
let player, yaw = Math.PI, pitch = 0.18;
let keys = {};
let lock = false;
let vy = 0;
let grounded = true;
let enemies = [];
let npcs = [];
let portalMesh = null;
let portalTex;
let moving = false;

function origin(i) {
  return new THREE.Vector3(i * GAP, 0, 0);
}

function toast(title, body) {
  const d = document.createElement("div");
  d.className = "toast";
  d.innerHTML = `<b>${title}</b><div>${body || ""}</div>`;
  $("#toasts").prepend(d);
  setTimeout(() => d.remove(), 3800);
}

function save() {
  localStorage.setItem("rickrift", JSON.stringify(state));
}
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem("rickrift") || "null");
    if (s?.hp) Object.assign(state, s);
  } catch {}
}

function plastic(c) {
  return new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.06 });
}
function part(geo, mat, x, y, z, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function buildGarage(root) {
  const g = new THREE.Group();
  g.position.copy(origin(0));
  root.add(g);

  // interior
  part(new THREE.BoxGeometry(28, 0.4, 22), plastic(0x6a6e72), 0, 0, 0, g); // floor
  part(new THREE.BoxGeometry(28, 10, 0.4), plastic(0xc8b89a), 0, 5, -11, g); // back wall
  part(new THREE.BoxGeometry(0.4, 10, 22), plastic(0xc8b89a), -14, 5, 0, g);
  part(new THREE.BoxGeometry(0.4, 10, 22), plastic(0xc8b89a), 14, 5, 0, g);
  part(new THREE.BoxGeometry(28, 0.4, 22), plastic(0x4a4e52), 0, 10, 0, g); // ceiling
  // open garage door frame
  part(new THREE.BoxGeometry(8, 10, 0.4), plastic(0x8a9094), -10, 5, 11, g);
  part(new THREE.BoxGeometry(8, 10, 0.4), plastic(0x8a9094), 10, 5, 11, g);
  part(new THREE.BoxGeometry(12, 2, 0.4), plastic(0x8a9094), 0, 9, 11, g);

  // workbench
  part(new THREE.BoxGeometry(8, 0.3, 2.4), plastic(0x6b4423), -8, 2.2, -8, g);
  part(new THREE.BoxGeometry(0.3, 2.1, 0.3), plastic(0x3a2a18), -11.5, 1.05, -8.8, g);
  part(new THREE.BoxGeometry(0.3, 2.1, 0.3), plastic(0x3a2a18), -4.5, 1.05, -8.8, g);
  // bottles
  for (let i = 0; i < 6; i++) {
    const b = part(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 8), plastic(i % 2 ? 0x44ff88 : 0x88aaff), -11 + i * 0.9, 2.6, -8, g);
    b.material.emissive = new THREE.Color(i % 2 ? 0x118822 : 0x112266);
    b.material.emissiveIntensity = 0.4;
  }
  // shelves
  for (let y = 3; y <= 7; y += 2) {
    part(new THREE.BoxGeometry(6, 0.15, 1.2), plastic(0x5a4030), 10.5, y, -9.5, g);
  }
  // hanging car (simple)
  part(new THREE.BoxGeometry(6, 1.6, 3), plastic(0x2a62c8), 0, 1.2, -3, g);
  part(new THREE.SphereGeometry(0.55, 10, 8), plastic(0x222), -2.2, 0.55, -4.1, g);
  part(new THREE.SphereGeometry(0.55, 10, 8), plastic(0x222), 2.2, 0.55, -4.1, g);
  part(new THREE.SphereGeometry(0.55, 10, 8), plastic(0x222), -2.2, 0.55, -1.9, g);
  part(new THREE.SphereGeometry(0.55, 10, 8), plastic(0x222), 2.2, 0.55, -1.9, g);

  // neon portal deco on back wall
  const deco = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.12, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x7cff3a })
  );
  deco.position.set(0, 5.2, -10.6);
  g.add(deco);
  const pl = new THREE.PointLight(0x88ff44, 2.2, 18);
  pl.position.set(0, 5, -8);
  g.add(pl);
  const lamp = new THREE.PointLight(0xffe6aa, 1.6, 20);
  lamp.position.set(0, 8.5, 0);
  g.add(lamp);

  // street
  part(new THREE.BoxGeometry(80, 0.3, 40), plastic(0x3a3a40), 0, -0.05, 32, g);
  part(new THREE.BoxGeometry(80, 0.05, 0.4), plastic(0xf0d24a), 0, 0.14, 32, g);
  // house
  part(new THREE.BoxGeometry(18, 12, 14), plastic(0xe2d4b8), -28, 6, 8, g);
  part(new THREE.BoxGeometry(20, 1.2, 16), plastic(0x8a3030), -28, 12.4, 8, g);
  // grass
  part(new THREE.BoxGeometry(90, 0.2, 90), plastic(0x3d8a45), 0, -0.2, 10, g);

  g.userData.spawn = new THREE.Vector3(0, 0, 2);
  return g;
}

function buildDim(i, root) {
  if (i === 0) return buildGarage(root);
  const d = DIMS[i];
  const g = new THREE.Group();
  g.position.copy(origin(i));
  root.add(g);
  part(new THREE.BoxGeometry(90, 0.5, 90), plastic(d.color), 0, -0.25, 0, g);
  const sky = new THREE.PointLight(d.fog, 1.4, 70);
  sky.position.set(0, 20, 0);
  g.add(sky);

  if (d.id === "citadel") {
    for (let n = 0; n < 10; n++) {
      const h = 14 + (n % 4) * 8;
      part(new THREE.BoxGeometry(7, h, 7), plastic(0x4a5a88), Math.cos(n * 0.7) * 22, h / 2, Math.sin(n * 0.7) * 22, g);
    }
    part(new THREE.BoxGeometry(30, 2, 30), plastic(0x223355), 0, 1, 0, g);
  } else if (d.id === "meeseeks") {
    part(new THREE.BoxGeometry(36, 16, 36), plastic(0x1e90c8), 0, 8, 0, g);
    part(new THREE.BoxGeometry(34, 14, 34), plastic(0x3ec4f0), 0, 8, 0, g);
    for (let n = 0; n < 8; n++) {
      part(new THREE.SphereGeometry(1.6, 12, 10), plastic(0x3ec4f0), -12 + (n % 4) * 8, 1.6, -8 + Math.floor(n / 4) * 10, g);
    }
  } else if (d.id === "federation") {
    part(new THREE.BoxGeometry(70, 12, 18), plastic(0x776655), 0, 6, -16, g);
    for (let n = -4; n <= 4; n++) part(new THREE.BoxGeometry(5, 10, 5), plastic(0xaa8844), n * 8, 5, 8, g);
  } else if (d.id === "unity") {
    for (let n = 0; n < 6; n++) {
      part(new THREE.SphereGeometry(6, 14, 12), plastic(0xaa66cc), Math.cos(n) * 18, 6, Math.sin(n) * 18, g);
    }
  } else if (d.id === "purge") {
    part(new THREE.BoxGeometry(24, 16, 24), plastic(0x661111), 0, 8, -12, g);
    for (let n = 0; n < 8; n++) part(new THREE.BoxGeometry(2.5, 7, 2.5), plastic(0x331111), -24 + n * 7, 3.5, 16, g);
  } else if (d.id === "microverse") {
    part(new THREE.BoxGeometry(40, 4, 40), plastic(0x226655), 0, 2, 0, g);
    part(new THREE.BoxGeometry(8, 20, 8), plastic(0x44aa88), 0, 12, 0, g);
  } else if (d.id === "dream") {
    part(new THREE.BoxGeometry(80, 0.4, 80), plastic(0x140018), 0, 0.1, 0, g);
    for (let n = 0; n < 8; n++) part(new THREE.BoxGeometry(3, 14, 3), plastic(0x442266), Math.cos(n) * 18, 7, Math.sin(n) * 18, g);
  } else if (d.id === "cromulon") {
    part(new THREE.BoxGeometry(70, 1, 70), plastic(0x224466), 0, 0.4, 0, g);
    part(new THREE.SphereGeometry(12, 20, 16), plastic(0xffdd55), 0, 14, -20, g);
  } else {
    part(new THREE.BoxGeometry(50, 6, 50), plastic(0x161616), 0, 3, 0, g);
    for (let n = 0; n < 5; n++) part(new THREE.BoxGeometry(8, 16, 8), plastic(0x111), Math.cos(n * 1.2) * 16, 8, Math.sin(n * 1.2) * 16, g);
  }
  g.userData.spawn = new THREE.Vector3(0, 0, 8);
  spawnWave(i, 7);
  return g;
}

function spawnWave(dimIndex, n) {
  const d = DIMS[dimIndex];
  const o = origin(dimIndex);
  for (let i = 0; i < n; i++) {
    spawnEnemy(d.enemy, o.x + (Math.random() - 0.5) * 40, o.z - 8 + (Math.random() - 0.5) * 28);
  }
}

function spawnEnemy(kind, x, z, boss = false) {
  const def = boss ? BOSSES[kind] : FOES[kind] || FOES.gromflomite;
  const m = createCharacter(kind);
  m.position.set(x, 0, z);
  m.userData.enemy = true;
  m.userData.boss = boss;
  m.userData.kind = kind;
  m.userData.hp = def.hp;
  m.userData.maxHp = def.hp;
  m.userData.dmg = def.dmg;
  m.userData.speed = def.speed * 0.85;
  m.userData.ai = (FOES[kind] && FOES[kind].ai) || (boss ? "boss" : "rush");
  m.userData.hitCd = 0;
  scene.add(m);
  enemies.push(m);
  if (boss) {
    $("#boss").classList.add("on");
    $("#bossName").textContent = def.name;
    toast(def.name, def.line);
  }
  return m;
}

function spawnNpcs() {
  const o = origin(0);
  const list = [
    ["morty", 6, 6, "Aw geez Rick, the gun actually works this time?"],
    ["summer", 10, 4, "If you're so OP, portal the HOA into the sun."],
    ["jerry", 14, 8, "I could have been in advertising."],
    ["birdperson", -8, 10, "In bird culture this garage is considered a nest of poor choices."],
  ];
  for (const [id, x, z, line] of list) {
    const n = createCharacter(id);
    n.position.set(o.x + x, 0, o.z + z);
    n.userData.npc = true;
    n.userData.line = line;
    scene.add(n);
    npcs.push(n);
  }
}

function initThree() {
  portalTex = tex("assets/tex_portal.jpg");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x6aa4d8);
  scene.fog = new THREE.Fog(0x6aa4d8, 35, 120);
  camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 300);
  renderer = new THREE.WebGLRenderer({ canvas: $("#view"), antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();

  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x3a4a30, 0.95));
  const sun = new THREE.DirectionalLight(0xfff1cc, 1.05);
  sun.position.set(18, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const world = new THREE.Group();
  scene.add(world);
  DIMS.forEach((_, i) => buildDim(i, world));

  player = createCharacter("rick");
  player.position.set(0, 0, 2);
  scene.add(player);
  spawnNpcs();

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

function firePortal() {
  const dir = new THREE.Vector3(Math.sin(yaw), -pitch * 0.35, Math.cos(yaw)).normalize();
  const origin = player.position.clone().add(new THREE.Vector3(0, 1.6, 0));
  raycaster.set(origin, dir);
  const hits = raycaster.intersectObjects(scene.children, true).filter((h) => {
    let o = h.object;
    while (o) {
      if (o === player || o === portalMesh) return false;
      if (o.userData?.enemy || o.userData?.npc) return false;
      o = o.parent;
    }
    return h.distance < 48;
  });
  let pos, quat;
  if (hits[0]) {
    pos = hits[0].point.clone().add(hits[0].face.normal.clone().multiplyScalar(0.12));
    const n = hits[0].face.normal.clone();
    quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  } else {
    pos = origin.clone().add(dir.clone().multiplyScalar(10));
    pos.y = Math.max(1.6, pos.y);
    quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, origin, new THREE.Vector3(0, 1, 0)));
  }
  if (portalMesh) scene.remove(portalMesh);
  portalMesh = makeGreenPortal(portalTex);
  portalMesh.position.copy(pos);
  portalMesh.quaternion.copy(quat);
  portalMesh.userData.dest = state.selectedDim;
  scene.add(portalMesh);
  beep(620, 0.09);
  toast("Portal", DIMS[state.selectedDim].name);
}

function enterPortal() {
  const dest = portalMesh.userData.dest ?? state.selectedDim;
  const d = DIMS[dest];
  if (!state.unlocked[d.id] && state.level < d.unlock) {
    toast("Locked", `Need level ${d.unlock}`);
    return;
  }
  state.unlocked[d.id] = true;
  state.dim = dest;
  const o = origin(dest);
  player.position.set(o.x, 0, o.z + 8);
  scene.background = new THREE.Color(d.fog);
  scene.fog.color = new THREE.Color(d.fog);
  if (portalMesh) {
    scene.remove(portalMesh);
    portalMesh = null;
  }
  flash();
  toast(d.name, d.desc);
  if (QUESTS[state.quest]?.kind === "goto") completeQuest();
  save();
  refreshHud();
  beep(180, 0.16);
}

function flash() {
  const el = $("#flash");
  el.classList.add("on");
  setTimeout(() => el.classList.remove("on"), 220);
}

function shootGun() {
  // OP blast from portal gun if not placing (hold shift to blast)
  const dir = new THREE.Vector3(Math.sin(yaw), -pitch * 0.2, Math.cos(yaw));
  const origin = player.position.clone().add(new THREE.Vector3(0, 1.5, 0));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0x88ff33 }));
  ball.position.copy(origin);
  scene.add(ball);
  ball.userData = { vel: dir.normalize().multiplyScalar(42), life: 1.2, dmg: 160 };
  bullets.push(ball);
  beep(880, 0.04);
}
const bullets = [];

function hurt(e, dmg) {
  e.userData.hp -= dmg;
  if (e.userData.boss) $("#bossFill").style.width = Math.max(0, e.userData.hp / e.userData.maxHp) * 100 + "%";
  if (e.userData.hp <= 0) {
    const kind = e.userData.kind;
    const def = e.userData.boss ? BOSSES[kind] : FOES[kind];
    state.kills[kind] = (state.kills[kind] || 0) + 1;
    if (def) {
      state.xp += def.xp || 20;
      state.cash += def.cash || 8;
      toast(e.userData.boss ? "Boss down" : "Wubba", def.name);
    }
    if (e.userData.boss) {
      state.bosses[kind] = true;
      $("#boss").classList.remove("on");
    }
    while (state.xp >= 80 * state.level) {
      state.xp -= 80 * state.level;
      state.level++;
      state.maxHp += 16;
      state.hp = state.maxHp;
      DIMS.forEach((d) => {
        if (state.level >= d.unlock) state.unlocked[d.id] = true;
      });
      toast("Level " + state.level, "Rick got worse (for everyone else).");
      paintDims();
    }
    tickQuest();
    scene.remove(e);
    enemies = enemies.filter((x) => x !== e);
    save();
    refreshHud();
  }
}

function tickQuest() {
  const q = QUESTS[state.quest];
  if (!q) return;
  if (q.kind === "kill" && (state.kills[q.target] || 0) >= (q.count || 1)) completeQuest();
  if (q.kind === "boss" && state.bosses[q.target]) completeQuest();
}
function completeQuest() {
  const q = QUESTS[state.quest];
  state.xp += q.xp;
  state.cash += q.cash;
  toast("Quest", q.name);
  state.quest = Math.min(state.quest + 1, QUESTS.length - 1);
  save();
  refreshHud();
}

function damageRick(n) {
  state.hp -= n * 0.32;
  beep(130, 0.07);
  if (state.hp <= 0) {
    state.hp = state.maxHp;
    const o = origin(state.dim);
    player.position.set(o.x, 0, o.z + 6);
    toast("Immortal", "Rick doesn't die. That's the update.");
  }
}

function beep(f, d) {
  try {
    const ac = beep.ac || (beep.ac = new AudioContext());
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "square";
    o.frequency.value = f;
    g.gain.value = 0.035;
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + d);
  } catch {}
}

function interact() {
  for (const n of npcs) {
    if (n.position.distanceTo(player.position) < 4.5) {
      toast(n.userData.label, n.userData.line);
      return;
    }
  }
}

function update(dt) {
  const t = clock.elapsedTime;
  const speed = keys.ShiftLeft || keys.ShiftRight ? 18 : 11.5;
  const f = (keys.KeyW ? 1 : 0) + (keys.KeyS ? -1 : 0);
  const s = (keys.KeyD ? 1 : 0) + (keys.KeyA ? -1 : 0);
  moving = !!(f || s);
  if (moving) {
    player.position.x += (Math.sin(yaw) * f + Math.cos(yaw) * s) * speed * dt;
    player.position.z += (Math.cos(yaw) * f - Math.sin(yaw) * s) * speed * dt;
    player.rotation.y = yaw;
  }
  if (keys.Space && grounded) {
    vy = 8.8;
    grounded = false;
  }
  vy -= 24 * dt;
  player.position.y += vy * dt;
  if (player.position.y <= 0) {
    player.position.y = 0;
    vy = 0;
    grounded = true;
  }
  animateWalk(player, t, moving);
  npcs.forEach((n) => animateWalk(n, t, false));

  // Roblox-style chase cam
  const back = new THREE.Vector3(-Math.sin(yaw) * 7.2, 3.3 + pitch * 2.4, -Math.cos(yaw) * 7.2);
  camera.position.lerp(player.position.clone().add(back), 0.2);
  camera.lookAt(player.position.x, player.position.y + 1.8, player.position.z);

  if (state.hp < state.maxHp) state.hp = Math.min(state.maxHp, state.hp + 12 * dt);
  $("#hpFill").style.width = (state.hp / state.maxHp) * 100 + "%";

  if (portalMesh) {
    portalMesh.userData.disc.rotation.z += dt * 1.8;
    portalMesh.userData.ring.rotation.z -= dt * 2.2;
    if (player.position.distanceTo(portalMesh.position) < 2.1) enterPortal();
  }

  for (const b of bullets) {
    b.position.addScaledVector(b.userData.vel, dt);
    b.userData.life -= dt;
    for (const e of enemies) {
      if (e.userData.hp > 0 && e.position.distanceTo(b.position) < (e.userData.radius || 1) + 0.35) {
        hurt(e, b.userData.dmg);
        b.userData.life = 0;
      }
    }
  }
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].userData.life <= 0) {
      scene.remove(bullets[i]);
      bullets.splice(i, 1);
    }
  }

  for (const e of enemies) {
    if (e.userData.hp <= 0) continue;
    const to = player.position.clone().sub(e.position);
    to.y = 0;
    const dist = to.length();
    const dir = dist > 0.01 ? to.normalize() : new THREE.Vector3();
    e.lookAt(player.position.x, e.position.y, player.position.z);
    animateWalk(e, t, dist > 2);
    if (dist > 2.2) e.position.addScaledVector(dir, e.userData.speed * dt);
    e.userData.hitCd -= dt;
    if (dist < 2.2 && e.userData.hitCd <= 0) {
      e.userData.hitCd = 0.7;
      damageRick(e.userData.dmg);
    }
  }

  if (Math.random() < 0.0018 && enemies.length < 12) {
    const d = DIMS[state.dim];
    const o = origin(state.dim);
    spawnEnemy(d.enemy, o.x + (Math.random() - 0.5) * 36, o.z + (Math.random() - 0.5) * 36);
  }
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if ($("#overlay").classList.contains("hidden") && !$("#menu").classList.contains("on")) update(dt);
  else if (player) {
    camera.position.lerp(player.position.clone().add(new THREE.Vector3(0, 4, 8)), 0.05);
    camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function refreshHud() {
  $("#lvl").textContent = `Rick  ·  Lv ${state.level}`;
  $("#dimName").textContent = DIMS[state.dim].name;
  $("#cash").textContent = "₵ " + state.cash;
  const need = 80 * state.level;
  $("#xpFill").style.width = Math.min(100, (state.xp / need) * 100) + "%";
  const q = QUESTS[state.quest];
  $("#questName").textContent = q ? q.name : "Go be a menace";
  $("#questDesc").textContent = q ? q.desc : "";
}

function paintDims() {
  const box = $("#dimList");
  box.innerHTML = DIMS.map((d, i) => {
    const open = state.unlocked[d.id] || state.level >= d.unlock;
    const on = state.selectedDim === i ? "on" : "";
    const here = state.dim === i ? "here" : "";
    return `<button class="dim-btn ${on} ${here}" data-i="${i}" ${open ? "" : "disabled"}>
      <span class="dot"></span><span>${d.name}</span>
    </button>`;
  }).join("");
  box.querySelectorAll(".dim-btn").forEach((b) =>
    b.addEventListener("click", () => {
      state.selectedDim = Number(b.dataset.i);
      paintDims();
      toast("Armed", DIMS[state.selectedDim].name);
    })
  );
}

function bind() {
  addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyE") interact();
    if (e.code === "KeyF") {
      player.position.add(new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(9));
      beep(280, 0.08);
    }
    if (e.code === "KeyB" || e.code === "Tab") {
      e.preventDefault();
      $("#menu").classList.toggle("on");
      document.exitPointerLock();
    }
    if (e.code === "Escape") $("#menu").classList.remove("on");
    if (e.code === "KeyH") {
      spawnEnemy(DIMS[state.dim].boss, player.position.x, player.position.z - 12, true);
    }
  });
  addEventListener("keyup", (e) => (keys[e.code] = false));
  addEventListener("mousedown", (e) => {
    if (!$("#overlay").classList.contains("hidden")) return;
    if ($("#menu").classList.contains("on")) return;
    if (e.button === 0) firePortal();
    if (e.button === 2) shootGun();
  });
  addEventListener("contextmenu", (e) => e.preventDefault());
  addEventListener("mousemove", (e) => {
    if (!lock) return;
    yaw -= e.movementX * 0.0022;
    pitch = Math.max(-0.35, Math.min(0.7, pitch + e.movementY * 0.002));
  });
  $("#view").addEventListener("click", () => {
    if ($("#overlay").classList.contains("hidden")) $("#view").requestPointerLock();
  });
  document.addEventListener("pointerlockchange", () => {
    lock = document.pointerLockElement === $("#view");
  });
  $("#play").onclick = () => {
    $("#overlay").classList.add("hidden");
    $("#view").requestPointerLock();
    toast("Portal Gun", "Pick a world on the right, then click to shoot a green portal. Walk through it.");
  };
  $("#closeMenu").onclick = () => $("#menu").classList.remove("on");
  $("#summon").onclick = () => {
    spawnEnemy(DIMS[state.dim].boss, player.position.x, player.position.z - 14, true);
    $("#menu").classList.remove("on");
  };
  $("#reset").onclick = () => {
    localStorage.removeItem("rickrift");
    location.reload();
  };
  $("#atk").onclick = () => firePortal();
  $("#alt").onclick = () => shootGun();
  $("#int").onclick = interact;
  $("#mmenu").onclick = () => $("#menu").classList.toggle("on");
  const stick = $("#stick");
  const knob = $("#knob");
  if (stick && knob) {
    let drag = false;
    const go = (ev) => {
      const t = ev.touches ? ev.touches[0] : ev;
      const r = stick.getBoundingClientRect();
      const x = t.clientX - r.left - 60;
      const y = t.clientY - r.top - 60;
      keys.KeyW = y < -10;
      keys.KeyS = y > 10;
      keys.KeyA = x < -10;
      keys.KeyD = x > 10;
    };
    stick.addEventListener("pointerdown", (e) => {
      drag = true;
      go(e);
    });
    addEventListener("pointermove", (e) => drag && go(e));
    addEventListener("pointerup", () => {
      drag = false;
      keys.KeyW = keys.KeyS = keys.KeyA = keys.KeyD = false;
    });
  }
}

export function boot() {
  loadSave();
  DIMS.forEach((d) => {
    if (state.level >= d.unlock) state.unlocked[d.id] = true;
  });
  initThree();
  bind();
  paintDims();
  refreshHud();
  loop();
}
