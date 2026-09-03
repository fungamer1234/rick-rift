import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";
import { spawnSkin, updateBillboard, loadTex } from "./chars.js";
import { DIMS } from "./data.js";

const $ = (s) => document.querySelector(s);
const MAP = 220;

const state = {
  hp: 420,
  maxHp: 420,
  cash: 50,
  kills: 0,
  wanted: 0,
  inCar: null,
};

let scene, camera, renderer, clock, raycaster;
let player, yaw = 0, pitch = 0.22;
let keys = {};
let lock = false;
let vy = 0, grounded = true;
let peds = [];
let cars = [];
let bullets = [];
let portalMesh = null;
let portalTex;
let selectedDim = 0;

function toast(title, body) {
  const d = document.createElement("div");
  d.className = "toast";
  d.innerHTML = `<b>${title}</b><div>${body || ""}</div>`;
  $("#toasts").prepend(d);
  setTimeout(() => d.remove(), 3200);
}

function beep(f, d) {
  try {
    const ac = beep.ac || (beep.ac = new AudioContext());
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "square";
    o.frequency.value = f;
    g.gain.value = 0.03;
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + d);
  } catch {}
}

function mat(c, extra = {}) {
  return new THREE.MeshStandardMaterial({ color: c, roughness: 0.62, metalness: 0.04, ...extra });
}
function box(w, h, d, c, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function buildCity(root) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(MAP * 2, MAP * 2), mat(0x3f8f46));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // road grid
  const asphalt = mat(0x3a3a40);
  for (let i = -4; i <= 4; i++) {
    const roadZ = new THREE.Mesh(new THREE.BoxGeometry(MAP * 2, 0.08, 14), asphalt);
    roadZ.position.set(0, 0.04, i * 44);
    roadZ.receiveShadow = true;
    root.add(roadZ);
    const roadX = new THREE.Mesh(new THREE.BoxGeometry(14, 0.08, MAP * 2), asphalt);
    roadX.position.set(i * 44, 0.04, 0);
    roadX.receiveShadow = true;
    root.add(roadX);
    const line = new THREE.Mesh(new THREE.BoxGeometry(MAP * 2, 0.09, 0.25), mat(0xf0d24a));
    line.position.set(0, 0.09, i * 44);
    root.add(line);
  }

  const houseCols = [0xe8d8b8, 0xd9c4a0, 0xc9d6c0, 0xe2c2c2, 0xc8d0e0];
  const roofCols = [0x8a3030, 0x4a4a55, 0x6a3a1a, 0x355a3a];
  for (let gx = -4; gx <= 3; gx++) {
    for (let gz = -4; gz <= 3; gz++) {
      if (gx === 0 && gz === 0) continue;
      const cx = gx * 44 + 16;
      const cz = gz * 44 + 16;
      const w = 10 + (Math.abs(gx * 3 + gz) % 5);
      const d = 8 + (Math.abs(gz * 2 + gx) % 4);
      const h = 6 + (Math.abs(gx + gz) % 6);
      box(w, h, d, houseCols[Math.abs(gx + gz * 3) % houseCols.length], cx, h / 2, cz, root);
      box(w + 1.2, 0.7, d + 1.2, roofCols[Math.abs(gx * 2 + gz) % roofCols.length], cx, h + 0.3, cz, root);
      // tree
      box(0.5, 3.2, 0.5, 0x6a4422, cx + w * 0.7, 1.6, cz + d * 0.6, root);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(2.1, 10, 8), mat(0x2e8a38));
      leaves.position.set(cx + w * 0.7, 4.1, cz + d * 0.6);
      leaves.castShadow = true;
      root.add(leaves);
    }
  }

  // Rick's garage / house
  box(16, 8, 14, 0xc8b89a, 0, 4, -18, root);
  box(18, 1, 16, 0x7a2a2a, 0, 8.5, -18, root);
  box(10, 6, 10, 0x8a9096, 10, 3, -10, root); // garage
  box(8, 5.2, 0.3, 0x555960, 10, 2.7, -5.1, root);
  const neon = new THREE.PointLight(0x88ff44, 2, 16);
  neon.position.set(10, 4, -8);
  root.add(neon);
  box(80, 0.2, 18, 0x333338, 0, 0.12, 0, root);

  // street lamps
  for (let i = -3; i <= 3; i++) {
    box(0.25, 6, 0.25, 0x333, i * 44, 3, 8, root);
    const l = new THREE.PointLight(0xffe6b0, 0.7, 22);
    l.position.set(i * 44, 6.2, 8);
    root.add(l);
  }
}

