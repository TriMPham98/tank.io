import { DT } from "./config/constants.ts";
import { createWorld, snapshotPrev } from "./sim/world.ts";
import { tick } from "./sim/tick.ts";
import { thinkAllBots } from "./sim/bots.ts";
import { createInput } from "./sim/input.ts";
import type { PlayerInput } from "./sim/types.ts";
import { createCamera, updateCamera } from "./render/camera.ts";
import { drawWorld } from "./render/draw.ts";
import { drawHud } from "./render/hud.ts";
import { drawMinimap } from "./render/minimap.ts";
import { playSfxCues, resumeAudio, sfxCues, type SfxSnap } from "./render/sfx.ts";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const gfx = canvas.getContext("2d");
if (!gfx) throw new Error("canvas");
const ctx: CanvasRenderingContext2D = gfx;

function resize(): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
}
resize();
window.addEventListener("resize", resize);

const world = createWorld();
const player0 = world.tanks.get(world.playerId)!;
const cam = createCamera(player0);
const input = createInput(canvas);

let acc = 0;
let last = performance.now();
let sfxPrev: SfxSnap = {
  lastHitAt: player0.lastHitAt,
  level: player0.level,
  alive: player0.alive,
  bullets: 0,
};

canvas.addEventListener("mousedown", () => resumeAudio());

function frame(now: number): void {
  const raw = (now - last) / 1000;
  last = now;
  acc += Math.min(0.08, raw);
  const player = world.tanks.get(world.playerId);
  if (player) updateCamera(cam, player, canvas, raw);

  while (acc >= DT) {
    snapshotPrev(world);
    const inputs = new Map<number, PlayerInput>();
    inputs.set(world.playerId, input.sample(world, cam, canvas));
    thinkAllBots(world, inputs);
    tick(world, inputs, DT);
    acc -= DT;
  }

  const p = world.tanks.get(world.playerId);
  if (p) {
    const next: SfxSnap = {
      lastHitAt: p.lastHitAt,
      level: p.level,
      alive: p.alive,
      bullets: world.bullets.size,
    };
    playSfxCues(sfxCues(sfxPrev, next));
    sfxPrev = next;
  }

  const alpha = acc / DT;
  drawWorld(ctx, world, cam, canvas, alpha);
  drawHud(ctx, world, canvas);
  drawMinimap(ctx, world, canvas, cam);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
