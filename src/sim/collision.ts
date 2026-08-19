import { HASH_CELL, KNOCKBACK } from "../config/constants.ts";

export type CircleRef = {
  id: number;
  x: number;
  y: number;
  r: number;
  tag: "tank" | "bullet" | "shape";
};

export class SpatialHash {
  readonly cell: number;
  buckets = new Map<number, CircleRef[]>();

  constructor(cell = HASH_CELL) {
    this.cell = cell;
  }

  clear(): void {
    this.buckets.clear();
  }

  private key(cx: number, cy: number): number {
    return cx * 73856093 + cy * 19349663;
  }

  insert(ref: CircleRef): void {
    const minX = Math.floor((ref.x - ref.r) / this.cell);
    const maxX = Math.floor((ref.x + ref.r) / this.cell);
    const minY = Math.floor((ref.y - ref.r) / this.cell);
    const maxY = Math.floor((ref.y + ref.r) / this.cell);
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const k = this.key(cx, cy);
        let bin = this.buckets.get(k);
        if (!bin) {
          bin = [];
          this.buckets.set(k, bin);
        }
        bin.push(ref);
      }
    }
  }

  query(x: number, y: number, r: number): CircleRef[] {
    const minX = Math.floor((x - r) / this.cell);
    const maxX = Math.floor((x + r) / this.cell);
    const minY = Math.floor((y - r) / this.cell);
    const maxY = Math.floor((y + r) / this.cell);
    const out: CircleRef[] = [];
    const seen = new Set<string>();
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const bin = this.buckets.get(this.key(cx, cy));
        if (!bin) continue;
        for (const ref of bin) {
          const sid = ref.tag + ":" + ref.id;
          if (seen.has(sid)) continue;
          seen.add(sid);
          out.push(ref);
        }
      }
    }
    return out;
  }
}

export function overlapAmount(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): number {
  const d = Math.hypot(bx - ax, by - ay);
  return ar + br - d;
}

export function circlesHit(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const rr = ar + br;
  return dx * dx + dy * dy < rr * rr;
}

export function separateCircles(
  a: { x: number; y: number; vx: number; vy: number; radius: number },
  b: { x: number; y: number; vx: number; vy: number; radius: number },
  knock = KNOCKBACK,
): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 0.0001;
  const overlap = a.radius + b.radius - dist;
  if (overlap <= 0) return;
  const nx = dx / dist;
  const ny = dy / dist;
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;
  const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  const j = rel * knock;
  a.vx -= j * nx;
  a.vy -= j * ny;
  b.vx += j * nx;
  b.vy += j * ny;
}

export function knockbackFrom(
  target: { x: number; y: number; vx: number; vy: number },
  fromX: number,
  fromY: number,
  force: number,
): void {
  const dx = target.x - fromX;
  const dy = target.y - fromY;
  const dist = Math.hypot(dx, dy) || 0.0001;
  target.vx += (dx / dist) * force;
  target.vy += (dy / dist) * force;
}
