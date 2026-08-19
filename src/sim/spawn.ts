import { ARENA, NEST_SIZE, SHAPE_TARGETS } from "../config/constants.ts";
import { SHAPE_DEFS, type ShapeKind } from "../config/shapeDefs.ts";
import type { Shape, World } from "./types.ts";
import { allocId } from "./types.ts";

function countKind(world: World, kind: ShapeKind): number {
  let n = 0;
  for (const s of world.shapes.values()) if (s.shapeKind === kind) n++;
  return n;
}

function nestBias(): boolean {
  return Math.random() < 0.35;
}

function randomPos(kind: ShapeKind): { x: number; y: number } {
  const margin = 40;
  if (kind === "pentagon" && nestBias()) {
    const cx = ARENA / 2;
    const cy = ARENA / 2;
    const half = NEST_SIZE / 2;
    return {
      x: cx - half + Math.random() * NEST_SIZE,
      y: cy - half + Math.random() * NEST_SIZE,
    };
  }
  return {
    x: margin + Math.random() * (ARENA - margin * 2),
    y: margin + Math.random() * (ARENA - margin * 2),
  };
}

export function spawnShape(world: World, kind: ShapeKind): Shape {
  const def = SHAPE_DEFS[kind];
  const pos = randomPos(kind);
  const shape: Shape = {
    id: allocId(world),
    kind: "shape",
    shapeKind: kind,
    sides: def.sides,
    x: pos.x,
    y: pos.y,
    angle: Math.random() * Math.PI * 2,
    spin: def.spin * (Math.random() < 0.5 ? -1 : 1),
    px: pos.x,
    py: pos.y,
    pa: 0,
    radius: def.radius,
    hp: def.hp,
    maxHp: def.hp,
    score: def.score,
    color: def.color,
  };
  world.shapes.set(shape.id, shape);
  return shape;
}

export function seedShapes(world: World): void {
  for (let i = 0; i < SHAPE_TARGETS.square; i++) spawnShape(world, "square");
  for (let i = 0; i < SHAPE_TARGETS.triangle; i++) spawnShape(world, "triangle");
  for (let i = 0; i < SHAPE_TARGETS.pentagon; i++) spawnShape(world, "pentagon");
}

export function maintainShapes(world: World): void {
  const missing: ShapeKind[] = [];
  if (countKind(world, "square") < SHAPE_TARGETS.square) missing.push("square");
  if (countKind(world, "triangle") < SHAPE_TARGETS.triangle) missing.push("triangle");
  if (countKind(world, "pentagon") < SHAPE_TARGETS.pentagon) missing.push("pentagon");
  for (const kind of missing) spawnShape(world, kind);
}

export function spinShapes(world: World, dt: number): void {
  for (const s of world.shapes.values()) {
    s.angle += s.spin * dt;
  }
}
