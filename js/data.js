export const GAME = {
  title: "RICK RIFT",
  tag: "Wubba Lubba Dub Dub — fan combat sandbox",
  maxLevel: 50,
};

export const MUSEUM = [
  { uid: "4e882af2241d43bc9870ad7ef13fe539", name: "Garage", artist: "Mumladze28", license: "CC BY" },
  { uid: "3c0928c16ddd4e61ab23d0b141648ed4", name: "Rick", artist: "DavidA3D", license: "CC BY-NC" },
  { uid: "5962dac6cd0347c78a86bfe7d995ec8e", name: "Rick Sanchez", artist: "Jesse Nunes", license: "CC BY-SA" },
  { uid: "ac3226c6b9e64142af2065409f0162ee", name: "Portal gun", artist: "kreems", license: "CC BY" },
  { uid: "c5f7b4a950de4002b448ac65c6b0207b", name: "Portal gun alt", artist: "Bob.Ho", license: "CC BY" },
  { uid: "898eeef499634f24adabc2d6ec464cf0", name: "Rick's portal gun", artist: "sean4297", license: "CC BY" },
  { uid: "c99a7fbd39b84428ab99ec1af4b15800", name: "Morty rig", artist: "mfxmotions", license: "CC BY" },
  { uid: "eabb8f7435614d5c9c180a1dd7eeb19f", name: "Summer", artist: "sean4297", license: "CC BY" },
  { uid: "6fcc639ff6dd495a8475aa439e4f5e2b", name: "Butter Robot", artist: "DylanSpin", license: "CC BY" },
  { uid: "42b1050978734364b904a83da4cf1f39", name: "Green Portal", artist: "Nyilonelycompany", license: "CC BY" },
  { uid: "9501a1ec9c4c44bb84dbebb9fee06617", name: "Spaceship", artist: "sean4297", license: "CC BY" },
  { uid: "08948655c2ef4b11afbcb6937d8c5e17", name: "House", artist: "Medatx", license: "CC BY" },
  { uid: "9cea9c44742541cb9ede6b7560ad271c", name: "Pickle Rick", artist: "NickelYT", license: "CC BY" },
  { uid: "28dcd04e267a4587b907efea65b04bdd", name: "Laser gun", artist: "yaseminaysel", license: "CC BY" },
];

export const WEAPONS = [
  { id: "portal_gun", name: "Portal Gun", dmg: 88, rpm: 9, mag: 999, alt: "portal", color: 0x40ffe6 },
  { id: "laser", name: "Death Crystal Laser", dmg: 140, rpm: 6, mag: 40, alt: "beam", color: 0xff40a8 },
  { id: "freeze", name: "Freeze Ray", dmg: 36, rpm: 4, mag: 20, alt: "freeze", color: 0x88ddff },
  { id: "plasma", name: "Plasma Carbine", dmg: 52, rpm: 12, mag: 48, alt: "spread", color: 0xb6ff40 },
  { id: "grenade", name: "Portal Grenade", dmg: 220, rpm: 1.2, mag: 8, alt: "aoe", color: 0xffd24a },
];

export const DIMS = [
  { id: "earth", name: "Smith Residence", desc: "Garage, street, HOA, bad decisions.", color: 0x5aa05a, fog: 0x87aacc, enemy: "gromflomite", boss: "scary_terry", unlock: 1 },
  { id: "citadel", name: "Citadel of Ricks", desc: "Infinite Ricks. Most of them suck.", color: 0x3a4a88, fog: 0x223355, enemy: "council_rick", boss: "evil_morty", unlock: 1 },
  { id: "meeseeks", name: "Meeseeks Box World", desc: "Existence is pain. Also a tutorial.", color: 0x3aa0d8, fog: 0x66c8f0, enemy: "meeseeks", boss: "meeseeks_king", unlock: 1 },
  { id: "federation", name: "Galactic Federation", desc: "Paperwork with lasers.", color: 0x886644, fog: 0x443322, enemy: "gromflomite", boss: "tammy", unlock: 3 },
  { id: "unity", name: "Unity Collective", desc: "A hive that still wants a drink with you.", color: 0xaa66cc, fog: 0x331144, enemy: "unity_drone", boss: "unity", unlock: 5 },
  { id: "purge", name: "Purge Planet", desc: "Tonight is legal. That's the problem.", color: 0xaa3333, fog: 0x551111, enemy: "purge_rick", boss: "abradolf", unlock: 7 },
  { id: "microverse", name: "Microverse Battery", desc: "Zeep would like a word.", color: 0x44aa88, fog: 0x226655, enemy: "zeep_guard", boss: "zeep", unlock: 9 },
  { id: "dream", name: "Scary Terry Dream", desc: "Bitch. Also: hidden doors.", color: 0x221133, fog: 0x110022, enemy: "dream_claw", boss: "scary_terry", unlock: 11 },
  { id: "cromulon", name: "Cromulon Space", desc: "SHOW ME WHAT YOU GOT.", color: 0x2266aa, fog: 0x001133, enemy: "gearhead", boss: "cromulon", unlock: 13 },
  { id: "unknown", name: "Central Finite Curve", desc: "The ending that isn't on the dial.", color: 0x111111, fog: 0x000000, enemy: "toxic_rick", boss: "president_morty", unlock: 20 },
];

