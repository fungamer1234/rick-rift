import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";
import { DIMS, FOES, BOSSES, WEAPONS, QUESTS, MUSEUM, GAME } from "./data.js";
import { createCharacter, animateWalk } from "./chars.js";

const GAP = 420;
const $ = (s) => document.querySelector(s);

const state = {
  hp: 420,
  maxHp: 420,
  xp: 0,
  level: 1,
  cash: 40,
  dim: 0,
  weapon: 0,
  kills: {},
  bosses: {},
  quest: 0,
  unlocked: { earth: true, citadel: true, meeseeks: true },
  god: true, // Rick is OP
};

let scene, camera, renderer, clock;
let rick, yaw = 0, pitch = 0.28;
let keys = {};
let enemies = [];
let bullets = [];
let portals = [null, null];
let lastShot = 0;
let grounded = true;
let vy = 0;
let lock = false;
let npcs = [];
let particles = [];
let worldRoot;

const listener = { x: 0, z: 0 };

function dimOrigin(i) {
  return new THREE.Vector3(i * GAP, 0, 0);
}

function toast(title, body) {
  const w = $("#toasts");
  const d = document.createElement("div");
  d.className = "toast";
  d.innerHTML = `<b>${title}</b><div>${body || ""}</div>`;
  w.prepend(d);
  setTimeout(() => d.remove(), 4200);
}

function save() {
  localStorage.setItem("rickrift", JSON.stringify(state));
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem("rickrift") || "null");
    if (s && s.hp) Object.assign(state, s);
  } catch {}
}

function mat(c) {
  return new THREE.MeshLambertMaterial({ color: c });
}

function box(w, h, d, c, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function portalRing(parent, pos, color) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.18, 10, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
  );
  ring.rotation.y = Math.PI / 2;
  g.add(ring);
  const glow = new THREE.PointLight(color, 2.2, 12);
  g.add(glow);
  g.position.copy(pos);
  parent.add(g);
  g.userData.spin = ring;
  return g;
}

function buildDimension(i, root) {
  const d = DIMS[i];
  const o = dimOrigin(i);
  const g = new THREE.Group();
  g.position.copy(o);
  root.add(g);

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(220, 2, 220),
    new THREE.MeshLambertMaterial({ color: d.color })
  );
  ground.position.y = -1;
  ground.receiveShadow = true;
  g.add(ground);

  // unique silhouettes
  if (d.id === "earth") {
    box(28, 16, 22, 0xe8dcc0, -18, 8, -16, g);
    box(30, 2, 24, 0x8a3030, -18, 16.6, -16, g);
    box(16, 12, 14, 0x8a9098, 2, 6, -8, g); // garage
    box(10, 14, 1.2, 0x40ffe6, 2, 8, -14.4, g); // portal device
    box(80, 0.4, 18, 0x333338, 8, 0.2, 20, g); // street
    for (let t = 0; t < 8; t++) {
      box(1.2, 8, 1.2, 0x6a4420, 20 + (t % 4) * 10, 4, -6 - Math.floor(t / 4) * 12, g);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(3.2, 10, 8), mat(0x2e8a3a));
      leaves.position.set(20 + (t % 4) * 10, 10, -6 - Math.floor(t / 4) * 12);
      g.add(leaves);
    }
    box(18, 10, 14, 0x3a6a44, 40, 5, 28, g); // shop
  } else if (d.id === "citadel") {
    for (let n = 0; n < 12; n++) {
      box(8, 28 + (n % 5) * 6, 8, 0x445588, Math.cos(n) * 40, 16, Math.sin(n) * 40, g);
    }
    box(50, 4, 50, 0x223355, 0, 2, 0, g);
  } else if (d.id === "meeseeks") {
    box(24, 18, 24, 0x2aa8e8, 0, 9, 0, g);
    for (let n = 0; n < 16; n++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), mat(0x3ec4f0));
      s.position.set((n % 8) * 8 - 28, 2.2, Math.floor(n / 8) * 16 - 8);
      g.add(s);
    }
  } else if (d.id === "federation") {
    box(80, 20, 16, 0x776655, 0, 10, -30, g);
    for (let n = -3; n <= 3; n++) box(6, 14, 6, 0xaa8844, n * 12, 7, 10, g);
  } else if (d.id === "unity") {
    for (let n = 0; n < 7; n++) {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 10), mat(0xaa66cc));
      dome.position.set(Math.cos(n) * 28, 4, Math.sin(n) * 28);
      g.add(dome);
    }
  } else if (d.id === "purge") {
    box(30, 18, 30, 0x661111, 0, 9, -20, g);
    for (let n = 0; n < 10; n++) box(3, 8, 3, 0x331111, -40 + n * 8, 4, 24, g);
  } else if (d.id === "microverse") {
    box(40, 6, 40, 0x226655, 0, 3, 0, g);
    box(8, 22, 8, 0x44aa88, 0, 14, 0, g);
  } else if (d.id === "dream") {
    box(200, 1, 200, 0x110018, 0, 0.2, 0, g);
    for (let n = 0; n < 9; n++) {
      box(4, 16, 4, 0x442266, Math.cos(n * 0.7) * 30, 8, Math.sin(n * 0.7) * 30, g);
    }
  } else if (d.id === "cromulon") {
    const star = new THREE.Mesh(new THREE.SphereGeometry(90, 16, 12), new THREE.MeshBasicMaterial({ color: 0x001133 }));
    star.position.y = 40;
    g.add(star);
    box(80, 2, 80, 0x224466, 0, 0, 0, g);
  } else {
    box(60, 8, 60, 0x222222, 0, 4, 0, g);
    for (let n = 0; n < 6; n++) box(10, 18, 10, 0x111111, Math.cos(n) * 24, 9, Math.sin(n) * 24, g);
  }

  const pad = portalRing(g, new THREE.Vector3(8, 2.2, 6), 0x40ffe6);
  pad.userData.home = true;
  g.userData.spawn = new THREE.Vector3(o.x + 6, 1.2, o.z + 10);
  g.userData.bossSpot = new THREE.Vector3(o.x, 1.2, o.z - 40);

  // lights
  const l = new THREE.PointLight(d.fog, 1.1, 80);
  l.position.set(0, 18, 8);
  g.add(l);

  spawnWave(d, o, 8);
  spawnNpcs(d, o);
  return g;
}