function makeCar(x, z, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 4.6), mat(color));
  body.position.y = 0.7;
  body.castShadow = true;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.6, 2.2), mat(0x99c8e8, { transparent: true, opacity: 0.55 }));
  cabin.position.set(0, 1.25, -0.3);
  g.add(cabin);
  [[-0.9, 0.35, 1.4], [0.9, 0.35, 1.4], [-0.9, 0.35, -1.4], [0.9, 0.35, -1.4]].forEach(([wx, wy, wz]) => {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.28, 10), mat(0x111));
    wh.rotation.z = Math.PI / 2;
    wh.position.set(wx, wy, wz);
    g.add(wh);
  });
  g.position.set(x, 0, z);
  g.userData = { car: true, speed: 0, color };
  scene.add(g);
  cars.push(g);
  return g;
}

function spawnPeds() {
  const kinds = ["civ_man", "civ_woman", "morty", "summer", "meeseeks", "cop"];
  const weights = [8, 8, 2, 2, 3, 3];
  function pick() {
    let t = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * t;
    for (let i = 0; i < kinds.length; i++) {
      r -= weights[i];
      if (r <= 0) return kinds[i];
    }
    return "civ_man";
  }
  for (let i = 0; i < 55; i++) {
    const k = pick();
    const p = spawnSkin(k);
    p.position.set((Math.random() - 0.5) * 180, 0, (Math.random() - 0.5) * 180);
    p.userData.yaw = Math.random() * Math.PI * 2;
    p.userData.wait = Math.random() * 3;
    scene.add(p);
    peds.push(p);
  }
}

function initThree() {
  portalTex = loadTex("assets/tex_portal.jpg");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87b8e8);
  scene.fog = new THREE.Fog(0x87b8e8, 40, 140);
  camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.1, 260);
  renderer = new THREE.WebGLRenderer({ canvas: $("#view"), antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();

  scene.add(new THREE.HemisphereLight(0xd8ecff, 0x3a5a30, 1.05));
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.15);
  sun.position.set(40, 60, 20);
  sun.castShadow = true;
  scene.add(sun);

  buildCity(scene);
  player = spawnSkin("rick");
  player.position.set(4, 0, 6);
  player.userData.yaw = 0;
  scene.add(player);

  const carColors = [0xc0392b, 0x2980b9, 0xf1c40f, 0x2ecc71, 0x8e44ad, 0xecf0f1, 0x1a1a1a];
  for (let i = 0; i < 16; i++) {
    makeCar((Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160, carColors[i % carColors.length]);
  }
  spawnPeds();

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

function shoot() {
  const dir = new THREE.Vector3(Math.sin(yaw), -pitch * 0.15, Math.cos(yaw)).normalize();
  const origin = player.position.clone().add(new THREE.Vector3(0, 1.4, 0));
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0x88ff33 })
  );
  ball.position.copy(origin);
  ball.userData = { vel: dir.clone().multiplyScalar(52), life: 1.1, dmg: 80 };
  scene.add(ball);
  bullets.push(ball);
  beep(760, 0.05);
}

