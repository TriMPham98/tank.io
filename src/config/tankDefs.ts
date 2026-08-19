export type TankClassId =
  | "basic"
  | "twin"
  | "sniper"
  | "machineGun"
  | "flankGuard"
  | "tripleShot"
  | "quadTank"
  | "assassin"
  | "destroyer";

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
};

export type TankDef = {
  id: TankClassId;
  name: string;
  fov: number;
  bodyDamageMul: number;
  barrels: Barrel[];
  unlockLevel: 1 | 15 | 30;
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
    upgradesTo: ["twin", "sniper", "machineGun", "flankGuard"],
  },
  twin: {
    id: "twin",
    name: "Twin",
    fov: 1,
    bodyDamageMul: 1,
    barrels: [
      basicBarrel({ lateral: -10, bulletDamage: 0.7, recoil: 8 }),
      basicBarrel({ lateral: 10, bulletDamage: 0.7, recoil: 8 }),
    ],
    unlockLevel: 15,
    upgradesTo: ["tripleShot"],
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
    upgradesTo: ["assassin"],
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
    upgradesTo: ["destroyer"],
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
    upgradesTo: ["quadTank"],
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
