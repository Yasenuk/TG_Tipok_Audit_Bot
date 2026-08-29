import type { Message } from 'telegraf/types';
import { calcScore, formatSummary } from '@sa/shared';
import { bot } from './index.js';
import { createPresignedGet } from '../services/r2.js';

const MAX_MESSAGE_LENGTH = 4096;
const MAX_COMMENT_LENGTH = 120;

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

interface OutgoingPhoto {
  media: string;
  caption: string;
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

function largestFileId(sizes: readonly { file_id: string }[] | undefined): string | undefined {
  return sizes?.at(-1)?.file_id;
}

async function collectPhotos(items: ReportItem[]): Promise<OutgoingPhoto[]> {
  const photos: OutgoingPhoto[] = [];

  for (const item of items) {
    for (const key of item.photos) {
      try {
        photos.push({
          media: await createPresignedGet(key),
          caption: shorten(`${item.itemLabel} — ${item.score}`, MAX_CAPTION_LENGTH),
        });
      } catch (error) {
        console.error(`report: не вдалось підписати ${key}`, error);
      }
    }
  }

  return photos;
}

async function sendChunk(
  chatId: string | number,
  chunk: OutgoingPhoto[],
): Promise<Array<string | undefined>> {
  if (chunk.length === 1) {
    const only = chunk[0]!;
    const message = await bot.telegram.sendPhoto(chatId, only.media, { caption: only.caption });

    return [largestFileId(message.photo)];
  }

  const messages = await bot.telegram.sendMediaGroup(
    chatId,
    chunk.map((photo) => ({ type: 'photo', media: photo.media, caption: photo.caption })),
  );

  return messages.map((message) =>
    'photo' in message ? largestFileId((message as Message.PhotoMessage).photo) : undefined,
  );
}

async function sendPhotos(chatIds: string[], items: ReportItem[]): Promise<void> {
  const photos = await collectPhotos(items);
  if (photos.length === 0) return;

  for (const chatId of chatIds) {
    for (let index = 0; index < photos.length; index += MEDIA_GROUP_SIZE) {
      const chunk = photos.slice(index, index + MEDIA_GROUP_SIZE);

      try {
        const fileIds = await sendChunk(chatId, chunk);

        fileIds.forEach((fileId, offset) => {
          const target = photos[index + offset];
          if (target && fileId) target.media = fileId;
        });
      } catch (error) {
        console.error(`report: медіагрупа не пішла в ${chatId}`, error);
      }

      if (index + MEDIA_GROUP_SIZE < photos.length) await delay(GROUP_DELAY_MS);
    }
  }
}

export async function sendReport(chatIds: string[], report: ReportInput): Promise<void> {
  const recipients = [...new Set(chatIds.filter(Boolean))];

  if (recipients.length === 0) {
    console.warn('sendReport: немає кому відправляти звіт');
    return;
  }

  const text = formatReport(report);
  const delivered: string[] = [];

  for (const chatId of recipients) {
    try {
      await bot.telegram.sendMessage(chatId, text, { parse_mode: 'HTML' });
      delivered.push(chatId);
    } catch (error) {
      console.error(`report: ${chatId} не отримав звіт`, error);
    }
  }

  await sendPhotos(delivered, report.items);
}