function spawnNpcs(d, o) {
  if (d.id === "earth") {
    placeNpc("morty", o.x + 10, o.z + 8, "Don't do the thing. You're gonna do the thing.");
    placeNpc("summer", o.x + 18, o.z + 4, "Grandpa, if you're OP just end the HOA.");
    placeNpc("jerry", o.x + 24, o.z + 12, "I made apples. That's... that's my thing.");
    placeNpc("birdperson", o.x - 8, o.z + 16, "In bird culture, this is considered a sick opening.");
  }
  if (d.id === "citadel") placeNpc("morty", o.x + 4, o.z + 6, "There's a Morty with an eyepatch. That's never good.");
}

function placeNpc(id, x, z, line) {
  const n = createCharacter(id);
  n.position.set(x, 0, z);
  n.userData.npc = true;
  n.userData.line = line;
  n.userData.hp = 9999;
  scene.add(n);
  npcs.push(n);
}

function spawnWave(d, o, count) {
  for (let i = 0; i < count; i++) {
    spawnEnemy(d.enemy, o.x + (Math.random() - 0.5) * 70, o.z - 10 + (Math.random() - 0.5) * 50);
  }
}

function spawnEnemy(kind, x, z, boss) {
  const def = boss ? BOSSES[kind] : FOES[kind] || FOES.gromflomite;
  const m = createCharacter(kind);
  m.position.set(x, 0, z);
  m.userData.enemy = true;
  m.userData.boss = !!boss;
  m.userData.kind = kind;
  m.userData.hp = def.hp;
  m.userData.maxHp = def.hp;
  m.userData.dmg = def.dmg;
  m.userData.speed = def.speed;
  m.userData.ai = (FOES[kind] && FOES[kind].ai) || (boss ? "boss" : "shoot");
  m.userData.line = def.line;
  m.userData.frozen = 0;
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

function spawnBoss() {
  const d = DIMS[state.dim];
  const o = dimOrigin(state.dim);
  spawnEnemy(d.boss, o.x, o.z - 42, true);
}

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87aacc);
  scene.fog = new THREE.Fog(0x87aacc, 40, 160);
  camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 400);
  renderer = new THREE.WebGLRenderer({ canvas: $("#view"), antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  clock = new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0xc8e8ff, 0x334422, 0.9));
  const sun = new THREE.DirectionalLight(0xfff2d0, 0.85);
  sun.position.set(20, 40, 10);
  sun.castShadow = true;
  scene.add(sun);

  worldRoot = new THREE.Group();
  scene.add(worldRoot);
  DIMS.forEach((_, i) => buildDimension(i, worldRoot));

  rick = createCharacter("rick");
  rick.position.copy(dimOrigin(0)).add(new THREE.Vector3(6, 0, 12));
  scene.add(rick);

  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

