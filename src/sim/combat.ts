import {
  ARENA,
  BULLET_LIFE,
  BULLET_RADIUS,
  MAX_BULLETS,
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

export function fireBarrels(world: World, tank: Tank, dt: number, wantFire: boolean): void {
  const def = TANK_DEFS[tank.classId];
  for (let i = 0; i < def.barrels.length; i++) {
    const barrel = def.barrels[i]!;
    tank.barrelT[i] = (tank.barrelT[i] ?? 0) - dt;
    if (!wantFire || tank.barrelT[i]! > 0) continue;
    if (world.bullets.size >= MAX_BULLETS) continue;

    tank.barrelT[i] = derivedReload(tank.stats, barrel.reload);

    const ang = tank.angle + barrel.offsetAngle + (Math.random() * 2 - 1) * barrel.spread;
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
      life: BULLET_LIFE,
    };
    world.bullets.set(bullet.id, bullet);
    tank.vx -= c * barrel.recoil;
    tank.vy -= s * barrel.recoil;
  }
}

export function stepBullets(world: World, dt: number): void {
  for (const b of world.bullets.values()) {
    b.life -= dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.life <= 0 || b.x < 0 || b.y < 0 || b.x > ARENA || b.y > ARENA || b.hp <= 0) {
      world.bullets.delete(b.id);
    }
  }
}

function killTank(world: World, tank: Tank, killer: Tank | undefined): void {
  tank.alive = false;
  tank.hp = 0;
  tank.vx = 0;
  tank.vy = 0;
  if (killer && killer.id !== tank.id && killer.alive) {
    addScore(world, killer, scoreForKill(tank.score));
  }
  if (tank.id === world.playerId) {
    world.death = { killerName: killer?.name ?? "the arena" };
  } else {
    tank.respawnT = 2.5;
  }
}

export function resolveCombat(world: World): void {
  const tanks = [...world.tanks.values()].filter((t) => t.alive);
  const bullets = [...world.bullets.values()];
  const shapes = [...world.shapes.values()];

  for (const b of bullets) {
    for (const s of shapes) {
      if (!world.shapes.has(s.id) || !world.bullets.has(b.id)) continue;
      if (!circlesHit(b.x, b.y, b.radius, s.x, s.y, s.radius)) continue;
      const dmg = Math.min(b.hp, b.damage, s.hp);
      s.hp -= dmg;
      b.hp -= Math.max(dmg, 0.8);
      if (s.hp <= 0) {
        const owner = world.tanks.get(b.ownerId);
        if (owner) addScore(world, owner, s.score);
        world.shapes.delete(s.id);
      }
      if (b.hp <= 0) world.bullets.delete(b.id);
    }
    for (const t of tanks) {
      if (t.id === b.ownerId) continue;
      if (!world.bullets.has(b.id) || !t.alive) continue;
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
    for (const s of [...world.shapes.values()]) {
      if (!circlesHit(a.x, a.y, a.radius, s.x, s.y, s.radius)) continue;
      const dummy = { x: s.x, y: s.y, vx: 0, vy: 0, radius: s.radius };
      separateCircles(a, dummy);
      s.x = dummy.x;
      s.y = dummy.y;
      s.hp -= derivedBodyDamage(a) * 0.2;
      a.hp -= 0.15;
      a.lastHitAt = world.time;
      if (s.hp <= 0) {
        addScore(world, a, s.score);
        world.shapes.delete(s.id);
      }
      if (a.hp <= 0) killTank(world, a, undefined);
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
