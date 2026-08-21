import { api } from './api.js';

const MAX_SIDE = 1600;
const QUALITY = 0.8;
const MIME = 'image/jpeg';

/**
 * Фото з телефону — це 3-8 МБ, у яких для чек-листа немає сенсу.
 * Стискаємо в браузері: менше трафіку в ревізора і менше сміття в R2.
 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, MIME, QUALITY);
  });

  return blob ?? file;
}

/** Повертає ключ у R2, який потім летить у AuditItem.photos */
export async function uploadPhoto(file: File): Promise<string> {
  const blob = await shrink(file);

  const { data } = await api.post<{ key: string; url: string }>('/uploads/sign', {
    mimeType: MIME,
  });

  // Навмисно fetch, а не axios: у R2 не можна слати наші заголовки авторизації,
  // інакше підпис не зійдеться
  const response = await fetch(data.url, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': MIME },
  });

  if (!response.ok) {
    throw new Error(`R2 PUT ${response.status}`);
  }

  return data.key;
}