function currentWeapon() {
  return WEAPONS[state.weapon];
}

function shoot(alt) {
  const now = performance.now() / 1000;
  const w = currentWeapon();
  const cd = 1 / (state.god ? w.rpm * 1.35 : w.rpm);
  if (now - lastShot < cd) return;
  lastShot = now;
  const origin = rick.position.clone().add(new THREE.Vector3(0, 1.4, 0));
  const dir = new THREE.Vector3(Math.sin(yaw), -pitch * 0.6, Math.cos(yaw)).normalize();
  if (alt && w.alt === "portal") {
    placePortal(origin, dir);
    beep(420, 0.08);
    return;
  }
  const dmg = (state.god ? w.dmg * 1.8 : w.dmg) * (1 + (state.level - 1) * 0.04);
  if (w.alt === "aoe" && alt) {
    explode(origin.clone().add(dir.clone().multiplyScalar(8)), dmg);
    return;
  }
  const geo = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshBasicMaterial({ color: w.color })
  );
  geo.position.copy(origin);
  scene.add(geo);
  bullets.push({
    mesh: geo,
    vel: dir.clone().multiplyScalar(48),
    life: 1.6,
    dmg,
    freeze: w.alt === "freeze" || alt,
    pierce: state.god ? 3 : 1,
  });
  beep(880, 0.04);
}

function placePortal(origin, dir) {
  const hit = origin.clone().add(dir.clone().multiplyScalar(18));
  hit.y = 2.2;
  const slot = portals[0] ? 1 : 0;
  if (portals[slot]) scene.remove(portals[slot]);
  const p = portalRing(scene, hit, slot ? 0xff9a3a : 0x40ffe6);
  p.userData.slot = slot;
  portals[slot] = p;
  toast("Portal", slot ? "Orange hole punched." : "Blue hole punched.");
}

function explode(pos, dmg) {
  for (const e of enemies) {
    if (e.position.distanceTo(pos) < 8) hurt(e, dmg);
  }
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), new THREE.MeshBasicMaterial({ color: 0xb6ff40 }));
  s.position.copy(pos);
  scene.add(s);
  particles.push({ mesh: s, t: 0.35, grow: 18 });
}

function hurt(e, dmg) {
  if (e.userData.hp <= 0) return;
  e.userData.hp -= dmg;
  floatDmg(e.position, dmg);
  e.position.add(e.position.clone().sub(rick.position).setY(0).normalize().multiplyScalar(0.6));
  if (e.userData.hp <= 0) kill(e);
  else if (e.userData.boss) {
    const pct = Math.max(0, e.userData.hp / e.userData.maxHp);
    $("#bossFill").style.width = pct * 100 + "%";
  }
}

function kill(e) {
  const kind = e.userData.kind;
  state.kills[kind] = (state.kills[kind] || 0) + 1;
  const def = e.userData.boss ? BOSSES[kind] : FOES[kind];
  if (def) {
    state.xp += def.xp || 20;
    state.cash += def.cash || 8;
    toast(e.userData.boss ? "Boss down" : "Wubba", `${def.name} folded. +${def.xp} XP`);
  }
  if (e.userData.boss) {
    state.bosses[kind] = true;
    $("#boss").classList.remove("on");
    if (kind === "president_morty") toast("Curve broken", "You walked off the Finite Curve. Morty is going to be annoying about it.");
    maybeUnlock();
  }
  while (state.xp >= xpNeed()) {
    state.xp -= xpNeed();
    state.level++;
    state.maxHp += 18;
    state.hp = state.maxHp;
    toast("Level " + state.level, "Rick gets even more illegally powerful.");
  }
  tickQuest();
  scene.remove(e);
  enemies = enemies.filter((x) => x !== e);
  save();
  refreshHud();
}

