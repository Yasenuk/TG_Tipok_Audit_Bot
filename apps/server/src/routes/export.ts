import { Router } from 'express';
import { exportQuerySchema } from '@sa/shared';
import { buildWorkbook } from '../services/xlsx.js';
import { bot } from '../bot/index.js';

export const exportRouter = Router();

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function fileName(): string {
  return `audits_${new Date().toISOString().slice(0, 10)}.xlsx`;
}

// GET /api/export/xlsx — пряме завантаження (працює у звичайному браузері)
exportRouter.get('/xlsx', async (req, res, next) => {
  try {
    const query = exportQuerySchema.parse(req.query);
    const workbook = await buildWorkbook(query);

    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName()}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

exportRouter.post('/xlsx/send', async (req, res, next) => {
  try {
    const query = exportQuerySchema.parse(req.body);
    const workbook = await buildWorkbook(query);
    const buffer = await workbook.xlsx.writeBuffer();

    await bot.telegram.sendDocument(req.user!.tgId, {
      source: Buffer.from(buffer as ArrayBuffer),
      filename: fileName(),
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
