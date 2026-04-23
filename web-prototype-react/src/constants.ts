import type { OrderStatus } from './types';

// ─── Brand ───────────────────────────────────────────────────────────────────
export const BRAND_NAME = 'Bếp Nhà Mình';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const INTERNAL_PIN = '1234';

// ─── Order status transitions (explicit allowed map) ─────────────────────────
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED'],
  SERVED: [],
  CANCELLED: [],
};

// ─── Status labels for Customer (friendly) ───────────────────────────────────
export const CUSTOMER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Đã tiếp nhận',
  PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng – Đang mang ra',
  SERVED: 'Đã phục vụ',
  CANCELLED: 'Đơn đã hủy',
};

// ─── Status labels for KDS (internal) ────────────────────────────────────────
export const KDS_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Mới nhận',
  PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng',
  SERVED: 'Đã phục vụ',
  CANCELLED: 'Đã hủy',
};

// ─── KDS CTA labels ───────────────────────────────────────────────────────────
export const KDS_CTA_LABELS: Partial<Record<OrderStatus, string>> = {
  NEW: 'Bắt đầu chuẩn bị',
  PREPARING: 'Sẵn sàng',
  READY: 'Đã phục vụ',
};

// ─── Centralized status color system — single source of truth ────────────────
// bg        : solid fill for pill badges / KDS CTA buttons
// text      : text on top of bg
// light     : light tint for card backgrounds (admin)
// kdsBg     : KDS dark-theme card background tint
// kdsBorder : KDS dark-theme card border accent
export const ORDER_STATUS_STYLE: Record<
  OrderStatus,
  { bg: string; text: string; light: string; kdsBg: string; kdsBorder: string }
> = {
  NEW:       { bg: '#3b82f6', text: '#fff', light: '#eff6ff', kdsBg: 'rgba(59,130,246,0.10)',  kdsBorder: 'rgba(59,130,246,0.55)'  },
  PREPARING: { bg: '#f59e0b', text: '#fff', light: '#fffbeb', kdsBg: 'rgba(245,158,11,0.10)', kdsBorder: 'rgba(245,158,11,0.55)' },
  READY:     { bg: '#22c55e', text: '#fff', light: '#f0fdf4', kdsBg: 'rgba(34,197,94,0.10)',   kdsBorder: 'rgba(34,197,94,0.55)'   },
  SERVED:    { bg: '#0d9488', text: '#fff', light: '#f0fdfa', kdsBg: 'rgba(13,148,136,0.06)',  kdsBorder: 'rgba(13,148,136,0.35)'  },
  CANCELLED: { bg: '#ef4444', text: '#fff', light: '#fef2f2', kdsBg: 'rgba(239,68,68,0.06)',   kdsBorder: 'rgba(239,68,68,0.35)'   },
};

// Legacy tone map kept for stat-card CSS classes (admin-stat-card--*)
export const STATUS_TONES: Record<OrderStatus, string> = {
  NEW:       'var(--color-turmeric)',
  PREPARING: 'var(--color-chili)',
  READY:     'var(--color-leaf)',
  SERVED:    'var(--color-leaf)',
  CANCELLED: 'var(--color-soy)',
};


// ─── KDS column order ─────────────────────────────────────────────────────────
export const KDS_COLUMNS: OrderStatus[] = ['NEW', 'PREPARING', 'READY', 'SERVED'];

// ─── Sync ─────────────────────────────────────────────────────────────────────
export const STORE_KEY = 'bep-nha-minh-store';
export const SYNC_ASSUMPTION = 'Prototype realtime sync only supports same-browser-profile multi-tab demo.';
