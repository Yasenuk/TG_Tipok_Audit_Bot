import { calcScore, formatSummary } from '@sa/shared';
import { bot } from './index.js';
import { createPresignedGet } from '../services/r2.js';

/** Telegram ріже повідомлення на 4096 символах, а коментарів може бути 18 по 500 */
const MAX_MESSAGE_LENGTH = 4096;
const MAX_COMMENT_LENGTH = 120;

/** Медіагрупа вміщає від 2 до 10 елементів - одне фото доводиться слати окремо */
const MEDIA_GROUP_SIZE = 10;
const MAX_CAPTION_LENGTH = 1024;
const GROUP_DELAY_MS = 1000;

interface ReportItem {
  itemLabel: string;
  score: number;
  comment?: string | null;
  photos: string[];
}

interface ReportInput {
  storeLabel: string;
  revisorName: string;
  sellerName: string | null;
  createdAt: Date;
  items: ReportItem[];
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

  // Бали важливіші за коментарі: спершу викидаємо коментарі цілком
  const compact = render(report, false);
  if (compact.length <= MAX_MESSAGE_LENGTH) return compact;

  return `${compact.slice(0, MAX_MESSAGE_LENGTH - 1)}…`;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function collectPhotos(items: ReportItem[]): Promise<Array<{ url: string; caption: string }>> {
  const photos: Array<{ url: string; caption: string }> = [];

  for (const item of items) {
    for (const key of item.photos) {
      try {
        photos.push({
          url: await createPresignedGet(key),
          caption: shorten(`${item.itemLabel} — ${item.score}`, MAX_CAPTION_LENGTH),
        });
      } catch (error) {
        console.error(`report: не вдалось підписати ${key}`, error);
      }
    }
  }

  return photos;
}

async function sendPhotos(chatId: string | number, items: ReportItem[]): Promise<void> {
  const photos = await collectPhotos(items);
  if (photos.length === 0) return;

  for (let index = 0; index < photos.length; index += MEDIA_GROUP_SIZE) {
    const chunk = photos.slice(index, index + MEDIA_GROUP_SIZE);

    try {
      if (chunk.length === 1) {
        const single = chunk[0]!;
        await bot.telegram.sendPhoto(chatId, single.url, { caption: single.caption });
      } else {
        await bot.telegram.sendMediaGroup(
          chatId,
          chunk.map((photo) => ({ type: 'photo', media: photo.url, caption: photo.caption })),
        );
      }
    } catch (error) {
      console.error('report: медіагрупа не відправилась', error);
    }

    if (index + MEDIA_GROUP_SIZE < photos.length) await delay(GROUP_DELAY_MS);
  }
}

export async function sendReport(chatId: string | number, report: ReportInput): Promise<void> {
  if (!chatId) {
    console.warn('sendReport: не вказано chatId — звіт не відправлено');
    return;
  }

  await bot.telegram.sendMessage(chatId, formatReport(report), { parse_mode: 'HTML' });

  await sendPhotos(chatId, report.items);
}
