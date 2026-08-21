import { Router } from 'express';
import { z } from 'zod';
import { createPresignedGet, createPresignedPut, isAllowedMime, isOwnKey } from '../services/r2.js';
import { HttpError } from '../lib/http-error.js';

export const uploadsRouter = Router();

const signSchema = z.object({ mimeType: z.string().min(1) });
const keySchema = z.object({ key: z.string().min(1) });

// POST /api/uploads/sign — presigned PUT, браузер вантажить у R2 напряму
uploadsRouter.post('/sign', async (req, res, next) => {
  try {
    const { mimeType } = signSchema.parse(req.body);

    if (!isAllowedMime(mimeType)) {
      throw new HttpError(415, 'Дозволені лише JPEG, PNG і WebP');
    }

    res.json(await createPresignedPut(mimeType));
  } catch (error) {
    next(error);
  }
});

// GET /api/uploads/sign-get?key=… — ключ містить слеші, тому query, а не :param
uploadsRouter.get('/sign-get', async (req, res, next) => {
  try {
    const { key } = keySchema.parse(req.query);

    if (!isOwnKey(key)) {
      throw new HttpError(400, 'Некоректний ключ');
    }

    res.json({ url: await createPresignedGet(key) });
  } catch (error) {
    next(error);
  }
});
