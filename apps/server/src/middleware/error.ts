import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Некоректні дані', issues: error.issues });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
}
