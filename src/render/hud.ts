import { SCORE_FOR_LEVEL, MAX_LEVEL, MAX_STAT } from "../config/levels.ts";
import { STAT_LABELS, TANK_DEFS, type TankClassId } from "../config/tankDefs.ts";
import type { Tank, World } from "../sim/types.ts";

export type HudHit =
  | { kind: "stat"; index: number }
  | { kind: "class"; classId: TankClassId }
  | { kind: "respawn" }
  | null;

type Rect = { x: number; y: number; w: number; h: number };

const statRects: Rect[] = [];
const classRects: { rect: Rect; classId: TankClassId }[] = [];
let respawnRect: Rect | null = null;

function inRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;
}

function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  fill: string,
  label: string,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#fff";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  world: World,
  canvas: HTMLCanvasElement,
): void {
  const player = world.tanks.get(world.playerId);
  if (!player) return;
  statRects.length = 0;
  classRects.length = 0;
  respawnRect = null;

  const w = canvas.width;
  const h = canvas.height;

  const nextLevel = Math.min(MAX_LEVEL, player.level + 1);
  const lo = SCORE_FOR_LEVEL[player.level] ?? 0;
  const hi = SCORE_FOR_LEVEL[nextLevel] ?? lo + 1;
  const levelFrac = player.level >= MAX_LEVEL ? 1 : (player.score - lo) / Math.max(1, hi - lo);

  const barW = Math.min(420, w * 0.45);
  bar(ctx, w / 2 - barW / 2, h - 52, barW, 16, Math.min(1, player.score / Math.max(1, hi)), "#e8d44d", `Score ${player.score}`);
  bar(ctx, w / 2 - barW / 2, h - 32, barW, 16, levelFrac, "#6ecbff", `Level ${player.level}`);

  const sx = 12;
  let sy = h - 24 - 8 * 22;
  for (let i = 0; i < 8; i++) {
    const pts = player.stats[i]!;
    const rect = { x: sx, y: sy, w: 210, h: 18 };
    statRects.push(rect);
    ctx.fillStyle = player.skillPoints > 0 && pts < MAX_STAT ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.35)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#7fd99a";
    ctx.fillRect(rect.x, rect.y, (rect.w * pts) / MAX_STAT, rect.h);
    ctx.fillStyle = "#fff";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${i + 1}  ${STAT_LABELS[i]}  ${pts}/${MAX_STAT}`, rect.x + 6, rect.y + 9);
    sy += 22;
  }
  if (player.skillPoints > 0) {
    ctx.fillStyle = "#fff";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Points: ${player.skillPoints}`, sx, sy - 8 * 22 - 10);
  }

  const upgrades = TANK_DEFS[player.classId].upgradesTo.filter(
    (id) => player.level >= TANK_DEFS[id].unlockLevel,
  );
  let cy = h / 2 - upgrades.length * 28;
  const keys = ["Y", "U", "I", "O"];
  upgrades.forEach((id, i) => {
    const rect = { x: w - 168, y: cy, w: 156, h: 48 };
    classRects.push({ rect, classId: id });
    ctx.fillStyle = "rgba(20,20,20,0.7)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = "#00b2e1";
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${keys[i]}  ${TANK_DEFS[id].name}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
    cy += 56;
  });

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(w - 200, 12, 188, 18 + 16 * 10);
  ctx.fillStyle = "#fff";
  ctx.font = "13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Leaderboard", w - 188, 26);
  const ranked = [...world.tanks.values()].filter((t) => t.alive || t.id === player.id);
  ranked.sort((a, b) => b.score - a.score);
  ranked.slice(0, 10).forEach((t, i) => {
    ctx.fillStyle = t.id === player.id ? "#9be7ff" : "#eee";
    ctx.fillText(`${i + 1}. ${t.name}  ${t.score}`, w - 188, 46 + i * 16);
  });

  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    "WASD move · mouse aim · click/space fire · E autofire · C autospin · 1-8 stats · YUIO class",
    12,
    18,
  );

  if (world.death && !player.alive) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = "28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`You were killed by ${world.death.killerName}`, w / 2, h / 2 - 20);
    respawnRect = { x: w / 2 - 90, y: h / 2 + 10, w: 180, h: 40 };
    ctx.fillStyle = "#00b2e1";
    ctx.fillRect(respawnRect.x, respawnRect.y, respawnRect.w, respawnRect.h);
    ctx.fillStyle = "#fff";
    ctx.font = "16px sans-serif";
    ctx.fillText("Respawn", w / 2, h / 2 + 32);
  }
}

export function hitHud(mx: number, my: number): HudHit {
  if (respawnRect && inRect(respawnRect, mx, my)) return { kind: "respawn" };
  for (const c of classRects) {
    if (inRect(c.rect, mx, my)) return { kind: "class", classId: c.classId };
  }
  for (let i = 0; i < statRects.length; i++) {
    if (inRect(statRects[i]!, mx, my)) return { kind: "stat", index: i };
  }
  return null;
}

export function availableUpgrades(tank: Tank): TankClassId[] {
  return TANK_DEFS[tank.classId].upgradesTo.filter((id) => tank.level >= TANK_DEFS[id].unlockLevel);
}
