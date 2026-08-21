import { buildSheetName } from '@sa/shared';
import { prisma } from '@sa/db';

const MAX_SHEET_NAME = 31;

/**
 * Excel не пускає однакові назви аркушів, а скорочення адреси легко збігається
 */
export async function generateSheetName(city: string, address: string): Promise<string> {
  const base = buildSheetName(city, address);

  const taken = new Set(
    (await prisma.store.findMany({ select: { sheetName: true } })).map((s) => s.sheetName),
  );

  if (!taken.has(base)) return base;

  for (let n = 2; n < 100; n += 1) {
    const suffix = `_${n}`;
    const candidate = `${base.slice(0, MAX_SHEET_NAME - suffix.length)}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }

  throw new Error(`Не вдалось підібрати унікальну назву аркуша для ${city} ${address}`);
}
