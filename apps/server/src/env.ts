import '@sa/db/load-env';
import { z } from 'zod';

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), schema);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  BOT_TOKEN: z.string().min(1),

  PUBLIC_URL: optional(
    z
      .url()
      .transform((url) => url.replace(/\/+$/, ''))
      .optional(),
  ),
  MINIAPP_URL: optional(z.url().optional()),
  REPORT_CHAT_ID: optional(z.string().optional()),

  R2_ACCOUNT_ID: optional(z.string().optional()),
  R2_ACCESS_KEY_ID: optional(z.string().optional()),
  R2_SECRET_ACCESS_KEY: optional(z.string().optional()),
  R2_BUCKET: z.string().default('store-audit-photos'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Некоректний .env:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')} — ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
