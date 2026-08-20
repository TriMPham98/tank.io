import {
  ARENA,
  BULLET_LIFE,
  BULLET_RADIUS,
  MAX_BULLETS,
  MAX_DRONES,
  REGEN_DELAY,
} from "../config/constants.ts";
import { TANK_DEFS } from "../config/tankDefs.ts";
import { scoreForKill } from "../config/levels.ts";
import type { Bullet, Tank, World } from "./types.ts";
import { allocId } from "./types.ts";
import {
  addScore,
  derivedBodyDamage,
  derivedBulletDamage,
  derivedBulletPen,
  derivedBulletSpeed,
  derivedMaxHp,
  derivedRegen,
  derivedReload,
} from "./xp.ts";
import { circlesHit, knockbackFrom, separateCircles } from "./collision.ts";
import { clampArena } from "./physics.ts";

function angDelta(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function nearestAutoTarget(
  world: World,
  tank: Tank,
  restAngle: number,
): { x: number; y: number } | null {
  let bestX = 0;
  let bestY = 0;
  let best = Infinity;
  const consider = (x: number, y: number) => {
    const ang = Math.atan2(y - tank.y, x - tank.x);
    if (Math.abs(angDelta(restAngle, ang)) > 2.05) return;
    const d = Math.hypot(x - tank.x, y - tank.y);
    if (d > 540 || d < 8) return;
    if (d < best) {
      best = d;
      bestX = x;
      bestY = y;
    }
  };
  for (const t of world.tanks.values()) {
    if (t.id === tank.id || !t.alive) continue;
    consider(t.x, t.y);
  }
  for (const s of world.shapes.values()) consider(s.x, s.y);
  return best < Infinity ? { x: bestX, y: bestY } : null;
}

export function fireBarrels(world: World, tank: Tank, dt: number, wantFire: boolean): void {
  const def = TANK_DEFS[tank.classId];
  for (let i = 0; i < def.barrels.length; i++) {
    const barrel = def.barrels[i]!;
    tank.barrelKick[i] = Math.max(0, (tank.barrelKick[i] ?? 0) - dt * 11);
    let fireThis = wantFire;
    let ang = tank.angle + barrel.offsetAngle;
    if (barrel.auto) {
      const rest = tank.angle + barrel.offsetAngle;
      const tgt = nearestAutoTarget(world, tank, rest);
      if (tgt) {
        ang = Math.atan2(tgt.y - tank.y, tgt.x - tank.x);
        fireThis = true;
      } else {
        fireThis = false;
      }
      const cur = tank.barrelAim[i] ?? rest;
      tank.barrelAim[i] = cur + angDelta(cur, ang) * Math.min(1, dt * 14);
      ang = tank.barrelAim[i]!;
    } else {
      tank.barrelAim[i] = ang;
    }
    if (barrel.drone) fireThis = droneCount(world, tank.id) < MAX_DRONES;
    if (!fireThis) continue;
    tank.barrelT[i] = (tank.barrelT[i] ?? 0) - dt;
    if (tank.barrelT[i]! > 0) continue;
    if (world.bullets.size >= MAX_BULLETS) continue;

    tank.barrelT[i] = derivedReload(tank.stats, barrel.reload);
    tank.barrelKick[i] = 1;

    ang += (Math.random() * 2 - 1) * barrel.spread;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const px = -s;
    const py = c;
    const muzzleDist = tank.radius + barrel.length * 0.55;
    const x = tank.x + c * muzzleDist + px * barrel.lateral;
    const y = tank.y + s * muzzleDist + py * barrel.lateral;
    const spd = derivedBulletSpeed(tank.stats, barrel.bulletSpeed);
    const bullet: Bullet = {
      id: allocId(world),
      kind: "bullet",
      ownerId: tank.id,
      fromBot: tank.isBot,
      x,
      y,
      vx: tank.vx * 0.2 + c * spd,
      vy: tank.vy * 0.2 + s * spd,
      px: x,
      py: y,
      radius: BULLET_RADIUS * barrel.bulletRadius,
      hp: derivedBulletPen(tank.stats, barrel.bulletPen),
      damage: derivedBulletDamage(tank.stats, barrel.bulletDamage),
      life: barrel.drone ? 999 : BULLET_LIFE,
      drone: !!barrel.drone,
    };
    world.bullets.set(bullet.id, bullet);
    tank.vx -= c * barrel.recoil;
    tank.vy -= s * barrel.recoil;
  }
}

export function droneCount(world: World, ownerId: number): number {
  let n = 0;
  for (const b of world.bullets.values()) {
    if (b.drone && b.ownerId === ownerId) n++;
  }
  return n;
}

function steerDrone(world: World, b: Bullet, dt: number): void {
  const owner = world.tanks.get(b.ownerId);
  if (!owner || !owner.alive) {
    b.hp = 0;
    return;
  }
  let tx = owner.x;
  let ty = owner.y;
  if (owner.sendDrones) {
    tx = owner.aimX;
    ty = owner.aimY;
  } else {
    const a = world.time * 2.1 + b.id * 0.9;
    tx = owner.x + Math.cos(a) * 52;
    ty = owner.y + Math.sin(a) * 52;
  }
  const dx = tx - b.x;
  const dy = ty - b.y;
  const dist = Math.hypot(dx, dy) || 1;
  const maxSpd = 340;
  b.vx += (dx / dist) * 980 * dt;
  b.vy += (dy / dist) * 980 * dt;
  const spd = Math.hypot(b.vx, b.vy);
  if (spd > maxSpd) {
    b.vx *= maxSpd / spd;
    b.vy *= maxSpd / spd;
  }
}

export function stepBullets(world: World, dt: number): void {
  for (const b of world.bullets.values()) {
    if (b.drone) steerDrone(world, b, dt);
    else b.life -= dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.drone) {
      if (b.x < 8) {
        b.x = 8;
        b.vx = Math.abs(b.vx);
      }
      if (b.y < 8) {
        b.y = 8;
        b.vy = Math.abs(b.vy);
      }
      if (b.x > ARENA - 8) {
        b.x = ARENA - 8;
        b.vx = -Math.abs(b.vx);
      }
      if (b.y > ARENA - 8) {
        b.y = ARENA - 8;
        b.vy = -Math.abs(b.vy);
      }
    }
    if (b.life <= 0 || b.hp <= 0 || (!b.drone && (b.x < 0 || b.y < 0 || b.x > ARENA || b.y > ARENA))) {
      world.bullets.delete(b.id);
    }
  }
}

