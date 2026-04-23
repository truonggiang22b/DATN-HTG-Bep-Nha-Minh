// ─── Enums ───────────────────────────────────────────────────────────────────
export type ItemStatus = 'ACTIVE' | 'SOLD_OUT' | 'HIDDEN';
export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type SessionStatus = 'OPEN' | 'SERVING' | 'CLOSED';
export type UserRole = 'ADMIN' | 'KITCHEN' | 'MANAGER';

// ─── Cart (per-client, NOT in shared store) ──────────────────────────────────
export interface SelectedOption {
  optionGroupId: string;
  optionGroupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  selectedOptions: SelectedOption[];
  note: string;
  lineTotal: number;
}

// ─── Toast ───────────────────────────────────────────────────────────────────
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES (từ Backend MVP)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  roles: UserRole[];
  branchId: string;
  storeId: string;
  displayName?: string;
}

// ─── QR Resolution ───────────────────────────────────────────────────────────
export interface QRResolveData {
  table: {
    id: string;
    tableCode: string;
    displayName: string;
    qrToken: string;
    status: 'ACTIVE' | 'INACTIVE';
  };
  branch: {
    id: string;
    name: string;
    address: string;
  };
  store: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  activeSession: {
    id: string;
    status: SessionStatus;
  } | null;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
export interface ApiMenuOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface ApiOptionGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: ApiMenuOption[];
}

export interface ApiMenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  imageUrl?: string;
  shortDescription?: string;
  tags: string[];
  status: ItemStatus;
  sortOrder: number;
  optionGroups: ApiOptionGroup[];
}

export interface ApiCategory {
  id: string;
  name: string;
  sortOrder: number;
  status?: string;
  items?: ApiMenuItem[]; // Chỉ có trong public menu response
}

export interface MenuResponse {
  categories: (ApiCategory & { items: ApiMenuItem[] })[];
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export interface ApiOrderItem {
  id: string;
  menuItemId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  selectedOptionsSnapshot: {
    optionGroupId: string;
    optionId: string;
    name: string;
    priceDelta: number;
  }[];
  note?: string;
  lineTotal: number;
}

export interface ApiOrder {
  id: string;
  orderCode: string;
  status: OrderStatus;
  internalStatus?: OrderStatus;       // trackOrder response field
  customerStatus?: string;            // Human-readable customer status
  subtotal: number;
  customerNote?: string;
  idempotencyKey?: string;
  tableId?: string;
  tableSessionId?: string;
  tableDisplayName?: string;
  branchId?: string;
  storeId?: string;
  sessionStatus?: SessionStatus;
  clientSessionId?: string;
  items: ApiOrderItem[];
  createdAt: string;
  updatedAt: string;
  // Populated joins (từ tracking endpoint)
  table?: {
    id: string;
    displayName: string;
    qrToken: string;
    tableCode: string;
  };
}

// ─── Submit Order Payload ─────────────────────────────────────────────────────
export interface SubmitOrderPayload {
  qrToken: string;
  clientSessionId: string;
  idempotencyKey: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    selectedOptions: Array<{
      optionGroupId: string;
      optionId: string;
      name: string;
      priceDelta: number;
    }>;
    note?: string;
  }>;
}

// ─── Tables (Admin) ────────────────────────────────────────────────────────────
export interface ApiTable {
  id: string;
  tableCode: string;
  displayName: string;
  qrToken: string;
  status: 'ACTIVE' | 'INACTIVE';
  hasActiveSession: boolean;
  branchId: string;
}
