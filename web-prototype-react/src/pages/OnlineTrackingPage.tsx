/**
 * OnlineTrackingPage.tsx — Theo dõi đơn hàng online
 * Phase 2 — Bếp Nhà Mình
 * UX: 4-step horizontal stepper, SVG icons chuyên nghiệp, tích xanh khi hoàn thành
 */

import React, { useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onlineApi, type OnlineOrderDetail } from '../services/onlineApi';
import { useRealtimeTracking } from '../hooks/useRealtimeTracking';
import './OnlineTrackingPage.css';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);



// ─── Types ─────────────────────────────────────────────────────────────────────
type DelivStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

// ─── SVG Icons chuyên nghiệp (line-art đồng bộ 24px) ──────────────────────────
const SvgDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
       strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
  </svg>
);

const SvgPot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
       strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
    <path d="M15 11h2a2 2 0 0 1 2 2v1H5v-1a2 2 0 0 1 2-2h2"/>
    <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>
    <path d="M9 5c0-1.1.9-2 2-2s2 .9 2 2v3H9V5z"/>
    <line x1="12" y1="3" x2="12" y2="3.5"/>
  </svg>
);

const SvgBike = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
       strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
    <circle cx="5.5" cy="17.5" r="3.5"/>
    <circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6h2l2 5.5"/>
    <path d="M5.5 14L9 6h4l2 5.5H5.5z"/>
    <line x1="15" y1="6" x2="9" y2="6"/>
  </svg>
);

const SvgCheck2 = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
       strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const SvgCheckmark = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
       strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);



const SvgAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
       strokeLinecap="round" strokeLinejoin="round" width={48} height={48}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const SvgX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
       strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─── 4 Display Steps ────────────────────────────────────────────────────────────
const DISPLAY_STEPS: { label: string; Icon: React.FC }[] = [
  { label: 'Đã đặt',    Icon: SvgDoc   },
  { label: 'Đang nấu',  Icon: SvgPot   },
  { label: 'Đang giao', Icon: SvgBike  },
  { label: 'Hoàn thành',Icon: SvgCheck2},
];

const STATUS_TO_STEP: Record<DelivStatus, number> = {
  PENDING:    0,
  ACCEPTED:   1,
  PREPARING:  1,
  DELIVERING: 2,
  DELIVERED:  3,
  CANCELLED: -1,
};

// ─── Hero meta theo trạng thái ─────────────────────────────────────────────────
interface StatusMeta {
  HeroIcon: React.FC;
  heroColor: string;
  headline: string;
  sub: string;
  badge: string;
  badgeColor: string;
  animClass: string;
}

const STATUS_META: Record<DelivStatus, StatusMeta> = {
  PENDING: {
    HeroIcon: SvgDoc,
    heroColor: '#E94F37',
    headline: 'Đơn hàng đã được ghi nhận',
    sub: 'Chờ quán xác nhận — thường trong vài phút',
    badge: 'Chờ xác nhận',
    badgeColor: '#E94F37',
    animClass: 'otp__hero-icon--pulse',
  },
  ACCEPTED: {
    HeroIcon: SvgPot,
    heroColor: '#E94F37',
    headline: 'Quán đã xác nhận đơn của bạn',
    sub: 'Bếp đang bắt đầu chuẩn bị những món ăn thơm ngon',
    badge: 'Đang nấu',
    badgeColor: '#E94F37',
    animClass: 'otp__hero-icon--breathe',
  },
  PREPARING: {
    HeroIcon: SvgPot,
    heroColor: '#E94F37',
    headline: 'Đang nấu những món tươi ngon cho bạn',
    sub: 'Món ăn đang được chuẩn bị — sắp xong rồi!',
    badge: 'Đang nấu',
    badgeColor: '#E94F37',
    animClass: 'otp__hero-icon--breathe',
  },
  DELIVERING: {
    HeroIcon: SvgBike,
    heroColor: '#2563EB',
    headline: 'Shipper đang trên đường đến',
    sub: 'Đơn hàng đang được giao đến địa chỉ của bạn — chờ chút nhé!',
    badge: 'Đang giao',
    badgeColor: '#2563EB',
    animClass: 'otp__hero-icon--slide',
  },
  DELIVERED: {
    HeroIcon: SvgCheck2,
    heroColor: '#16A34A',
    headline: 'Giao hàng thành công!',
    sub: 'Cảm ơn bạn đã tin dùng Bếp Nhà Mình — chúc ngon miệng!',
    badge: 'Đã giao',
    badgeColor: '#16A34A',
    animClass: 'otp__hero-icon--pop',
  },
  CANCELLED: {
    HeroIcon: SvgX,
    heroColor: '#888',
    headline: 'Đơn hàng đã bị hủy',
    sub: 'Vui lòng liên hệ quán nếu bạn có thắc mắc',
    badge: 'Đã hủy',
    badgeColor: '#888',
    animClass: '',
  },
};

