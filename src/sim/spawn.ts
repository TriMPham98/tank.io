import { ARENA, NEST_SIZE, SHAPE_TARGETS, TANK_FRICTION } from "../config/constants.ts";
import { clampArena } from "./physics.ts";
import { circlesHit, separateCircles } from "./collision.ts";
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
    vx: 0,
    vy: 0,
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
    lastHitAt: -999,
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

export function unstackShapes(world: World): void {
  const hash = world.hash;
  hash.clear();
  for (const s of world.shapes.values()) {
    hash.insert({ id: s.id, x: s.x, y: s.y, r: s.radius, tag: "shape" });
  }
  const seen = new Set<string>();
  for (const s of world.shapes.values()) {
    for (const ref of hash.query(s.x, s.y, s.radius)) {
      if (ref.id === s.id) continue;
      const a = s.id < ref.id ? s.id : ref.id;
      const b = s.id < ref.id ? ref.id : s.id;
      const key = a + ":" + b;
      if (seen.has(key)) continue;
      seen.add(key);
      const o = world.shapes.get(ref.id);
      if (!o) continue;
      if (!circlesHit(s.x, s.y, s.radius, o.x, o.y, o.radius)) continue;
      separateCircles(s, o, 0.28);
    }
  }
}

export function spinShapes(world: World, dt: number): void {
  const damp = Math.exp(-TANK_FRICTION * 0.55 * dt);
  for (const s of world.shapes.values()) {
    s.angle += s.spin * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= damp;
    s.vy *= damp;
    const c = clampArena(s.x, s.y, s.radius);
    s.x = c.x;
    s.y = c.y;
  }
}
