/**
 * AdminDeliveryPage.tsx — Giám sát đơn hàng giao tận nơi (Read-only)
 * Phase 2: Bếp Nhà Mình Online Ordering
 *
 * Route: /admin/delivery
 * Admin chỉ xem trạng thái — KDS và Shipper điều phối đơn
 */

import React, { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import {
  deliveryApi,
  type DeliveryStatus,
  type DeliveryOrderSummary,
} from '../services/deliveryApi';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import './AdminDeliveryPage.css';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
  }).format(new Date(iso));

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
const IcoUser = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoPin = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcoNote = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>
  </svg>
);
const IcoBike = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6h2l2 5.5"/><path d="M5.5 14L9 6h4l2 5.5H5.5z"/>
    <line x1="15" y1="6" x2="9" y2="6"/>
  </svg>
);
const IcoWarn = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IcoCheck = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Status Config (display only) ─────────────────────────────────────────────
const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; bg: string }> = {
  PENDING:    { label: 'Chờ xác nhận', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  ACCEPTED:   { label: 'Đang nấu',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  PREPARING:  { label: 'Đang nấu',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  DELIVERING: { label: 'Đang giao',    color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
  DELIVERED:  { label: 'Đã giao',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  CANCELLED:  { label: 'Đã hủy',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

const ALL_FILTER_STATUSES: (DeliveryStatus | 'ALL')[] = [
  'ALL', 'PENDING', 'PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED',
];

// ─── 4-Step Timeline Stepper ──────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { label: 'Đã nhận',   key: 'received'   },
  { label: 'Đang nấu',  key: 'preparing'  },
  { label: 'Đang giao', key: 'delivering' },
  { label: 'Hoàn thành',key: 'delivered'  },
];

/** Trả về index bước hiện tại (0-based).
 *  -1 = chưa có bước nào (PENDING — chờ bếp nhận)
 *  3  = hoàn thành (DELIVERED)
 */
function getStepIndex(status: DeliveryStatus): number {
  switch (status) {
    case 'PENDING':    return -1; // chưa bắt đầu
    case 'ACCEPTED':
    case 'PREPARING':  return 1;  // bước 2 active: Đang nấu
    case 'DELIVERING': return 2;  // bước 3 active: Đang giao
    case 'DELIVERED':  return 4;  // tất cả xong
    case 'CANCELLED':  return -2; // special
    default:           return -1;
  }
}

function DeliveryTimeline({ status }: { status: DeliveryStatus }) {
  if (status === 'CANCELLED') {
    return (
      <div className="adp__timeline adp__timeline--cancelled">
        <span className="adp__timeline-cancelled-txt">✕ Đơn hàng đã bị hủy</span>
      </div>
    );
  }

  const currentStep = getStepIndex(status);

  return (
    <div className="adp__timeline">
      <p className="adp__timeline-label">TIẾN TRÌNH ĐƠN HÀNG</p>
      <div className="adp__timeline-track">
        {TIMELINE_STEPS.map((step, i) => {
          const done   = i < currentStep;
          const active = i === currentStep;
          return (
            <React.Fragment key={step.key}>
              {/* Connector rail (trước mỗi bước trừ bước đầu) */}
              {i > 0 && (
                <div className={`adp__tl-rail${done || (active && i > 0) ? ' adp__tl-rail--done' : ''}`} />
              )}
              <div className="adp__tl-step">
                <div className={[
                  'adp__tl-dot',
                  done   ? 'adp__tl-dot--done'   : '',
                  active ? 'adp__tl-dot--active'  : '',
                  !done && !active && currentStep !== 4 ? 'adp__tl-dot--pending' : '',
                  currentStep === 4 ? 'adp__tl-dot--done' : '',
                ].filter(Boolean).join(' ')}>
                  {(done || currentStep === 4) ? <IcoCheck /> : null}
                </div>
                <span className={[
                  'adp__tl-text',
                  done || currentStep === 4 ? 'adp__tl-text--done'   : '',
                  active ? 'adp__tl-text--active' : '',
                ].filter(Boolean).join(' ')}>
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Order Card (Read-only) ───────────────────────────────────────────────────
function DeliveryOrderCard({ order }: { order: DeliveryOrderSummary }) {
  const [expanded, setExpanded] = useState(false);
  const di = order.deliveryInfo;
  const delivStatus = di?.deliveryStatus ?? 'PENDING';
  const cfg = DELIVERY_STATUS_CONFIG[delivStatus];
  const total = (order.subtotal ?? 0) + (di?.shippingFee ?? 0);

  return (
    <div className={`adp__card adp__card--${delivStatus.toLowerCase()}`}>
      {/* Card header */}
      <div className="adp__card-header">
        <div className="adp__card-left">
          <span className="adp__order-code">#{order.orderCode}</span>
          <span className="adp__time">{fmtTime(order.createdAt)}</span>
          {order.updatedAt && order.createdAt &&
            new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime() > 5000 && (
            <span className="adp__time adp__time--updated">
              Cập nhật: {fmtTime(order.updatedAt)}
            </span>
          )}
        </div>
        <div className="adp__card-right">
          <span
            className="adp__status-badge"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Customer info */}
      {di && (
        <div className="adp__card-info">
          <div className="adp__info-row">
            <span className="adp__info-icon"><IcoUser /></span>
            <strong>{di.customerName}</strong>
            <a href={`tel:${di.phone}`} className="adp__phone">{di.phone}</a>
          </div>
          <div className="adp__info-row">
            <span className="adp__info-icon"><IcoPin /></span>
            <span className="adp__address">
              {di.address}
              {di.ward ? `, ${di.ward}` : ''}
              {di.district ? `, ${di.district}` : ''}
            </span>
          </div>
          {di.note && (
            <div className="adp__info-row adp__info-row--note">
              <span className="adp__info-icon"><IcoNote /></span>
              <span>{di.note}</span>
            </div>
          )}
        </div>
      )}

      {/* ── 4-Step Timeline ── */}
      <DeliveryTimeline status={delivStatus} />

      {/* Summary footer */}
      <div className="adp__card-summary">
        <span className="adp__item-count">{order.itemCount} món</span>
        {di?.distanceKm && (
          <span className="adp__distance">
            <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="2" y1="12" x2="22" y2="12"/><polyline points="14 6 20 12 14 18"/>
            </svg>
            {di.distanceKm.toFixed(1)} km
          </span>
        )}
        <button
          className="adp__toggle-detail"
          onClick={() => setExpanded((p) => !p)}
          type="button"
        >
          {expanded ? '▲ Thu gọn' : '▼ Xem chi tiết'}
        </button>
        <div className="adp__totals">
          {di && <span className="adp__ship-fee">Ship: {fmt(di.shippingFee)}</span>}
          <strong className="adp__total">{fmt(total)}</strong>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="adp__detail">
          <div className="adp__detail-row">
            <span>Mã đơn</span><strong>#{order.orderCode}</strong>
          </div>
          <div className="adp__detail-row">
            <span>Tạm tính</span><strong>{fmt(order.subtotal)}</strong>
          </div>
          <div className="adp__detail-row">
            <span>Phí ship</span><strong>{fmt(di?.shippingFee ?? 0)}</strong>
          </div>
          <div className="adp__detail-row adp__detail-row--total">
            <span>Tổng thu</span>
            <strong className="adp__detail-total">{fmt(total)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Error Boundary ──────────────────────────────────────────────────────────
class CardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="adp__error" style={{ fontSize: 12 }}>
          <IcoWarn /> Lỗi hiển thị đơn hàng: {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AdminDeliveryPage() {
  const { showToast: _showToast } = useStore();
  void _showToast; // suppress unused warning
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'ALL'>('ALL');

  const params = statusFilter === 'ALL' ? { pageSize: 50 } : { pageSize: 50, deliveryStatus: statusFilter };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deliveryOrders', statusFilter],
    queryFn: () => deliveryApi.listOrders(params),
    refetchInterval: 30_000,
  });

  const handleRealtimeEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['deliveryOrders', statusFilter] });
  }, [queryClient, statusFilter]);

  const realtime = useRealtimeOrders({ onEvent: handleRealtimeEvent });

  const orders = data?.orders ?? [];

  const countByStatus = (status: DeliveryStatus) =>
    orders.filter((o) => o.deliveryInfo?.deliveryStatus === status).length;

  return (
    <div>
      {/* Topbar */}
      <div className="admin-topbar">
        <span className="admin-topbar__title">Giám sát đơn giao hàng</span>
        <span className="adp__live-badge">
          <span className="adp__pulse" aria-hidden />
          {realtime.statusText}
        </span>
      </div>

      <div className="admin-content">
        {/* Status filter tabs */}
        <div className="adp__filter-bar">
          {ALL_FILTER_STATUSES.map((s) => {
            const cfg = s === 'ALL' ? null : DELIVERY_STATUS_CONFIG[s];
            const count = s === 'ALL' ? orders.length : countByStatus(s);
            return (
              <button
                key={s}
                className={`adp__filter-btn${statusFilter === s ? ' active' : ''}`}
                onClick={() => setStatusFilter(s)}
                style={statusFilter === s && cfg ? { borderColor: cfg.color, color: cfg.color } : {}}
                type="button"
              >
                {s === 'ALL' ? 'Tất cả' : cfg!.label}
                {count > 0 && (
                  <span
                    className="adp__filter-count"
                    style={statusFilter === s && cfg ? { background: cfg.color } : {}}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Info banner — read-only notice */}
        <div className="adp__info-banner">
          <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Trang này chỉ hiển thị trạng thái. Bếp cập nhật qua <strong>KDS</strong> · Shipper xác nhận qua <strong>Giao hàng</strong>.
        </div>

        {isLoading && (
          <div className="adp__loading">
            <div className="adp__spinner" />
            <p>Đang tải đơn hàng...</p>
          </div>
        )}

        {isError && (
          <div className="adp__error">
            <IcoWarn /> Không thể tải dữ liệu. Vui lòng thử lại.
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="adp__empty">
            <div className="adp__empty-icon"><IcoBike /></div>
            <p>Chưa có đơn giao hàng nào</p>
          </div>
        )}

        {!isLoading && orders.length > 0 && (
          <div className="adp__orders-grid">
            {orders.map((order) => (
              <CardErrorBoundary key={order.id}>
                <DeliveryOrderCard order={order} />
              </CardErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
