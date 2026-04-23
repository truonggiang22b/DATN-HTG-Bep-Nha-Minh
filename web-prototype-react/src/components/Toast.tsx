import '../styles/global.css';
import type { Toast as ToastType } from '../types';

interface ToastProps { toasts: ToastType[]; onDismiss: (id: string) => void; }

export const ToastContainer = ({ toasts, onDismiss }: ToastProps) => (
  <div className="toast-container">
    {toasts.map((t) => (
      <div
        key={t.id}
        onClick={() => onDismiss(t.id)}
        style={{
          background: t.type === 'error' ? 'var(--color-chili)' : t.type === 'info' ? 'var(--color-charcoal)' : 'var(--color-charcoal)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
          pointerEvents: 'all',
          animation: 'slideDown 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
        <span style={{ flex: 1 }}>{t.message}</span>
      </div>
    ))}
    <style>{`@keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
  </div>
);

interface PINGateProps { children: React.ReactNode; }

export const PINGate = ({ children }: PINGateProps) => {
  // Simplified passthrough — actual PIN auth handled by auth middleware
  return <>{children}</>;
};

export const formatPrice = (price: number) =>
  price.toLocaleString('vi-VN') + 'đ';

export const getTagBadge = (tag: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    bestseller: { cls: 'badge badge-bestseller', label: '🔥 Bán chạy' },
    popular: { cls: 'badge badge-popular', label: '⭐ Phổ biến' },
    healthy: { cls: 'badge badge-healthy', label: '🥗 Healthy' },
    refreshing: { cls: 'badge badge-bestseller', label: '🧊 Thanh mát' },
    crispy: { cls: 'badge badge-popular', label: '✨ Giòn' },
  };
  return map[tag] ?? null;
};
