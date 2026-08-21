import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http-error.js';

function prismaCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code?: unknown };
    return typeof code === 'string' ? code : null;
  }

  return null;
}

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

  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  switch (prismaCode(error)) {
    case 'P2025':
      res.status(404).json({ error: 'Запис не знайдено' });
      return;
    case 'P2002':
      res.status(409).json({ error: 'Такий запис уже існує' });
      return;
    default:
      break;
  }

  console.error(error);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
}
