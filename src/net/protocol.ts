import type { PlayerInput } from "../sim/types.ts";
import type { Bullet, Shape, Tank } from "../sim/types.ts";

/** Types only — unused in v1. Future server snapshots. */
export type ClientCmd = { seq: number; dt: number; input: PlayerInput };

export type Snapshot = {
  tick: number;
  you: number;
  tanks: Tank[];
  bullets: Bullet[];
  shapes: Shape[];
};