function xpNeed() {
  return Math.floor(80 * Math.pow(state.level, 1.25));
}

function maybeUnlock() {
  DIMS.forEach((d) => {
    if (state.level >= d.unlock) state.unlocked[d.id] = true;
  });
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
  toast("Quest done", q.name);
  state.quest = Math.min(state.quest + 1, QUESTS.length - 1);
  save();
}

function floatDmg(pos, n) {
  const el = document.createElement("div");
  el.className = "dmg";
  el.textContent = Math.floor(n);
  el.style.left = innerWidth / 2 + "px";
  el.style.top = innerHeight / 2 - 40 + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

function beep(freq, dur) {
  try {
    const ac = beep.ac || (beep.ac = new AudioContext());
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.value = freq;
    o.type = "square";
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + dur);
  } catch {}
}

function interact() {
  for (const n of npcs) {
    if (n.position.distanceTo(rick.position) < 4) {
      toast(n.userData.label || "NPC", n.userData.line);
      if (QUESTS[state.quest]?.kind === "goto") completeQuest();
      return;
    }
  }
  const d = DIMS[state.dim];
  const o = dimOrigin(state.dim);
  if (rick.position.distanceTo(new THREE.Vector3(o.x + 8, 1, o.z + 6)) < 5) {
    openMenu("dims");
  }
}

function travel(i) {
  const d = DIMS[i];
  if (!state.unlocked[d.id] && state.level < d.unlock) {
    toast("Locked", "Level " + d.unlock + " or stop being a baby Morty.");
    return;
  }
  state.unlocked[d.id] = true;
  state.dim = i;
  rick.position.copy(dimOrigin(i)).add(new THREE.Vector3(6, 0, 12));
  scene.background = new THREE.Color(d.fog);
  scene.fog.color = new THREE.Color(d.fog);
  toast(d.name, d.desc);
  save();
  refreshHud();
  closeMenu();
}

