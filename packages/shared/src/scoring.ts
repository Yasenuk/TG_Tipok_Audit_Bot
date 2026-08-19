export const MAX_PER_ITEM = 5;

export function isApplicable(score: number): boolean {
  return score > 0;
}

export interface ScoreSummary {
  total: number;
  maxTotal: number;
  percent: number;
  applicable: number;
  skipped: number;
}

export function calcScore(items: ReadonlyArray<{ score: number }>): ScoreSummary {
  const applicable = items.filter((item) => isApplicable(item.score));
  const total = applicable.reduce((sum, item) => sum + item.score, 0);
  const maxTotal = applicable.length * MAX_PER_ITEM;

  return {
    total,
    maxTotal,
    percent: maxTotal === 0 ? 0 : Math.round((total / maxTotal) * 100),
    applicable: applicable.length,
    skipped: items.length - applicable.length,
  };
}

export function formatSummary(summary: ScoreSummary): string {
  return `${summary.total}/${summary.maxTotal} | ${summary.percent}%`;
}
