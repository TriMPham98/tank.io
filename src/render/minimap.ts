import { ARENA, COLORS, NEST_SIZE } from "../config/constants.ts";
import type { World } from "../sim/types.ts";
import { canvasCssSize } from "./hud.ts";
import { worldViewBounds, type Camera } from "./camera.ts";

export function minimapPentagons(world: World): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const s of world.shapes.values()) {
    if (s.shapeKind === "pentagon") out.push({ x: s.x, y: s.y });
  }
  return out;
}

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  world: World,
  canvas: HTMLCanvasElement,
  cam?: Camera,
): void {
  const { w, h, dpr } = canvasCssSize(canvas);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const size = Math.min(180, w * 0.18);
  const x = w - size - 16;
  const y = h - size - 16;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  const nest = (NEST_SIZE / ARENA) * size;
  ctx.fillStyle = "rgba(118,141,252,0.18)";
  ctx.fillRect(x + size / 2 - nest / 2, y + size / 2 - nest / 2, nest, nest);
  ctx.strokeStyle = "rgba(118,141,252,0.55)";
  ctx.strokeRect(x + size / 2 - nest / 2, y + size / 2 - nest / 2, nest, nest);

  const scale = size / ARENA;
  for (const p of minimapPentagons(world)) {
    ctx.fillStyle = COLORS.pentagon;
    ctx.beginPath();
    ctx.arc(x + p.x * scale, y + p.y * scale, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (cam) {
    const view = worldViewBounds(cam, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + view.x * scale, y + view.y * scale, view.w * scale, view.h * scale);
  }

  for (const t of world.tanks.values()) {
    if (!t.alive) continue;
    ctx.fillStyle = t.id === world.playerId ? COLORS.player : COLORS.bot;
    ctx.beginPath();
    ctx.arc(x + t.x * scale, y + t.y * scale, t.id === world.playerId ? 4.5 : 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
