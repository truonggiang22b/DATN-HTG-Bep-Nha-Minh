/**
 * AdminDeliveryPage.tsx — Quản lý đơn hàng giao tận nơi
 * Phase 2: Bếp Nhà Mình Online Ordering
 *
 * Route: /admin/delivery
 * Hiển thị danh sách đơn online, cập nhật trạng thái giao hàng
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import {
  deliveryApi,
  type DeliveryStatus,
  type DeliveryOrderSummary,
} from '../services/deliveryApi';
import './AdminDeliveryPage.css';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(
    new Date(iso)
  );

// ─── Delivery Status Config ───────────────────────────────────────────────────

const DELIVERY_STATUS_CONFIG: Record<
  DeliveryStatus,
  { label: string; color: string; bg: string; nextStatus?: DeliveryStatus; nextLabel?: string }
> = {
  PENDING:    { label: 'Chờ xác nhận', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', nextStatus: 'ACCEPTED',   nextLabel: '✓ Xác nhận đơn' },
  ACCEPTED:   { label: 'Đã xác nhận',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', nextStatus: 'PREPARING',  nextLabel: '👨‍🍳 Bắt đầu làm' },
  PREPARING:  { label: 'Đang chuẩn bị',color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', nextStatus: 'DELIVERING', nextLabel: '🛵 Giao đi' },
  DELIVERING: { label: 'Đang giao',    color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', nextStatus: 'DELIVERED',  nextLabel: '✅ Đã giao' },
  DELIVERED:  { label: 'Đã giao',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  CANCELLED:  { label: 'Đã hủy',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

const ALL_FILTER_STATUSES: (DeliveryStatus | 'ALL')[] = [
  'ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED',
];

// ─── Order Card ───────────────────────────────────────────────────────────────

function DeliveryOrderCard({
  order,
  onUpdateStatus,
  isUpdating,
}: {
  order: DeliveryOrderSummary;
  onUpdateStatus: (orderId: string, status: DeliveryStatus) => void;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const di = order.deliveryInfo;
  const delivStatus = di?.deliveryStatus ?? 'PENDING';
  const cfg = DELIVERY_STATUS_CONFIG[delivStatus];
  const next = cfg.nextStatus;
  const total = (order.subtotal ?? 0) + (di?.shippingFee ?? 0);

  return (
    <div className={`adp__card adp__card--${delivStatus.toLowerCase()}`}>
      {/* Card header */}
      <div className="adp__card-header">
        <div className="adp__card-left">
          <span className="adp__order-code">#{order.orderCode}</span>
          <span className="adp__time">{fmtTime(order.createdAt)}</span>
        </div>
        <div className="adp__card-right">
          <span
            className="adp__status-badge"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          {next && (
            <button
              className="adp__btn-next"
              onClick={() => onUpdateStatus(order.id, next)}
              disabled={isUpdating}
              style={{ background: cfg.color }}
              id={`btn-delivery-next-${order.id}`}
            >
              {cfg.nextLabel}
            </button>
          )}
          {delivStatus !== 'CANCELLED' && delivStatus !== 'DELIVERED' && (
            <button
              className="adp__btn-cancel"
              onClick={() => {
                if (window.confirm(`Hủy đơn ${order.orderCode}?`)) {
                  onUpdateStatus(order.id, 'CANCELLED');
                }
              }}
              disabled={isUpdating}
              id={`btn-delivery-cancel-${order.id}`}
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      {/* Customer info */}
      {di && (
        <div className="adp__card-info">
          <div className="adp__info-row">
            <span className="adp__info-icon">👤</span>
            <strong>{di.customerName}</strong>
            <a href={`tel:${di.phone}`} className="adp__phone">{di.phone}</a>
          </div>
          <div className="adp__info-row">
            <span className="adp__info-icon">📍</span>
            <span className="adp__address">
              {di.address}
              {di.ward ? `, ${di.ward}` : ''}
              {di.district ? `, ${di.district}` : ''}
            </span>
          </div>
          {di.note && (
            <div className="adp__info-row adp__info-row--note">
              <span className="adp__info-icon">📝</span>
              <span>{di.note}</span>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="adp__card-summary">
        <span className="adp__item-count">{order.itemCount} món</span>
        {di?.distanceKm && (
          <span className="adp__distance">📏 {di.distanceKm.toFixed(1)} km</span>
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
            <span>Mã đơn</span>
            <strong>#{order.orderCode}</strong>
          </div>
          <div className="adp__detail-row">
            <span>Tạm tính</span>
            <strong>{fmt(order.subtotal)}</strong>
          </div>
          <div className="adp__detail-row">
            <span>Phí ship</span>
            <strong>{fmt(di?.shippingFee ?? 0)}</strong>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminDeliveryPage() {
  const { showToast } = useStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'ALL'>('ALL');

  const params = statusFilter === 'ALL' ? { pageSize: 50 } : { pageSize: 50, deliveryStatus: statusFilter };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deliveryOrders', statusFilter],
    queryFn: () => deliveryApi.listOrders(params),
    refetchInterval: 30_000,
  });

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: DeliveryStatus }) =>
      deliveryApi.updateStatus(orderId, status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['deliveryOrders'] });
      showToast(`Đơn ${res.order.orderCode} → ${DELIVERY_STATUS_CONFIG[res.deliveryStatus].label}`, 'success');
    },
    onError: () => showToast('Không thể cập nhật trạng thái', 'error'),
  });

  const orders = data?.orders ?? [];

  // Count by status for filter badges
  const countByStatus = (status: DeliveryStatus) =>
    orders.filter((o) => o.deliveryInfo?.deliveryStatus === status).length;

  return (
    <div>
      {/* Topbar */}
      <div className="admin-topbar">
        <span className="admin-topbar__title">Đơn giao hàng</span>
        <span className="adp__live-badge">
          <span className="adp__pulse" aria-hidden />
          Cập nhật mỗi 30s
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

        {/* Content */}
        {isLoading && (
          <div className="adp__loading">
            <div className="adp__spinner" />
            <p>Đang tải đơn hàng...</p>
          </div>
        )}

        {isError && (
          <div className="adp__error">
            ⚠️ Không thể tải dữ liệu. Vui lòng thử lại.
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="adp__empty">
            <div className="adp__empty-icon">🛵</div>
            <p>Chưa có đơn giao hàng nào</p>
          </div>
        )}

        {!isLoading && orders.length > 0 && (
          <div className="adp__orders-grid">
            {orders.map((order) => (
              <DeliveryOrderCard
                key={order.id}
                order={order}
                onUpdateStatus={(orderId, status) => updateStatus({ orderId, status })}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