/** Landmine fades when nearly still; self still sees a faint outline. */
export function cloakOpacity(classId: string, speed: number, self: boolean): number {
  if (classId !== "landmine") return 1;
  const fade = Math.max(0, Math.min(1, 1 - speed / 80));
  const floor = self ? 0.22 : 0.05;
  return 1 - fade * (1 - floor);
}

export function isCloaked(classId: string, vx: number, vy: number): boolean {
  return classId === "landmine" && Math.hypot(vx, vy) < 28;
}

export function burstCount(radius: number): number {
  return Math.max(6, Math.min(18, Math.round(radius * 0.55)));
}

export function spawnBurst(
  world: World,
  x: number,
  y: number,
  color: string,
  radius: number,
): void {
  const n = burstCount(radius);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const spd = 70 + Math.random() * 160 + radius * 1.2;
    world.bursts.push({
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd,
      r: 2.5 + Math.random() * 3.5,
      born: world.time,
      life: 0.28 + Math.random() * 0.22,
      color,
    });
  }
  if (world.bursts.length > 220) world.bursts.splice(0, world.bursts.length - 220);
}

export function stepBursts(world: World, dt: number): void {
  for (let i = world.bursts.length - 1; i >= 0; i--) {
    const p = world.bursts[i]!;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    if (world.time - p.born > p.life) world.bursts.splice(i, 1);
  }
}

function killTank(world: World, tank: Tank, killer: Tank | undefined): void {
  spawnBurst(world, tank.x, tank.y, tank.isBot ? "#e85d75" : "#00b2e1", tank.radius);
  tank.alive = false;
  tank.hp = 0;
  tank.vx = 0;
  tank.vy = 0;
  if (killer && killer.id !== tank.id && killer.alive) {
    killer.kills += 1;
    addScore(world, killer, scoreForKill(tank.score));
  }
  if (tank.id === world.playerId) {
    world.death = {
      killerName: killer?.name ?? "the arena",
      killerClass: killer ? TANK_DEFS[killer.classId].name : "Arena",
      score: tank.score,
      level: tank.level,
      className: TANK_DEFS[tank.classId].name,
      kills: tank.kills,
    };
  } else {
    tank.respawnT = 2.5;
  }
}

function fillCombatHash(world: World, tanks: Tank[]): void {
  const hash = world.hash;
  hash.clear();
  for (const t of tanks) {
    if (!t.alive) continue;
    hash.insert({ id: t.id, x: t.x, y: t.y, r: t.radius, tag: "tank" });
  }
  for (const s of world.shapes.values()) {
    hash.insert({ id: s.id, x: s.x, y: s.y, r: s.radius, tag: "shape" });
  }
}

