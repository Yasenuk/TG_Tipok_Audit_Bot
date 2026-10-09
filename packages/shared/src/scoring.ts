export const MAX_PER_ITEM = 5;

export const MIN_WEIGHT = 1;
export const MAX_WEIGHT = 3;
export const DEFAULT_WEIGHT = 1;

export function isApplicable(score: number): boolean {
  return score > 0;
}

export interface ScoredItem {
  score: number;
  weight: number;
}

export interface ScoreSummary {
  total: number;
  maxTotal: number;
  percent: number;
  applicable: number;
  skipped: number;
}

export function percentOf(total: number, maxTotal: number): number {
  return maxTotal === 0 ? 0 : Math.round((total / maxTotal) * 100);
}

/** 0 = пункту немає на точці: не йде ні в бали, ні в максимум */
export function calcScore(items: ReadonlyArray<ScoredItem>): ScoreSummary {
  let total = 0;
  let maxTotal = 0;
  let applicable = 0;

  for (const item of items) {
    if (!isApplicable(item.score)) continue;

    total += item.score * item.weight;
    maxTotal += MAX_PER_ITEM * item.weight;
    applicable += 1;
  }

  return {
    total,
    maxTotal,
    percent: percentOf(total, maxTotal),
    applicable,
    skipped: items.length - applicable,
  };
}

export function formatCoverage(applicable: number, itemsCount: number): string {
  return `${applicable}/${itemsCount}`;
}

/** 84/105 | 80% · 10/18 */
export function formatSummary(summary: ScoreSummary): string {
  const coverage = formatCoverage(summary.applicable, summary.applicable + summary.skipped);
  return `${summary.total}/${summary.maxTotal} | ${summary.percent}% · ${coverage}`;
}
