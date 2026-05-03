/**
 * ShipperPage.tsx — Giao diện shipper chuẩn brand Bếp Nhà Mình
 * - Tab "Đang giao" (DELIVERING) + Tab "Đã hoàn thành" (DELIVERED, lọc theo ngày)
 * - Font: Be Vietnam Pro / Sora | Màu: charcoal #25211B, chili #D83A2E, leaf #2F7D4E
 * - Icon: SVG line-art thuần, không emoji
 */

import { useCallback, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { deliveryApi, type DeliveryOrderSummary } from '../services/deliveryApi';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import './ShipperPage.css';

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));

const isoDate = (iso: string) => iso.slice(0, 10); // "2026-04-28"

// ── SVG Icons — line-art chuyên nghiệp ───────────────────────────────────────
const IcoMapPin = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcoPhone = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12.1 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.34h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.93-1.02a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IcoUser = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoNote = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
  </svg>
);
const IcoCheck = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoBike = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5"/>
    <circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6h2l2 5.5"/>
    <path d="M5.5 14L9 6h4l2 5.5H5.5z"/>
    <line x1="15" y1="6" x2="9" y2="6"/>
  </svg>
);
const IcoTick = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IcoCalendar = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcoChevron = ({ size = 14, dir = 'down' }: { size?: number; dir?: 'down' | 'up' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: dir === 'up' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── Shipper Card (Đang giao) ──────────────────────────────────────────────────
function ActiveCard({
  order,
  onConfirm,
  isConfirming,
}: {
  order: DeliveryOrderSummary;
  onConfirm: (id: string) => void;
  isConfirming: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localDone, setLocalDone] = useState(false);
  const di = order.deliveryInfo;
  const total = (order.subtotal ?? 0) + (di?.shippingFee ?? 0);

  const mapsUrl = di
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [di.address, di.ward, di.district].filter(Boolean).join(', ')
      )}`
    : '#';

  const handleConfirm = () => {
    if (localDone || isConfirming) return;
    if (!window.confirm(`Xác nhận đã giao đơn ${order.orderCode} thành công?`)) return;
    setLocalDone(true);
    onConfirm(order.id);
  };

  return (
    <article className={`sip-card${localDone ? ' sip-card--done' : ''}`}>
      {/* Card header */}
      <div className="sip-card__header">
        <div className="sip-card__code-row">
          <span className="sip-card__dot sip-card__dot--blue" />
          <span className="sip-card__code">#{order.orderCode}</span>
          <span className="sip-card__time">{fmtTime(order.createdAt)}</span>
        </div>
        <button
          className="sip-card__expand-btn"
          onClick={() => setExpanded(p => !p)}
          type="button"
          aria-label="Xem chi tiết"
        >
          <IcoChevron dir={expanded ? 'up' : 'down'} />
        </button>
      </div>

      {/* Customer */}
      {di && (
        <div className="sip-card__customer">
          <div className="sip-card__customer-name">
            <IcoUser size={15} />
            <strong>{di.customerName}</strong>
          </div>
          <a href={`tel:${di.phone}`} className="sip-card__phone">
            <IcoPhone size={14} />
            {di.phone}
          </a>
        </div>
      )}

      {/* Address */}
      {di && (
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="sip-card__address">
          <IcoMapPin size={14} />
          <span>{[di.address, di.ward, di.district].filter(Boolean).join(', ')}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sip-card__ext">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      )}

      {/* Note */}
      {di?.note && (
        <div className="sip-card__note">
          <IcoNote size={13} />
          <span>{di.note}</span>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="sip-card__detail">
          <div className="sip-card__detail-row">
            <span>Tạm tính</span><span>{fmt(order.subtotal)}</span>
          </div>
          <div className="sip-card__detail-row">
            <span>Phí giao hàng</span><span>{fmt(di?.shippingFee ?? 0)}</span>
          </div>
          {di?.distanceKm && (
            <div className="sip-card__detail-row">
              <span>Khoảng cách</span><span>{di.distanceKm.toFixed(1)} km</span>
            </div>
          )}
          <div className="sip-card__detail-row sip-card__detail-row--total">
            <span>Tổng thu (COD)</span>
            <strong>{fmt(total)}</strong>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="sip-card__footer">
        <div className="sip-card__meta">
          <span className="sip-card__items">{order.itemCount} món</span>
          <span className="sip-card__total">{fmt(total)}</span>
        </div>
        <button
          className={`sip-card__btn-confirm${localDone ? ' sip-card__btn-confirm--done' : ''}`}
          onClick={handleConfirm}
          disabled={localDone || isConfirming}
          id={`btn-shipper-confirm-${order.id}`}
        >
          <IcoCheck size={16} />
          {localDone ? 'Đã xác nhận' : 'Xác nhận đã giao'}
        </button>
      </div>
    </article>
  );
}

// ── Completed Card (Đã giao) ──────────────────────────────────────────────────
function CompletedCard({ order }: { order: DeliveryOrderSummary }) {
  const [expanded, setExpanded] = useState(false);
  const di = order.deliveryInfo;
  const total = (order.subtotal ?? 0) + (di?.shippingFee ?? 0);

  return (
    <article className="sip-card sip-card--completed">
      <div className="sip-card__header">
        <div className="sip-card__code-row">
          <span className="sip-card__dot sip-card__dot--green" />
          <span className="sip-card__code">#{order.orderCode}</span>
          <span className="sip-card__time">{fmtTime(order.updatedAt ?? order.createdAt)}</span>
        </div>
        <button
          className="sip-card__expand-btn"
          onClick={() => setExpanded(p => !p)}
          type="button"
        >
          <IcoChevron dir={expanded ? 'up' : 'down'} />
        </button>
      </div>

      {di && (
        <div className="sip-card__customer">
          <div className="sip-card__customer-name">
            <IcoUser size={15} /><strong>{di.customerName}</strong>
          </div>
          <span className="sip-card__chip sip-card__chip--green">
            <IcoCheck size={11} /> Đã giao
          </span>
        </div>
      )}

      {di && (
        <div className="sip-card__address sip-card__address--static">
          <IcoMapPin size={14} />
          <span>{[di.address, di.ward, di.district].filter(Boolean).join(', ')}</span>
        </div>
      )}

      {expanded && (
        <div className="sip-card__detail">
          <div className="sip-card__detail-row">
            <span>Số món</span><span>{order.itemCount} món</span>
          </div>
          <div className="sip-card__detail-row">
            <span>Tạm tính</span><span>{fmt(order.subtotal)}</span>
          </div>
          <div className="sip-card__detail-row">
            <span>Phí giao hàng</span><span>{fmt(di?.shippingFee ?? 0)}</span>
          </div>
          <div className="sip-card__detail-row sip-card__detail-row--total">
            <span>Đã thu</span><strong>{fmt(total)}</strong>
          </div>
        </div>
      )}

      <div className="sip-card__footer sip-card__footer--compact">
        <span className="sip-card__items">{order.itemCount} món</span>
        <span className="sip-card__total sip-card__total--muted">{fmt(total)}</span>
      </div>
    </article>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type Tab = 'delivering' | 'delivered';

export function ShipperPage() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('delivering');
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const handleRealtimeEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['shipper', 'delivering'] });
    queryClient.invalidateQueries({ queryKey: ['shipper', 'delivered'] });
  }, [queryClient]);

  const realtime = useRealtimeOrders({ onEvent: handleRealtimeEvent });

  // ── Delivering orders ──
  const { data: activeData, isLoading: loadingActive } = useQuery({
    queryKey: ['shipper', 'delivering'],
    queryFn: () => deliveryApi.listOrders({ pageSize: 50, deliveryStatus: 'DELIVERING' }),
    refetchInterval: realtime.isRealtime ? 30_000 : 15_000,
  });

  // ── Completed orders ──
  const { data: doneData, isLoading: loadingDone } = useQuery({
    queryKey: ['shipper', 'delivered'],
    queryFn: () => deliveryApi.listOrders({ pageSize: 200, deliveryStatus: 'DELIVERED' }),
    refetchInterval: 60_000,
  });

  // Filter completed by selectedDate
  const completedByDate = useMemo(() => {
    const all = doneData?.orders ?? [];
    return all.filter(o =>
      isoDate(o.updatedAt ?? o.createdAt) === selectedDate
    );
  }, [doneData, selectedDate]);

  // Available dates for picker
  const availableDates = useMemo(() => {
    const all = doneData?.orders ?? [];
    const dates = [...new Set(all.map(o => isoDate(o.updatedAt ?? o.createdAt)))].sort().reverse();
    return dates;
  }, [doneData]);

  const { mutate: confirmDelivered, isPending: isConfirming } = useMutation({
    mutationFn: (orderId: string) => deliveryApi.updateStatus(orderId, 'DELIVERED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipper'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryOrders'] });
    },
    onError: () => alert('Không thể xác nhận. Vui lòng thử lại.'),
  });

  const activeOrders = activeData?.orders ?? [];

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="sip">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sip__header">
        <div className="sip__header-brand">
          <img src="/logo.png" alt="Bếp Nhà Mình" className="sip__header-logo" />
          <div className="sip__header-info">
            <span className="sip__header-title">Shipper</span>
            <span className="sip__header-sub">Bếp Nhà Mình</span>
          </div>
        </div>
        <button className="sip__logout" onClick={handleLogout} aria-label="Đăng xuất">
          <IcoLogout />
          <span>Đăng xuất</span>
        </button>
      </header>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="sip__tabs">
        <button
          className={`sip__tab${tab === 'delivering' ? ' sip__tab--active' : ''}`}
          onClick={() => setTab('delivering')}
          type="button"
        >
          Đang giao
          {activeOrders.length > 0 && (
            <span className="sip__tab-badge">{activeOrders.length}</span>
          )}
        </button>
        <button
          className={`sip__tab${tab === 'delivered' ? ' sip__tab--active' : ''}`}
          onClick={() => setTab('delivered')}
          type="button"
        >
          Đã hoàn thành
        </button>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="sip__content">

        {/* ── Tab: Đang giao ──────────────────────────────────────────────── */}
        {tab === 'delivering' && (
          <>
            <div className="sip__section-meta">
              <span className="sip__section-count">
                {loadingActive ? '—' : activeOrders.length} đơn đang chờ giao
              </span>
              <span className="sip__refresh-hint">{realtime.statusText}</span>
            </div>

            {loadingActive && (
              <div className="sip__spinner-wrap"><div className="sip__spinner" /></div>
            )}

            {!loadingActive && activeOrders.length === 0 && (
              <div className="sip__empty">
                <div className="sip__empty-illustration">
                  <IcoBike />
                </div>
                <p className="sip__empty-title">Không có đơn nào đang giao</p>
                <p className="sip__empty-sub">
                  Khi bếp hoàn thành đơn, đơn sẽ xuất hiện ở đây để bạn xác nhận giao.
                </p>
              </div>
            )}

            {!loadingActive && activeOrders.length > 0 && (
              <div className="sip__cards">
                {activeOrders.map(order => (
                  <ActiveCard
                    key={order.id}
                    order={order}
                    onConfirm={confirmDelivered}
                    isConfirming={isConfirming}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Tab: Đã hoàn thành ──────────────────────────────────────────── */}
        {tab === 'delivered' && (
          <>
            {/* Date picker */}
            <div className="sip__date-bar">
              <div className="sip__date-label">
                <IcoCalendar size={15} />
                <span>Lọc theo ngày</span>
              </div>
              <select
                className="sip__date-select"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              >
                {availableDates.length === 0 && (
                  <option value={selectedDate}>{selectedDate}</option>
                )}
                {availableDates.map(d => (
                  <option key={d} value={d}>
                    {fmtDate(d + 'T00:00:00')}
                  </option>
                ))}
              </select>
            </div>

            <div className="sip__section-meta">
              <span className="sip__section-count">
                {loadingDone ? '—' : completedByDate.length} đơn ngày {fmtDate(selectedDate + 'T00:00:00')}
              </span>
            </div>

            {loadingDone && (
              <div className="sip__spinner-wrap"><div className="sip__spinner" /></div>
            )}

            {!loadingDone && completedByDate.length === 0 && (
              <div className="sip__empty">
                <div className="sip__empty-illustration sip__empty-illustration--muted">
                  <IcoTick />
                </div>
                <p className="sip__empty-title">Chưa có đơn hoàn thành</p>
                <p className="sip__empty-sub">Không có đơn nào được giao thành công vào ngày này.</p>
              </div>
            )}

            {!loadingDone && completedByDate.length > 0 && (
              <>
                {/* Summary strip */}
                <div className="sip__summary-strip">
                  <div className="sip__summary-item">
                    <span className="sip__summary-value">{completedByDate.length}</span>
                    <span className="sip__summary-key">đơn hoàn thành</span>
                  </div>
                  <div className="sip__summary-divider" />
                  <div className="sip__summary-item">
                    <span className="sip__summary-value">
                      {fmt(completedByDate.reduce((acc, o) =>
                        acc + (o.subtotal ?? 0) + (o.deliveryInfo?.shippingFee ?? 0), 0
                      ))}
                    </span>
                    <span className="sip__summary-key">tổng đã thu</span>
                  </div>
                </div>

                <div className="sip__cards sip__cards--completed">
                  {completedByDate.map(order => (
                    <CompletedCard key={order.id} order={order} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
