import { Router } from 'express';
import { submitAuditSchema } from '@sa/shared';

export const auditsRouter = Router();

// POST /api/audits > створити перевірку, порахувати бали, відправити звіт у чат
auditsRouter.post('/', async (req, res, next) => {
  try {
    const body = submitAuditSchema.parse(req.body);
    // TODO: createAudit(req.user!, body) > транзакція + sendReport()
    res.status(501).json({ error: 'not implemented', storeId: body.storeId });
  } catch (error) {
    next(error);
  }
});

// GET /api/audits > історія (ревізор бачить свої, адмін - усі)
auditsRouter.get('/', async (_req, res) => {
  res.status(501).json({ error: 'not implemented' });
});

// GET /api/audits/:id > одна перевірка з пунктами, коментарями і фото
auditsRouter.get('/:id', async (_req, res) => {
  res.status(501).json({ error: 'not implemented' });
});
