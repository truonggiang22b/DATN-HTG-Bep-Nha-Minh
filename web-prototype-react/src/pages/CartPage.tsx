import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useCart, useClientSession } from '../hooks/useClientSession';
import { useStore } from '../store/useStore';
import { ToastContainer } from '../components/Toast';
import { formatPrice } from '../components/Toast';
import { submitOrder, buildSubmitPayload } from '../services/publicApi';

import '../styles/customer.css';

export const CartPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const clientSessionId = useClientSession();
  const { cart, subtotal, itemCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { toasts, showToast, dismissToast } = useStore();

  // Resolve table context: từ state hoặc sessionStorage
  const state = location.state as { tableId?: string; tableDisplay?: string } | null;
  // tableId available via sessionStorage if needed: sessionStorage.getItem('bnm-table-id')
  const tableDisplay = state?.tableDisplay || sessionStorage.getItem('bnm-table-display') || 'Bàn --';
  const qrToken = sessionStorage.getItem('bnm-qr-token') || '';

  const [soldOutItems, setSoldOutItems] = useState<string[]>([]);

  // ── Mutation: submit order to API ─────────────────────────────────────────
  const { mutate: doSubmit, isPending } = useMutation({
    mutationFn: submitOrder,
    onSuccess: (order) => {
      clearCart();
      navigate(`/order/${order.id}/tracking`, {
        state: { tableDisplay, qrToken },
      });
    },
    onError: (err: any) => {
      const code = err.code ?? err.response?.data?.error?.code;
      const details = err.details ?? err.response?.data?.error?.details;

      if (code === 'ITEM_SOLD_OUT' && details?.soldOutItems) {
        // Server trả về danh sách món hết — hiển thị
        const names = (details.soldOutItems as Array<{ name: string }>).map((i) => i.name);
        setSoldOutItems(names);
      } else if (code === 'DUPLICATE_ORDER') {
        // Đơn trùng idempotency key — trường hợp hiếm, show toast
        showToast('Đơn hàng đã được gửi trước đó.', 'info');
      } else {
        showToast('Không thể gửi đơn. Vui lòng thử lại.', 'error');
      }
    },
  });

  const handleSubmit = () => {
    if (!cart.length || !qrToken || isPending) return;
    setSoldOutItems([]);

    const idempotencyKey = `${clientSessionId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const items = cart.map((ci) => ({
      menuItemId: ci.menuItemId,
      quantity: ci.quantity,
      selectedOptions: ci.selectedOptions.map((o) => ({
        optionGroupId: o.optionGroupId,
        optionId: o.optionId,
        name: o.optionName,
        priceDelta: o.priceDelta,
      })),
      note: ci.note || undefined,
    }));

    doSubmit(buildSubmitPayload(qrToken, clientSessionId, idempotencyKey, items));
  };

  if (itemCount === 0) {
    return (
      <div className="app-shell">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <div className="cart-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <span className="cart-header__title">Giỏ hàng — {tableDisplay}</span>
        </div>
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-title">Giỏ hàng đang trống</div>
          <div className="empty-state-text">Bạn chưa chọn món nào.</div>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Xem thực đơn →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="cart-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <span className="cart-header__title">Giỏ hàng — {tableDisplay}</span>
      </div>

      <div className="cart-page">
        <div style={{ padding: '0 var(--space-md)' }}>
          {/* Sold-out error from server */}
          {soldOutItems.length > 0 && (
            <div className="error-banner" style={{ marginBottom: '16px' }}>
              <strong>Món đã tạm hết:</strong> {soldOutItems.join(', ')}
              <span style={{ fontSize: '13px', color: 'var(--color-soy)' }}>
                Vui lòng xóa các món trên trước khi gửi đơn.
              </span>
              <button
                style={{ fontSize: '12px', color: 'var(--color-chili)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                onClick={() => setSoldOutItems([])}
              >
                Đóng
              </button>
            </div>
          )}

          {/* Cart items */}
          {cart.map((item) => (
            <div key={item.cartItemId} className="cart-item">
              <img
                className="cart-item__img"
                src={item.imageUrl}
                alt={item.name}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="cart-item__body">
                <div className="cart-item__name">{item.name}</div>
                {item.selectedOptions.length > 0 && (
                  <div className="cart-item__option">
                    {item.selectedOptions.map((o) => o.optionName).join(' · ')}
                  </div>
                )}
                {item.note && <div className="cart-item__note">Ghi chú: {item.note}</div>}
                <div className="cart-item__footer">
                  <div className="qty-stepper">
                    <button
                      className="qty-stepper__btn"
                      onClick={() => {
                        if (item.quantity <= 1) {
                          removeFromCart(item.cartItemId);
                          showToast(`Đã xóa "${item.name}" khỏi giỏ`, 'info');
                        } else {
                          updateQuantity(item.cartItemId, item.quantity - 1);
                        }
                      }}
                    >−</button>
                    <span className="qty-stepper__value">{item.quantity}</span>
                    <button className="qty-stepper__btn" onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>+</button>
                  </div>
                  <span className="cart-item__line-total">{formatPrice(item.lineTotal)}</span>
                </div>
                <button
                  className="cart-item__remove-btn"
                  onClick={() => {
                    removeFromCart(item.cartItemId);
                    showToast(`Đã xóa "${item.name}" khỏi giỏ`, 'info');
                  }}
                >
                  🗑 Xóa món
                </button>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="cart-summary">
            <div className="cart-summary__row">
              <span className="cart-summary__label">Tạm tính ({itemCount} món)</span>
              <span className="cart-summary__total">{formatPrice(subtotal)}</span>
            </div>
          </div>

          <div className="warning-box" style={{ marginTop: '12px' }}>
            <span>💡</span>
            <span>Bạn có thể gọi thêm sau bằng cách vào menu và tạo đơn mới.</span>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="cart-footer">
        <button
          className="btn btn-primary btn-full"
          onClick={handleSubmit}
          disabled={isPending || !qrToken}
        >
          {isPending ? (
            <><span className="spinner" /> Đang gửi order...</>
          ) : (
            'Gửi order cho quán'
          )}
        </button>
      </div>
    </div>
  );
};
