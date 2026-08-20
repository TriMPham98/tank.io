import { ARENA, CAMERA_LERP, VIEW_WIDTH } from "../config/constants.ts";
import { TANK_DEFS } from "../config/tankDefs.ts";
import type { Tank } from "../sim/types.ts";

export type Camera = {
  x: number;
  y: number;
  scale: number;
  kickX: number;
  kickY: number;
  lvx: number;
  lvy: number;
  hitStamp: number;
};

export function createCamera(tank: Tank): Camera {
  return {
    x: tank.x,
    y: tank.y,
    scale: 1,
    kickX: 0,
    kickY: 0,
    lvx: tank.vx,
    lvy: tank.vy,
    hitStamp: tank.lastHitAt,
  };
}

export function updateCamera(cam: Camera, tank: Tank, canvas: HTMLCanvasElement, dt: number): void {
  const k = 1 - Math.exp(-CAMERA_LERP * dt);
  cam.kickX += (tank.vx - cam.lvx) * 0.48;
  cam.kickY += (tank.vy - cam.lvy) * 0.48;
  if (tank.lastHitAt > cam.hitStamp) {
    cam.hitStamp = tank.lastHitAt;
    cam.kickX += (tank.vx - cam.lvx) * 2.4;
    cam.kickY += (tank.vy - cam.lvy) * 2.4;
    const away = tank.angle + Math.PI;
    cam.kickX += Math.cos(away) * 22;
    cam.kickY += Math.sin(away) * 22;
  }
  const decay = Math.exp(-11 * dt);
  cam.kickX *= decay;
  cam.kickY *= decay;
  const mag = Math.hypot(cam.kickX, cam.kickY);
  if (mag > 90) {
    cam.kickX *= 90 / mag;
    cam.kickY *= 90 / mag;
  }
  cam.lvx = tank.vx;
  cam.lvy = tank.vy;
  cam.x += (tank.x + cam.kickX - cam.x) * k;
  cam.y += (tank.y + cam.kickY - cam.y) * k;
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

export function worldViewBounds(
  cam: Camera,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number; w: number; h: number } {
  const hw = canvasWidth / (2 * Math.max(0.001, cam.scale));
  const hh = canvasHeight / (2 * Math.max(0.001, cam.scale));
  return { x: cam.x - hw, y: cam.y - hh, w: hw * 2, h: hh * 2 };
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
