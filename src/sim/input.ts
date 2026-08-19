import type { TankClassId } from "../config/tankDefs.ts";
import type { PlayerInput } from "./types.ts";
import { EMPTY_INPUT } from "./types.ts";
import type { Camera } from "../render/camera.ts";
import { screenToWorld } from "../render/camera.ts";
import { availableUpgrades, hitHud } from "../render/hud.ts";
import type { World } from "./types.ts";

export type InputSampler = {
  sample: (world: World, cam: Camera, canvas: HTMLCanvasElement) => PlayerInput;
};

export function createInput(canvas: HTMLCanvasElement): InputSampler {
  const keys = new Set<string>();
  let mouseDown = false;
  let mx = 0;
  let my = 0;
  let autoFireToggle = false;
  let autoSpinToggle = false;
  const statBuys: number[] = [];
  let classPick: TankClassId | null = null;
  let respawn = false;

  window.addEventListener("keydown", (e) => {
    keys.add(e.code);
    if (e.code === "KeyE") autoFireToggle = true;
    if (e.code === "KeyC") autoSpinToggle = true;
    const digit = /^Digit([1-8])$/.exec(e.code);
    if (digit) statBuys.push(Number(digit[1]) - 1);
    if (e.code === "Space") e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
  });
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    my = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const hit = hitHud(mx, my);
    if (hit?.kind === "stat") {
      statBuys.push(hit.index);
      return;
    }
    if (hit?.kind === "class") {
      classPick = hit.classId;
      return;
    }
    if (hit?.kind === "respawn") {
      respawn = true;
      return;
    }
    mouseDown = true;
  });
  window.addEventListener("mouseup", () => {
    mouseDown = false;
  });
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    my = ((e.clientY - rect.top) / rect.height) * canvas.height;
  });

  return {
    sample(world, cam, cvs) {
      const aim = screenToWorld(cam, cvs, mx, my);
      const player = world.tanks.get(world.playerId);
      const ups = player ? availableUpgrades(player) : [];
      if (keys.has("KeyY") && ups[0]) classPick = ups[0];
      if (keys.has("KeyU") && ups[1]) classPick = ups[1];
      if (keys.has("KeyI") && ups[2]) classPick = ups[2];
      if (keys.has("KeyO") && ups[3]) classPick = ups[3];

      const input: PlayerInput = {
        ...EMPTY_INPUT,
        up: keys.has("KeyW") || keys.has("ArrowUp"),
        down: keys.has("KeyS") || keys.has("ArrowDown"),
        left: keys.has("KeyA") || keys.has("ArrowLeft"),
        right: keys.has("KeyD") || keys.has("ArrowRight"),
        aimX: aim.x,
        aimY: aim.y,
        fire: mouseDown || keys.has("Space"),
        autoFireToggle,
        autoSpinToggle,
        statBuys: statBuys.splice(0),
        classPick,
        respawn,
      };
      autoFireToggle = false;
      autoSpinToggle = false;
      classPick = null;
      respawn = false;
      return input;
    },
  };
}
