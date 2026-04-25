/**
 * OnlineTrackingPage.tsx — Theo dõi đơn hàng online
 * Phase 2 — Bếp Nhà Mình
 * Responsive: mobile + desktop, Be Vietnam Pro + Sora
 * Route: /online-tracking/:orderId | Polling mỗi 30s
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { onlineApi, type OnlineOrderDetail } from '../services/onlineApi';
import './OnlineTrackingPage.css';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));

// ── SVG icons ──────────────────────────────────────────────────────────────────

const ICONS = {
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  ),
  ThumbUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  Cook: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 21H5a2 2 0 0 1-2-2v-5" />
      <path d="M3 10a7 7 0 1 1 14 0" />
      <path d="M21 21v-1a4 4 0 0 0-4-4h-1" />
      <line x1="9" y1="17" x2="9" y2="21" />
      <line x1="13" y1="17" x2="13" y2="21" />
    </svg>
  ),
  Truck: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

// ── Status config ──────────────────────────────────────────────────────────────

type DelivStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

const STEPS: { status: DelivStatus; label: string; desc: string; Icon: () => React.ReactElement }[] = [
  { status: 'PENDING',    label: 'Đã đặt hàng',   desc: 'Đơn hàng đã được ghi nhận',           Icon: ICONS.Clipboard },
  { status: 'ACCEPTED',   label: 'Đã xác nhận',   desc: 'Bếp đã xác nhận và bắt đầu chuẩn bị', Icon: ICONS.ThumbUp },
  { status: 'PREPARING',  label: 'Đang nấu',       desc: 'Chúng tôi đang chuẩn bị món của bạn', Icon: ICONS.Cook },
  { status: 'DELIVERING', label: 'Đang giao',      desc: 'Shipper đang trên đường đến',          Icon: ICONS.Truck },
  { status: 'DELIVERED',  label: 'Đã giao',        desc: 'Đơn hàng đã giao thành công',          Icon: ICONS.Home },
];

const STATUS_ORDER: Record<DelivStatus, number> = {
  PENDING: 0, ACCEPTED: 1, PREPARING: 2, DELIVERING: 3, DELIVERED: 4, CANCELLED: -1,
};

const STATUS_META: Record<DelivStatus, { headline: string; sub: string; badge: string; badgeCls: string; iconCls: string }> = {
  PENDING:    { headline: 'Đơn hàng đã được đặt',      sub: 'Chờ quán xác nhận — thường trong vài phút',       badge: 'Chờ xác nhận',  badgeCls: 'otp__status-badge--pending',    iconCls: '' },
  ACCEPTED:   { headline: 'Quán đã xác nhận',          sub: 'Bếp sẽ bắt đầu chuẩn bị ngay',                    badge: 'Đã xác nhận',   badgeCls: 'otp__status-badge--preparing',  iconCls: '' },
  PREPARING:  { headline: 'Đang chuẩn bị món ăn',      sub: 'Các món đang được nấu tươi cho bạn',               badge: 'Đang nấu',      badgeCls: 'otp__status-badge--preparing',  iconCls: '' },
  DELIVERING: { headline: 'Shipper đang giao hàng',    sub: 'Đơn hàng đang trên đường đến địa chỉ của bạn',     badge: 'Đang giao',     badgeCls: 'otp__status-badge--delivering', iconCls: '' },
  DELIVERED:  { headline: 'Giao hàng thành công!',     sub: 'Cảm ơn bạn đã đặt hàng — chúc ngon miệng!',       badge: 'Đã giao',       badgeCls: 'otp__status-badge--delivered',  iconCls: 'otp__status-icon--done' },
  CANCELLED:  { headline: 'Đơn hàng đã bị hủy',        sub: 'Liên hệ quán nếu bạn có thắc mắc',                badge: 'Đã hủy',        badgeCls: 'otp__status-badge--cancelled',  iconCls: 'otp__status-icon--cancelled' },
};

const STATUS_ICON: Record<string, () => React.ReactElement> = {
  PENDING: ICONS.Clipboard, ACCEPTED: ICONS.ThumbUp, PREPARING: ICONS.Cook,
  DELIVERING: ICONS.Truck, DELIVERED: ICONS.Home, CANCELLED: ICONS.X,
};

// ── Timeline ───────────────────────────────────────────────────────────────────

function DeliveryTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER[status as DelivStatus] ?? 0;

  if (status === 'CANCELLED') {
    return (
      <div className="otp__cancelled-banner">
        <div className="otp__cancelled-icon"><ICONS.X /></div>
        <div className="otp__cancelled-text">
          <strong>Đơn hàng đã bị hủy</strong>
          Vui lòng liên hệ quán để biết thêm thông tin.
        </div>
      </div>
    );
  }

  return (
    <div className="otp__timeline">
      {STEPS.map(({ status: stepStatus, label, desc, Icon }, i) => {
        const done   = i <= currentIdx;
        const active = i === currentIdx;
        const state  = done ? (active ? 'active' : 'done') : 'pending';
        return (
          <div key={stepStatus} className={`otp__tl-item otp__tl-item--${state}`}>
            <div className="otp__tl-dot-col">
              <div className="otp__tl-dot">
                {done && !active
                  ? <ICONS.Check />
                  : active
                  ? <Icon />
                  : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-soy)' }}>{i + 1}</span>
                }
              </div>
            </div>
            <div className="otp__tl-body">
              <div className="otp__tl-label">{label}</div>
              <div className="otp__tl-desc">{desc}</div>
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="otp">
      <header className="otp__header">
        <Link to="/order-online" className="otp__header-brand" id="link-home-loading">
          <img src="/logo.png" alt="" />
          Bếp Nhà Mình
        </Link>
      </header>
      <div className="otp__loading">
        <div className="otp__spinner" />
        <span className="otp__loading-text">Đang tải thông tin đơn hàng...</span>
      </div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError || !order) return (
    <div className="otp">
      <header className="otp__header">
        <Link to="/order-online" className="otp__header-brand" id="link-home-error">
          <img src="/logo.png" alt="" />
          Bếp Nhà Mình
        </Link>
      </header>
      <div className="otp__error">
        <div className="otp__error-icon"><ICONS.AlertCircle /></div>
        <div className="otp__error-title">Không tìm thấy đơn hàng</div>
        <p className="otp__error-desc">
          Mã đơn <strong>{orderId}</strong> không tồn tại hoặc đã hết hiệu lực.
        </p>
        <Link to="/order-online" className="otp__btn-home" id="btn-back-error"
          style={{ marginTop: 'var(--space-sm)' }}>
          Đặt hàng mới
        </Link>
      </div>
    </div>
  );

  // ── Data ───────────────────────────────────────────────────────────────────
  const deliveryStatus = (order.deliveryInfo?.deliveryStatus ?? 'PENDING') as DelivStatus;
  const meta = STATUS_META[deliveryStatus];
  const StatusIcon = STATUS_ICON[deliveryStatus] ?? ICONS.Clipboard;

  return (
    <div className="otp">

      {/* Header */}
      <header className="otp__header">
        <Link to="/order-online" className="otp__header-brand" id="link-home">
          <img src="/logo.png" alt="Bếp Nhà Mình" />
          Bếp Nhà Mình
        </Link>
        <span className="otp__header-order-id">#{order.orderCode}</span>
      </header>

      {/* Content */}
      <div className="otp__content">

        {/* Status hero */}
        <div className="otp__status-card">
          <div className={`otp__status-icon ${meta.iconCls}`}>
            <StatusIcon />
          </div>
          <div className={`otp__status-badge ${meta.badgeCls}`}>
            <span className="otp__status-dot" />
            {meta.badge}
          </div>
          <h1 className="otp__status-headline">{meta.headline}</h1>
          <p className="otp__status-sub">{meta.sub}</p>
          {deliveryStatus !== 'DELIVERED' && deliveryStatus !== 'CANCELLED' && (
            <div className="otp__eta">
              <ICONS.Clock />
              Cập nhật tự động mỗi 30 giây · {fmtDate(order.createdAt)}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="otp__timeline-card">
          <div className="otp__timeline-title">Trạng thái giao hàng</div>
          <DeliveryTimeline status={deliveryStatus} />
        </div>

        {/* Delivery info */}
        {order.deliveryInfo && (
          <div className="otp__info-card">
            <div className="otp__info-title">Thông tin giao hàng</div>
            <div className="otp__info-grid">
              <div className="otp__info-row">
                <span className="otp__info-label">Người nhận</span>
                <span className="otp__info-val">{order.deliveryInfo.customerName}</span>
              </div>
              <div className="otp__info-row">
                <span className="otp__info-label">Điện thoại</span>
                <span className="otp__info-val">{order.deliveryInfo.phone}</span>
              </div>
              <div className="otp__info-row">
                <span className="otp__info-label">Địa chỉ</span>
                <span className="otp__info-val">
                  {order.deliveryInfo.address}
                  {order.deliveryInfo.ward ? `, ${order.deliveryInfo.ward}` : ''}
                  {order.deliveryInfo.district ? `, ${order.deliveryInfo.district}` : ''}
                </span>
              </div>
              {order.deliveryInfo.distanceKm && (
                <div className="otp__info-row">
                  <span className="otp__info-label">Khoảng cách</span>
                  <span className="otp__info-val">{order.deliveryInfo.distanceKm.toFixed(1)} km</span>
                </div>
              )}
              <div className="otp__info-row">
                <span className="otp__info-label">Phí giao</span>
                <span className="otp__info-val otp__info-val--price">{fmt(order.deliveryInfo.shippingFee)}</span>
              </div>
              <div className="otp__info-row">
                <span className="otp__info-label">Thanh toán</span>
                <span className="otp__info-val">COD — Tiền mặt khi nhận</span>
              </div>
            </div>
          </div>
        )}

        {/* Order items */}
        <div className="otp__items-card">
          <div className="otp__items-title">Món đã đặt</div>
          {order.items.map((item) => (
            <div key={item.id} className="otp__item">
              <div className="otp__item-qty">{item.quantity}</div>
              <div className="otp__item-name">{item.name}</div>
              <div className="otp__item-price">{fmt(item.lineTotal)}</div>
            </div>
          ))}

          {/* Bill */}
          <div style={{ marginTop: 'var(--space-md)', borderTop: '1.5px solid var(--color-steam)', paddingTop: 'var(--space-md)' }}>
            <div className="otp__info-row" style={{ marginBottom: 4 }}>
              <span className="otp__info-label">Tạm tính</span>
              <span className="otp__info-val">{fmt(order.subtotal)}</span>
            </div>
            <div className="otp__info-row" style={{ marginBottom: 8 }}>
              <span className="otp__info-label">Phí giao hàng</span>
              <span className="otp__info-val">{fmt(order.deliveryInfo?.shippingFee ?? 0)}</span>
            </div>
            <div className="otp__info-row">
              <span className="otp__info-label" style={{ fontWeight: 700, color: 'var(--color-charcoal)', fontSize: 15 }}>Tổng cộng</span>
              <span className="otp__info-val otp__info-val--price" style={{ fontSize: 20 }}>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="otp__footer-cta">
          <Link to="/order-online/menu" className="otp__btn-home" id="btn-order-again">
            Đặt thêm món
          </Link>
          <Link to="/order-online" className="otp__btn-order-again" id="btn-back-home">
            Về trang chủ
          </Link>
        </div>

      </div>
    </div>
  );
}
