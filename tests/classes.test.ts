import { describe, expect, it } from "vitest";
import { TANK_DEFS } from "../src/config/tankDefs.ts";
import { createWorld } from "../src/sim/world.ts";
import { pickClass } from "../src/sim/xp.ts";
import { tick } from "../src/sim/tick.ts";
import { EMPTY_INPUT, type PlayerInput } from "../src/sim/types.ts";
import { DT } from "../src/config/constants.ts";

describe("class upgrades", () => {
  it("cannot pick Twin at level 14", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 14;
    expect(pickClass(tank, "twin")).toBe(false);
    expect(tank.classId).toBe("basic");
  });

  it("Twin at 15 fires two bullets", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "twin")).toBe(true);
    expect(TANK_DEFS.twin.barrels.length).toBe(2);
    tank.barrelT = [0, 0];
    const input: PlayerInput = {
      ...EMPTY_INPUT,
      fire: true,
      aimX: tank.x + 100,
      aimY: tank.y,
    };
    const inputs = new Map<number, PlayerInput>();
    inputs.set(tank.id, input);
    tick(world, inputs, DT);
    expect(world.bullets.size).toBe(2);
  });
});
