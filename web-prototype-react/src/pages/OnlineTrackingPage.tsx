/**
 * OnlineTrackingPage.tsx — Theo dõi đơn hàng online
 * Phase 2: Bếp Nhà Mình Online Ordering
 *
 * Thiết kế nhất quán với Phase 1 (customer.css):
 * - Warm earthy palette (rice, paper, chili, leaf)
 * - Không dùng emoji icon — thay bằng SVG thuần hoặc ký hiệu typography
 * - Timeline giống TrackingPage.tsx Phase 1
 * - Font: Be Vietnam Pro + Sora
 *
 * Route: /online-tracking/:orderId
 * Polling mỗi 30s
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

// ── SVG icons (nhất quán với TrackingPage.tsx Phase 1) ─────────────────────────

const IconCheck = () => (
  <svg viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconClipboard = () => (
  <svg viewBox="0 0 24 24">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
  </svg>
);

const IconThumbUp = () => (
  <svg viewBox="0 0 24 24">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const IconCook = () => (
  <svg viewBox="0 0 24 24">
    <path d="M11 21H5a2 2 0 0 1-2-2v-5" />
    <path d="M3 10a7 7 0 1 1 14 0" />
    <path d="M21 21v-1a4 4 0 0 0-4-4h-1" />
    <line x1="9" y1="17" x2="9" y2="21" />
    <line x1="13" y1="17" x2="13" y2="21" />
  </svg>
);

const IconTruck = () => (
  <svg viewBox="0 0 24 24">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconHome = () => (
  <svg viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Delivery Status Config ─────────────────────────────────────────────────────

type DelivStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

const DELIVERY_STEPS: { status: DelivStatus; label: string; Icon: () => JSX.Element }[] = [
  { status: 'PENDING',    label: 'Đã đặt hàng',  Icon: IconClipboard },
  { status: 'ACCEPTED',   label: 'Đã xác nhận',  Icon: IconThumbUp },
  { status: 'PREPARING',  label: 'Đang chuẩn bị', Icon: IconCook },
  { status: 'DELIVERING', label: 'Đang giao',     Icon: IconTruck },
  { status: 'DELIVERED',  label: 'Đã giao',       Icon: IconHome },
];

const STATUS_ORDER: Record<DelivStatus, number> = {
  PENDING: 0, ACCEPTED: 1, PREPARING: 2, DELIVERING: 3, DELIVERED: 4, CANCELLED: -1,
};

function DeliveryTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER[status as DelivStatus] ?? 0;
  const isCancelled = status === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="otp__cancelled">
        <div className="otp__cancelled-icon">
          <IconX />
        </div>
        <p>Đơn hàng đã bị hủy</p>
      </div>
    );
  }

  return (
    <div className="otp__timeline">
      {DELIVERY_STEPS.map(({ status: stepStatus, label, Icon }, i) => {
        const done   = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div
            key={stepStatus}
            className={`otp__tl-step${done ? ' done' : ''}${active ? ' active' : ''}`}
          >
            <div className="otp__tl-icon">
              {done ? <Icon /> : <span className="otp__tl-num">{i + 1}</span>}
            </div>
            <div className="otp__tl-body">
              <span className="otp__tl-label">{label}</span>
              {active && <span className="otp__tl-badge">Hiện tại</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function OnlineTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();

  const { data: order, isLoading, isError } = useQuery<OnlineOrderDetail>({
    queryKey: ['online-order', orderId],
    queryFn: () => onlineApi.getOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: 30_000,
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
          <h2>Không tìm thấy đơn hàng</h2>
          <p>Mã đơn: <code>{orderId}</code></p>
          <Link to="/order-online" className="otp__btn-back-link" id="btn-back-to-landing">
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
        <Link to="/order-online" className="otp__home-link" id="link-home">
          Bếp Nhà Mình
        </Link>
        <span className="otp__title">Theo dõi đơn hàng</span>
      </header>

      <main className="otp__main">
        {/* Hero — mã đơn + polling note */}
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
          <h2 className="otp__card-title">Trạng thái giao hàng</h2>
          <DeliveryTimeline status={deliveryStatus} />
        </div>

        {/* Delivery Info */}
        {order.deliveryInfo && (
          <div className="otp__card">
            <h2 className="otp__card-title">Thông tin giao hàng</h2>
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
                <strong>COD — Tiền mặt khi nhận</strong>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="otp__card">
          <h2 className="otp__card-title">Món đã đặt</h2>
          <div className="otp__items">
            {order.items.map((item) => (
              <div key={item.id} className="otp__item">
                <div className="otp__item-main">
                  <span className="otp__item-name">{item.name}</span>
                  <span className="otp__item-qty">×{item.quantity}</span>
                </div>
                {item.note && <p className="otp__item-note">{item.note}</p>}
                <span className="otp__item-price">{fmt(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          {/* Bill */}
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
            Đặt hàng thêm
          </Link>
          <a href="tel:+84901234567" className="otp__btn-call" id="btn-call-shop">
            Gọi cho quán
          </a>
        </div>
      </main>
    </div>
  );
}
