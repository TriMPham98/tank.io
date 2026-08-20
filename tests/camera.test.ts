import { describe, expect, it } from "vitest";
import { DT } from "../src/config/constants.ts";
import { bulletTrailLength, nameplateText } from "../src/render/draw.ts";
import { createCamera, updateCamera, worldViewBounds } from "../src/render/camera.ts";
import { sfxCues } from "../src/render/sfx.ts";
import { minimapPentagons } from "../src/render/minimap.ts";
import { spawnShape } from "../src/sim/spawn.ts";
import { createWorld } from "../src/sim/world.ts";
import { pickClass } from "../src/sim/xp.ts";
import { tick } from "../src/sim/tick.ts";
import { EMPTY_INPUT, type PlayerInput } from "../src/sim/types.ts";

describe("camera kick", () => {
  it("shifts with destroyer recoil", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.x = 800;
    tank.y = 800;
    tank.level = 30;
    expect(pickClass(tank, "machineGun")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "destroyer")).toBe(true);
    tank.angle = 0;
    const cam = createCamera(tank);
    const canvas = { width: 920, height: 600 } as HTMLCanvasElement;
    updateCamera(cam, tank, canvas, DT);
    const before = cam.kickX;
    const input: PlayerInput = {
      ...EMPTY_INPUT,
      fire: true,
      aimX: tank.x + 80,
      aimY: tank.y,
    };
    tick(world, new Map([[tank.id, input]]), DT);
    updateCamera(cam, tank, canvas, DT);
    expect(cam.kickX).toBeLessThan(before - 8);
  });

  it("view bounds contain the tank and pentagons show on the minimap list", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.x = 900;
    tank.y = 700;
    const cam = createCamera(tank);
    cam.scale = 1;
    const view = worldViewBounds(cam, 920, 600);
    expect(view.x).toBeLessThan(tank.x);
    expect(view.x + view.w).toBeGreaterThan(tank.x);
    const p = spawnShape(world, "pentagon");
    p.x = 1600;
    p.y = 1600;
    const dots = minimapPentagons(world);
    expect(dots.some((d) => d.x === 1600 && d.y === 1600)).toBe(true);
  });

  it("punches kick when the tank takes a new hit", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.x = 800;
    tank.y = 800;
    tank.angle = 0;
    tank.vx = 40;
    const cam = createCamera(tank);
    const canvas = { width: 920, height: 600 } as HTMLCanvasElement;
    updateCamera(cam, tank, canvas, DT);
    const before = Math.hypot(cam.kickX, cam.kickY);
    tank.lastHitAt = tank.lastHitAt + 1;
    tank.vx = 180;
    updateCamera(cam, tank, canvas, DT);
    expect(Math.hypot(cam.kickX, cam.kickY)).toBeGreaterThan(before + 20);
  });
});

describe("nameplates", () => {
  it("includes name, class, and level for contrast overlay", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.name = "Ace";
    tank.level = 15;
    expect(pickClass(tank, "sniper")).toBe(true);
    expect(nameplateText(tank)).toBe("Ace · Sniper  L15");
  });
});

describe("bullet trails", () => {
  it("grows with speed and shell size", () => {
    expect(bulletTrailLength(400, 8)).toBeGreaterThan(bulletTrailLength(120, 8));
    expect(bulletTrailLength(300, 16)).toBeGreaterThan(bulletTrailLength(300, 8));
    expect(bulletTrailLength(2000, 40)).toBeLessThanOrEqual(48);
  });
});

describe("sfx cues", () => {
  it("fires hit when lastHitAt advances while alive, death when dying", () => {
    const prev = { lastHitAt: 0, level: 1, alive: true, bullets: 2 };
    expect(sfxCues(prev, { lastHitAt: 0.2, level: 1, alive: true, bullets: 2 })).toEqual(["hit"]);
    expect(sfxCues(prev, { lastHitAt: 0.2, level: 1, alive: false, bullets: 2 })).toEqual(["death"]);
    expect(sfxCues(prev, { lastHitAt: 0, level: 1, alive: true, bullets: 4 })).toEqual(["shoot"]);
  });
});
