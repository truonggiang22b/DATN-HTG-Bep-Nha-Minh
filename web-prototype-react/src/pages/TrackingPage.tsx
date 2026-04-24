import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '../components/Toast';
import { trackOrder } from '../services/publicApi';
import type { OrderStatus } from '../types';
import '../styles/customer.css';

// SVG icons
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ServedIcon = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="servedGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2f7d4e" /><stop offset="100%" stopColor="#4caf74" />
      </linearGradient>
      <filter id="servedGlow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <circle cx="36" cy="36" r="34" fill="rgba(47,125,78,0.10)" />
    <circle cx="36" cy="36" r="28" fill="url(#servedGrad)" filter="url(#servedGlow)" />
    <polyline points="22,36 31,45 50,26" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      style={{ strokeDasharray: 40, strokeDashoffset: 0, animation: 'drawCheck 0.5s 0.15s cubic-bezier(.4,0,.2,1) both' }} />
  </svg>
);

const CancelledIcon = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="34" fill="rgba(216,58,46,0.10)" />
    <circle cx="36" cy="36" r="28" fill="#d83a2e" />
    <line x1="24" y1="24" x2="48" y2="48" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="48" y1="24" x2="24" y2="48" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

const PendingIcon = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    <defs>
      <linearGradient id="pendingGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d83a2e" /><stop offset="100%" stopColor="#f0875a" />
      </linearGradient>
    </defs>
    <circle cx="36" cy="36" r="34" fill="rgba(216,58,46,0.08)" />
    <circle cx="36" cy="36" r="28" fill="url(#pendingGrad)" />
    <circle cx="36" cy="36" r="2.5" fill="white" />
    <line x1="36" y1="24" x2="36" y2="36" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <line x1="36" y1="36" x2="44" y2="40" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'NEW',       label: 'Đã tiếp nhận' },
  { status: 'PREPARING', label: 'Đang chuẩn bị' },
  { status: 'READY',    label: 'Sẵn sàng – Đang mang ra' },
  { status: 'SERVED',   label: 'Đã phục vụ' },
];

const STATUS_ORDER: OrderStatus[] = ['NEW', 'PREPARING', 'READY', 'SERVED'];

