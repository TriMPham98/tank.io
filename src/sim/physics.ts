import { ARENA, TANK_ACCEL, TANK_FRICTION } from "../config/constants.ts";
import type { Tank } from "./types.ts";
import { derivedSpeed } from "./xp.ts";

export function applyMovement(
  tank: Tank,
  dt: number,
  dirX: number,
  dirY: number,
): void {
  const speed = derivedSpeed(tank.stats);
  const len = Math.hypot(dirX, dirY);
  if (len > 0) {
    dirX /= len;
    dirY /= len;
    tank.vx += dirX * TANK_ACCEL * dt;
    tank.vy += dirY * TANK_ACCEL * dt;
  }
  const damp = Math.exp(-TANK_FRICTION * dt);
  tank.vx *= damp;
  tank.vy *= damp;
  const v = Math.hypot(tank.vx, tank.vy);
  if (v > speed) {
    tank.vx = (tank.vx / v) * speed;
    tank.vy = (tank.vy / v) * speed;
  }
  tank.x += tank.vx * dt;
  tank.y += tank.vy * dt;
}

export function clampArena(x: number, y: number, r: number): { x: number; y: number } {
  return {
    x: Math.max(r, Math.min(ARENA - r, x)),
    y: Math.max(r, Math.min(ARENA - r, y)),
  };
}

export function shortestAngle(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
