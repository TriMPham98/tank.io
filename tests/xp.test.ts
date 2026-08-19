import { describe, expect, it } from "vitest";
import {
  SCORE_FOR_LEVEL,
  levelFromScore,
  skillPointsForLevel,
  totalSkillPointsAtLevel,
} from "../src/config/levels.ts";
import { createWorld } from "../src/sim/world.ts";
import { addScore, buyStat, derivedReload } from "../src/sim/xp.ts";

describe("levels", () => {
  it("maps score to level", () => {
    expect(levelFromScore(0)).toBe(1);
    expect(levelFromScore(SCORE_FOR_LEVEL[15]!)).toBe(15);
    expect(levelFromScore(SCORE_FOR_LEVEL[45]!)).toBe(45);
  });

  it("grants skill points on the 28 / skip 29 / 30 / +3 schedule", () => {
    expect(skillPointsForLevel(2)).toBe(1);
    expect(skillPointsForLevel(28)).toBe(1);
    expect(skillPointsForLevel(29)).toBe(0);
    expect(skillPointsForLevel(30)).toBe(1);
    expect(skillPointsForLevel(31)).toBe(0);
    expect(skillPointsForLevel(33)).toBe(1);
    expect(totalSkillPointsAtLevel(45)).toBe(33);
  });
});

describe("score and stats", () => {
  it("killing a square-worth of score levels eventually", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    addScore(world, tank, 10);
    expect(tank.score).toBe(10);
  });

  it("reload with 7 points is faster than 0", () => {
    expect(derivedReload([0, 0, 0, 0, 0, 0, 7, 0], 1)).toBeLessThan(
      derivedReload([0, 0, 0, 0, 0, 0, 0, 0], 1),
    );
  });

  it("cannot buy past 7 points", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.skillPoints = 20;
    for (let i = 0; i < 10; i++) buyStat(tank, 6);
    expect(tank.stats[6]).toBe(7);
    expect(tank.skillPoints).toBe(13);
  });
});
