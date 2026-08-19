import { Router } from 'express';
import { prisma } from '@sa/db';

export const checklistRouter = Router();

checklistRouter.get('/', async (_req, res) => {
  const items = await prisma.checklistItem.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, label: true, order: true },
  });

  res.json(items);
});
