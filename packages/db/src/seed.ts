import { DEFAULT_CHECKLIST, DEFAULT_STORES, buildSheetName } from '@sa/shared';
import { prisma } from './client.js';

function uniqueSheetNames(stores: typeof DEFAULT_STORES): string[] {
  const used = new Set<string>();

  return stores.map((store) => {
    const base = buildSheetName(store.city, store.address);
    let name = base;
    let n = 2;

    while (used.has(name)) {
      name = `${base.slice(0, 28)}_${n++}`;
    }

    used.add(name);
    return name;
  });
}

async function main(): Promise<void> {
  const names = uniqueSheetNames(DEFAULT_STORES);

  for (const [index, store] of DEFAULT_STORES.entries()) {
    await prisma.store.upsert({
      where: { city_address: { city: store.city, address: store.address } },
      update: { order: index },
      create: { city: store.city, address: store.address, sheetName: names[index]!, order: index },
    });
  }

  for (const [index, label] of DEFAULT_CHECKLIST.entries()) {
    const existing = await prisma.checklistItem.findFirst({ where: { label } });

    if (existing) {
      await prisma.checklistItem.update({ where: { id: existing.id }, data: { order: index } });
    } else {
      await prisma.checklistItem.create({ data: { label, order: index } });
    }
  }

  const adminTgId = process.env.SEED_ADMIN_TG_ID;

  if (adminTgId) {
    await prisma.user.upsert({
      where: { tgId: adminTgId },
      update: { role: 'ADMIN', isActive: true },
      create: { tgId: adminTgId, name: 'Адмін', role: 'ADMIN' },
    });
  }

  console.log(`seed: ${DEFAULT_STORES.length} точок, ${DEFAULT_CHECKLIST.length} пунктів`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
