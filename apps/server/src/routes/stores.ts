import { Router } from 'express';
import { prisma } from '@sa/db';

export const storesRouter = Router();

storesRouter.get('/', async (_req, res) => {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, city: true, address: true, isActive: true },
  });

  res.json(stores);
});
