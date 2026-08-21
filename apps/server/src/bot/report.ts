import { calcScore, formatSummary } from '@sa/shared';
import { bot } from './index.js';

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
    const comment = item.comment ? `\n   <i>${escapeHtml(item.comment)}</i>` : '';

    return `${escapeHtml(item.itemLabel)} — ${score}${comment}`;
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

export async function sendReport(chatId: string | number, report: ReportInput): Promise<void> {
  if (!chatId) {
    console.warn('sendReport: не вказано chatId — звіт не відправлено');
    return;
  }

  // TODO: фото пунктів окремим media group після тексту
  await bot.telegram.sendMessage(chatId, formatReport(report), { parse_mode: 'HTML' });
}
