import { Telegraf, Markup } from 'telegraf';
import { env } from '../env.js';
import { prisma } from '@sa/db';

export const WEBHOOK_PATH = '/telegraf/webhook';

export const bot = new Telegraf(env.BOT_TOKEN);

bot.start(async (ctx) => {
  const tgId = String(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { tgId } });

  if (!user || !user.isActive) {
    await ctx.reply(`Доступу немає. Передай адміну свій ID: ${tgId}`);
    return;
  }

  if (!env.PUBLIC_URL) {
    await ctx.reply('Mini App недоступний у dev-режимі без PUBLIC_URL.');
    return;
  }

  await ctx.reply(
    `Вітаю, ${user.name}. Відкривай перевірку:`,
    Markup.inlineKeyboard([Markup.button.webApp('Відкрити', env.PUBLIC_URL)]),
  );
});

bot.command('id', (ctx) => ctx.reply(String(ctx.from.id)));
