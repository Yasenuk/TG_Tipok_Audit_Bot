import { Router } from 'express';
import { z } from 'zod';
import { calcScore, submitAuditSchema, type AuditListItemDto } from '@sa/shared';
import { prisma } from '@sa/db';
import { createAudit } from '../services/audits.js';
import { sendReport } from '../bot/report.js';
import { HttpError } from '../lib/http-error.js';

export const auditsRouter = Router();

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  storeId: z.string().optional(),
});

const percentOf = (total: number, maxTotal: number): number =>
  maxTotal === 0 ? 0 : Math.round((total / maxTotal) * 100);

// POST /api/audits — створити перевірку і відправити звіт ревізору в чат
auditsRouter.post('/', async (req, res, next) => {
  try {
    const body = submitAuditSchema.parse(req.body);
    const user = req.user!;
    const audit = await createAudit(user, body);

    // Звіт не має права завалити збереження: логуємо і йдемо далі
    void sendReport(user.tgId, {
      storeLabel: `${audit.store.city}, ${audit.store.address}`,
      revisorName: user.name,
      sellerName: audit.sellerName,
      createdAt: audit.createdAt,
      items: audit.items,
    }).catch((error: unknown) => {
      console.error(`sendReport failed (audit ${audit.id}):`, error);
    });

    res.status(201).json({
      id: audit.id,
      total: audit.total,
      maxTotal: audit.maxTotal,
      percent: calcScore(audit.items).percent,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/audits — історія: ревізор бачить свої, адмін усі
auditsRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const user = req.user!;

    const where = {
      ...(user.role === 'ADMIN' ? {} : { userId: user.id }),
      ...(query.storeId ? { storeId: query.storeId } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
        include: {
          store: { select: { city: true, address: true } },
          user: { select: { name: true } },
        },
      }),
      prisma.audit.count({ where }),
    ]);

    const items: AuditListItemDto[] = rows.map((audit) => ({
      id: audit.id,
      storeId: audit.storeId,
      storeLabel: `${audit.store.city}, ${audit.store.address}`,
      revisorName: audit.user.name,
      sellerName: audit.sellerName,
      total: audit.total,
      maxTotal: audit.maxTotal,
      percent: percentOf(audit.total, audit.maxTotal),
      createdAt: audit.createdAt.toISOString(),
    }));

    res.json({ total, items });
  } catch (error) {
    next(error);
  }
});

// GET /api/audits/:id — одна перевірка з пунктами, коментарями і фото
auditsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new HttpError(400, 'Не вказано id перевірки');

    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        store: { select: { city: true, address: true } },
        user: { select: { name: true } },
        items: { orderBy: { itemOrder: 'asc' } },
      },
    });

    if (!audit) throw new HttpError(404, 'Перевірку не знайдено');

    const user = req.user!;
    if (user.role !== 'ADMIN' && audit.userId !== user.id) {
      throw new HttpError(403, 'Немає доступу до чужої перевірки');
    }

    res.json({
      id: audit.id,
      storeId: audit.storeId,
      storeLabel: `${audit.store.city}, ${audit.store.address}`,
      revisorName: audit.user.name,
      sellerName: audit.sellerName,
      total: audit.total,
      maxTotal: audit.maxTotal,
      percent: percentOf(audit.total, audit.maxTotal),
      createdAt: audit.createdAt.toISOString(),
      items: audit.items.map((item) => ({
        itemLabel: item.itemLabel,
        itemOrder: item.itemOrder,
        score: item.score,
        comment: item.comment,
        photos: item.photos,
      })),
    });
  } catch (error) {
    next(error);
  }
});
