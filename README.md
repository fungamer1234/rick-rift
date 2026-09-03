# RICK RIFT

Fan-made **Rick and Morty** browser combat game. You are Rick. You are unfair. That is the build.

**Live:** after GitHub Pages is on, this folder is the site root.

## Play

Open `index.html` via a local server (modules need HTTP):

```bash
python3 -m http.server 8765
# then http://127.0.0.1:8765
```

Or use the GitHub Pages URL for this repo.

### Controls

| | |
| --- | --- |
| WASD | Move |
| Mouse | Look (click canvas) |
| Click | Shoot (OP) |
| Right click | Place portal / alt fire |
| Q | Freeze ray |
| F | Portal dash |
| E | Talk / garage portal |
| B | Dimension list |
| M | Sketchfab museum |
| 1–5 | Weapons |
| Tab | Menu |

Mobile: on-screen stick + PEW / PORTAL.

## Sketchfab

Downloads from Sketchfab need a logged-in API token, so the game does **not** rip `.glb` files.

Instead:

1. **Combat characters** are original Three.js cartoon rigs (Rick, Morty, Meeseeks, Scary Terry, Gromflomites, Council Ricks, Evil Morty, Tammy, Unity, Abradolf, Zeep, Cromulon, etc.).
2. **Museum tab** embeds official Sketchfab viewers for CC fan models from [sketchfab.com/tags/rick-and-morty](https://sketchfab.com/tags/rick-and-morty).

Credited embeds include garage (Mumladze28), Rick (DavidA3D, Jesse Nunes), portal guns (kreems, Bob.Ho, sean4297), Morty rig (mfxmotions), Summer (sean4297), Butter Robot (DylanSpin), house, ship, pickle Rick, and more. Licenses are CC BY / BY-NC / BY-SA as listed in-game.

## Content

- 10 dimensions (Residence → Citadel → Meeseeks → Federation → Unity → Purge → Microverse → Dream → Cromulon → Finite Curve)
- Rick: 420 HP, fast regen, portal gun, pierce shots, dash, no-permadeath
- Bosses still take a beating on purpose — Rick is the joke *and* the tank
- Quests, XP, localStorage save
- Help → **Summon Boss** if you want a problem

## Legal

Fan project. Not affiliated with Adult Swim, Justin Roiland, or Dan Harmon. Don't use this commercially. Don't re-upload Sketchfab meshes.

## Stack

Three.js r160 (CDN), vanilla ES modules, GitHub Pages.
