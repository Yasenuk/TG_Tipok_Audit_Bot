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
  sheetName: z.string().trim().min(1).max(31),
  isActive: z.boolean().default(true),
});

export const checklistItemInputSchema = z.object({
  label: z.string().trim().min(1).max(200),
  order: z.number().int().min(0),
  isActive: z.boolean().default(true),
});

export const userInputSchema = z.object({
  tgId: z.string().regex(/^\d+$/, 'tgId — це число'),
  name: z.string().trim().min(1),
  role: z.enum(['REVISOR', 'ADMIN']),
  isActive: z.boolean().default(true),
});

export const exportQuerySchema = z.object({
  storeIds: z.array(z.string()).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AuditItemInput = z.infer<typeof auditItemInputSchema>;
export type SubmitAuditInput = z.infer<typeof submitAuditSchema>;
export type StoreInput = z.infer<typeof storeInputSchema>;
export type ChecklistItemInput = z.infer<typeof checklistItemInputSchema>;
export type UserInput = z.infer<typeof userInputSchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
