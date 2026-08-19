import { ARENA, CAMERA_LERP, VIEW_WIDTH } from "../config/constants.ts";
import { TANK_DEFS } from "../config/tankDefs.ts";
import type { Tank } from "../sim/types.ts";

export type Camera = {
  x: number;
  y: number;
  scale: number;
};

export function createCamera(tank: Tank): Camera {
  return { x: tank.x, y: tank.y, scale: 1 };
}

export function updateCamera(cam: Camera, tank: Tank, canvas: HTMLCanvasElement, dt: number): void {
  const k = 1 - Math.exp(-CAMERA_LERP * dt);
  cam.x += (tank.x - cam.x) * k;
  cam.y += (tank.y - cam.y) * k;
  const fov = TANK_DEFS[tank.classId].fov;
  const target = canvas.width / (VIEW_WIDTH * fov);
  cam.scale += (target - cam.scale) * k;
}

export function worldToScreen(
  cam: Camera,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: (x - cam.x) * cam.scale + canvas.width / 2,
    y: (y - cam.y) * cam.scale + canvas.height / 2,
  };
}

export function screenToWorld(
  cam: Camera,
  canvas: HTMLCanvasElement,
  sx: number,
  sy: number,
): { x: number; y: number } {
  return {
    x: (sx - canvas.width / 2) / cam.scale + cam.x,
    y: (sy - canvas.height / 2) / cam.scale + cam.y,
  };
}

export function applyCamera(ctx: CanvasRenderingContext2D, cam: Camera, canvas: HTMLCanvasElement): void {
  ctx.setTransform(
    cam.scale,
    0,
    0,
    cam.scale,
    canvas.width / 2 - cam.x * cam.scale,
    canvas.height / 2 - cam.y * cam.scale,
  );
}

export function clampCam(_cam: Camera): void {
  void ARENA;
}
