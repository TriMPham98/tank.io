import { describe, expect, it } from "vitest";
import { DT } from "../src/config/constants.ts";
import { createWorld } from "../src/sim/world.ts";
import { tick } from "../src/sim/tick.ts";
import { EMPTY_INPUT, type PlayerInput } from "../src/sim/types.ts";
import { spawnShape } from "../src/sim/spawn.ts";
import { SHAPE_DEFS } from "../src/config/shapeDefs.ts";
import { hitFlash, muzzleFlashAlpha } from "../src/render/draw.ts";
import { makeTank } from "../src/sim/world.ts";
import { burstCount, resolveCombat, spawnBurst, stepBursts } from "../src/sim/combat.ts";
import { modeHints, scoreBarLabel } from "../src/render/hud.ts";

describe("tick", () => {
  it("does not leak bullets over 600 fire frames", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    const input: PlayerInput = {
      ...EMPTY_INPUT,
      fire: true,
      aimX: tank.x + 40,
      aimY: tank.y,
    };
    const inputs = new Map<number, PlayerInput>();
    inputs.set(tank.id, input);
    for (let i = 0; i < 600; i++) {
      tank.x = 400;
      tank.y = 400;
      input.aimX = tank.x + 40;
      input.aimY = tank.y;
      tick(world, inputs, DT);
    }
    expect(world.bullets.size).toBeLessThan(80);
  });

  it("killing a square grants 10 score and it can respawn", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    const s = spawnShape(world, "square");
    s.x = tank.x + 30;
    s.y = tank.y;
    s.hp = 1;
    const input: PlayerInput = {
      ...EMPTY_INPUT,
      fire: true,
      aimX: s.x,
      aimY: s.y,
    };
    const inputs = new Map([[tank.id, input]]);
    for (let i = 0; i < 40; i++) tick(world, inputs, DT);
    expect(tank.score).toBeGreaterThanOrEqual(SHAPE_DEFS.square.score);
    expect(world.shapes.size).toBeGreaterThanOrEqual(1);
  });

  it("death bursts scale with size and fade out", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    world.time = 1;
    spawnBurst(world, 400, 400, "#ffe066", 20);
    expect(world.bursts.length).toBe(burstCount(20));
    expect(burstCount(36)).toBeGreaterThan(burstCount(12));
    const first = world.bursts[0]!;
    const ox = first.x;
    stepBursts(world, DT);
    expect(Math.hypot(first.x - ox, first.y - 400)).toBeGreaterThan(0);
    for (let i = 0; i < 50; i++) {
      world.time += DT;
      stepBursts(world, DT);
    }
    expect(world.bursts.length).toBe(0);
  });

  it("bullets knock shapes away", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.x = 400;
    tank.y = 400;
    const s = spawnShape(world, "square");
    s.x = tank.x + 90;
    s.y = tank.y;
    s.hp = 200;
    const startX = s.x;
    const input: PlayerInput = {
      ...EMPTY_INPUT,
      fire: true,
      aimX: s.x,
      aimY: s.y,
    };
    const inputs = new Map([[tank.id, input]]);
    for (let i = 0; i < 45; i++) tick(world, inputs, DT);
    expect(s.x).toBeGreaterThan(startX + 4);
    expect(s.lastHitAt).toBeGreaterThan(0);
    expect(hitFlash(s.lastHitAt, s.lastHitAt)).toBe(1);
    expect(hitFlash(s.lastHitAt + 0.2, s.lastHitAt)).toBe(0);
    expect(muzzleFlashAlpha(1)).toBe(1);
    expect(muzzleFlashAlpha(0)).toBe(0);
    expect(muzzleFlashAlpha(0.64)).toBeGreaterThan(0.4);
  });

  it("snapshots score and class on player death", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const player = world.tanks.get(world.playerId)!;
    player.x = 400;
    player.y = 400;
    player.hp = 0.05;
    player.score = 321;
    player.level = 12;
    player.kills = 4;
    const bot = makeTank(world, { name: "Hex", x: 408, y: 400, isBot: true });
    bot.classId = "sniper";
    resolveCombat(world);
    expect(player.alive).toBe(false);
    expect(world.death?.score).toBe(321);
    expect(world.death?.level).toBe(12);
    expect(world.death?.className).toBe("Tank");
    expect(world.death?.kills).toBe(4);
    expect(world.death?.killerName).toBe("Hex");
    expect(world.death?.killerClass).toBe("Sniper");
    expect(bot.kills).toBe(1);
  });

  it("labels score with kills and active fire modes", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const player = world.tanks.get(world.playerId)!;
    player.score = 40;
    player.kills = 1;
    player.autoFire = true;
    player.autoSpin = false;
    expect(scoreBarLabel(player)).toBe("Score 40  ·  1 kill");
    expect(modeHints(player)).toBe("AUTOFIRE");
    player.kills = 2;
    player.autoSpin = true;
    expect(scoreBarLabel(player)).toBe("Score 40  ·  2 kills");
    expect(modeHints(player)).toBe("AUTOFIRE  ·  AUTOSPIN");
  });
});
