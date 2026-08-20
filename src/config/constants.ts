export const TICK_HZ = 60;
export const DT = 1 / TICK_HZ;

export const ARENA = 3200;
export const GRID = 25;
export const NEST_SIZE = 700;

export const TANK_R0 = 18;
export const TANK_SPEED0 = 220;
export const TANK_ACCEL = 1400;
export const TANK_FRICTION = 6;

export const BULLET_SPEED0 = 380;
export const RELOAD0 = 0.4;
export const HP0 = 50;
export const HP_PER_LEVEL = 2;
export const HP_PER_MAX_STAT = 20;
export const REGEN0 = 0.08;
export const REGEN_DELAY = 4;
export const BODY_DMG0 = 8;
export const BULLET_DMG0 = 7;
export const BULLET_PEN0 = 2;
export const BULLET_LIFE = 2.2;
export const BULLET_RADIUS = 8;
export const MAX_BULLETS = 400;
export const MAX_DRONES = 8;

export const KNOCKBACK = 0.42;
export const VIEW_WIDTH = 920;
export const CAMERA_LERP = 8;

export const HASH_CELL = 64;

export const SHAPE_TARGETS = { square: 350, triangle: 100, pentagon: 30 };

export const BOT_COUNT = 10;

export const COLORS = {
  bg: "#c3c3c3",
  grid: "#b3b3b3",
  player: "#00b2e1",
  bot: "#f14e54",
  bulletPlayer: "#00b2e1",
  bulletBot: "#f14e54",
  square: "#ffe869",
  triangle: "#fc7677",
  pentagon: "#768dfc",
  barrel: "#999999",
  barrelStroke: "#555555",
  hpGreen: "#85e37d",
  hpBack: "#555555",
};

export function tankRadius(level: number): number {
  return TANK_R0 * Math.pow(1.01, level - 1);
}

export function statMul(base: number, points: number, per: number): number {
  return base * Math.pow(per, points);
}
