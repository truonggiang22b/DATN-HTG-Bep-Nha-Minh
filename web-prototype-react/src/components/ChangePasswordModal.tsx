import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { changeMyPassword } from '../services/internalApi';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordModal({ onClose, onSuccess }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !loading;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setLoading(true);
      setMessage(null);
      await changeMyPassword({ currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Da doi mat khau thanh cong.' });
      onSuccess?.();
      window.setTimeout(onClose, 700);
    } catch (err: unknown) {
      const text = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Doi mat khau that bai';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          background: '#fff',
          borderRadius: 16,
          padding: '28px 26px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#1a1714' }}>
            Doi mat khau
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#7a6f65', lineHeight: 1.5 }}>
            Nhap mat khau hien tai va mat khau moi de bao ve tai khoan.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3d3530' }}>
              Mat khau hien tai
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3d3530' }}>
              Mat khau moi
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
              style={{
                ...inputStyle,
                borderColor: newPassword.length > 0 && newPassword.length < 8 ? '#d83a2e' : '#ddd5cc',
              }}
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <span style={{ fontSize: 11, color: '#d83a2e' }}>Can it nhat 8 ky tu</span>
            )}
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3d3530' }}>
              Nhap lai mat khau moi
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              style={{
                ...inputStyle,
                borderColor: confirmPassword && confirmPassword !== newPassword ? '#d83a2e' : '#ddd5cc',
              }}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <span style={{ fontSize: 11, color: '#d83a2e' }}>Mat khau nhap lai chua khop</span>
            )}
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#3d3530' }}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              style={{ width: 15, height: 15, accentColor: '#d83a2e' }}
            />
            Hien mat khau
          </label>

          {message && (
            <div
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.5,
                color: message.type === 'error' ? '#991b1b' : '#166534',
                background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: '1.5px solid #ddd5cc',
                background: '#fff',
                color: '#3d3530',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: canSubmit ? '#d83a2e' : '#e8a09b',
                color: '#fff',
                fontWeight: 800,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Dang doi...' : 'Doi mat khau'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1.5px solid #ddd5cc',
  background: '#faf9f7',
  color: '#1a1714',
  fontSize: 14,
  outline: 'none',
};