function update(dt) {
  const t = clock.elapsedTime;
  const speed = (keys.ShiftLeft || keys.ShiftRight ? 22 : 14) * (state.god ? 1.25 : 1);
  const forward = (keys.KeyW ? 1 : 0) + (keys.KeyS ? -1 : 0);
  const strafe = (keys.KeyD ? 1 : 0) + (keys.KeyA ? -1 : 0);
  const moving = !!(forward || strafe);
  if (moving) {
    rick.position.x += (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * speed * dt;
    rick.position.z += (Math.cos(yaw) * forward - Math.sin(yaw) * strafe) * speed * dt;
  }
  if (keys.Space && grounded) {
    vy = 9.5;
    grounded = false;
  }
  vy -= 22 * dt;
  rick.position.y += vy * dt;
  if (rick.position.y <= 0) {
    rick.position.y = 0;
    vy = 0;
    grounded = true;
  }
  rick.rotation.y = yaw;
  animateWalk(rick, t, moving);

  // camera chase
  const camOff = new THREE.Vector3(-Math.sin(yaw) * 6, 3.4 + pitch * 2, -Math.cos(yaw) * 6);
  const want = rick.position.clone().add(camOff);
  camera.position.lerp(want, 0.18);
  camera.lookAt(rick.position.x, rick.position.y + 1.6, rick.position.z);

  // regen OP
  if (state.hp < state.maxHp) state.hp = Math.min(state.maxHp, state.hp + (state.god ? 14 : 4) * dt);

  // bullets
  for (const b of bullets) {
    b.mesh.position.addScaledVector(b.vel, dt);
    b.life -= dt;
    if (b.enemy) {
      if (b.mesh.position.distanceTo(rick.position.clone().setY(1.3)) < 1.2) {
        damageRick(12);
        b.life = 0;
      }
      continue;
    }
    for (const e of enemies) {
      if (e.userData.hp > 0 && e.position.distanceTo(b.mesh.position) < (e.userData.radius || 1.1) + 0.4) {
        hurt(e, b.dmg);
        if (b.freeze) e.userData.frozen = 2.4;
        b.pierce--;
        if (b.pierce <= 0) b.life = 0;
      }
    }
  }
  bullets = bullets.filter((b) => {
    if (b.life <= 0) {
      scene.remove(b.mesh);
      return false;
    }
    return true;
  });

  // enemy AI
  for (const e of enemies) {
    if (e.userData.hp <= 0) continue;
    e.userData.frozen = Math.max(0, e.userData.frozen - dt);
    animateWalk(e, t, e.userData.frozen <= 0);
    if (e.userData.frozen > 0) continue;
    const to = rick.position.clone().sub(e.position);
    to.y = 0;
    const dist = to.length();
    const dir = dist > 0.01 ? to.normalize() : new THREE.Vector3();
    e.lookAt(rick.position.x, e.position.y, rick.position.z);
    const ai = e.userData.ai;
    if (ai === "cower") {
      e.position.addScaledVector(dir, -e.userData.speed * dt);
    } else if (ai === "rush" || ai === "swarm" || dist > 12) {
      e.position.addScaledVector(dir, e.userData.speed * dt);
    } else if (ai === "shoot" || ai === "boss") {
      if (dist > 8) e.position.addScaledVector(dir, e.userData.speed * 0.6 * dt);
      e.userData.hitCd -= dt;
      if (e.userData.hitCd <= 0 && dist < 28) {
        e.userData.hitCd = e.userData.boss ? 0.7 : 1.15;
        enemyShot(e);
      }
    }
    if (dist < 1.8) {
      e.userData.hitCd -= dt;
      if (e.userData.hitCd <= 0) {
        e.userData.hitCd = 0.6;
        damageRick(e.userData.dmg);
      }
    }
  }

  // player portals
  if (portals[0] && portals[1]) {
    for (const [a, b] of [
      [portals[0], portals[1]],
      [portals[1], portals[0]],
    ]) {
      if (rick.position.distanceTo(a.position) < 1.7) {
        rick.position.copy(b.position).add(new THREE.Vector3(0, 0, 2));
        beep(200, 0.12);
      }
    }
    portals.forEach((p) => p && p.userData.spin && (p.userData.spin.rotation.z += dt * 3));
  }

  for (const p of particles) {
    p.t -= dt;
    p.mesh.scale.multiplyScalar(1 + dt * (p.grow || 4));
    p.mesh.material.opacity = Math.max(0, p.t * 3);
  }
  particles = particles.filter((p) => {
    if (p.t <= 0) {
      scene.remove(p.mesh);
      return false;
    }
    return true;
  });

  if (Math.random() < 0.002 && enemies.length < 14) {
    const d = DIMS[state.dim];
    const o = dimOrigin(state.dim);
    spawnEnemy(d.enemy, o.x + (Math.random() - 0.5) * 60, o.z + (Math.random() - 0.5) * 60);
  }

  $("#hpFill").style.width = (state.hp / state.maxHp) * 100 + "%";
}

function enemyShot(e) {
  const dir = rick.position.clone().add(new THREE.Vector3(0, 1, 0)).sub(e.position.clone().setY(1.4)).normalize();
  const geo = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff4060 }));
  geo.position.copy(e.position).add(new THREE.Vector3(0, 1.3, 0));
  scene.add(geo);
  bullets.push({
    mesh: geo,
    vel: dir.multiplyScalar(22),
    life: 1.4,
    dmg: 0,
    enemy: true,
    pierce: 1,
  });
}

