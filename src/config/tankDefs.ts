export type TankClassId =
  | "basic"
  | "twin"
  | "sniper"
  | "machineGun"
  | "flankGuard"
  | "tripleShot"
  | "quadTank"
  | "assassin"
  | "destroyer"
  | "triAngle"
  | "booster"
  | "fighter"
  | "hunter"
  | "annihilator"
  | "pentaShot"
  | "octoTank"
  | "sprayer"
  | "twinFlank"
  | "tripleTwin"
  | "streamliner"
  | "ranger"
  | "hybrid"
  | "predator"
  | "spreadShot"
  | "smasher"
  | "spike"
  | "landmine"
  | "auto3"
  | "auto5"
  | "overseer";

export type Barrel = {
  offsetAngle: number;
  lateral: number;
  length: number;
  width: number;
  reload: number;
  delay: number;
  bulletSpeed: number;
  bulletDamage: number;
  bulletPen: number;
  bulletRadius: number;
  recoil: number;
  spread: number;
  auto?: boolean;
  drone?: boolean;
};

export type TankDef = {
  id: TankClassId;
  name: string;
  fov: number;
  bodyDamageMul: number;
  barrels: Barrel[];
  unlockLevel: 1 | 15 | 30 | 45;
  upgradesTo: TankClassId[];
};

const basicBarrel = (over: Partial<Barrel> = {}): Barrel => ({
  offsetAngle: 0,
  lateral: 0,
  length: 28,
  width: 16,
  reload: 1,
  delay: 0,
  bulletSpeed: 1,
  bulletDamage: 1,
  bulletPen: 1,
  bulletRadius: 1,
  recoil: 14,
  spread: 0,
  ...over,
});

