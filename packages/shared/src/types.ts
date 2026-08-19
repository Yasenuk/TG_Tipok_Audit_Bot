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