function damageRick(n) {
  const taken = state.god ? n * 0.35 : n;
  state.hp -= taken;
  beep(140, 0.08);
  if (state.hp <= 0) {
    state.hp = state.maxHp;
    rick.position.copy(dimOrigin(state.dim)).add(new THREE.Vector3(6, 0, 12));
    toast("Portal liver", "Rick doesn't die. He just gets bored and respawns.");
  }
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (lock || $("#overlay").classList.contains("hidden")) update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function refreshHud() {
  $("#lvl").textContent = `Lv ${state.level}  OP Rick`;
  $("#dimName").textContent = DIMS[state.dim].name;
  $("#cash").textContent = "$" + state.cash;
  $("#xpFill").style.width = (state.xp / xpNeed()) * 100 + "%";
  const q = QUESTS[state.quest];
  $("#questName").textContent = q ? q.name : "Go be a menace";
  $("#questDesc").textContent = q ? q.desc : "";
  document.querySelectorAll(".slot").forEach((s, i) => s.classList.toggle("on", i === state.weapon));
}

function bind() {
  addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyE") interact();
    if (e.code === "KeyQ") {
      state.weapon = 2;
      shoot(true);
    }
    if (e.code === "KeyF") {
      rick.position.add(new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(10));
      beep(300, 0.1);
    }
    if (e.code === "KeyR") toast("Reload", "Portal fluid doesn't reload. That's the point.");
    if (e.code === "Tab") {
      e.preventDefault();
      openMenu("inv");
    }
    if (e.code === "KeyB") openMenu("dims");
    if (e.code === "KeyM") openMenu("museum");
    if (e.code.startsWith("Digit")) {
      const n = Number(e.code.slice(5)) - 1;
      if (n >= 0 && n < WEAPONS.length) state.weapon = n;
      refreshHud();
    }
    if (e.code === "Escape") closeMenu();
  });
  addEventListener("keyup", (e) => (keys[e.code] = false));
  addEventListener("mousedown", (e) => {
    if (!$("#overlay").classList.contains("hidden")) return;
    if (e.button === 0) shoot(false);
    if (e.button === 2) shoot(true);
  });
  addEventListener("contextmenu", (e) => e.preventDefault());
  addEventListener("mousemove", (e) => {
    if (!lock) return;
    yaw -= e.movementX * 0.0024;
    pitch = Math.max(-0.6, Math.min(0.8, pitch + e.movementY * 0.002));
  });
  $("#view").addEventListener("click", () => {
    if ($("#overlay").classList.contains("hidden")) {
      $("#view").requestPointerLock();
    }
  });
  document.addEventListener("pointerlockchange", () => {
    lock = document.pointerLockElement === $("#view") || document.pointerLockElement === document.body;
  });

  $("#play").onclick = start;
  $("#museumBtn").onclick = () => {
    $("#overlay").classList.add("hidden");
    openMenu("museum");
  };
  $("#closeMenu").onclick = closeMenu;
  document.querySelectorAll(".tabs button").forEach((b) =>
    b.addEventListener("click", () => openMenu(b.dataset.tab))
  );

  // mobile
  $("#atk").onclick = () => shoot(false);
  $("#alt").onclick = () => shoot(true);
  $("#int").onclick = interact;
  $("#mmenu").onclick = () => openMenu("dims");
  bindStick();
}

function bindStick() {
  const stick = $("#stick");
  const knob = $("#knob");
  let dragging = false;
  const go = (ev) => {
    const t = ev.touches ? ev.touches[0] : ev;
    const r = stick.getBoundingClientRect();
    const x = t.clientX - r.left - 60;
    const y = t.clientY - r.top - 60;
    const l = Math.min(40, Math.hypot(x, y));
    const a = Math.atan2(y, x);
    knob.style.left = 35 + Math.cos(a) * (l / 1.2) + "px";
    knob.style.top = 35 + Math.sin(a) * (l / 1.2) + "px";
    keys.KeyW = y < -10;
    keys.KeyS = y > 10;
    keys.KeyA = x < -10;
    keys.KeyD = x > 10;
  };
  const end = () => {
    dragging = false;
    keys.KeyW = keys.KeyS = keys.KeyA = keys.KeyD = false;
    knob.style.left = "35px";
    knob.style.top = "35px";
  };
  stick.addEventListener("pointerdown", (e) => {
    dragging = true;
    go(e);
  });
  addEventListener("pointermove", (e) => dragging && go(e));
  addEventListener("pointerup", end);
}

function start() {
  $("#overlay").classList.add("hidden");
  $("#view").requestPointerLock();
  toast("Rick Sanchez", "You're overpowered. That's the joke AND the build.");
  beep(220, 0.2);
}

