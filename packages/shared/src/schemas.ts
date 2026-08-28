import { z } from 'zod';
import { MAX_PER_ITEM } from './scoring.js';

export const MAX_PHOTOS_PER_ITEM = 3;

export const auditItemInputSchema = z.object({
  itemId: z.string().min(1),
  score: z.number().int().min(0).max(MAX_PER_ITEM),
  comment: z.string().trim().max(500).optional(),
  photos: z.array(z.string().min(1)).max(MAX_PHOTOS_PER_ITEM).default([]),
});

export const submitAuditSchema = z
  .object({
    storeId: z.string().min(1),
    sellerName: z.string().trim().min(1, 'Вкажіть ПІБ продавця').max(120),
    items: z.array(auditItemInputSchema).min(1),
  })
  .refine((body) => new Set(body.items.map((i) => i.itemId)).size === body.items.length, {
    message: 'Дубльовані пункти чек-листа',
    path: ['items'],
  })
  .refine((body) => body.items.some((i) => i.score > 0), {
    message: 'Хоча б один пункт має бути оцінений',
    path: ['items'],
  });

export const storeInputSchema = z.object({
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  isActive: z.boolean().default(true),
});

export const storeUpdateSchema = storeInputSchema
  .extend({ sheetName: z.string().trim().min(1).max(31) })
  .partial();

export const checklistItemInputSchema = z.object({
  label: z.string().trim().min(1).max(200),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

export const checklistItemUpdateSchema = checklistItemInputSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const userInputSchema = z.object({
  tgId: z.string().regex(/^\d+$/, 'tgId — це число'),
  name: z.string().trim().min(1),
  role: z.enum(['REVISOR', 'ADMIN']),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = userInputSchema.omit({ tgId: true }).partial();

const csvIds = z.preprocess(
  (value) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value),
  z.array(z.string()).optional(),
);

export const exportQuerySchema = z.object({
  storeIds: csvIds,
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AuditItemInput = z.infer<typeof auditItemInputSchema>;
export type SubmitAuditInput = z.infer<typeof submitAuditSchema>;
export type StoreInput = z.infer<typeof storeInputSchema>;
export type StoreUpdate = z.infer<typeof storeUpdateSchema>;
export type ChecklistItemInput = z.infer<typeof checklistItemInputSchema>;
export type ChecklistItemUpdate = z.infer<typeof checklistItemUpdateSchema>;
export type UserInput = z.infer<typeof userInputSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
