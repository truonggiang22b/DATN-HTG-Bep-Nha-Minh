/**
 * OnlineTrackingPage.tsx — Theo dõi đơn hàng online
 * Phase 2: Bếp Nhà Mình Online Ordering
 *
 * Route: /online-tracking/:orderId
 * Polling mỗi 30s để cập nhật trạng thái giao hàng
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { onlineApi, type OnlineOrderDetail } from '../services/onlineApi';
import './OnlineTrackingPage.css';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));

// ─── Delivery Status Config ───────────────────────────────────────────────────

type DelivStaus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

const DELIVERY_STEPS: { status: DelivStaus; label: string; icon: string }[] = [
  { status: 'PENDING',    label: 'Đã đặt hàng',   icon: '📋' },
  { status: 'ACCEPTED',   label: 'Đã xác nhận',    icon: '✅' },
  { status: 'PREPARING',  label: 'Đang chuẩn bị',  icon: '👨‍🍳' },
  { status: 'DELIVERING', label: 'Đang giao',       icon: '🛵' },
  { status: 'DELIVERED',  label: 'Đã giao',         icon: '🎉' },
];

const STATUS_ORDER: Record<DelivStaus, number> = {
  PENDING: 0, ACCEPTED: 1, PREPARING: 2, DELIVERING: 3, DELIVERED: 4, CANCELLED: -1,
};

function DeliveryTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER[status as DelivStaus] ?? 0;
  const isCancelled = status === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="otp__cancelled">
        <span className="otp__cancelled-icon">🚫</span>
        <p>Đơn hàng đã bị hủy</p>
      </div>
    );
  }

  return (
    <div className="otp__timeline">
      {DELIVERY_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.status} className={`otp__tl-step${done ? ' done' : ''}${active ? ' active' : ''}`}>
            <div className="otp__tl-icon">
              {done ? step.icon : <span className="otp__tl-num">{i + 1}</span>}
            </div>
            <div className="otp__tl-body">
              <span className="otp__tl-label">{step.label}</span>
              {active && <span className="otp__tl-badge">Hiện tại</span>}
            </div>
            {i < DELIVERY_STEPS.length - 1 && (
              <div className={`otp__tl-line${done ? ' done' : ''}`} aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OnlineTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();

  const { data: order, isLoading, isError } = useQuery<OnlineOrderDetail>({
    queryKey: ['online-order', orderId],
    queryFn: () => onlineApi.getOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: 30_000, // poll mỗi 30s
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="otp">
        <div className="otp__loading">
          <div className="otp__spinner" />
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="otp">
        <div className="otp__error">
          <p className="otp__error-icon">😕</p>
          <h2>Không tìm thấy đơn hàng</h2>
          <p>Mã đơn hàng: <code>{orderId}</code></p>
          <Link to="/order-online" className="otp__btn-back">
            Đặt hàng mới
          </Link>
        </div>
      </div>
    );
  }

  const deliveryStatus = order.deliveryInfo?.deliveryStatus ?? 'PENDING';

  return (
    <div className="otp">
      {/* Header */}
      <header className="otp__header">
        <Link to="/order-online" className="otp__home-link">🏠 Bếp Nhà Mình</Link>
        <h1 className="otp__title">Theo dõi đơn hàng</h1>
      </header>

      <main className="otp__main">
        {/* Order code + meta */}
        <div className="otp__card otp__card--hero">
          <div className="otp__order-code">#{order.orderCode}</div>
          <div className="otp__order-meta">
            <span>{order.branchName}</span>
            <span>·</span>
            <span>{fmtDate(order.createdAt)}</span>
          </div>
          <div className="otp__polling-note">
            <span className="otp__pulse" aria-hidden />
            Tự động cập nhật mỗi 30 giây
          </div>
        </div>

        {/* Delivery Timeline */}
        <div className="otp__card">
          <h2 className="otp__card-title">📍 Trạng thái giao hàng</h2>
          <DeliveryTimeline status={deliveryStatus} />
        </div>

        {/* Delivery Info */}
        {order.deliveryInfo && (
          <div className="otp__card">
            <h2 className="otp__card-title">📋 Thông tin giao hàng</h2>
            <div className="otp__info-grid">
              <div className="otp__info-row">
                <span>Người nhận</span>
                <strong>{order.deliveryInfo.customerName}</strong>
              </div>
              <div className="otp__info-row">
                <span>Số điện thoại</span>
                <strong>{order.deliveryInfo.phone}</strong>
              </div>
              <div className="otp__info-row">
                <span>Địa chỉ</span>
                <strong>
                  {order.deliveryInfo.address}
                  {order.deliveryInfo.ward ? `, ${order.deliveryInfo.ward}` : ''}
                  {order.deliveryInfo.district ? `, ${order.deliveryInfo.district}` : ''}
                </strong>
              </div>
              {order.deliveryInfo.distanceKm && (
                <div className="otp__info-row">
                  <span>Khoảng cách</span>
                  <strong>{order.deliveryInfo.distanceKm.toFixed(1)} km</strong>
                </div>
              )}
              <div className="otp__info-row">
                <span>Phí giao hàng</span>
                <strong className="otp__text-green">{fmt(order.deliveryInfo.shippingFee)}</strong>
              </div>
              <div className="otp__info-row">
                <span>Thanh toán</span>
                <strong>💵 COD — Tiền mặt khi nhận</strong>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="otp__card">
          <h2 className="otp__card-title">🍜 Món đã đặt</h2>
          <div className="otp__items">
            {order.items.map((item) => (
              <div key={item.id} className="otp__item">
                <div className="otp__item-main">
                  <span className="otp__item-name">{item.name}</span>
                  <span className="otp__item-qty">×{item.quantity}</span>
                </div>
                {item.note && <p className="otp__item-note">📝 {item.note}</p>}
                <span className="otp__item-price">{fmt(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          {/* Bill summary */}
          <div className="otp__bill">
            <div className="otp__bill-row">
              <span>Tạm tính</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            <div className="otp__bill-row">
              <span>Phí giao hàng</span>
              <span>{fmt(order.deliveryInfo?.shippingFee ?? 0)}</span>
            </div>
            <div className="otp__bill-row otp__bill-row--total">
              <strong>Tổng cộng</strong>
              <strong className="otp__bill-total">{fmt(order.total)}</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="otp__actions">
          <Link to="/order-online/menu" className="otp__btn-reorder" id="btn-reorder">
            🍜 Đặt hàng thêm
          </Link>
          <a href="tel:+84901234567" className="otp__btn-call" id="btn-call-shop">
            📞 Gọi cho quán
          </a>
        </div>
      </main>
    </div>
  );
}
