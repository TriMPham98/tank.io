import { describe, expect, it } from "vitest";
import { DT } from "../src/config/constants.ts";
import { createWorld } from "../src/sim/world.ts";
import { tick } from "../src/sim/tick.ts";
import { EMPTY_INPUT, type PlayerInput } from "../src/sim/types.ts";
import { spawnShape } from "../src/sim/spawn.ts";
import { SHAPE_DEFS } from "../src/config/shapeDefs.ts";

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
});
