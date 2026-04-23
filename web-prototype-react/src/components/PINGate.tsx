import { useState } from 'react';
import '../styles/admin.css';
import { BRAND_NAME, INTERNAL_PIN } from '../constants';
import { usePINGate } from '../hooks/useClientSession';

interface PINGateProps {
  children: React.ReactNode;
}

export const PINGate = ({ children }: PINGateProps) => {
  const { unlocked, unlock } = usePINGate(INTERNAL_PIN);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = unlock(pin);
    if (!ok) {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="pin-gate">
      <div className="pin-gate__card">
        <div className="pin-gate__logo">🍜 {BRAND_NAME}</div>
        <div className="pin-gate__subtitle">Khu vực nội bộ — Vui lòng nhập mã PIN</div>
        <form onSubmit={handleSubmit}>
          <input
            className="input-field"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="Nhập PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            autoFocus
            style={{
              textAlign: 'center',
              fontSize: '24px',
              letterSpacing: '0.3em',
              marginBottom: '16px',
              borderColor: error ? 'var(--color-chili)' : undefined,
              animation: error ? 'shake 0.4s' : undefined,
            }}
          />
          {error && (
            <p style={{ color: 'var(--color-chili)', fontSize: '13px', marginBottom: '12px' }}>
              Mã PIN không đúng
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-full">
            Xác nhận
          </button>
        </form>
        <p className="pin-gate__hint">Gợi ý: 1234</p>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
    </div>
  );
};
