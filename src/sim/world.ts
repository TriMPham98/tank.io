import { ARENA, BOT_COUNT, tankRadius } from "../config/constants.ts";
import { TANK_DEFS, type TankClassId } from "../config/tankDefs.ts";
import { SpatialHash } from "./collision.ts";
import { allocId, type Stats, type Tank, type World } from "./types.ts";
import { seedShapes } from "./spawn.ts";
import { derivedMaxHp, derivedReload } from "./xp.ts";

const BOT_NAMES = [
  "Hex",
  "Nim",
  "Orb",
  "Pico",
  "Rook",
  "Silo",
  "Vex",
  "Wisp",
  "Yarn",
  "Zed",
  "Kite",
  "Lumen",
];

export function emptyStats(): Stats {
  return [0, 0, 0, 0, 0, 0, 0, 0];
}

export function makeTank(
  world: World,
  opts: { name: string; x: number; y: number; isBot: boolean; classId?: TankClassId },
): Tank {
  const classId = opts.classId ?? "basic";
  const def = TANK_DEFS[classId];
  const stats = emptyStats();
  const level = 1;
  const maxHp = derivedMaxHp(level, stats);
  const tank: Tank = {
    id: allocId(world),
    kind: "tank",
    name: opts.name,
    x: opts.x,
    y: opts.y,
    vx: 0,
    vy: 0,
    angle: Math.random() * Math.PI * 2,
    px: opts.x,
    py: opts.y,
    pa: 0,
    radius: tankRadius(level),
    hp: maxHp,
    maxHp,
    level,
    score: 0,
    skillPoints: 0,
    stats,
    classId,
    barrelT: def.barrels.map((b) => b.delay * derivedReload(stats, b.reload)),
    barrelKick: def.barrels.map(() => 0),
    barrelAim: def.barrels.map((b) => b.offsetAngle),
    alive: true,
    isBot: opts.isBot,
    lastHitAt: -999,
    lastHitBy: null,
    kills: 0,
    regenT: 0,
    autoFire: false,
    autoSpin: false,
    respawnT: 0,
    aimX: opts.x,
    aimY: opts.y,
    sendDrones: false,
  };
  world.tanks.set(tank.id, tank);
  return tank;
}

export function randomArenaPos(margin = 80): { x: number; y: number } {
  return {
    x: margin + Math.random() * (ARENA - margin * 2),
    y: margin + Math.random() * (ARENA - margin * 2),
  };
}

export function createWorld(opts: { bots?: number; seedShapes?: boolean } = {}): World {
  const world: World = {
    nextId: 1,
    tick: 0,
    time: 0,
    tanks: new Map(),
    bullets: new Map(),
    shapes: new Map(),
    floats: [],
    bursts: [],
    playerId: 0,
    hash: new SpatialHash(),
    death: null,
  };
  const p = randomArenaPos();
  const player = makeTank(world, { name: "You", x: p.x, y: p.y, isBot: false });
  world.playerId = player.id;

  const nBots = opts.bots ?? BOT_COUNT;
  for (let i = 0; i < nBots; i++) {
    let pos = randomArenaPos();
    let guard = 0;
    while (Math.hypot(pos.x - player.x, pos.y - player.y) < 400 && guard++ < 20) {
      pos = randomArenaPos();
    }
    makeTank(world, { name: BOT_NAMES[i % BOT_NAMES.length]!, x: pos.x, y: pos.y, isBot: true });
  }

  if (opts.seedShapes !== false) seedShapes(world);
  return world;
}

export function snapshotPrev(world: World): void {
  for (const t of world.tanks.values()) {
    t.px = t.x;
    t.py = t.y;
    t.pa = t.angle;
  }
  for (const b of world.bullets.values()) {
    b.px = b.x;
    b.py = b.y;
  }
  for (const s of world.shapes.values()) {
    s.px = s.x;
    s.py = s.y;
    s.pa = s.angle;
  }
}

