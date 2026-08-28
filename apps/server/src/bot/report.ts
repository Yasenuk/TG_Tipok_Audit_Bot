import { calcScore, formatSummary } from '@sa/shared';
import { bot } from './index.js';

/** Telegram ріже повідомлення на 4096 символах, а коментарів може бути 18 по 500 */
const MAX_MESSAGE_LENGTH = 4096;
const MAX_COMMENT_LENGTH = 120;

interface ReportInput {
  storeLabel: string;
  revisorName: string;
  sellerName: string | null;
  createdAt: Date;
  items: Array<{ itemLabel: string; score: number; comment?: string | null }>;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function shorten(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit).trimEnd()}…` : value;
}

function render(report: ReportInput, withComments: boolean): string {
  const summary = calcScore(report.items);

  const lines = report.items.map((item) => {
    const score = item.score === 0 ? '—' : String(item.score);
    const comment =
      withComments && item.comment
        ? `\n   <i>${escapeHtml(shorten(item.comment, MAX_COMMENT_LENGTH))}</i>`
        : '';

    return `${escapeHtml(item.itemLabel)} — ${score}${comment}`;
  });

  return [
    `<b>${escapeHtml(report.storeLabel)}</b>`,
    `Ревізор: ${escapeHtml(report.revisorName)}`,
    report.sellerName ? `Продавець: ${escapeHtml(report.sellerName)}` : '',
    report.createdAt.toLocaleString('uk-UA'),
    '',
    ...lines,
    '',
    `<b>${formatSummary(summary)}</b>`,
    summary.skipped > 0 ? `Не застосовано пунктів: ${summary.skipped}` : '',
    withComments ? '' : '<i>Коментарі не вмістились — дивіться в адмінці.</i>',
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatReport(report: ReportInput): string {
  const full = render(report, true);
  if (full.length <= MAX_MESSAGE_LENGTH) return full;

  // Бали важливіші за коментарі
  const compact = render(report, false);
  if (compact.length <= MAX_MESSAGE_LENGTH) return compact;

  return `${compact.slice(0, MAX_MESSAGE_LENGTH - 1)}…`;
}

export async function sendReport(chatId: string | number, report: ReportInput): Promise<void> {
  if (!chatId) {
    console.warn('sendReport: не вказано chatId — звіт не відправлено');
    return;
  }

  // TODO: фото пунктів окремим media group після тексту
  await bot.telegram.sendMessage(chatId, formatReport(report), { parse_mode: 'HTML' });
}