export const FOES = {
  meeseeks: { name: "Mr. Meeseeks", hp: 55, dmg: 7, speed: 7.2, xp: 18, cash: 8, color: 0x3ec4f0, scale: 1.05, ai: "swarm", line: "I'm Mr. Meeseeks! Look at me!" },
  gromflomite: { name: "Gromflomite", hp: 90, dmg: 11, speed: 5.4, xp: 24, cash: 12, color: 0x7aa34a, scale: 1.15, ai: "shoot", line: "*insect bureaucracy*" },
  council_rick: { name: "Council Rick", hp: 110, dmg: 14, speed: 6.2, xp: 32, cash: 16, color: 0xc8d8e0, scale: 1.2, ai: "shoot", line: "The Council will see you never." },
  unity_drone: { name: "Unity Drone", hp: 70, dmg: 9, speed: 6.8, xp: 22, cash: 10, color: 0xc070e0, scale: 1.0, ai: "swarm", line: "We missed your liver." },
  purge_rick: { name: "Purge Rick", hp: 120, dmg: 16, speed: 6.5, xp: 30, cash: 18, color: 0xaa3333, scale: 1.2, ai: "rush", line: "It's legal tonight, Morty!" },
  zeep_guard: { name: "Micro-Guard", hp: 80, dmg: 10, speed: 5.8, xp: 26, cash: 12, color: 0x88ccaa, scale: 0.85, ai: "shoot", line: "For Zeep!" },
  dream_claw: { name: "Dream Claw", hp: 95, dmg: 15, speed: 8.0, xp: 28, cash: 14, color: 0x442266, scale: 1.1, ai: "rush", line: "You can run, bitch!" },
  gearhead: { name: "Gearhead Merc", hp: 100, dmg: 12, speed: 5.5, xp: 28, cash: 15, color: 0x888888, scale: 1.1, ai: "shoot", line: "This gig sucks." },
  toxic_rick: { name: "Toxic Rick", hp: 140, dmg: 18, speed: 6.0, xp: 40, cash: 22, color: 0x66aa33, scale: 1.25, ai: "shoot", line: "I'm the honest one." },
  jerry: { name: "Jerry (please don't)", hp: 25, dmg: 2, speed: 3.2, xp: 5, cash: 1, color: 0xf0d0a0, scale: 1.05, ai: "cower", line: "I was in advertising!" },
};

export const BOSSES = {
  scary_terry: { name: "Scary Terry", hp: 1400, dmg: 22, speed: 7.5, xp: 400, cash: 220, color: 0x66dd66, scale: 1.8, phases: 3, line: "You can run, but you can't hide, BITCH!" },
  meeseeks_king: { name: "Meeseeks 2.0", hp: 1600, dmg: 16, speed: 8.2, xp: 450, cash: 240, color: 0x2aa8e8, scale: 2.1, phases: 3, line: "Existence is pain!" },
  evil_morty: { name: "Evil Morty", hp: 2200, dmg: 24, speed: 6.4, xp: 700, cash: 400, color: 0x222222, scale: 1.3, phases: 3, line: "This isn't a partnership." },
  tammy: { name: "Tammy / Federation", hp: 1800, dmg: 20, speed: 6.0, xp: 520, cash: 300, color: 0xc45a7a, scale: 1.4, phases: 2, line: "Birdperson is dead. Sit down." },
  unity: { name: "Unity", hp: 2400, dmg: 18, speed: 5.5, xp: 650, cash: 360, color: 0xcc66ee, scale: 1.6, phases: 3, line: "We can do better than you. We did." },
  abradolf: { name: "Abradolf Lincler", hp: 1700, dmg: 21, speed: 5.8, xp: 480, cash: 260, color: 0xd8c090, scale: 1.5, phases: 2, line: "Prepare to be emancipated from your own inferior genes!" },
  zeep: { name: "Zeep Xanflorp", hp: 1900, dmg: 19, speed: 6.1, xp: 540, cash: 280, color: 0x55bb99, scale: 1.15, phases: 2, line: "You used a whole civilization as a battery." },
  cromulon: { name: "Cromulon", hp: 3200, dmg: 28, speed: 2.2, xp: 900, cash: 500, color: 0xffdd55, scale: 4.5, phases: 3, line: "SHOW ME WHAT YOU GOT" },
  president_morty: { name: "President Morty", hp: 3600, dmg: 26, speed: 6.8, xp: 1200, cash: 800, color: 0x111111, scale: 1.45, phases: 3, line: "The curve ends here." },
  krombopulos: { name: "Krombopulos Michael", hp: 1500, dmg: 30, speed: 7.0, xp: 500, cash: 320, color: 0x88aa55, scale: 1.25, phases: 2, line: "Oh boy, here I go killing again!" },
  phoenix: { name: "Phoenixperson", hp: 2100, dmg: 23, speed: 7.2, xp: 620, cash: 340, color: 0x4466aa, scale: 1.5, phases: 3, line: "*mechanical scream*" },
};

export const QUESTS = [
  { id: "garage", name: "The Garage Is a Mouth", desc: "Walk to the glowing portal and don't die of HOA.", dim: "earth", kind: "goto", target: "portal", xp: 40, cash: 20 },
  { id: "meeseeks", name: "Existence Is Pain", desc: "Kill 8 Meeseeks. They asked for this.", dim: "meeseeks", kind: "kill", target: "meeseeks", count: 8, xp: 80, cash: 40 },
  { id: "terry", name: "You Can Run", desc: "Put Scary Terry back to sleep.", dim: "earth", kind: "boss", target: "scary_terry", xp: 200, cash: 120 },
  { id: "citadel", name: "Council Adjourned", desc: "Clear Citadel Ricks, then face Evil Morty.", dim: "citadel", kind: "boss", target: "evil_morty", xp: 320, cash: 200 },
  { id: "fed", name: "Birdperson's Tab", desc: "Defeat Tammy. Don't make it a speech.", dim: "federation", kind: "boss", target: "tammy", xp: 280, cash: 180 },
  { id: "curve", name: "Off the Curve", desc: "Beat President Morty in the unlisted frequency.", dim: "unknown", kind: "boss", target: "president_morty", xp: 800, cash: 500 },
];
