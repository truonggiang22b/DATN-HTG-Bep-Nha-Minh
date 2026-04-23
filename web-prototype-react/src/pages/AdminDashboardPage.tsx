import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { formatPrice } from '../components/Toast';
import { CUSTOMER_STATUS_LABELS, ORDER_STATUS_STYLE } from '../constants';
import type { ApiOrder, OrderStatus } from '../types';
import { getOrderHistory, getMenuItems, getTables, getActiveOrders } from '../services/internalApi';
import '../styles/admin.css';

type DatePreset = 'today' | 'yesterday' | '7days' | '30days' | 'all' | 'custom';

const startOfDay = (d: Date) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };
const endOfDay   = (d: Date) => { const r = new Date(d); r.setHours(23,59,59,999); return r; };

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today',     label: 'Hôm nay'   },
  { key: 'yesterday', label: 'Hôm qua'   },
  { key: '7days',     label: '7 ngày'    },
  { key: '30days',    label: '30 ngày'   },
  { key: 'all',       label: 'Tất cả'    },
  { key: 'custom',    label: 'Tùy chọn' },
];

const toInputDate = (d: Date) => d.toISOString().slice(0, 10);

const getPresetRange = (preset: DatePreset): [Date, Date] => {
  const now   = new Date();
  const today = startOfDay(now);
  switch (preset) {
    case 'today':     return [today, endOfDay(now)];
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return [y, endOfDay(y)]; }
    case '7days':     { const f = new Date(today); f.setDate(f.getDate() - 6); return [f, endOfDay(now)]; }
    case '30days':    { const f = new Date(today); f.setDate(f.getDate() - 29); return [f, endOfDay(now)]; }
    default:          return [new Date(0), new Date(8640000000000000)];
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toDateKey = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const toDateLabel = (dateKey: string) => {
  const today = toDateKey(new Date().toISOString());
  const yesterday = toDateKey(new Date(Date.now() - 86400000).toISOString());
  if (dateKey === today) return `Hôm nay — ${dateKey}`;
  if (dateKey === yesterday) return `Hôm qua — ${dateKey}`;
  return dateKey;
};

const STAT_CONFIG = [
  { key: 'new',      label: 'Đơn mới',      tone: 'turmeric' },
  { key: 'preparing',label: 'Đang làm',     tone: 'chili'    },
  { key: 'ready',    label: 'Sẵn sàng',     tone: 'leaf'     },
  { key: 'served',   label: 'Đã phục vụ',   tone: 'soy'      },
];

// ─── Stat icons (inline SVG, no emoji) ───────────────────────────────────────
const IconNew = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconFire = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8 7 6 10 6 13a6 6 0 0 0 12 0c0-3-2-6-6-11z" />
  </svg>
);
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconExpand = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const STAT_ICONS = [IconNew, IconFire, IconBell, IconCheck];

