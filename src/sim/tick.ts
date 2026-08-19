import { TANK_DEFS } from "../config/tankDefs.ts";
import { tankRadius } from "../config/constants.ts";
import type { PlayerInput, World } from "./types.ts";
import { EMPTY_INPUT } from "./types.ts";
import { emptyStats, randomArenaPos } from "./world.ts";
import { applyMovement } from "./physics.ts";
import { fireBarrels, regenTanks, resolveCombat, stepBullets } from "./combat.ts";
import { maintainShapes, spinShapes } from "./spawn.ts";
import { buyStat, pickClass, derivedMaxHp } from "./xp.ts";
import type { Tank } from "./types.ts";

function resetTank(tank: Tank): void {
  const pos = randomArenaPos();
  tank.x = pos.x;
  tank.y = pos.y;
  tank.px = pos.x;
  tank.py = pos.y;
  tank.vx = 0;
  tank.vy = 0;
  tank.score = 0;
  tank.level = 1;
  tank.skillPoints = 0;
  tank.stats = emptyStats();
  tank.classId = "basic";
  tank.barrelT = TANK_DEFS.basic.barrels.map((b) => b.delay);
  tank.radius = tankRadius(1);
  tank.maxHp = derivedMaxHp(1, tank.stats);
  tank.hp = tank.maxHp;
  tank.alive = true;
  tank.respawnT = 0;
  tank.lastHitBy = null;
  tank.lastHitAt = -999;
}

export function tick(world: World, inputs: Map<number, PlayerInput>, dt: number): void {
  world.tick += 1;
  world.time += dt;

  for (const tank of world.tanks.values()) {
    const input = inputs.get(tank.id) ?? EMPTY_INPUT;
    if (!tank.alive) {
      if (tank.isBot) {
        tank.respawnT -= dt;
        if (tank.respawnT <= 0) resetTank(tank);
      } else if (input.respawn && tank.id === world.playerId) {
        resetTank(tank);
        world.death = null;
      }
      continue;
    }

    if (input.autoFireToggle) tank.autoFire = !tank.autoFire;
    if (input.autoSpinToggle) tank.autoSpin = !tank.autoSpin;

    for (const s of input.statBuys) buyStat(tank, s);
    if (input.classPick) pickClass(tank, input.classPick);

    if (tank.autoSpin) tank.angle += 2.2 * dt;
    else tank.angle = Math.atan2(input.aimY - tank.y, input.aimX - tank.x);

    let dx = 0;
    let dy = 0;
    if (input.right) dx += 1;
    if (input.left) dx -= 1;
    if (input.down) dy += 1;
    if (input.up) dy -= 1;
    applyMovement(tank, dt, dx, dy);

    const wantFire = tank.alive && (input.fire || tank.autoFire);
    fireBarrels(world, tank, dt, wantFire);
  }

  stepBullets(world, dt);
  spinShapes(world, dt);
  resolveCombat(world);
  regenTanks(world, dt);
  maintainShapes(world);
}
