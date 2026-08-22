import { prisma } from '@sa/db';
import { deleteObjects, listAllObjects } from './r2.js';

const GRACE_PERIOD_MS = 60 * 60 * 1000;

export interface CleanupResult {
  scanned: number;
  used: number;
  deleted: number;
  skippedFresh: number;
}

export async function cleanupOrphanPhotos(dryRun = false): Promise<CleanupResult> {
  const [objects, items] = await Promise.all([
    listAllObjects(),
    prisma.auditItem.findMany({ select: { photos: true } }),
  ]);

  const used = new Set(items.flatMap((item) => item.photos));
  const threshold = Date.now() - GRACE_PERIOD_MS;

  const orphans: string[] = [];
  let skippedFresh = 0;

  for (const object of objects) {
    if (used.has(object.key)) continue;

    if (object.lastModified.getTime() > threshold) {
      skippedFresh += 1;
      continue;
    }

    orphans.push(object.key);
  }

  if (!dryRun && orphans.length > 0) {
    await deleteObjects(orphans);
  }

  return {
    scanned: objects.length,
    used: used.size,
    deleted: dryRun ? 0 : orphans.length,
    skippedFresh,
  };
}
