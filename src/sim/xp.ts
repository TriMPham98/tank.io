import {
  BODY_DMG0,
  BULLET_DMG0,
  BULLET_PEN0,
  BULLET_SPEED0,
  HP0,
  HP_PER_LEVEL,
  HP_PER_MAX_STAT,
  REGEN0,
  RELOAD0,
  TANK_SPEED0,
  tankRadius,
  statMul,
} from "../config/constants.ts";
import {
  levelFromScore,
  MAX_STAT,
  skillPointsForLevel,
  totalSkillPointsAtLevel,
} from "../config/levels.ts";
import { TANK_DEFS, type TankClassId } from "../config/tankDefs.ts";
import type { Stats, Tank, World } from "./types.ts";

export function derivedMaxHp(level: number, stats: Stats): number {
  return HP0 + HP_PER_LEVEL * (level - 1) + HP_PER_MAX_STAT * stats[1];
}

export function derivedSpeed(stats: Stats): number {
  return statMul(TANK_SPEED0, stats[7], 1.07);
}

export function derivedReload(stats: Stats, barrelReload: number): number {
  return RELOAD0 * barrelReload * Math.pow(0.91, stats[6]);
}

export function derivedBulletSpeed(stats: Stats, mul: number): number {
  return BULLET_SPEED0 * mul * Math.pow(1.1, stats[3]);
}

export function derivedBulletDamage(stats: Stats, mul: number): number {
  return BULLET_DMG0 * mul * (1 + 0.15 * stats[5]);
}

export function derivedBulletPen(stats: Stats, mul: number): number {
  return BULLET_PEN0 * mul * (1 + 0.2 * stats[4]);
}

export function derivedBodyDamage(tank: Tank): number {
  return BODY_DMG0 * TANK_DEFS[tank.classId].bodyDamageMul * (1 + 0.2 * tank.stats[2]);
}

export function derivedRegen(stats: Stats): number {
  return REGEN0 * (1 + 1.4 * stats[0]);
}

export function addScore(world: World, tank: Tank, amount: number): void {
  if (!tank.alive || amount <= 0) return;
  const prev = tank.level;
  tank.score += amount;
  const next = levelFromScore(tank.score);
  if (next > prev) {
    for (let l = prev + 1; l <= next; l++) {
      tank.skillPoints += skillPointsForLevel(l);
    }
    tank.level = next;
    tank.radius = tankRadius(tank.level);
    const ratio = tank.hp / tank.maxHp;
    tank.maxHp = derivedMaxHp(tank.level, tank.stats);
    tank.hp = Math.min(tank.maxHp, Math.max(1, ratio * tank.maxHp));
  }
}

export function buyStat(tank: Tank, index: number): boolean {
  if (!tank.alive) return false;
  if (index < 0 || index > 7) return false;
  if (tank.skillPoints <= 0) return false;
  if (tank.stats[index]! >= MAX_STAT) return false;
  tank.stats[index]! += 1;
  tank.skillPoints -= 1;
  const ratio = tank.hp / tank.maxHp;
  tank.maxHp = derivedMaxHp(tank.level, tank.stats);
  tank.hp = Math.min(tank.maxHp, ratio * tank.maxHp);
  return true;
}

export function pickClass(tank: Tank, classId: TankClassId): boolean {
  if (!tank.alive) return false;
  const current = TANK_DEFS[tank.classId];
  const next = TANK_DEFS[classId];
  if (!current.upgradesTo.includes(classId)) return false;
  if (tank.level < next.unlockLevel) return false;
  tank.classId = classId;
  tank.barrelT = next.barrels.map((b) => b.delay);
  return true;
}

export function spentSkillPoints(stats: Stats): number {
  return stats.reduce((a, b) => a + b, 0);
}

export function availableSkillPoints(tank: Tank): number {
  return totalSkillPointsAtLevel(tank.level) - spentSkillPoints(tank.stats);
}
