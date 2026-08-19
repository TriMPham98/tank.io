import { COLORS } from "./constants.ts";

export type ShapeKind = "square" | "triangle" | "pentagon";

export type ShapeDef = {
  kind: ShapeKind;
  sides: 4 | 3 | 5;
  hp: number;
  score: number;
  radius: number;
  color: string;
  spin: number;
};

export const SHAPE_DEFS: Record<ShapeKind, ShapeDef> = {
  square: {
    kind: "square",
    sides: 4,
    hp: 10,
    score: 10,
    radius: 20,
    color: COLORS.square,
    spin: 0.4,
  },
  triangle: {
    kind: "triangle",
    sides: 3,
    hp: 30,
    score: 25,
    radius: 22,
    color: COLORS.triangle,
    spin: 0.55,
  },
  pentagon: {
    kind: "pentagon",
    sides: 5,
    hp: 100,
    score: 130,
    radius: 30,
    color: COLORS.pentagon,
    spin: 0.25,
  },
};
