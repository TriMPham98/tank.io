import { describe, expect, it } from "vitest";
import { classHoldRange, fightWaypoint, fleeWaypoint, leadAim, thinkBot } from "../src/sim/bots.ts";
import { createWorld, makeTank } from "../src/sim/world.ts";

describe("leadAim", () => {
  it("aims ahead of a target moving perpendicular to the shot", () => {
    const aim = leadAim(0, 0, 400, 0, 0, 200, 400);
    expect(aim.x).toBeGreaterThan(390);
    expect(aim.y).toBeGreaterThan(150);
  });

  it("does not lead a stationary target", () => {
    const aim = leadAim(10, 20, 100, 50, 0, 0, 380);
    expect(aim.x).toBeCloseTo(100);
    expect(aim.y).toBeCloseTo(50);
  });
});

describe("thinkBot", () => {
  it("leads a moving player when fighting", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const player = world.tanks.get(world.playerId)!;
    player.x = 800;
    player.y = 400;
    player.vx = 0;
    player.vy = 180;
    const spawned = makeTank(world, { name: "Bot", x: 400, y: 400, isBot: true });
    spawned.stats = [0, 2, 0, 7, 7, 7, 7, 5];
    spawned.level = 8;
    player.level = 8;
    const input = thinkBot(world, spawned);
    expect(input.fire).toBe(true);
    expect(input.aimY).toBeGreaterThan(player.y + 20);
  });

  it("kites sideways while backing off a close threat", () => {
    const close = fleeWaypoint(400, 400, 500, 400, 0, 1);
    expect(close.x).toBeLessThan(400);
    const mid = fleeWaypoint(400, 400, 750, 400, 0.4, 2);
    expect(Math.abs(mid.y - 400)).toBeGreaterThan(80);
  });

  it("moves away and fires when HP is low", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const player = world.tanks.get(world.playerId)!;
    player.x = 520;
    player.y = 400;
    const bot = makeTank(world, { name: "Bot", x: 400, y: 400, isBot: true });
    bot.hp = bot.maxHp * 0.2;
    bot.level = 8;
    player.level = 8;
    const input = thinkBot(world, bot);
    expect(input.fire).toBe(true);
    expect(input.left).toBe(true);
    expect(input.right).toBe(false);
  });

  it("gun bots back off when inside hold range; rammers charge", () => {
    const hold = fightWaypoint(400, 400, 450, 400, false, 0, 1);
    expect(hold.x).toBeLessThan(400);
    const charge = fightWaypoint(400, 400, 450, 400, true, 0, 5);
    expect(charge.x).toBe(450);
    const approach = fightWaypoint(400, 400, 900, 400, false, 0, 1);
    expect(approach.x).toBeGreaterThan(400);
    const sniper = fightWaypoint(400, 400, 450, 400, false, 0, 1, 420);
    const basic = fightWaypoint(400, 400, 450, 400, false, 0, 1, 300);
    expect(sniper.x).toBeLessThan(basic.x);
    expect(classHoldRange("destroyer")).toBeLessThan(classHoldRange("basic"));
    expect(classHoldRange("destroyer")).toBeLessThan(classHoldRange("sniper"));
    const dest = fightWaypoint(400, 400, 450, 400, false, 0, 1, classHoldRange("destroyer"));
    expect(dest.x).toBeGreaterThan(basic.x);
    expect(classHoldRange("triAngle")).toBeLessThan(classHoldRange("destroyer"));
    expect(classHoldRange("hunter")).toBeGreaterThan(classHoldRange("assassin"));
    expect(classHoldRange("annihilator")).toBeLessThan(classHoldRange("destroyer"));
  });

  it("Tri-Angle bots charge the target", () => {
    const world = createWorld({ bots: 0, seedShapes: false });
    const player = world.tanks.get(world.playerId)!;
    player.x = 620;
    player.y = 400;
    player.level = 30;
    const bot = makeTank(world, { name: "Ram", x: 400, y: 400, isBot: true });
    bot.classId = "triAngle";
    bot.level = 30;
    bot.hp = bot.maxHp;
    const input = thinkBot(world, bot);
    expect(input.fire).toBe(true);
    expect(input.right).toBe(true);
  });
});