export const TANK_DEFS: Record<TankClassId, TankDef> = {
  basic: {
    id: "basic",
    name: "Tank",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [basicBarrel()],
    unlockLevel: 1,
    upgradesTo: ["twin", "sniper", "machineGun", "flankGuard", "smasher"],
  },
  twin: {
    id: "twin",
    name: "Twin",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({ lateral: -10, bulletDamage: 0.7, recoil: 8, delay: 0 }),
      basicBarrel({ lateral: 10, bulletDamage: 0.7, recoil: 8, delay: 0.5 }),
    ],
    unlockLevel: 15,
    upgradesTo: ["tripleShot", "twinFlank"],
  },
  sniper: {
    id: "sniper",
    name: "Sniper",
    fov: 1.22,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({
        length: 42,
        width: 14,
        reload: 1.65,
        bulletSpeed: 1.55,
        bulletDamage: 1.35,
        bulletPen: 1.3,
        recoil: 18,
      }),
    ],
    unlockLevel: 15,
    upgradesTo: ["assassin", "overseer"],
  },
  overseer: {
    id: "overseer",
    name: "Overseer",
    fov: 1.15,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({
        offsetAngle: Math.PI / 2,
        length: 18,
        width: 22,
        reload: 2.4,
        delay: 0,
        bulletSpeed: 0.55,
        bulletDamage: 0.85,
        bulletPen: 1.4,
        bulletRadius: 1.15,
        recoil: 0,
        drone: true,
      }),
      basicBarrel({
        offsetAngle: -Math.PI / 2,
        length: 18,
        width: 22,
        reload: 2.4,
        delay: 0.5,
        bulletSpeed: 0.55,
        bulletDamage: 0.85,
        bulletPen: 1.4,
        bulletRadius: 1.15,
        recoil: 0,
        drone: true,
      }),
    ],
    unlockLevel: 30,
    upgradesTo: [],
  },
  machineGun: {
    id: "machineGun",
    name: "Machine Gun",
    fov: 0.95,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({
        length: 22,
        width: 26,
        reload: 0.42,
        bulletDamage: 0.55,
        bulletPen: 0.7,
        spread: 0.28,
        recoil: 6,
      }),
    ],
    unlockLevel: 15,
    upgradesTo: ["destroyer", "sprayer"],
  },
  flankGuard: {
    id: "flankGuard",
    name: "Flank Guard",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({ bulletDamage: 0.85, recoil: 10 }),
      basicBarrel({ offsetAngle: Math.PI, bulletDamage: 0.85, recoil: 10 }),
    ],
    unlockLevel: 15,
    upgradesTo: ["quadTank", "triAngle", "auto3"],
  },
  auto3: {
    id: "auto3",
    name: "Auto 3",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) =>
      basicBarrel({
        offsetAngle: a,
        length: 24,
        width: 14,
        reload: 1.05,
        bulletDamage: 0.7,
        recoil: 5,
        auto: true,
      }),
    ),
    unlockLevel: 30,
    upgradesTo: ["auto5"],
  },
  auto5: {
    id: "auto5",
    name: "Auto 5",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [0, 1, 2, 3, 4].map((i) =>
      basicBarrel({
        offsetAngle: (i * Math.PI * 2) / 5,
        length: 22,
        width: 12,
        reload: 1.12,
        bulletDamage: 0.58,
        recoil: 3.5,
        auto: true,
      }),
    ),
    unlockLevel: 45,
    upgradesTo: [],
  },
  tripleShot: {
    id: "tripleShot",
    name: "Triple Shot",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({ offsetAngle: -Math.PI / 8, bulletDamage: 0.6, recoil: 6 }),
      basicBarrel({ bulletDamage: 0.7, recoil: 8 }),
      basicBarrel({ offsetAngle: Math.PI / 8, bulletDamage: 0.6, recoil: 6 }),
    ],
    unlockLevel: 30,
    upgradesTo: ["pentaShot", "spreadShot"],
  },
  pentaShot: {
    id: "pentaShot",
    name: "Penta Shot",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({ offsetAngle: -Math.PI / 4, bulletDamage: 0.42, recoil: 4, delay: 0.1 }),
      basicBarrel({ offsetAngle: -Math.PI / 8, bulletDamage: 0.5, recoil: 5, delay: 0.05 }),
      basicBarrel({ bulletDamage: 0.6, recoil: 6, delay: 0 }),
      basicBarrel({ offsetAngle: Math.PI / 8, bulletDamage: 0.5, recoil: 5, delay: 0.05 }),
      basicBarrel({ offsetAngle: Math.PI / 4, bulletDamage: 0.42, recoil: 4, delay: 0.1 }),
    ],
    unlockLevel: 45,
    upgradesTo: [],
  },
  spreadShot: {
    id: "spreadShot",
    name: "Spread Shot",
    fov: 1,
    bodyDamageMul: 1,
    barrels: Array.from({ length: 11 }, (_, i) => {
      const t = i / 10;
      const ang = (t - 0.5) * (Math.PI * 0.85);
      const dist = Math.abs(t - 0.5);
      return basicBarrel({
        offsetAngle: ang,
        bulletDamage: 0.55 - dist * 0.25,
        recoil: dist < 0.05 ? 5 : 2.5,
        delay: dist * 0.12,
        reload: 1.15,
        width: 12,
        length: 26 - dist * 6,
      });
    }),
    unlockLevel: 45,
    upgradesTo: [],
  },
  quadTank: {
    id: "quadTank",
    name: "Quad Tank",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a) =>
      basicBarrel({ offsetAngle: a, bulletDamage: 0.65, recoil: 7, reload: 1.05 }),
    ),
    unlockLevel: 30,
    upgradesTo: ["octoTank"],
  },
  octoTank: {
    id: "octoTank",
    name: "Octo Tank",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
      basicBarrel({
        offsetAngle: (i * Math.PI) / 4,
        bulletDamage: 0.5,
        recoil: 5,
        reload: 1.1,
      }),
    ),
    unlockLevel: 45,
    upgradesTo: [],
  },
  assassin: {
    id: "assassin",
    name: "Assassin",
    fov: 1.4,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({
        length: 50,
        width: 13,
        reload: 2.1,
        bulletSpeed: 1.85,
        bulletDamage: 1.6,
        bulletPen: 1.5,
        recoil: 22,
      }),
    ],
    unlockLevel: 30,
    upgradesTo: ["hunter", "ranger", "predator"],
  },
  hunter: {
    id: "hunter",
    name: "Hunter",
    fov: 1.55,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({
        length: 56,
        width: 12,
        reload: 2.35,
        bulletSpeed: 2.05,
        bulletDamage: 1.85,
        bulletPen: 1.65,
        recoil: 24,
      }),
    ],
    unlockLevel: 45,
    upgradesTo: [],
  },
  ranger: {
    id: "ranger",
    name: "Ranger",
    fov: 1.85,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({
        length: 64,
        width: 11,
        reload: 2.6,
        bulletSpeed: 2.25,
        bulletDamage: 1.75,
        bulletPen: 1.7,
        recoil: 26,
      }),
    ],
    unlockLevel: 45,
    upgradesTo: [],
  },
  predator: {
    id: "predator",
    name: "Predator",
    fov: 1.7,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({
        length: 52,
        width: 16,
        reload: 2.5,
        bulletSpeed: 1.9,
        bulletDamage: 1.55,
        bulletPen: 1.45,
        recoil: 18,
        delay: 0,
      }),
      basicBarrel({
        length: 60,
        width: 10,
        reload: 2.5,
        bulletSpeed: 2.15,
        bulletDamage: 1.2,
        bulletPen: 1.2,
        recoil: 12,
        delay: 0.18,
      }),
    ],
    unlockLevel: 45,
    upgradesTo: [],
  },
  triAngle: {
    id: "triAngle",
    name: "Tri-Angle",
    fov: 1,
    bodyDamageMul: 1.35,
    barrels: [
      basicBarrel({ length: 26, bulletDamage: 0.75, recoil: 8 }),
      basicBarrel({
        offsetAngle: (Math.PI * 5) / 6,
        length: 22,
        width: 14,
        reload: 1.05,
        bulletDamage: 0.35,
        recoil: 22,
      }),
      basicBarrel({
        offsetAngle: -(Math.PI * 5) / 6,
        length: 22,
        width: 14,
        reload: 1.05,
        bulletDamage: 0.35,
        recoil: 22,
      }),
    ],
    unlockLevel: 30,
    upgradesTo: ["booster", "fighter"],
  },
  booster: {
    id: "booster",
    name: "Booster",
    fov: 1,
    bodyDamageMul: 1.5,
    barrels: [
      basicBarrel({ length: 26, bulletDamage: 0.7, recoil: 6 }),
      basicBarrel({
        offsetAngle: (Math.PI * 5) / 6,
        length: 20,
        width: 13,
        reload: 1,
        bulletDamage: 0.28,
        recoil: 18,
      }),
      basicBarrel({
        offsetAngle: -(Math.PI * 5) / 6,
        length: 20,
        width: 13,
        reload: 1,
        bulletDamage: 0.28,
        recoil: 18,
      }),
      basicBarrel({
        offsetAngle: (Math.PI * 11) / 12,
        length: 18,
        width: 12,
        reload: 1,
        bulletDamage: 0.25,
        recoil: 20,
      }),
      basicBarrel({
        offsetAngle: -(Math.PI * 11) / 12,
        length: 18,
        width: 12,
        reload: 1,
        bulletDamage: 0.25,
        recoil: 20,
      }),
    ],
    unlockLevel: 45,
    upgradesTo: [],
  },
  fighter: {
    id: "fighter",
    name: "Fighter",
    fov: 1,
    bodyDamageMul: 1.25,
    barrels: [
      basicBarrel({ length: 28, bulletDamage: 0.8, recoil: 8 }),
      basicBarrel({
        offsetAngle: (Math.PI * 5) / 6,
        length: 20,
        width: 13,
        reload: 1.05,
        bulletDamage: 0.3,
        recoil: 16,
      }),
      basicBarrel({
        offsetAngle: -(Math.PI * 5) / 6,
        length: 20,
        width: 13,
        reload: 1.05,
        bulletDamage: 0.3,
        recoil: 16,
      }),
      basicBarrel({
        offsetAngle: Math.PI / 2,
        length: 22,
        width: 14,
        bulletDamage: 0.55,
        recoil: 6,
      }),
      basicBarrel({
        offsetAngle: -Math.PI / 2,
        length: 22,
        width: 14,
        bulletDamage: 0.55,
        recoil: 6,
      }),
    ],
    unlockLevel: 45,
    upgradesTo: [],
  },
  destroyer: {
    id: "destroyer",
    name: "Destroyer",
    fov: 1.05,
    bodyDamageMul: 1.15,
    barrels: [
      basicBarrel({
        length: 36,
        width: 32,
        reload: 3.2,
        bulletSpeed: 0.85,
        bulletDamage: 3.4,
        bulletPen: 4.2,
        bulletRadius: 2.1,
        recoil: 48,
      }),
    ],
    unlockLevel: 30,
    upgradesTo: ["annihilator", "hybrid"],
  },
  annihilator: {
    id: "annihilator",
    name: "Annihilator",
    fov: 1.05,
    bodyDamageMul: 1.25,
    barrels: [
      basicBarrel({
        length: 38,
        width: 42,
        reload: 3.6,
        bulletSpeed: 0.78,
        bulletDamage: 4.4,
        bulletPen: 5.4,
        bulletRadius: 2.7,
        recoil: 62,
      }),
    ],
    unlockLevel: 45,
    upgradesTo: [],
  },
  hybrid: {
    id: "hybrid",
    name: "Hybrid",
    fov: 1.05,
    bodyDamageMul: 1.15,
    barrels: [
      basicBarrel({
        length: 36,
        width: 30,
        reload: 3.3,
        bulletSpeed: 0.85,
        bulletDamage: 3.1,
        bulletPen: 3.8,
        bulletRadius: 2,
        recoil: 42,
        delay: 0,
      }),
      basicBarrel({
        length: 26,
        width: 12,
        reload: 0.7,
        bulletSpeed: 1.15,
        bulletDamage: 0.45,
        bulletPen: 0.6,
        bulletRadius: 0.75,
        recoil: 4,
        delay: 0.2,
      }),
    ],
    unlockLevel: 45,
    upgradesTo: [],
  },
  sprayer: {
    id: "sprayer",
    name: "Sprayer",
    fov: 0.95,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({
        length: 24,
        width: 26,
        reload: 0.32,
        bulletDamage: 0.42,
        bulletPen: 0.55,
        spread: 0.32,
        recoil: 4,
        delay: 0,
      }),
      basicBarrel({
        length: 30,
        width: 12,
        reload: 0.28,
        bulletDamage: 0.38,
        bulletPen: 0.5,
        spread: 0.18,
        recoil: 3,
        delay: 0.15,
      }),
    ],
    unlockLevel: 30,
    upgradesTo: ["streamliner"],
  },
  streamliner: {
    id: "streamliner",
    name: "Streamliner",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [0, 1, 2, 3, 4].map((i) =>
      basicBarrel({
        length: 22 + i * 4,
        width: 11,
        reload: 0.55,
        bulletDamage: 0.32,
        bulletPen: 0.4,
        bulletRadius: 0.7,
        recoil: 2.5,
        spread: 0.04,
        delay: i * 0.12,
      }),
    ),
    unlockLevel: 45,
    upgradesTo: [],
  },
  twinFlank: {
    id: "twinFlank",
    name: "Twin Flank",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({ lateral: -10, bulletDamage: 0.62, recoil: 6, delay: 0 }),
      basicBarrel({ lateral: 10, bulletDamage: 0.62, recoil: 6, delay: 0.5 }),
      basicBarrel({
        offsetAngle: Math.PI,
        lateral: -10,
        bulletDamage: 0.62,
        recoil: 6,
        delay: 0,
      }),
      basicBarrel({
        offsetAngle: Math.PI,
        lateral: 10,
        bulletDamage: 0.62,
        recoil: 6,
        delay: 0.5,
      }),
    ],
    unlockLevel: 30,
    upgradesTo: ["tripleTwin"],
  },
  tripleTwin: {
    id: "tripleTwin",
    name: "Triple Twin",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].flatMap((a) => [
      basicBarrel({ offsetAngle: a, lateral: -10, bulletDamage: 0.52, recoil: 5, delay: 0 }),
      basicBarrel({ offsetAngle: a, lateral: 10, bulletDamage: 0.52, recoil: 5, delay: 0.5 }),
    ]),
    unlockLevel: 45,
    upgradesTo: [],
  },
  smasher: {
    id: "smasher",
    name: "Smasher",
    fov: 1,
    bodyDamageMul: 2.2,
    barrels: [],
    unlockLevel: 30,
    upgradesTo: ["spike", "landmine"],
  },
  spike: {
    id: "spike",
    name: "Spike",
    fov: 1,
    bodyDamageMul: 2.85,
    barrels: [],
    unlockLevel: 45,
    upgradesTo: [],
  },
  landmine: {
    id: "landmine",
    name: "Landmine",
    fov: 1,
    bodyDamageMul: 2.4,
    barrels: [],
    unlockLevel: 45,
    upgradesTo: [],
  },
};

export const STAT_LABELS = [
  "Health Regen",
  "Max Health",
  "Body Damage",
  "Bullet Speed",
  "Bullet Penetration",
  "Bullet Damage",
  "Reload",
  "Movement Speed",
] as const;

export type StatIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