function openMenu(tab) {
  $("#menu").classList.add("on");
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  const pane = $("#pane");
  if (tab === "dims") {
    pane.innerHTML = DIMS.map(
      (d, i) => `<div class="item"><div><b>${d.name}</b><div class="help">${d.desc}<br>Boss: ${BOSSES[d.boss].name}</div></div>
      <button class="btn ${state.dim === i ? "cyan" : ""}" data-i="${i}">${state.unlocked[d.id] || state.level >= d.unlock ? "TRAVEL" : "LOCK"}</button></div>`
    ).join("");
    pane.querySelectorAll("button[data-i]").forEach((b) =>
      b.addEventListener("click", () => travel(Number(b.dataset.i)))
    );
  } else if (tab === "inv") {
    pane.innerHTML = WEAPONS.map(
      (w, i) => `<div class="item"><div><b>${w.name}</b><div class="help">DMG ${w.dmg} · ${w.alt}</div></div>
      <button class="btn" data-w="${i}">EQUIP</button></div>`
    ).join("");
    pane.querySelectorAll("button[data-w]").forEach((b) =>
      b.addEventListener("click", () => {
        state.weapon = Number(b.dataset.w);
        refreshHud();
        toast("Equipped", WEAPONS[state.weapon].name);
      })
    );
  } else if (tab === "quests") {
    pane.innerHTML = QUESTS.map(
      (q, i) => `<div class="item"><div><b>${i === state.quest ? "▶ " : ""}${q.name}</b><div class="help">${q.desc}</div></div><div>${q.xp} XP</div></div>`
    ).join("");
  } else if (tab === "museum") {
    renderMuseum(pane);
  } else if (tab === "bestiary") {
    pane.innerHTML = Object.entries({ ...FOES, ...BOSSES })
      .map(
        ([id, f]) =>
          `<div class="item"><div><b>${f.name}</b><div class="help">${f.line || ""}</div></div><div>HP ${f.hp}</div></div>`
      )
      .join("");
  } else {
    pane.innerHTML = `<p class="help">WASD move · mouse look · click shoot · right-click portal/alt · Q freeze · E talk/portal · F dash · B dimensions · M Sketchfab museum · 1-5 weapons.<br><br>Rick regenerates, punches holes in reality, and does not stay dead. Bosses still hit back.</p>
    <button class="btn" id="summon">SUMMON BOSS</button>
    <button class="btn ghost" id="reset">Reset save</button>`;
    $("#summon").onclick = () => {
      spawnBoss();
      closeMenu();
    };
    $("#reset").onclick = () => {
      localStorage.removeItem("rickrift");
      location.reload();
    };
  }
  document.exitPointerLock();
}

let museumIndex = 0;
function renderMuseum(pane) {
  const m = MUSEUM[museumIndex];
  pane.innerHTML = `
    <h3 style="color:var(--lime)">${m.name}</h3>
    <p class="help">Fan model by <b>${m.artist}</b> · ${m.license} · official Sketchfab embed (not ripped).</p>
    <div class="sf-nav">
      <button class="btn ghost" id="sfPrev">Prev</button>
      <button class="btn cyan" id="sfNext">Next</button>
      <a class="btn ghost" href="https://sketchfab.com/3d-models/${m.uid}" target="_blank" rel="noopener">Open on Sketchfab</a>
    </div>
    <iframe class="sf-frame" title="${m.name}" src="https://sketchfab.com/models/${m.uid}/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_watermark=0" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe>
    <p class="help" style="margin-top:8px">${museumIndex + 1} / ${MUSEUM.length} · Combat uses original in-engine cartoon rigs so the game stays playable. Sketchfab is the lookbook.</p>`;
  $("#sfPrev").onclick = () => {
    museumIndex = (museumIndex + MUSEUM.length - 1) % MUSEUM.length;
    renderMuseum(pane);
  };
  $("#sfNext").onclick = () => {
    museumIndex = (museumIndex + 1) % MUSEUM.length;
    renderMuseum(pane);
  };
}

function closeMenu() {
  $("#menu").classList.remove("on");
}

export function boot() {
  load();
  maybeUnlock();
  initThree();
  bind();
  refreshHud();
  document.querySelectorAll(".slot").forEach((s, i) => {
    if (WEAPONS[i]) s.textContent = `${i + 1}\n${WEAPONS[i].name.split(" ")[0]}`;
  });
  loop();
}
