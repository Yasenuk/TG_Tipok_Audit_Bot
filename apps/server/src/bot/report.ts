import { calcScore, formatSummary } from '@sa/shared';
import { bot } from './index.js';
import { env } from '../env.js';

interface ReportInput {
  storeLabel: string;
  revisorName: string;
  createdAt: Date;
  items: Array<{ itemLabel: string; score: number; comment?: string | null }>;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatReport(report: ReportInput): string {
  const summary = calcScore(report.items);

  const lines = report.items.map((item) => {
    const score = item.score === 0 ? '—' : String(item.score);
    return `${escapeHtml(item.itemLabel)} — ${score}`;
  });

  return [
    `<b>${escapeHtml(report.storeLabel)}</b>`,
    `Ревізор: ${escapeHtml(report.revisorName)}`,
    report.createdAt.toLocaleString('uk-UA'),
    '',
    ...lines,
    '',
    `<b>${formatSummary(summary)}</b>`,
    summary.skipped > 0 ? `Не застосовано пунктів: ${summary.skipped}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function sendReport(REPORT_CHAT_ID: string | number, report: ReportInput): Promise<void> {
  if (REPORT_CHAT_ID) {
    console.warn('REPORT_CHAT_ID не заданий — звіт не відправлено');
    return;
  }

  // TODO: фото пунктів окремим media group після тексту
  await bot.telegram.sendMessage(REPORT_CHAT_ID, formatReport(report), {
    parse_mode: 'HTML',
  });
}
