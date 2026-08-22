import { Router } from 'express';
import {
  checklistItemInputSchema,
  checklistItemUpdateSchema,
  reorderSchema,
  storeInputSchema,
  storeUpdateSchema,
  userInputSchema,
  userUpdateSchema,
} from '@sa/shared';
import { prisma } from '@sa/db';
import { generateSheetName } from '../services/stores.js';
import { cleanupOrphanPhotos } from '../services/photo-cleanup.js';
import { HttpError } from '../lib/http-error.js';

export const adminRouter = Router();

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

function requireId(id: string | undefined): string {
  if (!id) throw new HttpError(400, 'Не вказано id');
  return id;
}

// ─── Точки ────────────────────────────────────────────────────────────────────

adminRouter.get('/stores', async (_req, res, next) => {
  try {
    res.json(await prisma.store.findMany({ orderBy: [{ city: 'asc' }, { address: 'asc' }] }));
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/stores', async (req, res, next) => {
  try {
    const body = storeInputSchema.parse(req.body);
    const last = await prisma.store.findFirst({ orderBy: { order: 'desc' }, select: { order: true } });

    const store = await prisma.store.create({
      data: {
        ...body,
        sheetName: await generateSheetName(body.city, body.address),
        order: (last?.order ?? -1) + 1,
      },
    });

    res.status(201).json(store);
  } catch (error) {
    next(isUniqueViolation(error) ? new HttpError(409, 'Така точка вже існує') : error);
  }
});

adminRouter.patch('/stores/:id', async (req, res, next) => {
  try {
    const id = requireId(req.params.id);
    const body = storeUpdateSchema.parse(req.body);

    res.json(await prisma.store.update({ where: { id }, data: body }));
  } catch (error) {
    next(isUniqueViolation(error) ? new HttpError(409, 'Така точка вже існує') : error);
  }
});

// ─── Чек-лист ─────────────────────────────────────────────────────────────────

adminRouter.get('/checklist', async (_req, res, next) => {
  try {
    res.json(await prisma.checklistItem.findMany({ orderBy: { order: 'asc' } }));
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/checklist', async (req, res, next) => {
  try {
    const body = checklistItemInputSchema.parse(req.body);
    const last = await prisma.checklistItem.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const item = await prisma.checklistItem.create({
      data: { ...body, order: body.order ?? (last?.order ?? -1) + 1 },
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/checklist/reorder', async (req, res, next) => {
  try {
    const { ids } = reorderSchema.parse(req.body);

    await prisma.$transaction(
      ids.map((id, index) => prisma.checklistItem.update({ where: { id }, data: { order: index } })),
    );

    res.json(await prisma.checklistItem.findMany({ orderBy: { order: 'asc' } }));
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/checklist/:id', async (req, res, next) => {
  try {
    const id = requireId(req.params.id);
    const body = checklistItemUpdateSchema.parse(req.body);

    res.json(await prisma.checklistItem.update({ where: { id }, data: body }));
  } catch (error) {
    next(error);
  }
});

// ─── Ревізори ─────────────────────────────────────────────────────────────────

adminRouter.get('/users', async (_req, res, next) => {
  try {
    res.json(await prisma.user.findMany({ orderBy: { createdAt: 'asc' } }));
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/users', async (req, res, next) => {
  try {
    const body = userInputSchema.parse(req.body);
    res.status(201).json(await prisma.user.create({ data: body }));
  } catch (error) {
    next(isUniqueViolation(error) ? new HttpError(409, 'Такий tgId вже заведений') : error);
  }
});

adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    const id = requireId(req.params.id);
    const body = userUpdateSchema.parse(req.body);
    const me = req.user!;

    if (id === me.id && (body.role === 'REVISOR' || body.isActive === false)) {
      throw new HttpError(409, 'Не можна зняти права з самого себе');
    }

    const losingAdmin = body.role === 'REVISOR' || body.isActive === false;

    if (losingAdmin) {
      const admins = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });

      if (admins <= 1 && target?.role === 'ADMIN') {
        throw new HttpError(409, 'Це останній активний адміністратор');
      }
    }

    res.json(await prisma.user.update({ where: { id }, data: body }));
  } catch (error) {
    next(error);
  }
});

// ─── Обслуговування ───────────────────────────────────────────────────────────

adminRouter.post('/photos/cleanup', async (req, res, next) => {
  try {
    const dryRun = req.query.dryRun === '1' || req.query.dryRun === 'true';
    res.json(await cleanupOrphanPhotos(dryRun));
  } catch (error) {
    next(error);
  }
});
