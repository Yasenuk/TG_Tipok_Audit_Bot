import path from 'node:path';
import { existsSync } from 'node:fs';
import express from 'express';
import { env, isProd } from './env.js';
import { bot, WEBHOOK_PATH } from './bot/index.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import { prisma } from '@sa/db';

function findMiniappDist(): string | null {
  let dir = import.meta.dirname;

  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = path.join(dir, 'apps', 'miniapp', 'dist');
    if (existsSync(candidate)) return candidate;

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

const app = express();

app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', apiRouter);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Маршрут не знайдено' }));

async function start(): Promise<void> {
  if (env.PUBLIC_URL) {
    app.use(await bot.createWebhook({ domain: env.PUBLIC_URL, path: WEBHOOK_PATH }));
    console.log('bot: webhook mode');
  } else {
    void bot.launch();
    console.log('bot: long polling (dev)');
  }

  if (isProd) {
    const dist = findMiniappDist();

    if (dist) {
      app.use(express.static(dist));
      app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
      console.log(`miniapp: ${dist}`);
    } else {
      console.error('miniapp: збірку не знайдено — спочатку npm run build -w @sa/miniapp');
    }
  }

  app.use(errorHandler);

  app.listen(env.PORT, () => console.log(`server: http://localhost:${env.PORT}`));
}

void start();

async function shutdown(signal: string): Promise<void> {
  console.log(`shutdown: ${signal}`);
  bot.stop(signal);
  await prisma.$disconnect();
  process.exit(0);
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