export const TrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const locState = location.state as { tableDisplay?: string; qrToken?: string } | null;
  const tableDisplay = locState?.tableDisplay ?? sessionStorage.getItem('bnm-table-display') ?? 'Bàn --';
  const qrToken = locState?.qrToken ?? sessionStorage.getItem('bnm-qr-token') ?? '';

  // ── Real-time polling mỗi 3 giây ─────────────────────────────────────────
  const {
    data: order,
    isLoading,
    isError,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => trackOrder(orderId!, qrToken),
    enabled: !!orderId,
    refetchInterval: (query) => {
      // Ngừng poll khi order đã terminal (SERVED / CANCELLED)
      const status = query.state.data?.internalStatus;
      if (status === 'SERVED' || status === 'CANCELLED') return false;
      return 3000;
    },
    retry: 2,
  });

  const [lastUpdated, setLastUpdated] = useState<string>('');
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [dataUpdatedAt]);

  if (isLoading) {
    return (
      <div className="app-shell">
        <header className="customer-header">
          <span className="customer-header__brand">
            <img src="/logo.png" alt="Bếp Nhà Mình" style={{ height: 38, objectFit: 'contain', display: 'block' }} />
          </span>
        </header>
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-soy)' }}>
          Đang tải thông tin đơn hàng...
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="app-shell">
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-state-icon">❓</div>
          <div className="empty-state-title">Không tìm thấy đơn hàng</div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Về trang chủ</button>
        </div>
      </div>
    );
  }

  const currentStatusIdx = STATUS_ORDER.indexOf(order.internalStatus as OrderStatus);
  // Backend trả tableDisplayName ở top-level, fallback to table.displayName hoặc state
  const resolvedTableDisplay = (order as any).tableDisplayName ?? order.table?.displayName ?? tableDisplay;

  return (
    <div className="app-shell">
      <header className="customer-header">
        <span className="customer-header__brand">
          <img src="/logo.png" alt="Bếp Nhà Mình" style={{ height: 38, objectFit: 'contain', display: 'block' }} />
        </span>
        <span className="customer-header__table">{resolvedTableDisplay}</span>
      </header>

      <div className="tracking-page">
        {/* Success header */}
        <div className="tracking-success-header">
          <div className="tracking-success-icon">
            {order.internalStatus === 'CANCELLED' ? <CancelledIcon /> : order.internalStatus === 'SERVED' ? <ServedIcon /> : <PendingIcon />}
          </div>
          <div className="tracking-success-title">
            {order.internalStatus === 'CANCELLED' ? 'Đơn đã bị hủy'
              : order.internalStatus === 'SERVED' ? 'Đã phục vụ xong!'
              : 'Đơn đã được tiếp nhận!'}
          </div>
          <div className="tracking-codes">
            <div className="tracking-code-pill">
              <div className="tracking-code-label">Mã đơn</div>
              <div className="tracking-code-value">{order.orderCode}</div>
            </div>
            <div className="tracking-code-pill">
              <div className="tracking-code-label">Bàn</div>
              <div className="tracking-code-value">{resolvedTableDisplay}</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', boxShadow: 'var(--shadow-soft)' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>Trạng thái đơn hàng</div>
          <div className="timeline">
            {TIMELINE_STEPS.map(({ status, label }, idx) => {
              const isDone = currentStatusIdx > idx || order.internalStatus === 'SERVED';
              const isActive = currentStatusIdx === idx && order.internalStatus !== 'SERVED';
              const isPending = !isDone && !isActive;

              let dotClass = 'timeline-dot';
              if (isDone) dotClass += ' timeline-dot--done';
              else if (isActive) dotClass += ' timeline-dot--active';
              else dotClass += ' timeline-dot--pending';

              return (
                <div key={status} className={`timeline-item ${isDone ? 'timeline-item--done' : ''}`}>
                  <div className={dotClass}>
                    {(isDone || isActive) && <CheckIcon />}
                  </div>
                  <div className="timeline-content">
                    <div className={`timeline-label ${isPending ? 'timeline-label--muted' : ''}`}>{label}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-steam)' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-soy)' }}>
              Cập nhật lần cuối: {lastUpdated || '--:--'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-soy)', fontStyle: 'italic' }}>
              {order.internalStatus !== 'SERVED' && order.internalStatus !== 'CANCELLED' ? '↻ Tự động cập nhật mỗi 3s' : ''}
            </span>
          </div>
        </div>

        {/* Order summary */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', boxShadow: 'var(--shadow-soft)' }}>
          <div className="section-header">Chi tiết đơn {order.orderCode}</div>
          {order.items.map((item: any) => {
            const itemName = item.nameSnapshot ?? item.name ?? 'Món ăn';
            const options = item.selectedOptionsSnapshot ?? item.selectedOptions ?? [];
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-steam)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{itemName}</div>
                  {Array.isArray(options) && options.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--color-soy)' }}>
                      {options.map((o: any) => o.name).join(' · ')}
                    </div>
                  )}
                  {item.note && <div style={{ fontSize: '12px', color: 'var(--color-soy)', fontStyle: 'italic' }}>Ghi chú: {item.note}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-accent)', fontWeight: 600, fontSize: '14px' }}>{formatPrice(item.lineTotal)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-soy)' }}>×{item.quantity}</div>
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
            <span style={{ fontWeight: 600 }}>Tổng cộng</span>
            <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: '18px', color: 'var(--color-charcoal)' }}>
              {formatPrice(order.subtotal)}
            </span>
          </div>
        </div>

        {/* CTA */}
        {order.internalStatus !== 'CANCELLED' && qrToken && (
          order.internalStatus === 'SERVED' ? (
            /* Đã phục vụ → nổi bật nút order thêm */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate(`/qr/${qrToken}`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, padding: '14px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Gọi thêm món
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-soy)', margin: 0 }}>
                Món mới sẽ được gửi thẳng vào bếp — không cần quét lại QR
              </p>
            </div>
          ) : (
            /* Đang xử lý → nút ghost */
            <button
              className="btn btn-outline btn-full"
              onClick={() => navigate(`/qr/${qrToken}`)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
              </svg>
              Gọi thêm món
            </button>
          )
        )}
      </div>
    </div>
  );
};
