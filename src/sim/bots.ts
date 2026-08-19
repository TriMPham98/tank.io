import { TANK_DEFS, type TankClassId } from "../config/tankDefs.ts";
import type { PlayerInput, Tank, World } from "./types.ts";
import { EMPTY_INPUT } from "./types.ts";

const BULLET_BUILD = [0, 2, 0, 7, 7, 7, 7, 5];
const RAM_BUILD = [7, 7, 7, 0, 0, 0, 0, 7];

function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
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
  if (flee && nearestTank) {
    tx = bot.x - (nearestTank.x - bot.x);
    ty = bot.y - (nearestTank.y - bot.y);
    input.fire = true;
  } else if (canFight && nearestTank) {
    tx = nearestTank.x;
    ty = nearestTank.y;
    input.fire = true;
  } else if (nearestShape) {
    tx = nearestShape.x;
    ty = nearestShape.y;
    input.fire = nearestShapeD < 380 * 380;
  }

  const noise = (Math.sin(world.time * 3 + bot.id) + Math.sin(bot.id * 1.7)) * 0.12;
  input.aimX = tx + Math.cos(noise) * 8;
  input.aimY = ty + Math.sin(noise) * 8;

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
