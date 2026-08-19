import '@sa/db/load-env';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  BOT_TOKEN: z.string().min(1),
  PUBLIC_URL: z.url().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default('store-audit-photos'),
});

export const env = envSchema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';
