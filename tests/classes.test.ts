import { describe, expect, it } from "vitest";
import { TANK_DEFS } from "../src/config/tankDefs.ts";
import { createWorld } from "../src/sim/world.ts";
import { pickClass } from "../src/sim/xp.ts";
import { tick } from "../src/sim/tick.ts";
import { EMPTY_INPUT, type PlayerInput } from "../src/sim/types.ts";
import { DT } from "../src/config/constants.ts";
import { cloakOpacity, droneCount, isCloaked } from "../src/sim/combat.ts";
import { spawnShape } from "../src/sim/spawn.ts";

describe("class upgrades", () => {
  it("cannot pick Twin at level 14", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 14;
    expect(pickClass(tank, "twin")).toBe(false);
    expect(tank.classId).toBe("basic");
  });

  it("Twin at 15 staggers barrels instead of dumping both at once", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    tank.x = 400;
    tank.y = 400;
    expect(pickClass(tank, "twin")).toBe(true);
    expect(TANK_DEFS.twin.barrels.length).toBe(2);
    const input: PlayerInput = {
      ...EMPTY_INPUT,
      fire: true,
      aimX: tank.x + 100,
      aimY: tank.y,
    };
    const inputs = new Map<number, PlayerInput>();
    inputs.set(tank.id, input);
    tick(world, inputs, DT);
    expect(world.bullets.size).toBe(1);
    expect(tank.barrelKick[0]).toBe(1);
    expect(tank.barrelKick[1] ?? 0).toBeLessThan(0.2);
    let maxLive = world.bullets.size;
    const beforeId = world.nextId;
    for (let i = 0; i < 40; i++) {
      tick(world, inputs, DT);
      maxLive = Math.max(maxLive, world.bullets.size);
    }
    expect(maxLive).toBeGreaterThanOrEqual(2);
    expect(world.nextId - beforeId).toBeGreaterThanOrEqual(1);
  });

  it("Flank Guard unlocks Quad Tank and Tri-Angle at 30", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "flankGuard")).toBe(true);
    tank.level = 29;
    expect(pickClass(tank, "triAngle")).toBe(false);
    tank.level = 30;
    expect(TANK_DEFS.flankGuard.upgradesTo).toEqual(["quadTank", "triAngle", "auto3"]);
    expect(pickClass(tank, "triAngle")).toBe(true);
    expect(TANK_DEFS.triAngle.barrels).toHaveLength(3);
    expect(TANK_DEFS.triAngle.bodyDamageMul).toBeGreaterThan(1);
  });

  it("Tri-Angle unlocks Booster at 45 with extra rear barrels", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "flankGuard")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "triAngle")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "booster")).toBe(false);
    tank.level = 45;
    expect(pickClass(tank, "booster")).toBe(true);
    expect(TANK_DEFS.booster.barrels.length).toBeGreaterThan(TANK_DEFS.triAngle.barrels.length);
    expect(TANK_DEFS.booster.bodyDamageMul).toBeGreaterThan(TANK_DEFS.triAngle.bodyDamageMul);
  });

  it("Tri-Angle also unlocks Fighter with side guns at 45", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "flankGuard")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "triAngle")).toBe(true);
    tank.level = 45;
    expect(TANK_DEFS.triAngle.upgradesTo).toEqual(["booster", "fighter"]);
    expect(pickClass(tank, "fighter")).toBe(true);
    const angs = TANK_DEFS.fighter.barrels.map((b) => b.offsetAngle);
    expect(angs.some((a) => Math.abs(a - Math.PI / 2) < 0.01)).toBe(true);
    expect(angs.some((a) => Math.abs(a + Math.PI / 2) < 0.01)).toBe(true);
    expect(TANK_DEFS.fighter.bodyDamageMul).toBeLessThan(TANK_DEFS.booster.bodyDamageMul);
  });

  it("Assassin unlocks Hunter at 45 with more FOV and a longer barrel", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "sniper")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "assassin")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "hunter")).toBe(false);
    tank.level = 45;
    expect(pickClass(tank, "hunter")).toBe(true);
    expect(TANK_DEFS.hunter.fov).toBeGreaterThan(TANK_DEFS.assassin.fov);
    expect(TANK_DEFS.hunter.barrels[0]!.length).toBeGreaterThan(TANK_DEFS.assassin.barrels[0]!.length);
    expect(TANK_DEFS.hunter.barrels[0]!.bulletSpeed).toBeGreaterThan(
      TANK_DEFS.assassin.barrels[0]!.bulletSpeed,
    );
  });

  it("Assassin also unlocks Ranger at 45 with extra FOV", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "sniper")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "assassin")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "ranger")).toBe(false);
    tank.level = 45;
    expect(TANK_DEFS.assassin.upgradesTo).toEqual(["hunter", "ranger", "predator"]);
    expect(pickClass(tank, "ranger")).toBe(true);
    expect(TANK_DEFS.ranger.fov).toBeGreaterThan(TANK_DEFS.hunter.fov);
    expect(TANK_DEFS.ranger.barrels[0]!.length).toBeGreaterThan(TANK_DEFS.hunter.barrels[0]!.length);
    expect(TANK_DEFS.ranger.barrels[0]!.reload).toBeGreaterThan(TANK_DEFS.hunter.barrels[0]!.reload);
  });

  it("Assassin also unlocks Predator at 45 with nested sniper barrels", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "sniper")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "assassin")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "predator")).toBe(false);
    tank.level = 45;
    expect(pickClass(tank, "predator")).toBe(true);
    expect(TANK_DEFS.predator.barrels).toHaveLength(2);
    expect(TANK_DEFS.predator.barrels[1]!.length).toBeGreaterThan(TANK_DEFS.predator.barrels[0]!.length);
    expect(TANK_DEFS.predator.barrels[1]!.delay).toBeGreaterThan(0);
    expect(TANK_DEFS.predator.fov).toBeGreaterThan(TANK_DEFS.assassin.fov);
  });

  it("Machine Gun unlocks Sprayer at 30 with a nested spray barrel", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "machineGun")).toBe(true);
    tank.level = 29;
    expect(pickClass(tank, "sprayer")).toBe(false);
    tank.level = 30;
    expect(TANK_DEFS.machineGun.upgradesTo).toEqual(["destroyer", "sprayer"]);
    expect(pickClass(tank, "sprayer")).toBe(true);
    expect(TANK_DEFS.sprayer.barrels).toHaveLength(2);
    expect(TANK_DEFS.sprayer.barrels[0]!.reload).toBeLessThan(TANK_DEFS.machineGun.barrels[0]!.reload);
    expect(TANK_DEFS.sprayer.barrels[0]!.spread).toBeGreaterThan(TANK_DEFS.machineGun.barrels[0]!.spread);
  });

  it("Sprayer unlocks Streamliner at 45 with five stacked barrels", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "machineGun")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "sprayer")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "streamliner")).toBe(false);
    tank.level = 45;
    expect(pickClass(tank, "streamliner")).toBe(true);
    expect(TANK_DEFS.streamliner.barrels).toHaveLength(5);
    const delays = TANK_DEFS.streamliner.barrels.map((b) => b.delay);
    expect(Math.max(...delays)).toBeGreaterThan(Math.min(...delays));
    expect(TANK_DEFS.streamliner.barrels[0]!.spread).toBeLessThan(TANK_DEFS.sprayer.barrels[0]!.spread);
  });

  it("Destroyer unlocks Hybrid at 45 with a cannon plus a secondary gun", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "machineGun")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "destroyer")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "hybrid")).toBe(false);
    tank.level = 45;
    expect(TANK_DEFS.destroyer.upgradesTo).toEqual(["annihilator", "hybrid"]);
    expect(pickClass(tank, "hybrid")).toBe(true);
    expect(TANK_DEFS.hybrid.barrels).toHaveLength(2);
    expect(TANK_DEFS.hybrid.barrels[0]!.width).toBeGreaterThan(TANK_DEFS.hybrid.barrels[1]!.width);
    expect(TANK_DEFS.hybrid.barrels[1]!.reload).toBeLessThan(TANK_DEFS.hybrid.barrels[0]!.reload);
  });

  it("Destroyer unlocks Annihilator at 45 with a fatter shell", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "machineGun")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "destroyer")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "annihilator")).toBe(false);
    tank.level = 45;
    expect(pickClass(tank, "annihilator")).toBe(true);
    expect(TANK_DEFS.annihilator.barrels[0]!.width).toBeGreaterThan(TANK_DEFS.destroyer.barrels[0]!.width);
    expect(TANK_DEFS.annihilator.barrels[0]!.bulletDamage).toBeGreaterThan(
      TANK_DEFS.destroyer.barrels[0]!.bulletDamage,
    );
    expect(TANK_DEFS.annihilator.barrels[0]!.recoil).toBeGreaterThan(TANK_DEFS.destroyer.barrels[0]!.recoil);
  });

  it("Triple Shot unlocks Penta Shot at 45 with a five-barrel fan", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "twin")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "tripleShot")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "pentaShot")).toBe(false);
    tank.level = 45;
    expect(pickClass(tank, "pentaShot")).toBe(true);
    expect(TANK_DEFS.pentaShot.barrels).toHaveLength(5);
    const delays = TANK_DEFS.pentaShot.barrels.map((b) => b.delay);
    expect(Math.max(...delays)).toBeGreaterThan(0);
  });

  it("Triple Shot unlocks Spread Shot at 45 with an eleven-barrel fan", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "twin")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "tripleShot")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "spreadShot")).toBe(false);
    tank.level = 45;
    expect(TANK_DEFS.tripleShot.upgradesTo).toEqual(["pentaShot", "spreadShot"]);
    expect(pickClass(tank, "spreadShot")).toBe(true);
    expect(TANK_DEFS.spreadShot.barrels).toHaveLength(11);
    const span =
      Math.max(...TANK_DEFS.spreadShot.barrels.map((b) => b.offsetAngle)) -
      Math.min(...TANK_DEFS.spreadShot.barrels.map((b) => b.offsetAngle));
    expect(span).toBeGreaterThan(Math.PI / 2);
  });

  it("Quad Tank unlocks Octo Tank at 45 with eight barrels", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "flankGuard")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "quadTank")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "octoTank")).toBe(false);
    tank.level = 45;
    expect(pickClass(tank, "octoTank")).toBe(true);
    expect(TANK_DEFS.octoTank.barrels).toHaveLength(8);
    expect(TANK_DEFS.octoTank.barrels[0]!.bulletDamage).toBeLessThan(
      TANK_DEFS.quadTank.barrels[0]!.bulletDamage,
    );
  });

  it("Twin unlocks Twin Flank at 30 with front and rear twins", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "twin")).toBe(true);
    tank.level = 29;
    expect(pickClass(tank, "twinFlank")).toBe(false);
    tank.level = 30;
    expect(TANK_DEFS.twin.upgradesTo).toEqual(["tripleShot", "twinFlank"]);
    expect(pickClass(tank, "twinFlank")).toBe(true);
    expect(TANK_DEFS.twinFlank.barrels).toHaveLength(4);
    const rear = TANK_DEFS.twinFlank.barrels.filter((b) => Math.abs(b.offsetAngle - Math.PI) < 0.01);
    expect(rear).toHaveLength(2);
  });

  it("Twin Flank unlocks Triple Twin at 45 with three twin pairs", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "twin")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "twinFlank")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "tripleTwin")).toBe(false);
    tank.level = 45;
    expect(pickClass(tank, "tripleTwin")).toBe(true);
    expect(TANK_DEFS.tripleTwin.barrels).toHaveLength(6);
    const dirs = new Set(TANK_DEFS.tripleTwin.barrels.map((b) => b.offsetAngle.toFixed(4)));
    expect(dirs.size).toBe(3);
  });

  it("Basic unlocks Smasher at 30 with no barrels and high body damage", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 29;
    expect(pickClass(tank, "smasher")).toBe(false);
    tank.level = 30;
    expect(TANK_DEFS.basic.upgradesTo).toContain("smasher");
    expect(pickClass(tank, "smasher")).toBe(true);
    expect(TANK_DEFS.smasher.barrels).toHaveLength(0);
    expect(TANK_DEFS.smasher.bodyDamageMul).toBeGreaterThan(2);
  });

  it("Smasher unlocks Spike at 45 with more ram damage and no barrels", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 30;
    expect(pickClass(tank, "smasher")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "spike")).toBe(false);
    tank.level = 45;
    expect(TANK_DEFS.smasher.upgradesTo).toEqual(["spike", "landmine"]);
    expect(pickClass(tank, "spike")).toBe(true);
    expect(TANK_DEFS.spike.barrels).toHaveLength(0);
    expect(TANK_DEFS.spike.bodyDamageMul).toBeGreaterThan(TANK_DEFS.smasher.bodyDamageMul);
  });

  it("Smasher unlocks Landmine at 45; still tanks cloak from bots", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 30;
    expect(pickClass(tank, "smasher")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "landmine")).toBe(false);
    tank.level = 45;
    expect(pickClass(tank, "landmine")).toBe(true);
    expect(TANK_DEFS.landmine.barrels).toHaveLength(0);
    expect(TANK_DEFS.landmine.bodyDamageMul).toBeGreaterThan(2);
    expect(isCloaked("landmine", 0, 0)).toBe(true);
    expect(isCloaked("landmine", 80, 0)).toBe(false);
    expect(cloakOpacity("landmine", 0, false)).toBeLessThan(cloakOpacity("landmine", 0, true));
    expect(cloakOpacity("basic", 0, false)).toBe(1);
  });

  it("Flank Guard unlocks Auto 3 at 30; turrets fire off hull aim", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "flankGuard")).toBe(true);
    tank.level = 29;
    expect(pickClass(tank, "auto3")).toBe(false);
    tank.level = 30;
    expect(pickClass(tank, "auto3")).toBe(true);
    expect(TANK_DEFS.auto3.barrels.every((b) => b.auto)).toBe(true);
    tank.x = 400;
    tank.y = 400;
    tank.angle = 0;
    const s = spawnShape(world, "square");
    s.x = 400;
    s.y = 520;
    const inputs = new Map<number, PlayerInput>();
    inputs.set(tank.id, { ...EMPTY_INPUT, fire: false, aimX: tank.x + 80, aimY: tank.y });
    let offHull = false;
    for (let i = 0; i < 50; i++) {
      tick(world, inputs, DT);
      for (const b of world.bullets.values()) {
        if (Math.abs(b.vy) > Math.abs(b.vx)) offHull = true;
      }
    }
    expect(world.bullets.size).toBeGreaterThan(0);
    expect(offHull).toBe(true);
  });

  it("Auto 3 unlocks Auto 5 at 45 with five auto turrets", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "flankGuard")).toBe(true);
    tank.level = 30;
    expect(pickClass(tank, "auto3")).toBe(true);
    tank.level = 44;
    expect(pickClass(tank, "auto5")).toBe(false);
    tank.level = 45;
    expect(TANK_DEFS.auto3.upgradesTo).toEqual(["auto5"]);
    expect(pickClass(tank, "auto5")).toBe(true);
    expect(TANK_DEFS.auto5.barrels).toHaveLength(5);
    expect(TANK_DEFS.auto5.barrels.every((b) => b.auto)).toBe(true);
  });

  it("Sniper unlocks Overseer at 30; drones spawn and chase the cursor when firing", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const tank = world.tanks.get(world.playerId)!;
    tank.level = 15;
    expect(pickClass(tank, "sniper")).toBe(true);
    tank.level = 29;
    expect(pickClass(tank, "overseer")).toBe(false);
    tank.level = 30;
    expect(TANK_DEFS.sniper.upgradesTo).toContain("overseer");
    expect(pickClass(tank, "overseer")).toBe(true);
    expect(TANK_DEFS.overseer.barrels.every((b) => b.drone)).toBe(true);
    tank.x = 500;
    tank.y = 500;
    const idle: PlayerInput = { ...EMPTY_INPUT, fire: false, aimX: 500, aimY: 500 };
    const inputs = new Map<number, PlayerInput>();
    inputs.set(tank.id, idle);
    for (let i = 0; i < 180; i++) tick(world, inputs, DT);
    expect(droneCount(world, tank.id)).toBeGreaterThan(0);
    expect(droneCount(world, tank.id)).toBeLessThanOrEqual(8);
    const go: PlayerInput = { ...EMPTY_INPUT, fire: true, aimX: 900, aimY: 500 };
    inputs.set(tank.id, go);
    const before = [...world.bullets.values()].filter((b) => b.drone).map((b) => b.x);
    for (let i = 0; i < 50; i++) tick(world, inputs, DT);
    const after = [...world.bullets.values()].filter((b) => b.drone);
    expect(after.length).toBeGreaterThan(0);
    const mean = after.reduce((s, b) => s + b.x, 0) / after.length;
    expect(mean).toBeGreaterThan(before.reduce((s, x) => s + x, 0) / before.length + 20);
  });
});