function firePortal() {
  const dir = new THREE.Vector3(Math.sin(yaw), -pitch * 0.2, Math.cos(yaw)).normalize();
  const origin = player.position.clone().add(new THREE.Vector3(0, 1.5, 0));
  const pos = origin.add(dir.multiplyScalar(8));
  pos.y = 1.7;
  if (portalMesh) scene.remove(portalMesh);
  const g = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 36),
    new THREE.MeshBasicMaterial({ map: portalTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  g.add(disc);
  g.add(new THREE.PointLight(0x88ff33, 3, 14));
  g.position.copy(pos);
  g.userData.disc = disc;
  g.userData.dest = selectedDim;
  scene.add(g);
  portalMesh = g;
  toast("Portal", DIMS[selectedDim].name);
  beep(540, 0.08);
}

function killPed(p, fromPlayer) {
  if (p.userData.dead) return;
  p.userData.dead = true;
  p.userData.hp = 0;
  p.rotation.z = Math.PI / 2;
  p.position.y = 0.15;
  if (fromPlayer) {
    state.kills++;
    state.cash += 8 + Math.floor(Math.random() * 20);
    if (p.userData.cop) state.wanted = Math.min(5, state.wanted + 2);
    else state.wanted = Math.min(5, state.wanted + 1);
    toast(p.userData.cop ? "Cop down" : "Wubba", p.userData.label + " folded");
    refreshHud();
    if (state.wanted >= 2) spawnCops();
  }
  setTimeout(() => {
    if (p.parent) p.removeFromParent();
    peds = peds.filter((x) => x !== p);
  }, 4000);
}

function spawnCops() {
  const n = 2 + state.wanted;
  for (let i = 0; i < n; i++) {
    const c = spawnSkin("cop");
    const a = Math.random() * Math.PI * 2;
    c.position.set(player.position.x + Math.cos(a) * 28, 0, player.position.z + Math.sin(a) * 28);
    c.userData.chase = true;
    scene.add(c);
    peds.push(c);
  }
}

function nearestCar() {
  let best = null, bd = 3.4;
  for (const c of cars) {
    const d = c.position.distanceTo(player.position);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}

function enterCar() {
  if (state.inCar) {
    player.position.copy(state.inCar.position).add(new THREE.Vector3(2, 0, 0));
    player.visible = true;
    state.inCar = null;
    toast("Out", "Portal gun still works on foot.");
    return;
  }
  const c = nearestCar();
  if (!c) {
    toast("No car", "Get closer.");
    return;
  }
  state.inCar = c;
  player.visible = false;
  toast("Carjack", "WASD drive · Space brake · E exit");
  beep(200, 0.1);
}

function update(dt) {
  const t = clock.elapsedTime;
  const speed = state.inCar ? 0 : keys.ShiftLeft || keys.ShiftRight ? 16 : 10.5;
  const f = (keys.KeyW ? 1 : 0) + (keys.KeyS ? -1 : 0);
  const s = (keys.KeyD ? 1 : 0) + (keys.KeyA ? -1 : 0);
  const moving = !!(f || s);

  if (!state.inCar) {
    if (moving) {
      player.position.x += (Math.sin(yaw) * f + Math.cos(yaw) * s) * speed * dt;
      player.position.z += (Math.cos(yaw) * f - Math.sin(yaw) * s) * speed * dt;
      player.userData.yaw = yaw;
      player.userData.walking = true;
      player.userData.walkT += dt;
    } else player.userData.walking = false;
    if (keys.Space && grounded) {
      vy = 8.5;
      grounded = false;
    }
    vy -= 24 * dt;
    player.position.y += vy * dt;
    if (player.position.y <= 0) {
      player.position.y = 0;
      vy = 0;
      grounded = true;
    }
  } else {
    const car = state.inCar;
    const acc = (keys.KeyW ? 1 : 0) + (keys.KeyS ? -0.6 : 0);
    car.userData.speed += acc * 18 * dt;
    car.userData.speed *= keys.Space ? 0.9 : 0.985;
    car.userData.speed = Math.max(-12, Math.min(28, car.userData.speed));
    const turn = ((keys.KeyA ? 1 : 0) + (keys.KeyD ? -1 : 0)) * dt * 1.8 * Math.sign(car.userData.speed || 1);
    car.rotation.y += turn;
    car.position.x += Math.sin(car.rotation.y) * car.userData.speed * dt;
    car.position.z += Math.cos(car.rotation.y) * car.userData.speed * dt;
    player.position.copy(car.position);
    yaw = car.rotation.y;
    // run over peds
    for (const p of peds) {
      if (!p.userData.dead && p.position.distanceTo(car.position) < 1.8 && Math.abs(car.userData.speed) > 6) {
        killPed(p, true);
      }
    }
  }

  const back = new THREE.Vector3(-Math.sin(yaw) * 7.5, 3.4 + pitch * 2.2, -Math.cos(yaw) * 7.5);
  camera.position.lerp(player.position.clone().add(back), 0.22);
  camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z);
  updateBillboard(player, camera);

  if (state.hp < state.maxHp) state.hp = Math.min(state.maxHp, state.hp + 10 * dt);
  $("#hpFill").style.width = (state.hp / state.maxHp) * 100 + "%";

  // bullets
  for (const b of bullets) {
    b.position.addScaledVector(b.userData.vel, dt);
    b.userData.life -= dt;
    for (const p of peds) {
      if (!p.userData.dead && p.position.distanceTo(b.position) < 0.9) {
        p.userData.hp -= b.userData.dmg;
        b.userData.life = 0;
        if (p.userData.hp <= 0) killPed(p, true);
        else p.userData.flee = 4;
      }
    }
  }
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].userData.life <= 0) {
      scene.remove(bullets[i]);
      bullets.splice(i, 1);
    }
  }

  // peds
  for (const p of peds) {
    if (p.userData.dead) continue;
    p.userData.walkT += dt;
    const toP = player.position.clone().sub(p.position);
    toP.y = 0;
    const dist = toP.length();
    if (p.userData.cop && state.wanted > 0) {
      const dir = toP.normalize();
      p.position.addScaledVector(dir, p.userData.speed * (1 + state.wanted * 0.12) * dt);
      p.userData.yaw = Math.atan2(dir.x, dir.z);
      p.userData.walking = true;
      p.userData.hitCd -= dt;
      if (dist < 1.6 && p.userData.hitCd <= 0) {
        p.userData.hitCd = 0.7;
        state.hp -= 9;
        beep(140, 0.06);
        if (state.hp <= 0) {
          state.hp = state.maxHp;
          state.wanted = Math.max(0, state.wanted - 1);
          player.position.set(4, 0, 6);
          toast("Wasted? Nah", "Rick respawns. Cops are still mad.");
        }
      }
    } else if (p.userData.flee > 0) {
      p.userData.flee -= dt;
      const dir = toP.length() > 0.1 ? toP.normalize().multiplyScalar(-1) : new THREE.Vector3(1, 0, 0);
      p.position.addScaledVector(dir, 8 * dt);
      p.userData.walking = true;
    } else {
      p.userData.wait -= dt;
      if (p.userData.wait <= 0) {
        p.userData.yaw += (Math.random() - 0.5) * 1.4;
        p.userData.wait = 1 + Math.random() * 3;
      }
      p.position.x += Math.sin(p.userData.yaw) * p.userData.speed * dt;
      p.position.z += Math.cos(p.userData.yaw) * p.userData.speed * dt;
      p.userData.walking = true;
      if (Math.abs(p.position.x) > MAP) p.userData.yaw += Math.PI;
      if (Math.abs(p.position.z) > MAP) p.userData.yaw += Math.PI;
    }
    updateBillboard(p, camera);
  }

  if (portalMesh) {
    portalMesh.userData.disc.rotation.z += dt * 2;
    if (player.position.distanceTo(portalMesh.position) < 1.8) {
      const d = DIMS[portalMesh.userData.dest] || DIMS[0];
      player.position.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
      scene.remove(portalMesh);
      portalMesh = null;
      toast(d.name, "Dumped you somewhere on the map. Still Earth. Still GTA.");
      $("#flash").classList.add("on");
      setTimeout(() => $("#flash").classList.remove("on"), 180);
    }
  }

  if (state.wanted > 0 && Math.random() < 0.0008 * state.wanted) spawnCops();
  if (peds.length < 40 && Math.random() < 0.02) {
    const k = Math.random() < 0.12 ? "cop" : Math.random() < 0.5 ? "civ_man" : "civ_woman";
    const p = spawnSkin(k);
    p.position.set((Math.random() - 0.5) * 160, 0, (Math.random() - 0.5) * 160);
    scene.add(p);
    peds.push(p);
  }
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if ($("#overlay").classList.contains("hidden")) update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function refreshHud() {
  $("#lvl").textContent = "Rick Sanchez";
  $("#dimName").textContent = "Suburb C-137";
  $("#cash").textContent = "$" + state.cash;
  $("#kills").textContent = state.kills + " wasted";
  const stars = "★".repeat(state.wanted) + "☆".repeat(5 - state.wanted);
  $("#wanted").textContent = stars;
}

