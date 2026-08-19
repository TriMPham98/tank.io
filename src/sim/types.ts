import type { TankClassId } from "../config/tankDefs.ts";
import type { ShapeKind } from "../config/shapeDefs.ts";

export type EntityId = number;

export type Stats = [number, number, number, number, number, number, number, number];

export type Tank = {
  id: EntityId;
  kind: "tank";
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  px: number;
  py: number;
  pa: number;
  radius: number;
  hp: number;
  maxHp: number;
  level: number;
  score: number;
  skillPoints: number;
  stats: Stats;
  classId: TankClassId;
  barrelT: number[];
  alive: boolean;
  isBot: boolean;
  lastHitAt: number;
  lastHitBy: EntityId | null;
  regenT: number;
  autoFire: boolean;
  autoSpin: boolean;
  respawnT: number;
};

export type Bullet = {
  id: EntityId;
  kind: "bullet";
  ownerId: EntityId;
  fromBot: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  px: number;
  py: number;
  radius: number;
  hp: number;
  damage: number;
  life: number;
};

export type Shape = {
  id: EntityId;
  kind: "shape";
  shapeKind: ShapeKind;
  sides: 4 | 3 | 5;
  x: number;
  y: number;
  angle: number;
  spin: number;
  px: number;
  py: number;
  pa: number;
  radius: number;
  hp: number;
  maxHp: number;
  score: number;
  color: string;
};

export type PlayerInput = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  aimX: number;
  aimY: number;
  fire: boolean;
  autoFireToggle: boolean;
  autoSpinToggle: boolean;
  statBuys: number[];
  classPick: TankClassId | null;
  respawn: boolean;
};

export const EMPTY_INPUT: PlayerInput = {
  up: false,
  down: false,
  left: false,
  right: false,
  aimX: 0,
  aimY: 0,
  fire: false,
  autoFireToggle: false,
  autoSpinToggle: false,
  statBuys: [],
  classPick: null,
  respawn: false,
};

export type World = {
  nextId: number;
  tick: number;
  time: number;
  tanks: Map<EntityId, Tank>;
  bullets: Map<EntityId, Bullet>;
  shapes: Map<EntityId, Shape>;
  playerId: EntityId;
  death: { killerName: string } | null;
};

export function allocId(world: World): EntityId {
  return world.nextId++;
}
