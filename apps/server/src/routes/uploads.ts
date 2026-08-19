import { Router } from 'express';

export const uploadsRouter = Router();

// POST /api/uploads/sign > presigned PUT у R2, повертає { key, url }
uploadsRouter.post('/sign', async (_req, res) => {
  // TODO: createPresignedPut(mimeType) з services/r2.ts
  res.status(501).json({ error: 'not implemented' });
});

// GET /api/uploads/:key > presigned GET для перегляду фото в адмінці
uploadsRouter.get('/:key', async (_req, res) => {
  res.status(501).json({ error: 'not implemented' });
});
