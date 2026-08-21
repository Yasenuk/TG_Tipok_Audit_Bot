export type Role = 'REVISOR' | 'ADMIN';

export interface MeResponse {
  id: string;
  tgId: string;
  name: string;
  role: Role;
}

export interface StoreDto {
  id: string;
  city: string;
  address: string;
  isActive: boolean;
}

export interface ChecklistItemDto {
  id: string;
  label: string;
  order: number;
}

export interface AuditListItemDto {
  id: string;
  storeId: string;
  storeLabel: string;
  revisorName: string;
  total: number;
  maxTotal: number;
  percent: number;
  createdAt: string;
}

export interface AuditItemDto {
  itemLabel: string;
  itemOrder: number;
  score: number;
  comment: string | null;
  photos: string[];
}

export interface AuditDetailDto extends AuditListItemDto {
  items: AuditItemDto[];
}

export interface PagedResponse<T> {
  total: number;
  items: T[];
}

// ─── Адмінка: повні записи, включно з неактивними ────────────────────────────

export interface AdminStoreDto {
  id: string;
  city: string;
  address: string;
  sheetName: string;
  order: number;
  isActive: boolean;
}

export interface AdminChecklistItemDto {
  id: string;
  label: string;
  order: number;
  isActive: boolean;
}

export interface AdminUserDto {
  id: string;
  tgId: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}
