import { Router } from 'express';
import { exportQuerySchema } from '@sa/shared';

export const exportRouter = Router();

// GET /api/export/xlsx > аркуш на точку, тільки для адмінів
exportRouter.get('/xlsx', async (req, res, next) => {
  try {
    exportQuerySchema.parse(req.query);
    // TODO: buildWorkbook() > workbook.xlsx.write(res)
    res.status(501).json({ error: 'not implemented' });
  } catch (error) {
    next(error);
  }
});
