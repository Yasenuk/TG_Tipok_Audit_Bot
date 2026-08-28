import ExcelJS from 'exceljs';
import { calcScore, type ExportQuery } from '@sa/shared';
import { prisma } from '@sa/db';

const LABEL_COLUMN_WIDTH = 55;
const DATE_COLUMN_WIDTH = 12;
const TOTAL_LABEL = 'Загальна к-л балів:';
const SELLER_LABEL = 'Продавець:';

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

export interface ExportAudit {
  createdAt: Date;
  sellerName: string | null;
  items: Array<{ itemLabel: string; itemOrder: number; score: number; comment: string | null }>;
}

function collectLabels(audits: ExportAudit[]): string[] {
  const order = new Map<string, number>();

  for (const audit of audits) {
    for (const item of audit.items) {
      const known = order.get(item.itemLabel);
      if (known === undefined || item.itemOrder < known) order.set(item.itemLabel, item.itemOrder);
    }
  }

  return [...order.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label);
}

export function renderStoreSheet(sheet: ExcelJS.Worksheet, audits: ExportAudit[]): void {
  const labels = collectLabels(audits);

  sheet.columns = [
    { width: LABEL_COLUMN_WIDTH },
    ...audits.map(() => ({ width: DATE_COLUMN_WIDTH })),
  ];

  const header = sheet.addRow(['', ...audits.map((audit) => audit.createdAt)]);

  audits.forEach((_, index) => {
    const cell = header.getCell(index + 2);
    cell.numFmt = 'dd.mm.yyyy';
    cell.alignment = { horizontal: 'center' };
  });

  const sellerRow = sheet.addRow([SELLER_LABEL, ...audits.map((audit) => audit.sellerName ?? '')]);
  sellerRow.getCell(1).alignment = { horizontal: 'right' };
  audits.forEach((_, index) => {
    sellerRow.getCell(index + 2).alignment = { horizontal: 'center', wrapText: true };
  });

  for (const label of labels) {
    const row = sheet.addRow([
      label,
      ...audits.map((audit) => {
        const item = audit.items.find((candidate) => candidate.itemLabel === label);
        if (!item) return null;

        return item.score === 0 ? '—' : item.score;
      }),
    ]);

    row.getCell(1).alignment = { horizontal: 'right', wrapText: true };

    audits.forEach((audit, index) => {
      const cell = row.getCell(index + 2);
      cell.alignment = { horizontal: 'center' };

      const comment = audit.items.find((item) => item.itemLabel === label)?.comment;
      if (comment) cell.note = comment;
    });
  }

  const summaries = audits.map((audit) => calcScore(audit.items));

  const totalRow = sheet.addRow([TOTAL_LABEL, ...summaries.map((summary) => summary.total)]);
  totalRow.getCell(1).alignment = { horizontal: 'right' };
  audits.forEach((_, index) => {
    totalRow.getCell(index + 2).alignment = { horizontal: 'center' };
  });

  const percentRow = sheet.addRow([
    '',
    ...summaries.map((summary) => (summary.maxTotal === 0 ? 0 : summary.total / summary.maxTotal)),
  ]);

  audits.forEach((_, index) => {
    const cell = percentRow.getCell(index + 2);
    cell.numFmt = '0%';
    cell.alignment = { horizontal: 'right' };
  });

  sheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = BORDER;
    });
  });

  sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];
}

export async function buildWorkbook(query: ExportQuery): Promise<ExcelJS.Workbook> {
  const to = query.to ? new Date(query.to) : undefined;
  if (to) to.setHours(23, 59, 59, 999);

  const audits = await prisma.audit.findMany({
    where: {
      ...(query.storeIds?.length ? { storeId: { in: query.storeIds } } : {}),
      ...(query.from || to
        ? { createdAt: { ...(query.from ? { gte: query.from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    },
    orderBy: { createdAt: 'asc' },
    include: {
      store: { select: { sheetName: true, order: true } },
      items: { orderBy: { itemOrder: 'asc' } },
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Store Audit Bot';

  const byStore = new Map<string, { sheetName: string; order: number; audits: ExportAudit[] }>();

  for (const audit of audits) {
    const group = byStore.get(audit.storeId) ?? {
      sheetName: audit.store.sheetName,
      order: audit.store.order,
      audits: [],
    };

    group.audits.push({
      createdAt: audit.createdAt,
      sellerName: audit.sellerName,
      items: audit.items,
    });
    byStore.set(audit.storeId, group);
  }

  const groups = [...byStore.values()].sort((a, b) => a.order - b.order);

  if (groups.length === 0) {
    workbook.addWorksheet('Немає даних').addRow(['За вибраний період перевірок немає']);
    return workbook;
  }

  for (const group of groups) {
    renderStoreSheet(workbook.addWorksheet(group.sheetName), group.audits);
  }

  return workbook;
}
