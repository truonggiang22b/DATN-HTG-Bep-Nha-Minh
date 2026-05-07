import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { ToastContainer } from '../components/Toast';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { getActiveOrders, updateOrderStatus, cancelOrder } from '../services/internalApi';
import { BRAND_NAME, KDS_STATUS_LABELS, KDS_CTA_LABELS, KDS_COLUMNS } from '../constants';
import type { ApiOrder, OrderStatus } from '../types';
import { useElapsedTime } from '../hooks/useClientSession';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import '../styles/kds.css';

export const KDSPage = () => {
  const { toasts, showToast, dismissToast } = useStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [clock, setClock] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleRealtimeEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
  }, [queryClient]);

  const realtime = useRealtimeOrders({ onEvent: handleRealtimeEvent });

  // ── Polling active orders mỗi 5 giây ─────────────────────────────────────
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['activeOrders'],
    queryFn: getActiveOrders,
    refetchInterval: realtime.isRealtime ? 30_000 : 5000,
    staleTime: 0, // Luôn re-fetch
  });

  // ── Mutation: chuyển trạng thái (Optimistic Update) ────────────────────
  const { mutate: doUpdateStatus } = useMutation({
    mutationFn: ({ id, toStatus }: { id: string; toStatus: OrderStatus }) =>
      updateOrderStatus(id, toStatus),

    // ① Cập nhật UI ngay lập tức — không đợi server
    onMutate: async ({ id, toStatus }) => {
      // Hủy các re-fetch đang chạy để tránh ghi đè snapshot
      await queryClient.cancelQueries({ queryKey: ['activeOrders'] });
      // Lưu snapshot để rollback nếu lỗi
      const previous = queryClient.getQueryData<ApiOrder[]>(['activeOrders']);
      // Cập nhật cache ngay
      queryClient.setQueryData<ApiOrder[]>(['activeOrders'], (old = []) =>
        old.map((o) => (o.id === id ? { ...o, status: toStatus } : o))
      );
      return { previous };
    },

    // ② Nếu server báo lỗi → rollback về trạng thái cũ
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['activeOrders'], ctx.previous);
      }
      showToast('Không thể cập nhật trạng thái', 'error');
    },

    // ③ Dù thành công hay lỗi → sync lại với server cho chắc
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      // Toast sau khi server confirm (lấy orderCode từ snapshot cache)
      if (_data) {
        showToast(`${_data.orderCode} → ${KDS_STATUS_LABELS[_data.status]}`);
      }
    },
  });

  // ── Mutation: hủy đơn (Optimistic Update) ──────────────────────────────
  const { mutate: doCancel } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelOrder(id, reason),

    // ① Ẩn card ngay — optimistically xóa khỏi danh sách active
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['activeOrders'] });
      const previous = queryClient.getQueryData<ApiOrder[]>(['activeOrders']);
      queryClient.setQueryData<ApiOrder[]>(['activeOrders'], (old = []) =>
        old.filter((o) => o.id !== id)
      );
      return { previous };
    },

    // ② Rollback nếu lỗi
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['activeOrders'], ctx.previous);
      }
      showToast('Không thể hủy đơn', 'error');
    },

    // ③ Sync lại với server
    onSettled: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      if (_data) {
        showToast(`${_data.orderCode} đã hủy`, 'error');
      }
    },
  });

  const handleNext = (order: ApiOrder) => {
    const transitions: Record<OrderStatus, OrderStatus | null> = {
      NEW: 'PREPARING', PREPARING: 'READY', READY: 'SERVED', SERVED: null, CANCELLED: null,
    };
    const next = transitions[order.status];
    if (!next) return;
    doUpdateStatus({ id: order.id, toStatus: next });
  };

  const handleCancel = (order: ApiOrder) => {
    if (order.status === 'SERVED') return;
    if (!window.confirm(`Xác nhận hủy đơn ${order.orderCode}?`)) return;
    doCancel({ id: order.id, reason: 'Hủy từ KDS' });
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="kds-layout">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <header className="kds-header">
        <div className="kds-header__brand">
          <img
            className="kds-header__logo"
            src="/Logo_Bep_nha_minh.jpg"
            alt={BRAND_NAME}
          />
          <span>{BRAND_NAME} — Bếp</span>
        </div>
        <div className="kds-header__meta">
          {isLoading ? 'Đang tải...' : (
            <>
              {orders.filter((o) => o.status === 'NEW').length} đơn mới •{' '}
              {orders.filter((o) => o.status === 'PREPARING').length} đang làm •{' '}
              {orders.filter((o) => o.status === 'SERVED').length} hoàn thành hôm nay •{' '}
              {realtime.statusText}
            </>
          )}
        </div>
        {/* Clock + User menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="kds-header__clock">{clock}</div>

          {/* User menu — 1 nút duy nhất */}
          <div className="kds-user-menu" ref={userMenuRef}>
            <button
              className="kds-user-trigger"
              onClick={() => setShowUserMenu(v => !v)}
              aria-label="Menu tài khoản"
              aria-expanded={showUserMenu}
            >
              <div className="kds-user-avatar">
                {(user?.displayName ?? user?.email ?? 'B').charAt(0).toUpperCase()}
              </div>
              <span className="kds-user-trigger-name">{user?.displayName ?? 'Bếp'}</span>
              <svg
                className={`kds-user-chevron${showUserMenu ? ' kds-user-chevron--open' : ''}`}
                width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="kds-user-dropdown">
                {/* Thông tin tài khoản */}
                <div className="kds-udrop-header">
                  <div className="kds-udrop-avatar">
                    {(user?.displayName ?? user?.email ?? 'B').charAt(0).toUpperCase()}
                  </div>
                  <div className="kds-udrop-info">
                    <span className="kds-udrop-name">{user?.displayName ?? 'Bếp'}</span>
                    <span className="kds-udrop-email">{user?.email}</span>
                    <span className="kds-udrop-badge">Nhà bếp</span>
                  </div>
                </div>
                <div className="kds-udrop-divider" />
                <button
                  className="kds-udrop-item"
                  onClick={() => { setShowUserMenu(false); setShowChangePassword(true); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Đổi mật khẩu
                </button>
                <button
                  className="kds-udrop-item kds-udrop-item--danger"
                  onClick={() => { setShowUserMenu(false); handleLogout(); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      <div className="kds-board">
        {KDS_COLUMNS.map((colStatus) => {
          const colOrders = orders.filter((o) => o.status === colStatus);
          return (
            <div key={colStatus} className="kds-column">
              <div className="kds-column__header">
                <span className="kds-column__title">{KDS_STATUS_LABELS[colStatus]}</span>
                <span className="kds-column__count">{colOrders.length}</span>
              </div>
              <div className="kds-column__cards">
                {colOrders.length === 0 ? (
                  <div className="kds-empty">
                    <div className="kds-empty__icon">📋</div>
                    <div className="kds-empty__text">Chưa có đơn</div>
                  </div>
                ) : (
                  [...colOrders]
                    // SERVED: mới nhất lên đầu (để dễ xem); các cột khác: FIFO (cũ nhất lên đầu)
                    .sort((a, b) => {
                      const aT = new Date(a.createdAt).getTime();
                      const bT = new Date(b.createdAt).getTime();
                      return colStatus === 'SERVED' ? bT - aT : aT - bT;
                    })
                    .map((order) => (
                      <KDSOrderCard
                        key={order.id}
                        order={order}
                        onNext={() => handleNext(order)}
                        onCancel={() => handleCancel(order)}
                      />
                    ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const KDSOrderCard = ({
  order,
  onNext,
  onCancel,
}: {
  order: ApiOrder;
  onNext: () => void;
  onCancel: () => void;
}) => {
  const endAt = order.status === 'SERVED' ? order.updatedAt : undefined;
  const elapsed = useElapsedTime(order.createdAt, endAt);
  const ctaLabel = KDS_CTA_LABELS[order.status as OrderStatus];

  const cardClass = [
    'kds-card',
    order.status === 'NEW' ? 'kds-card--new' : '',
    order.status === 'PREPARING' ? 'kds-card--preparing' : '',
    order.status === 'READY' ? 'kds-card--ready pulse-new' : '',
    order.status === 'SERVED' ? 'kds-card--served' : '',
  ].filter(Boolean).join(' ');

  const ctaBtnClass = [
    'kds-btn-primary',
    order.status === 'PREPARING' ? 'kds-btn-primary--preparing' : '',
    order.status === 'READY' ? 'kds-btn-primary--ready' : '',
  ].filter(Boolean).join(' ');

  // Phân biệt đơn online vs đơn tại quán
  const isOnline = (order as any).orderType === 'ONLINE';
  const customerName = (order as any).customerName;
  const displayName = isOnline
    ? (customerName ? `Giao — ${customerName}` : 'Giao hàng')
    : (order as any).tableName ?? order.table?.displayName ?? `Bàn ${(order.tableId ?? '???').slice(-4)}`;

  const shortLabel = isOnline
    ? 'ONLINE'
    : displayName.replace('Bàn ', '');

  return (
    <div className={cardClass}>
      <div className="kds-card__header">
        <div className={`kds-card__table${isOnline ? ' kds-card__table--online' : ''}`}>
          {shortLabel}
        </div>
        <div className="kds-card__meta">
          {isOnline && (
            <div className="kds-card__online-badge">🛵 Giao tận nơi</div>
          )}
          <div className="kds-card__code">{order.orderCode}</div>
          <div className="kds-card__time">{elapsed}</div>
        </div>
      </div>

      {order.customerNote && (
        <div className="kds-card__customer-note">📌 {order.customerNote}</div>
      )}

      <div className="kds-card__items">
        {order.items.map((item) => (
          <div key={item.id}>
            <div className="kds-card__item">
              <span className="kds-card__item-qty">×{item.quantity}</span>
              <span>{(item as any).name ?? item.nameSnapshot}</span>
            </div>
            {((item as any).selectedOptions ?? item.selectedOptionsSnapshot)?.length > 0 && (
              <div className="kds-card__item-note" style={{ marginLeft: '28px' }}>
                {((item as any).selectedOptions ?? item.selectedOptionsSnapshot).map((o: any) => o.name).join(' · ')}
              </div>
            )}
            {item.note && (
              <div className="kds-card__item-note" style={{ marginLeft: '28px' }}>✎ {item.note}</div>
            )}
          </div>
        ))}
      </div>

      {ctaLabel && (
        <div className="kds-card__actions">
          <button className={ctaBtnClass} onClick={onNext}>{ctaLabel}</button>
          {order.status !== 'SERVED' && (
            <button className="kds-btn-cancel" onClick={onCancel}>Hủy</button>
          )}
        </div>
      )}
    </div>
  );
};
