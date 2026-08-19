import { ARENA, COLORS, NEST_SIZE } from "../config/constants.ts";
import type { World } from "../sim/types.ts";

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  world: World,
  canvas: HTMLCanvasElement,
): void {
  const size = Math.min(150, canvas.width * 0.16);
  const x = canvas.width - size - 16;
  const y = canvas.height - size - 16;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.strokeRect(x, y, size, size);

  const nest = (NEST_SIZE / ARENA) * size;
  ctx.strokeStyle = "rgba(118,141,252,0.5)";
  ctx.strokeRect(x + size / 2 - nest / 2, y + size / 2 - nest / 2, nest, nest);

  const scale = size / ARENA;
  for (const t of world.tanks.values()) {
    if (!t.alive) continue;
    ctx.fillStyle = t.id === world.playerId ? COLORS.player : COLORS.bot;
    ctx.beginPath();
    ctx.arc(x + t.x * scale, y + t.y * scale, t.id === world.playerId ? 3.5 : 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
