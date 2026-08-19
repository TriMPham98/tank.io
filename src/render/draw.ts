import { ARENA, COLORS, GRID, NEST_SIZE } from "../config/constants.ts";
import { TANK_DEFS } from "../config/tankDefs.ts";
import type { Bullet, Shape, Tank, World } from "../sim/types.ts";
import { applyCamera, type Camera } from "./camera.ts";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, ARENA, ARENA);
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= ARENA; x += GRID) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ARENA);
  }
  for (let y = 0; y <= ARENA; y += GRID) {
    ctx.moveTo(0, y);
    ctx.lineTo(ARENA, y);
  }
  ctx.stroke();

  const nest = NEST_SIZE;
  ctx.strokeStyle = "rgba(118, 141, 252, 0.25)";
  ctx.lineWidth = 4;
  ctx.strokeRect(ARENA / 2 - nest / 2, ARENA / 2 - nest / 2, nest, nest);
}

function drawShape(ctx: CanvasRenderingContext2D, s: Shape, alpha: number): void {
  const x = lerp(s.px, s.x, alpha);
  const y = lerp(s.py, s.y, alpha);
  const ang = lerpAngle(s.pa, s.angle, alpha);
  ctx.beginPath();
  for (let i = 0; i < s.sides; i++) {
    const a = ang + (i * Math.PI * 2) / s.sides - Math.PI / 2;
    const px = x + Math.cos(a) * s.radius;
    const py = y + Math.sin(a) * s.radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = s.color;
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
  if (s.hp < s.maxHp) drawHpBar(ctx, x, y - s.radius - 8, s.radius * 1.6, s.hp / s.maxHp);
}

function drawHpBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, frac: number): void {
  const h = 5;
  ctx.fillStyle = COLORS.hpBack;
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = COLORS.hpGreen;
  ctx.fillRect(x - w / 2, y, w * Math.max(0, Math.min(1, frac)), h);
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet, alpha: number): void {
  const x = lerp(b.px, b.x, alpha);
  const y = lerp(b.py, b.y, alpha);
  ctx.beginPath();
  ctx.arc(x, y, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = b.fromBot ? COLORS.bulletBot : COLORS.bulletPlayer;
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
}

function drawTank(ctx: CanvasRenderingContext2D, tank: Tank, alpha: number, isPlayer: boolean): void {
  const x = lerp(tank.px, tank.x, alpha);
  const y = lerp(tank.py, tank.y, alpha);
  const ang = lerpAngle(tank.pa, tank.angle, alpha);
  const def = TANK_DEFS[tank.classId];
  const color = isPlayer ? COLORS.player : COLORS.bot;
  const fill = tank.alive ? color : "#888";

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  for (const barrel of def.barrels) {
    ctx.save();
    ctx.rotate(barrel.offsetAngle);
    ctx.translate(0, barrel.lateral);
    ctx.fillStyle = COLORS.barrel;
    ctx.strokeStyle = COLORS.barrelStroke;
    ctx.lineWidth = 3;
    roundRect(ctx, tank.radius - 6, -barrel.width / 2, barrel.length + 6, barrel.width, 5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, tank.radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (tank.alive) {
    drawHpBar(ctx, x, y - tank.radius - 14, tank.radius * 2.2, tank.hp / tank.maxHp);
    ctx.fillStyle = "#333";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${tank.name}  L${tank.level}`, x, y - tank.radius - 20);
  }
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  canvas: HTMLCanvasElement,
  alpha: number,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#9e9e9e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  applyCamera(ctx, cam, canvas);
  drawGrid(ctx);
  for (const s of world.shapes.values()) drawShape(ctx, s, alpha);
  for (const b of world.bullets.values()) drawBullet(ctx, b, alpha);
  for (const t of world.tanks.values()) {
    drawTank(ctx, t, alpha, t.id === world.playerId);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