function paintDims() {
  const box = $("#dimList");
  if (!box) return;
  box.innerHTML = DIMS.map(
    (d, i) =>
      `<button class="dim-btn ${selectedDim === i ? "on" : ""}" data-i="${i}"><span class="dot"></span><span>${d.name}</span></button>`
  ).join("");
  box.querySelectorAll(".dim-btn").forEach((b) =>
    b.addEventListener("click", () => {
      selectedDim = Number(b.dataset.i);
      paintDims();
      toast("Locked in", DIMS[selectedDim].name + " — click to shoot the portal");
    })
  );
}

function bind() {
  addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyE") enterCar();
    if (e.code === "KeyQ") firePortal();
    if (e.code === "KeyF") {
      player.position.add(new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(8));
    }
  });
  addEventListener("keyup", (e) => (keys[e.code] = false));
  addEventListener("mousedown", (e) => {
    if (!$("#overlay").classList.contains("hidden")) return;
    if (e.button === 0) shoot();
    if (e.button === 2) firePortal();
  });
  addEventListener("contextmenu", (e) => e.preventDefault());
  addEventListener("mousemove", (e) => {
    if (!lock) return;
    yaw -= e.movementX * 0.0023;
    pitch = Math.max(-0.3, Math.min(0.7, pitch + e.movementY * 0.002));
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
    toast("C-137", "You're Rick. Street's full of idiots. Left click = kill. E = steal a car.");
  };
  $("#atk").onclick = shoot;
  $("#alt").onclick = firePortal;
  $("#int").onclick = enterCar;
  setInterval(refreshHud, 400);
}

export function boot() {
  initThree();
  bind();
  paintDims();
  refreshHud();
  loop();
}
