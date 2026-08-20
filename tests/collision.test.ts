import { describe, expect, it } from "vitest";
import {
  SpatialHash,
  circlesHit,
  overlapAmount,
  separateCircles,
} from "../src/sim/collision.ts";
import { createWorld } from "../src/sim/world.ts";
import { spawnShape, unstackShapes } from "../src/sim/spawn.ts";

describe("circles", () => {
  it("detects overlap", () => {
    expect(circlesHit(0, 0, 10, 15, 0, 10)).toBe(true);
    expect(circlesHit(0, 0, 10, 50, 0, 10)).toBe(false);
  });

  it("computes overlap amount", () => {
    expect(overlapAmount(0, 0, 10, 10, 0, 10)).toBeCloseTo(10);
  });

  it("separates overlapping tanks without NaN", () => {
    const a = { x: 0, y: 0, vx: 5, vy: 0, radius: 10 };
    const b = { x: 12, y: 0, vx: -5, vy: 0, radius: 10 };
    separateCircles(a, b);
    expect(Number.isFinite(a.x)).toBe(true);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(19.9);
  });
});

describe("spatial hash", () => {
  it("does not pair distant circles", () => {
    const h = new SpatialHash(64);
    h.insert({ id: 1, x: 0, y: 0, r: 10, tag: "tank" });
    h.insert({ id: 2, x: 800, y: 800, r: 10, tag: "tank" });
    const near = h.query(0, 0, 10);
    expect(near.some((r) => r.id === 1)).toBe(true);
    expect(near.some((r) => r.id === 2)).toBe(false);
  });
});

describe("shape unstack", () => {
  it("pushes overlapping squares apart", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const a = spawnShape(world, "square");
    const b = spawnShape(world, "square");
    a.x = 500;
    a.y = 500;
    b.x = 508;
    b.y = 500;
    unstackShapes(world);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(a.radius + b.radius - 0.2);
    a.x = 500;
    a.y = 500;
    b.x = 508;
    b.y = 500;
    unstackShapes(world);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(a.radius + b.radius - 0.2);
    expect(world.hash.buckets.size).toBeGreaterThan(0);
  });
});
