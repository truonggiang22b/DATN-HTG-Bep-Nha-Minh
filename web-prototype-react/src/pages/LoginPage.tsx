/**
 * LoginPage.tsx
 * Trang đăng nhập cho Staff (KDS, Admin).
 * Form email + password → gọi API login → redirect về trang trước.
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { BRAND_NAME } from '../constants';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const from = (location.state as { from?: string })?.from;
  const insufficientRole = (location.state as { error?: string })?.error === 'insufficient_role';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    insufficientRole ? 'Tài khoản của bạn không có quyền truy cập trang này.' : null
  );
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      const authUser = useAuthStore.getState().user;
      const redirectTo = from ?? (authUser?.roles?.includes('KITCHEN') ? '/kds' : '/admin');
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400 || status === 401) {
        setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
      } else {
        setError('Không thể kết nối máy chủ. Hãy kiểm tra kết nối mạng.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 100%)',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <img
          src="/logo.png"
          alt="Bếp Nhà Mình"
          style={{ width: 120, height: 120, objectFit: 'contain', margin: '0 auto 12px', display: 'block', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}
        />
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: 4 }}>
          Đăng nhập cho nhân viên
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16,
        padding: '32px 28px',
        backdropFilter: 'blur(12px)',
      }}>
        <form onSubmit={handleSubmit}>
          {/* Error banner */}
          {error && (
            <div style={{
              background: 'rgba(216,58,46,0.15)',
              border: '1px solid rgba(216,58,46,0.4)',
              borderRadius: 8, padding: '10px 14px',
              color: '#ff8a7a', fontSize: 13,
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6 }}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@bepnhaminh.vn"
              autoComplete="email"
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 15,
                outline: 'none',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6 }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 44px 12px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: 15,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', fontSize: 16, padding: 0,
                }}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'rgba(216,58,46,0.5)' : 'linear-gradient(135deg, #d83a2e, #f0875a)',
              border: 'none', borderRadius: 12,
              color: '#fff', fontSize: 16, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}
          >
            {loading && (
              <span style={{
                width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#fff', borderRadius: '50%',
                display: 'inline-block', animation: 'spin 0.8s linear infinite',
              }} />
            )}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Quick links hint */}
        <div style={{ marginTop: 20, textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
          KDS: bep@bepnhaminh.vn · Admin: admin@bepnhaminh.vn
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: rgba(216,58,46,0.7) !important; box-shadow: 0 0 0 3px rgba(216,58,46,0.15); }
      `}</style>
    </div>
  );
};
