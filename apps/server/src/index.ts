import path from 'node:path';
import express from 'express';
import { env, isProd } from './env.js';
import { bot, WEBHOOK_PATH } from './bot/index.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error.js';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', apiRouter);

if (isProd) {
  const dist = path.resolve(import.meta.dirname, '../../miniapp/dist');
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(errorHandler);

async function start(): Promise<void> {
  if (env.PUBLIC_URL) {
    app.use(await bot.createWebhook({ domain: env.PUBLIC_URL, path: WEBHOOK_PATH }));
    console.log('bot: webhook mode');
  } else {
    void bot.launch();
    console.log('bot: long polling (dev)');
  }

  app.listen(env.PORT, () => console.log(`server: http://localhost:${env.PORT}`));
}

void start();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