export function resolveCombat(world: World): void {
  const tanks = [...world.tanks.values()].filter((t) => t.alive);
  fillCombatHash(world, tanks);

  for (const b of [...world.bullets.values()]) {
    if (!world.bullets.has(b.id)) continue;
    for (const ref of world.hash.query(b.x, b.y, b.radius)) {
      if (!world.bullets.has(b.id)) break;
      if (ref.tag === "shape") {
        const s = world.shapes.get(ref.id);
        if (!s) continue;
        if (!circlesHit(b.x, b.y, b.radius, s.x, s.y, s.radius)) continue;
        const dmg = Math.min(b.hp, b.damage, s.hp);
        s.hp -= dmg;
        s.lastHitAt = world.time;
        b.hp -= Math.max(dmg, 0.8);
        knockbackFrom(s, b.x, b.y, 42);
        s.vx += b.vx * 0.12;
        s.vy += b.vy * 0.12;
        if (s.hp <= 0) {
          const owner = world.tanks.get(b.ownerId);
          if (owner) addScore(world, owner, s.score);
          spawnBurst(world, s.x, s.y, s.color, s.radius);
          world.shapes.delete(s.id);
        }
        if (b.hp <= 0) world.bullets.delete(b.id);
        continue;
      }
      if (ref.tag !== "tank" || ref.id === b.ownerId) continue;
      const t = world.tanks.get(ref.id);
      if (!t || !t.alive) continue;
      if (!circlesHit(b.x, b.y, b.radius, t.x, t.y, t.radius)) continue;
      const dmg = Math.min(b.damage, b.hp);
      t.hp -= dmg;
      t.lastHitAt = world.time;
      t.lastHitBy = b.ownerId;
      b.hp -= 1;
      knockbackFrom(t, b.x, b.y, 28);
      if (b.hp <= 0) world.bullets.delete(b.id);
      if (t.hp <= 0) killTank(world, t, world.tanks.get(b.ownerId));
    }
  }

  for (let i = 0; i < tanks.length; i++) {
    const a = tanks[i]!;
    if (!a.alive) continue;
    for (let j = i + 1; j < tanks.length; j++) {
      const b = tanks[j]!;
      if (!b.alive) continue;
      if (!circlesHit(a.x, a.y, a.radius, b.x, b.y, b.radius)) continue;
      separateCircles(a, b);
      a.hp -= derivedBodyDamage(b) * 0.12;
      b.hp -= derivedBodyDamage(a) * 0.12;
      a.lastHitAt = world.time;
      b.lastHitAt = world.time;
      a.lastHitBy = b.id;
      b.lastHitBy = a.id;
      if (a.hp <= 0) killTank(world, a, b);
      if (b.hp <= 0) killTank(world, b, a);
    }
    for (const ref of world.hash.query(a.x, a.y, a.radius)) {
      if (ref.tag !== "shape") continue;
      const s = world.shapes.get(ref.id);
      if (!s) continue;
      if (!circlesHit(a.x, a.y, a.radius, s.x, s.y, s.radius)) continue;
      const dummy = { x: s.x, y: s.y, vx: s.vx, vy: s.vy, radius: s.radius };
      separateCircles(a, dummy);
      s.x = dummy.x;
      s.y = dummy.y;
      s.vx = dummy.vx;
      s.vy = dummy.vy;
      s.hp -= derivedBodyDamage(a) * 0.2;
      s.lastHitAt = world.time;
      a.hp -= 0.15;
      a.lastHitAt = world.time;
      if (s.hp <= 0) {
        addScore(world, a, s.score);
        spawnBurst(world, s.x, s.y, s.color, s.radius);
        world.shapes.delete(s.id);
      }
      if (a.hp <= 0) {
        killTank(world, a, undefined);
        break;
      }
    }
    const c = clampArena(a.x, a.y, a.radius);
    a.x = c.x;
    a.y = c.y;
  }
}

export function regenTanks(world: World, dt: number): void {
  for (const t of world.tanks.values()) {
    if (!t.alive) continue;
    t.maxHp = derivedMaxHp(t.level, t.stats);
    if (world.time - t.lastHitAt < REGEN_DELAY) continue;
    t.hp = Math.min(t.maxHp, t.hp + derivedRegen(t.stats) * dt);
  }
}