// ─── Horizontal Stepper ─────────────────────────────────────────────────────────
function HorizontalStepper({ status }: { status: DelivStatus }) {
  const currentStep = STATUS_TO_STEP[status];
  if (currentStep === -1) return null;

  const fillPct = currentStep === 0 ? 0
    : currentStep >= DISPLAY_STEPS.length - 1 ? 100
    : Math.round((currentStep / (DISPLAY_STEPS.length - 1)) * 100);

  return (
    <div className="otp__stepper">
      {/* Rail */}
      <div className="otp__stepper-rail">
        <div className="otp__stepper-fill" style={{ width: `${fillPct}%` }} />
      </div>

      {/* Steps */}
      <div className="otp__stepper-row">
      {DISPLAY_STEPS.map(({ label, Icon }, i) => {
          const isCompleted = currentStep >= DISPLAY_STEPS.length - 1; // tất cả xong (DELIVERED)
          const done   = isCompleted || i < currentStep;
          const active = !isCompleted && i === currentStep;
          return (
            <div key={i} className="otp__stepper-item">
              <div className={[
                'otp__stepper-dot',
                done   ? 'otp__stepper-dot--done'   : '',
                active ? 'otp__stepper-dot--active' : '',
                !done && !active ? 'otp__stepper-dot--pending' : '',
              ].filter(Boolean).join(' ')}>
                {done
                  ? <SvgCheckmark size={16} />
                  : <Icon />
                }
              </div>
              <span className={[
                'otp__stepper-label',
                done   ? 'otp__stepper-label--done'   : '',
                active ? 'otp__stepper-label--active' : '',
              ].filter(Boolean).join(' ')}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Page ---
export function OnlineTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const queryClient = useQueryClient();
  // Doc trackingToken tu localStorage (da luu khi dat hang thanh cong)
  const trackingToken = orderId ? localStorage.getItem(`tracking-token-${orderId}`) ?? '' : '';

  const handleRealtimeEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['online-order', orderId] });
  }, [orderId, queryClient]);

  const realtime = useRealtimeTracking({
    orderId,
    trackingToken,
    onEvent: handleRealtimeEvent,
  });

  const { data: order, isLoading, isError } = useQuery<OnlineOrderDetail>({
    queryKey: ['online-order', orderId],
    queryFn: () => onlineApi.getOrder(orderId!, trackingToken),
    enabled: !!orderId && !!trackingToken,
    refetchInterval: realtime.isRealtime ? 30_000 : 30_000,
    retry: 2,
  });

  if (isLoading) return (
    <div className="otp">
      <header className="otp__header">
        <Link to="/order-online" className="otp__header-brand" id="link-home-loading">
          <img src="/logo.png" alt="" /> Bếp Nhà Mình
        </Link>
      </header>
      <div className="otp__center-fill">
        <div className="otp__spinner" />
        <span className="otp__muted-text">Đang tải thông tin đơn hàng...</span>
      </div>
    </div>
  );

  if (isError || !order) return (
    <div className="otp">
      <header className="otp__header">
        <Link to="/order-online" className="otp__header-brand" id="link-home-error">
          <img src="/logo.png" alt="" /> Bếp Nhà Mình
        </Link>
      </header>
      <div className="otp__center-fill">
        <div className="otp__error-icon"><SvgAlert /></div>
        <p className="otp__error-title">Không tìm thấy đơn hàng</p>
        <p className="otp__muted-text">Mã đơn <strong>{orderId}</strong> không tồn tại.</p>
        <Link to="/order-online" className="otp__btn-primary" id="btn-back-error">
          Đặt hàng mới
        </Link>
      </div>
    </div>
  );

  const deliveryStatus = (order.deliveryInfo?.deliveryStatus ?? 'PENDING') as DelivStatus;
  const meta = STATUS_META[deliveryStatus];
  const { HeroIcon } = meta;


  return (
    <div className="otp">

      {/* ── Header ── */}
      <header className="otp__header">
        <Link to="/order-online" className="otp__header-brand" id="link-home">
          <img src="/logo.png" alt="Bếp Nhà Mình" />
          Bếp Nhà Mình
        </Link>
        <span className="otp__order-chip">#{order.orderCode}</span>
      </header>

      <div className="otp__content">

        {/* ── Hero status ── */}
        <div className="otp__hero-card">
          <div
            className={`otp__hero-icon-wrap ${meta.animClass}`}
            style={{ '--hero-color': meta.heroColor } as React.CSSProperties}
          >
            <HeroIcon />
          </div>

          <span
            className="otp__status-badge"
            style={{ '--badge-color': meta.badgeColor } as React.CSSProperties}
          >
            <span className="otp__badge-ping" />
            {meta.badge}
          </span>

          <h1 className="otp__hero-title">{meta.headline}</h1>



        </div>

        {/* ── Stepper ── */}
        {deliveryStatus !== 'CANCELLED' && (
          <div className="otp__stepper-card">
            <p className="otp__section-label">Đơn hàng của bạn đang ở đâu?</p>
            <HorizontalStepper status={deliveryStatus} />
          </div>
        )}

        {/* ── Thông tin giao hàng ── */}
        {order.deliveryInfo && (
          <div className="otp__card">
            <p className="otp__section-label">Thông tin giao hàng</p>
            <div className="otp__rows">
              <div className="otp__row">
                <span className="otp__row-key">Người nhận</span>
                <span className="otp__row-val">{order.deliveryInfo.customerName}</span>
              </div>
              <div className="otp__row">
                <span className="otp__row-key">Điện thoại</span>
                <span className="otp__row-val">{order.deliveryInfo.phone}</span>
              </div>
              <div className="otp__row">
                <span className="otp__row-key">Địa chỉ</span>
                <span className="otp__row-val">
                  {order.deliveryInfo.address}
                  {order.deliveryInfo.ward    ? `, ${order.deliveryInfo.ward}`    : ''}
                  {order.deliveryInfo.district? `, ${order.deliveryInfo.district}`: ''}
                </span>
              </div>
              <div className="otp__row">
                <span className="otp__row-key">Phí giao</span>
                <span className="otp__row-val">{fmt(order.deliveryInfo.shippingFee)}</span>
              </div>
              <div className="otp__row">
                <span className="otp__row-key">Thanh toán</span>
                <span className="otp__row-val">COD — Tiền mặt khi nhận</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Món đã đặt ── */}
        <div className="otp__card">
          <p className="otp__section-label">Món đã đặt</p>

          {order.items.map((item) => (
            <div key={item.id} className="otp__item-row">
              <span className="otp__item-qty">{item.quantity}</span>
              <span className="otp__item-name">{item.name}</span>
              <span className="otp__item-price">{fmt(item.lineTotal)}</span>
            </div>
          ))}

          <div className="otp__bill-divider" />

          <div className="otp__rows otp__rows--bill">
            <div className="otp__row">
              <span className="otp__row-key">Tạm tính</span>
              <span className="otp__row-val">{fmt(order.subtotal)}</span>
            </div>
            <div className="otp__row">
              <span className="otp__row-key">Phí giao hàng</span>
              <span className="otp__row-val">{fmt(order.deliveryInfo?.shippingFee ?? 0)}</span>
            </div>
            <div className="otp__row otp__row--grand">
              <span className="otp__row-key otp__row-key--bold">Tổng cộng</span>
              <span className="otp__row-val otp__row-val--grand">{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="otp__footer-cta">
          <Link to="/order-online/menu" className="otp__btn-primary" id="btn-order-again">
            Đặt thêm món
          </Link>
          <Link to="/order-online" className="otp__btn-ghost" id="btn-back-home">
            Về trang chủ
          </Link>
        </div>

      </div>
    </div>
  );
}