// ─── Main component ───────────────────────────────────────────────────────────
export const AdminDashboardPage = () => {
  const { } = useStore(); // chỉ giữ cho toast khi cần
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [datePreset, setDatePreset]   = useState<DatePreset>('today');
  const [customFrom, setCustomFrom]   = useState(() => toInputDate(new Date()));
  const [customTo,   setCustomTo]     = useState(() => toInputDate(new Date()));

  // ── Fetch data from API ───────────────────────────────────────────────────────
  const { data: orderHistoryData } = useQuery({
    queryKey: ['orderHistory', 'all'],
    queryFn: () => getOrderHistory({ pageSize: 100 }), // 'pageSize' đúng tên backend, max=100
    staleTime: 30_000,
  });

  const { data: activeOrdersData = [] } = useQuery({
    queryKey: ['activeOrders'],
    queryFn: getActiveOrders,
    refetchInterval: 10_000,
    staleTime: 0,
  });

  const { data: menuItemsData = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: getMenuItems,
    staleTime: 60_000,
  });

  const { data: tablesData = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
    staleTime: 30_000,
  });

  // Normalize: dùng orderHistory làm data source chính cho table
  const orders: ApiOrder[] = orderHistoryData?.orders ?? [];

  const [dateFrom, dateTo] = useMemo<[Date, Date]>(() => {
    if (datePreset === 'custom') {
      return [startOfDay(new Date(customFrom)), endOfDay(new Date(customTo))];
    }
    return getPresetRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const handlePreset = (key: DatePreset) => {
    setDatePreset(key);
    setCollapsedDates(new Set()); // expand all dates on filter change
    setExpandedOrder(null);
  };

  // ── Live stats (từ active orders API) ────────────────────────────────────────
  const stats = {
    new:       activeOrdersData.filter((o) => o.status === 'NEW').length,
    preparing: activeOrdersData.filter((o) => o.status === 'PREPARING').length,
    ready:     activeOrdersData.filter((o) => o.status === 'READY').length,
    served:    activeOrdersData.filter((o) => o.status === 'SERVED').length,
  };
  const tablesOpen   = tablesData.filter((t) => t.hasActiveSession).length;
  const soldOutCount = menuItemsData.filter((m) => m.status === 'SOLD_OUT').length;

  // ── Group orders by date ────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const dfTs = dateFrom.getTime();
    const dtTs = dateTo.getTime();
    const filtered = orders.filter((o) => {
      const ts = new Date(o.createdAt).getTime();
      if (ts < dfTs || ts > dtTs) return false;
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      return true;
    });
    const map: Record<string, ApiOrder[]> = {};
    filtered.forEach((order) => {
      const key = toDateKey(order.createdAt);
      if (!map[key]) map[key] = [];
      map[key].push(order);
    });
    Object.values(map).forEach((g) => g.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    return Object.entries(map).sort((a, b) => new Date(b[0].split('/').reverse().join('-')).getTime() - new Date(a[0].split('/').reverse().join('-')).getTime());
  }, [orders, statusFilter, dateFrom, dateTo]);

  const toggleDate  = (key: string) => setCollapsedDates((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const toggleOrder = (id: string) => setExpandedOrder((prev) => (prev === id ? null : id));

  return (
    <div>
      {/* ── Topbar ── */}
      <div className="admin-topbar">
        <span className="admin-topbar__title">Tổng quan</span>
        <span style={{ fontSize: '13px', color: 'var(--color-soy)' }}>
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="admin-content">
        {/* ── Stats grid ── */}
        <div className="admin-stats-grid">
          {STAT_CONFIG.map(({ key, label, tone }, i) => {
            const Icon = STAT_ICONS[i];
            return (
              <div key={key} className={`admin-stat-card admin-stat-card--${tone}`}>
                <div className="admin-stat-label"><Icon /> {label}</div>
                <div className="admin-stat-value">{stats[key as keyof typeof stats]}</div>
              </div>
            );
          })}
          <div className="admin-stat-card admin-stat-card--soy">
            <div className="admin-stat-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Bàn đang phục vụ
            </div>
            <div className="admin-stat-value">{tablesOpen}/{tablesData.length}</div>
          </div>
          <div className="admin-stat-card admin-stat-card--turmeric">
            <div className="admin-stat-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Tạm hết món
            </div>
            <div className="admin-stat-value">{soldOutCount}</div>
          </div>
        </div>

        {/* ── Order history ── */}
        <div className="admin-table-wrapper">
          {/* Section header */}
          <div className="admin-table-header">
            <span className="admin-table-title">Lịch sử đơn hàng</span>
          </div>

          {/* Filter bar */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-steam)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Date presets */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--color-soy)', fontWeight: 600, marginRight: 4 }}>Thời gian:</span>
              {PRESETS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handlePreset(key)}
                  style={{
                    padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s',
                    borderColor: datePreset === key ? 'var(--color-chili)' : 'var(--color-steam)',
                    background:  datePreset === key ? 'var(--color-chili)' : 'transparent',
                    color:       datePreset === key ? '#fff' : 'var(--color-soy)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            {datePreset === 'custom' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--color-soy)' }}>Từ</span>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-steam)',
                    fontSize: 13, fontFamily: 'var(--font-primary)', background: 'var(--color-paper)',
                    color: 'var(--color-charcoal)', cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--color-soy)' }}>đến</span>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  max={toInputDate(new Date())}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-steam)',
                    fontSize: 13, fontFamily: 'var(--font-primary)', background: 'var(--color-paper)',
                    color: 'var(--color-charcoal)', cursor: 'pointer',
                  }}
                />
              </div>
            )}

            {/* Status filter */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--color-soy)', fontWeight: 600, marginRight: 4 }}>Trạng thái:</span>
              {(['ALL', 'NEW', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s',
                    borderColor: statusFilter === s ? 'var(--color-chili)' : 'var(--color-steam)',
                    background:  statusFilter === s ? 'var(--color-chili)' : 'transparent',
                    color:       statusFilter === s ? '#fff' : 'var(--color-soy)',
                  }}
                >
                  {s === 'ALL' ? 'Tất cả' : CUSTOMER_STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Result summary */}
            <div style={{ fontSize: 12, color: 'var(--color-soy)' }}>
              Tìm thấy <strong style={{ color: 'var(--color-charcoal)' }}>
                {grouped.reduce((s, [, o]) => s + o.length, 0)}
              </strong> đơn trong <strong style={{ color: 'var(--color-charcoal)' }}>{grouped.length}</strong> ngày
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Không có đơn hàng</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px' }}>
              {grouped.map(([dateKey, dayOrders]) => {
                const isCollapsed = collapsedDates.has(dateKey);
                const dayRevenue  = dayOrders.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.subtotal, 0);
                const servedCount = dayOrders.filter((o) => o.status === 'SERVED').length;

                return (
                  <div key={dateKey} style={{ border: '1px solid var(--color-steam)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {/* Date group header */}
                    <button
                      onClick={() => toggleDate(dateKey)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', background: 'var(--color-paper)', border: 'none', cursor: 'pointer',
                        borderBottom: isCollapsed ? 'none' : '1px solid var(--color-steam)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <IconChevron open={!isCollapsed} />
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-charcoal)' }}>
                          {toDateLabel(dateKey)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--color-soy)' }}>
                          {dayOrders.length} đơn
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--color-soy)' }}>
                          {servedCount} hoàn thành
                        </span>
                        <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: 15, color: 'var(--color-chili)' }}>
                          {formatPrice(dayRevenue)}
                        </span>
                      </div>
                    </button>

                    {/* Orders list */}
                    {!isCollapsed && (
                      <div>
                        {dayOrders.map((order, idx) => {
                          const table      = tablesData.find((t) => t.id === order.tableId);
                          const statusStyle = ORDER_STATUS_STYLE[order.status];
                          const isOpen     = expandedOrder === order.id;
                          const totalQty   = order.items.reduce((s, i) => s + i.quantity, 0);
                          const timeStr    = new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div key={order.id} style={{ borderBottom: idx < dayOrders.length - 1 ? '1px solid var(--color-steam)' : 'none' }}>
                              {/* Order row */}
                              <button
                                className="order-history-row"
                                onClick={() => toggleOrder(order.id)}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '12px 16px', background: isOpen ? 'rgba(216,58,46,0.03)' : 'transparent',
                                  border: 'none', cursor: 'pointer', textAlign: 'left',
                                  transition: 'background 0.15s',
                                }}
                              >
                                <IconExpand open={isOpen} />

                                {/* Time */}
                                <span style={{ fontSize: 13, color: 'var(--color-soy)', minWidth: 42, fontFamily: 'var(--font-accent)' }}>
                                  {timeStr}
                                </span>

                                {/* Order code */}
                                <span className="order-code" style={{ fontSize: 14, minWidth: 80 }}>
                                  {order.orderCode}
                                </span>

                                {/* Table */}
                                <span style={{ fontWeight: 600, fontSize: 14, minWidth: 60, color: 'var(--color-charcoal)' }}>
                                  {table?.displayName ?? '—'}
                                </span>

                                {/* Item count */}
                                <span style={{ fontSize: 13, color: 'var(--color-soy)', flex: 1 }}>
                                  {totalQty} món
                                </span>

                                {/* Subtotal */}
                                <span className="price" style={{ fontSize: 14, minWidth: 90, textAlign: 'right' }}>
                                  {formatPrice(order.subtotal)}
                                </span>

                                {/* Status badge */}
                                <span style={{
                                  background: statusStyle.bg, color: statusStyle.text,
                                  padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                                  fontSize: 11, fontWeight: 700, minWidth: 90, textAlign: 'center',
                                }}>
                                  {CUSTOMER_STATUS_LABELS[order.status]}
                                </span>
                              </button>

                              {/* Expanded order detail */}
                              {isOpen && (
                                <div className="order-detail" style={{
                                  background: 'var(--color-rice)', padding: '12px 16px 16px 48px',
                                  borderTop: '1px dashed var(--color-steam)',
                                }}>
                                  {order.customerNote && (
                                    <div style={{
                                      background: 'rgba(216,58,46,0.06)', border: '1px solid rgba(216,58,46,0.2)',
                                      borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                                      fontSize: 13, color: 'var(--color-chili)', marginBottom: 12,
                                    }}>
                                      📌 {order.customerNote}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {order.items.map((item) => (
                                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-charcoal)' }}>
                                            ×{item.quantity} {(item as any).name ?? item.nameSnapshot}
                                          </div>
                                          {((item as any).selectedOptions ?? item.selectedOptionsSnapshot)?.length > 0 && (
                                            <div style={{ fontSize: 12, color: 'var(--color-soy)', marginTop: 2 }}>
                                              {((item as any).selectedOptions ?? item.selectedOptionsSnapshot).map((o: any) => o.name ?? o.optionName).join(' · ')}
                                            </div>
                                          )}
                                          {item.note && (
                                            <div style={{ fontSize: 12, color: 'var(--color-soy)', fontStyle: 'italic', marginTop: 2 }}>
                                              Ghi chú: {item.note}
                                            </div>
                                          )}
                                        </div>
                                        <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 600, fontSize: 14, flexShrink: 0, marginLeft: 16 }}>
                                          {formatPrice(item.lineTotal)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{
                                    display: 'flex', justifyContent: 'flex-end', marginTop: 12,
                                    paddingTop: 10, borderTop: '1px solid var(--color-steam)',
                                  }}>
                                    <span style={{ fontFamily: 'var(--font-accent)', fontWeight: 700, fontSize: 15, color: 'var(--color-charcoal)' }}>
                                      Tổng: {formatPrice(order.subtotal)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
