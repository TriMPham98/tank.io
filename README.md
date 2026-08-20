# tank.io

A Diep.io-inspired tank arena in the browser. Farm polygons, spend skill points, pick a class, fight bots.

Inspired by Diep.io. Original name, original canvas drawing — no copied assets.

## Run

```bash
npm install
npm test
npm run dev
```

Open http://localhost:5173

## Controls

- **WASD / arrows** — move
- **Mouse** — aim
- **Click / space** — fire
- **E** — auto-fire
- **C** — auto-spin
- **1–8** — buy a skill (or click the bars)
- **Y U I O P** — class upgrade (or click the cards)
- Click **Respawn** after death

## v1 class tree

```
Basic
├─ Twin → Triple Shot → Penta Shot / Spread Shot (45)
│        └─ Twin Flank → Triple Twin (45)
├─ Sniper → Assassin → Hunter / Ranger / Predator (45)
│        └─ Overseer (30)
├─ Machine Gun → Destroyer → Annihilator / Hybrid (45)
│              └─ Sprayer → Streamliner (45)
├─ Flank Guard → Quad Tank → Octo Tank (45)
│                Tri-Angle → Booster / Fighter (45)
│                Auto 3 → Auto 5 (45)
└─ Smasher (30) → Spike / Landmine (45)
```
