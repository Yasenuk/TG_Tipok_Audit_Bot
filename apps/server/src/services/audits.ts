import { calcScore, type SubmitAuditInput } from '@sa/shared';
import { prisma } from '@sa/db';
import type { AuthUser } from '../middleware/auth.js';
import { HttpError } from '../lib/http-error.js';

/**
 * Пункти чек-листа денормалізуються в AuditItem на момент перевірки
 */
export async function createAudit(user: AuthUser, input: SubmitAuditInput) {
  const [store, checklist] = await Promise.all([
    prisma.store.findUnique({ where: { id: input.storeId } }),
    prisma.checklistItem.findMany({
      where: { id: { in: input.items.map((item) => item.itemId) } },
      select: { id: true, label: true, order: true },
    }),
  ]);

  if (!store || !store.isActive) {
    throw new HttpError(404, 'Точку не знайдено або вона неактивна');
  }

  const byId = new Map(checklist.map((item) => [item.id, item]));

  if (byId.size !== input.items.length) {
    throw new HttpError(409, 'Чек-лист змінився — перезавантажте форму');
  }

  const summary = calcScore(input.items);

  return prisma.audit.create({
    data: {
      storeId: store.id,
      userId: user.id,
      sellerName: input.sellerName,
      total: summary.total,
      maxTotal: summary.maxTotal,
      items: {
        create: input.items.map((item) => {
          const snapshot = byId.get(item.itemId)!;

          return {
            itemId: snapshot.id,
            itemLabel: snapshot.label,
            itemOrder: snapshot.order,
            score: item.score,
            comment: item.comment?.trim() || null,
            photos: item.photos,
          };
        }),
      },
    },
    include: {
      store: { select: { city: true, address: true } },
      items: { orderBy: { itemOrder: 'asc' } },
    },
  });
}
