/**
 * LoginPage.tsx
 * Trang đăng nhập cho các tài khoản nội bộ: Admin, Bếp, Quản lý.
 */
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import './LoginPage.css';

const EyeIcon = ({ hidden }: { hidden: boolean }) => (
  <svg
    aria-hidden="true"
    className="login-password-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {hidden ? (
      <>
        <path d="M17.94 17.94A10.8 10.8 0 0 1 12 20C7 20 2.73 16.89 1 12c.8-2.26 2.24-4.14 4.06-5.45" />
        <path d="M9.9 4.24A10.3 10.3 0 0 1 12 4c5 0 9.27 3.11 11 8a12.6 12.6 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
        <path d="M1 1l22 22" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const from = (location.state as { from?: string })?.from;
  const insufficientRole = (location.state as { error?: string })?.error === 'insufficient_role';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      const authUser = useAuthStore.getState().user;
      const roles = authUser?.roles ?? [];
      const defaultRedirect = roles.includes('KITCHEN')
        ? '/kds'
        : roles.includes('SHIPPER')
        ? '/shipper'
        : '/admin';
      const redirectTo = from ?? defaultRedirect;
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const status = typeof err === 'object' && err !== null
        && 'response' in err
        && typeof (err as { response?: { status?: unknown } }).response?.status === 'number'
        ? (err as { response: { status: number } }).response.status
        : undefined;

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
    <main className="login-page" aria-labelledby="login-title">
      <section className="login-shell">
        <div className="login-brand-panel" aria-label="Bếp nhà mình">
          <div className="login-brand-top">
            <img
              className="login-logo"
              src="/Logo_Bep_nha_minh.jpg"
              alt="Logo Bếp nhà mình"
            />
            <div>
              <p className="login-eyebrow">Bếp nhà mình</p>
              <h1 id="login-title">Bếp Nhà Ta Nấu</h1>
            </div>
          </div>

          <div className="login-food-strip" aria-hidden="true">
            <img src="/v2-com-tam.png" alt="" />
            <img src="/v2-canh-chua.png" alt="" />
            <img src="/v2-bua-com.png" alt="" />
          </div>

        </div>

        <section className="login-card" aria-label="Biểu mẫu đăng nhập">
          <div className="login-card-header">
            <div className="login-card-logo-wrap">
              <img
                className="login-card-logo"
                src="/Logo_Bep_nha_minh.jpg"
                alt=""
                aria-hidden="true"
              />
            </div>
            <p className="login-eyebrow">Tài khoản nội bộ</p>
            <h2>Đăng nhập hệ thống</h2>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {insufficientRole && !error && (
              <div role="note" style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                fontSize: 13,
                color: '#1e40af',
                lineHeight: 1.5,
                marginBottom: 4,
              }}>
                Tài khoản hiện tại không đủ quyền. Vui lòng đăng nhập bằng tài khoản phù hợp.
              </div>
            )}
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <label className="login-field" htmlFor="login-email">
              <span>Email</span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@bepnhaminh.vn"
                autoComplete="email"
                required
              />
            </label>

            <label className="login-field" htmlFor="login-password">
              <span>Mật khẩu</span>
              <div className="login-password-control">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  required
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
            </label>

            <div className="login-form-actions">
              <a
                className="login-forgot-link"
                href="mailto:admin@bepnhaminh.vn?subject=Yeu%20cau%20dat%20lai%20mat%20khau"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              id="login-submit"
              className="login-submit"
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
            >
              {loading && <span className="spinner login-submit-spinner" aria-hidden="true" />}
              <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
            </button>

            <dl className="login-system-status" aria-label="Trạng thái hệ thống">
              <div>
                <dt>Chi nhánh</dt>
                <dd>Bếp Nhà Mình – Q1</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd><span aria-hidden="true">🟢</span> Đang hoạt động</dd>
              </div>
              <div>
                <dt>Phiên bản</dt>
                <dd>v1.0.0</dd>
              </div>
            </dl>
          </form>
        </section>
      </section>
    </main>
  );
};
