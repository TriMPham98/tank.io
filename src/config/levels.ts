/** Cumulative score required to *reach* this level. Index = level. */
export const SCORE_FOR_LEVEL: number[] = (() => {
  const t = [0, 0];
  for (let level = 2; level <= 45; level++) {
    const step = Math.round(6 * Math.pow(level, 1.72));
    t[level] = t[level - 1] + step;
  }
  return t;
})();

export const MAX_LEVEL = 45;
export const MAX_STAT = 7;

export function levelFromScore(score: number): number {
  let level = 1;
  for (let l = 2; l <= MAX_LEVEL; l++) {
    if (score >= SCORE_FOR_LEVEL[l]!) level = l;
    else break;
  }
  return level;
}

/** Skill points granted when reaching `level` (not cumulative). */
export function skillPointsForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= 28) return 1;
  if (level === 29) return 0;
  if (level === 30) return 1;
  if (level > 30 && (level - 30) % 3 === 0) return 1;
  return 0;
}

export function totalSkillPointsAtLevel(level: number): number {
  let n = 0;
  for (let l = 2; l <= level; l++) n += skillPointsForLevel(l);
  return n;
}

export function scoreForKill(victimScore: number): number {
  return Math.floor(victimScore * 0.5) + 20;
}
