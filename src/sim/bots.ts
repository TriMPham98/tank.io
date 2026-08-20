import { TANK_DEFS, type TankClassId } from "../config/tankDefs.ts";
import { derivedBulletSpeed } from "./xp.ts";
import { isCloaked } from "./combat.ts";
import type { PlayerInput, Tank, World } from "./types.ts";
import { EMPTY_INPUT } from "./types.ts";

const BULLET_BUILD = [0, 2, 0, 7, 7, 7, 7, 5];
const RAM_BUILD = [7, 7, 7, 0, 0, 0, 0, 7];

function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/** First-order intercept: aim ahead of a moving target. */
export function leadAim(
  ox: number,
  oy: number,
  tx: number,
  ty: number,
  tvx: number,
  tvy: number,
  bulletSpeed: number,
): { x: number; y: number } {
  const spd = Math.max(40, bulletSpeed);
  let x = tx;
  let y = ty;
  for (let i = 0; i < 2; i++) {
    const t = Math.hypot(x - ox, y - oy) / spd;
    x = tx + tvx * t;
    y = ty + tvy * t;
  }
  return { x, y };
}

/** Backpedal from a threat and strafe so we kite instead of running in a straight line. */
export function fleeWaypoint(
  bx: number,
  by: number,
  tx: number,
  ty: number,
  time: number,
  id: number,
): { x: number; y: number } {
  const dx = bx - tx;
  const dy = by - ty;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const side = Math.sin(time * 1.85 + id) >= 0 ? 1 : -1;
  const close = dist < 280;
  const away = close ? 220 : 90;
  const kite = close ? 80 : 240;
  return {
    x: bx + nx * away + -ny * side * kite,
    y: by + ny * away + nx * side * kite,
  };
}

const HOLD_RANGE = 300;

/** Snipers sit farther; destroyers close for fat, slow shells. */
export function classHoldRange(classId: TankClassId): number {
  const def = TANK_DEFS[classId];
  if (classId === "destroyer") return 200;
  if (classId === "annihilator") return 170;
  if (classId === "machineGun") return 240;
  if (classId === "triAngle" || classId === "booster" || classId === "fighter") return 90;
  if (classId === "smasher" || classId === "spike" || classId === "landmine") return 40;
  if (classId === "overseer") return 360;
  return HOLD_RANGE * def.fov;
}

/** Rammers charge; gun bots hold a ring and circle-strafe. */
export function fightWaypoint(
  bx: number,
  by: number,
  tx: number,
  ty: number,
  rammer: boolean,
  time: number,
  id: number,
  holdRange = HOLD_RANGE,
): { x: number; y: number } {
  if (rammer) return { x: tx, y: ty };
  const dx = bx - tx;
  const dy = by - ty;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const side = Math.sin(time * 1.6 + id) >= 0 ? 1 : -1;
  const hold = Math.max(180, holdRange);
  return {
    x: tx + nx * hold + -ny * side * 70,
    y: ty + ny * hold + nx * side * 70,
  };
}

export function thinkBot(world: World, bot: Tank): PlayerInput {
  const input: PlayerInput = { ...EMPTY_INPUT, statBuys: [] };
  if (!bot.alive) return input;

  const build = bot.id % 5 === 0 ? RAM_BUILD : BULLET_BUILD;
  for (let i = 0; i < 8; i++) {
    if (bot.stats[i]! < build[i]! && bot.skillPoints > 0) {
      input.statBuys.push(i);
      break;
    }
  }

  const def = TANK_DEFS[bot.classId];
  if (def.upgradesTo.length && bot.level >= TANK_DEFS[def.upgradesTo[0]!].unlockLevel) {
    const pick = def.upgradesTo[Math.floor(Math.random() * def.upgradesTo.length)] as TankClassId;
    input.classPick = pick;
  }

  let nearestTank: Tank | null = null;
  let nearestTankD = Infinity;
  for (const t of world.tanks.values()) {
    if (t.id === bot.id || !t.alive) continue;
    if (isCloaked(t.classId, t.vx, t.vy)) continue;
    const d = dist2(bot.x, bot.y, t.x, t.y);
    if (d < nearestTankD) {
      nearestTankD = d;
      nearestTank = t;
    }
  }

  let nearestShape = null as { x: number; y: number } | null;
  let nearestShapeD = Infinity;
  for (const s of world.shapes.values()) {
    const d = dist2(bot.x, bot.y, s.x, s.y);
    if (d < nearestShapeD) {
      nearestShapeD = d;
      nearestShape = s;
    }
  }

  const hpFrac = bot.hp / bot.maxHp;
  const fightRange = 420 * 420;
  const seeTank = nearestTank && nearestTankD < 700 * 700;
  const canFight =
    seeTank &&
    hpFrac > 0.4 &&
    nearestTank &&
    Math.abs(nearestTank.level - bot.level) <= 12 &&
    nearestTankD < fightRange;
  const flee = hpFrac < 0.35 || (seeTank && nearestTank && nearestTank.level > bot.level + 8);

  let tx = bot.x;
  let ty = bot.y;
  let ax = bot.x;
  let ay = bot.y;
  const barrel = def.barrels[0];
  const bspd = barrel ? derivedBulletSpeed(bot.stats, barrel.bulletSpeed) : 380;
  const rammer =
    bot.id % 5 === 0 ||
    bot.classId === "triAngle" ||
    bot.classId === "booster" ||
    bot.classId === "fighter" ||
    bot.classId === "smasher" ||
    bot.classId === "spike" ||
    bot.classId === "landmine";
  if (flee && nearestTank) {
    const wp = fleeWaypoint(bot.x, bot.y, nearestTank.x, nearestTank.y, world.time, bot.id);
    tx = wp.x;
    ty = wp.y;
    const lead = leadAim(bot.x, bot.y, nearestTank.x, nearestTank.y, nearestTank.vx, nearestTank.vy, bspd);
    ax = lead.x;
    ay = lead.y;
    input.fire = true;
  } else if (canFight && nearestTank) {
    const wp = fightWaypoint(
      bot.x,
      bot.y,
      nearestTank.x,
      nearestTank.y,
      rammer,
      world.time,
      bot.id,
      classHoldRange(bot.classId),
    );
    tx = wp.x;
    ty = wp.y;
    const lead = rammer
      ? { x: nearestTank.x, y: nearestTank.y }
      : leadAim(bot.x, bot.y, nearestTank.x, nearestTank.y, nearestTank.vx, nearestTank.vy, bspd);
    ax = lead.x;
    ay = lead.y;
    input.fire = true;
  } else if (nearestShape) {
    tx = nearestShape.x;
    ty = nearestShape.y;
    ax = tx;
    ay = ty;
    input.fire = nearestShapeD < 380 * 380;
  }

  const noise = (Math.sin(world.time * 3 + bot.id) + Math.sin(bot.id * 1.7)) * 0.12;
  input.aimX = ax + Math.cos(noise) * 8;
  input.aimY = ay + Math.sin(noise) * 8;

  const dx = tx - bot.x;
  const dy = ty - bot.y;
  const strafe = Math.sin(world.time * 1.4 + bot.id) * 0.35;
  const rx = -dy;
  const ry = dx;
  const mx = dx + rx * strafe;
  const my = dy + ry * strafe;
  input.right = mx > 8;
  input.left = mx < -8;
  input.down = my > 8;
  input.up = my < -8;
  return input;
}

export function thinkAllBots(world: World, inputs: Map<number, PlayerInput>): void {
  for (const t of world.tanks.values()) {
    if (!t.isBot) continue;
    inputs.set(t.id, thinkBot(world, t));
  }
}
