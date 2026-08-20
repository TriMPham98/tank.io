import { ARENA, COLORS, GRID, NEST_SIZE } from "../config/constants.ts";
import { TANK_DEFS } from "../config/tankDefs.ts";
import type { Bullet, Shape, Tank, World } from "../sim/types.ts";
import { cloakOpacity } from "../sim/combat.ts";
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

export function hitFlash(time: number, lastHitAt: number, window = 0.14): number {
  const d = time - lastHitAt;
  if (d < 0 || d > window) return 0;
  return 1 - d / window;
}

export function muzzleFlashAlpha(kick: number): number {
  return Math.max(0, Math.min(1, (kick - 0.28) / 0.72));
}

/** Name, class, and level — Diep-style overlay readable on grid and tanks. */
export function nameplateText(tank: Tank): string {
  const cls = TANK_DEFS[tank.classId].name;
  return `${tank.name} · ${cls}  L${tank.level}`;
}

function drawNameplate(ctx: CanvasRenderingContext2D, tank: Tank, x: number, y: number): void {
  const label = nameplateText(tank);
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(18, 22, 32, 0.82)";
  ctx.strokeText(label, x, y);
  ctx.fillStyle = "#f4f6fb";
  ctx.fillText(label, x, y);
}

function drawShape(ctx: CanvasRenderingContext2D, s: Shape, alpha: number, time: number): void {
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
  const flash = hitFlash(time, s.lastHitAt);
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flash * 0.7})`;
    ctx.fill();
  }
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

/** Fade length behind a shot; fat/fast shells leave a longer smear. */
export function bulletTrailLength(speed: number, radius: number): number {
  return Math.min(48, 8 + speed * 0.045 + radius * 1.4);
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet, alpha: number): void {
  const x = lerp(b.px, b.x, alpha);
  const y = lerp(b.py, b.y, alpha);
  const spd = Math.hypot(b.vx, b.vy);
  const ang = spd > 1 ? Math.atan2(b.vy, b.vx) : 0;
  const stretch = b.radius + Math.min(22, spd * 0.035);
  const trail = bulletTrailLength(spd, b.radius);
  const fill = b.fromBot ? COLORS.bulletBot : COLORS.bulletPlayer;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  if (b.drone) {
    ctx.beginPath();
    ctx.moveTo(b.radius * 1.5, 0);
    ctx.lineTo(-b.radius * 0.95, -b.radius * 0.95);
    ctx.lineTo(-b.radius * 0.95, b.radius * 0.95);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.strokeStyle = "rgba(0,0,0,0.32)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (trail > 4 && spd > 40) {
    const grad = ctx.createLinearGradient(-trail, 0, 0, 0);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(1, fill);
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(-trail * 0.45, 0, trail * 0.55, b.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.beginPath();
  ctx.ellipse(-stretch * 0.15, 0, stretch, b.radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTank(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  alpha: number,
  isPlayer: boolean,
  time: number,
): void {
  const x = lerp(tank.px, tank.x, alpha);
  const y = lerp(tank.py, tank.y, alpha);
  const ang = lerpAngle(tank.pa, tank.angle, alpha);
  const def = TANK_DEFS[tank.classId];
  const color = isPlayer ? COLORS.player : COLORS.bot;
  const fill = tank.alive ? color : "#888";
  const spd = Math.hypot(tank.vx, tank.vy);
  const vis = cloakOpacity(tank.classId, spd, isPlayer);

  ctx.save();
  ctx.globalAlpha *= vis;
  ctx.translate(x, y);
  ctx.rotate(ang);
  def.barrels.forEach((barrel, i) => {
    ctx.save();
    const aim = tank.barrelAim[i];
    ctx.rotate(barrel.auto && aim != null ? aim - ang : barrel.offsetAngle);
    ctx.translate(0, barrel.lateral);
    const kick = Math.min(1, tank.barrelKick[i] ?? 0);
    ctx.translate(-kick * 7, 0);
    ctx.fillStyle = COLORS.barrel;
    ctx.strokeStyle = COLORS.barrelStroke;
    ctx.lineWidth = 3;
    roundRect(ctx, tank.radius - 6, -barrel.width / 2, barrel.length + 6, barrel.width, 5);
    ctx.fill();
    ctx.stroke();
    const flashA = muzzleFlashAlpha(kick);
    if (flashA > 0) {
      const mx = tank.radius - 6 + barrel.length + 6;
      ctx.beginPath();
      ctx.arc(mx, 0, barrel.width * 0.42 + flashA * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 236, 150, ${0.85 * flashA})`;
      ctx.fill();
    }
    ctx.restore();
  });
  if (def.barrels.length === 0) {
    ctx.save();
    ctx.rotate(time * 2.4);
    ctx.beginPath();
    if (def.id === "spike") {
      const spikes = 12;
      for (let i = 0; i < spikes; i++) {
        const a = (i * Math.PI * 2) / spikes - Math.PI / 2;
        const r = i % 2 === 0 ? tank.radius * 1.48 : tank.radius * 1.08;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        const r = tank.radius * 1.28;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = COLORS.barrel;
    ctx.strokeStyle = COLORS.barrelStroke;
    ctx.lineWidth = 3;
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
  const flash = hitFlash(time, tank.lastHitAt);
  if (flash > 0 && tank.alive) {
    ctx.fillStyle = `rgba(255,255,255,${flash * 0.65})`;
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();

  if (tank.alive && vis > 0.15) {
    drawHpBar(ctx, x, y - tank.radius - 14, tank.radius * 2.2, tank.hp / tank.maxHp);
    drawNameplate(ctx, tank, x, y - tank.radius - 22);
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
  for (const s of world.shapes.values()) drawShape(ctx, s, alpha, world.time);
  for (const b of world.bullets.values()) drawBullet(ctx, b, alpha);
  for (const t of world.tanks.values()) {
    drawTank(ctx, t, alpha, t.id === world.playerId, world.time);
  }
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const p of world.bursts) {
    const age = world.time - p.born;
    const fade = 1 - Math.max(0, age / p.life);
    ctx.globalAlpha = Math.max(0, fade);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (0.6 + fade * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of world.floats) {
    const fade = 1 - Math.max(0, (world.time - f.born) / f.life);
    ctx.globalAlpha = Math.max(0, fade);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
