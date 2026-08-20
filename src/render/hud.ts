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

export function canvasCssSize(canvas: HTMLCanvasElement): { w: number; h: number; dpr: number } {
  const w = canvas.clientWidth || window.innerWidth || canvas.width;
  const h = canvas.clientHeight || window.innerHeight || canvas.height;
  const dpr = canvas.width / Math.max(1, w);
  return { w, h, dpr };
}

function inRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;
}

function toCanvasRect(r: Rect, dpr: number): Rect {
  return { x: r.x * dpr, y: r.y * dpr, w: r.w * dpr, h: r.h * dpr };
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
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
}

export function scoreBarLabel(player: Tank): string {
  const k = player.kills;
  return `Score ${player.score}  ·  ${k} kill${k === 1 ? "" : "s"}`;
}

export function modeHints(player: Tank): string {
  const bits: string[] = [];
  if (player.autoFire) bits.push("AUTOFIRE");
  if (player.autoSpin) bits.push("AUTOSPIN");
  return bits.join("  ·  ");
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

  const { w, h, dpr } = canvasCssSize(canvas);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const nextLevel = Math.min(MAX_LEVEL, player.level + 1);
  const lo = SCORE_FOR_LEVEL[player.level] ?? 0;
  const hi = SCORE_FOR_LEVEL[nextLevel] ?? lo + 1;
  const levelFrac = player.level >= MAX_LEVEL ? 1 : (player.score - lo) / Math.max(1, hi - lo);

  const barW = Math.min(480, w * 0.42);
  bar(
    ctx,
    w / 2 - barW / 2,
    h - 64,
    barW,
    22,
    Math.min(1, player.score / Math.max(1, hi)),
    "#e8d44d",
    scoreBarLabel(player),
  );
  bar(ctx, w / 2 - barW / 2, h - 38, barW, 22, levelFrac, "#6ecbff", `Level ${player.level}`);

  const sx = 16;
  const rowH = 26;
  let sy = h - 28 - 8 * rowH;
  for (let i = 0; i < 8; i++) {
    const pts = player.stats[i]!;
    const rect = { x: sx, y: sy, w: 280, h: 22 };
    statRects.push(toCanvasRect(rect, dpr));
    ctx.fillStyle = player.skillPoints > 0 && pts < MAX_STAT ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.35)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#7fd99a";
    ctx.fillRect(rect.x, rect.y, (rect.w * pts) / MAX_STAT, rect.h);
    ctx.fillStyle = "#fff";
    ctx.font = "15px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${i + 1}  ${STAT_LABELS[i]}  ${pts}/${MAX_STAT}`, rect.x + 8, rect.y + 11);
    sy += rowH;
  }
  if (player.skillPoints > 0) {
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Points: ${player.skillPoints}`, sx, sy - 8 * rowH - 12);
  }

  const boardW = 300;
  const row = 26;
  const boardH = 44 + row * 10;
  const bx = w - boardW - 16;
  const by = 16;

  const upgrades = TANK_DEFS[player.classId].upgradesTo.filter(
    (id) => player.level >= TANK_DEFS[id].unlockLevel,
  );
  const cardW = 260;
  const cardH = 78;
  const cardGap = 14;
  let cy = by + boardH + 18;
  const keys = ["Y", "U", "I", "O", "P"];
  upgrades.forEach((id, i) => {
    const rect = { x: bx + boardW - cardW, y: cy, w: cardW, h: cardH };
    classRects.push({ rect: toCanvasRect(rect, dpr), classId: id });
    ctx.fillStyle = "rgba(20,20,20,0.78)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = "#00b2e1";
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#7ad7f0";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(keys[i]!, rect.x + 16, rect.y + rect.h / 2);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(TANK_DEFS[id].name, rect.x + 48, rect.y + rect.h / 2);
    cy += cardH + cardGap;
  });

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(bx, by, boardW, boardH);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Leaderboard", bx + 16, by + 30);
  const ranked = [...world.tanks.values()].filter((t) => t.alive || t.id === player.id);
  ranked.sort((a, b) => b.score - a.score);
  ranked.slice(0, 10).forEach((t, i) => {
    ctx.fillStyle = t.id === player.id ? "#9be7ff" : "#eee";
    ctx.font = "18px sans-serif";
    ctx.fillText(`${i + 1}. ${t.name}  ${t.score}`, bx + 16, by + 56 + i * row);
  });

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.font = "15px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    "WASD move · mouse aim · click/space fire · E autofire · C autospin · 1-8 stats · YUIO class",
    16,
    28,
  );
  const modes = modeHints(player);
  if (modes) {
    ctx.fillStyle = "#7ad7f0";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(modes, 16, 48);
  }

  if (world.death && !player.alive) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = "36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`You were killed by ${world.death.killerName}`, w / 2, h / 2 - 56);
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#d8d8d8";
    ctx.fillText(
      `Score ${world.death.score}  ·  Level ${world.death.level}  ·  ${world.death.className}  ·  ${world.death.kills} kill${world.death.kills === 1 ? "" : "s"}`,
      w / 2,
      h / 2 - 18,
    );
    ctx.fillStyle = "#9be7ff";
    ctx.font = "16px sans-serif";
    ctx.fillText(`Killer: ${world.death.killerClass}`, w / 2, h / 2 + 8);
    const rr = { x: w / 2 - 110, y: h / 2 + 32, w: 220, h: 52 };
    respawnRect = toCanvasRect(rr, dpr);
    ctx.fillStyle = "#00b2e1";
    ctx.fillRect(rr.x, rr.y, rr.w, rr.h);
    ctx.fillStyle = "#fff";
    ctx.font = "22px sans-serif";
    ctx.fillText("Respawn", w / 2, h / 2 + 60);
  }

  ctx.restore();
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
