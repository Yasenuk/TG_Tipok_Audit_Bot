import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@sa/shared';
import { env, isProd } from '../env.js';
import { prisma } from '@sa/db';

const MAX_AUTH_AGE_SECONDS = 60 * 60 * 24;

export interface AuthUser {
  id: string;
  tgId: string;
  name: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function parseInitData(initData: string): { tgId: string; name: string } | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(env.BOT_TOKEN).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computed.length !== hash.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash))) return null;

  const authDate = Number(params.get('auth_date') ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) return null;

  const rawUser = params.get('user');
  if (!rawUser) return null;

  const user = JSON.parse(rawUser) as { id: number; first_name?: string; last_name?: string };

  return {
    tgId: String(user.id),
    name: [user.first_name, user.last_name].filter(Boolean).join(' ') || String(user.id),
  };
}

export async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const initData = req.header('x-init-data');

  const devTgId = !isProd ? req.header('x-dev-tg-id') : undefined;
  const parsed = devTgId ? { tgId: devTgId, name: 'dev' } : initData ? parseInitData(initData) : null;

  if (!parsed) {
    res.status(401).json({ error: 'Недійсні дані авторизації' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { tgId: parsed.tgId } });

  if (!user || !user.isActive) {
    res.status(403).json({ error: 'Немає доступу' });
    return;
  }

  req.user = { id: user.id, tgId: user.tgId, name: user.name, role: user.role };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Тільки для адміністраторів' });
    return;
  }

  next();
}
