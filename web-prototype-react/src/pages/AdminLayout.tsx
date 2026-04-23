import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ToastContainer } from '../components/Toast';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { BRAND_NAME } from '../constants';
import '../styles/admin.css';

// ── Sidebar SVG icons (Feather-style, 18×18, stroke-only) ────────────────────
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2h2v20H3zM19 2h2v20h-2z" />
    <path d="M5 12h14" />
    <path d="M8 7c0-2.8 8-2.8 8 0" />
    <path d="M8 17c0 2.8 8 2.8 8 0" />
  </svg>
);

const IconTable = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="3" rx="1" />
    <line x1="7" y1="10" x2="7" y2="20" />
    <line x1="17" y1="10" x2="17" y2="20" />
    <line x1="5" y1="20" x2="9" y2="20" />
    <line x1="15" y1="20" x2="19" y2="20" />
  </svg>
);

const IconKDS = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="7" y1="8" x2="7" y2="12" />
    <line x1="12" y1="7" x2="12" y2="12" />
    <line x1="17" y1="9" x2="17" y2="12" />
  </svg>
);

const IconBrand = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8 2 4 5 4 9c0 2.4 1 4.5 2.6 6H4v2h16v-2h-2.6C19 13.5 20 11.4 20 9c0-4-4-7-8-7z" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconStaff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="16" y1="11" x2="22" y2="11" />
  </svg>
);


// ── Sidebar component ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/admin',        label: 'Tổng quan',          Icon: IconDashboard, end: true  },
  { to: '/admin/menu',   label: 'Thực đơn',           Icon: IconMenu,      end: false },
  { to: '/admin/tables', label: 'Bàn & QR',           Icon: IconTable,     end: false },
  { to: '/admin/staff',  label: 'Nhân viên',          Icon: IconStaff,     end: false },
  { to: '/kds',          label: 'Màn hình bếp (KDS)', Icon: IconKDS,       end: false },
];


const AdminSidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="admin-sidebar">
      <div className="admin-sidebar__brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="admin-sidebar__brand-icon">
          <IconBrand />
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{BRAND_NAME}</div>
          <div className="admin-sidebar__sub">Quản lý cửa hàng</div>
        </div>
      </div>

      {NAV_ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `admin-nav-item ${isActive ? 'admin-nav-item--active' : ''}`}
        >
          <span className="admin-nav-icon"><Icon /></span>
          {label}
        </NavLink>
      ))}

      <div style={{ flex: 1 }} />

      {/* User info + logout */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-steam)' }}>
        <div style={{ fontSize: 12, color: 'var(--color-soy)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            background: 'transparent', border: '1px solid var(--color-steam)',
            color: 'var(--color-soy)', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(216,58,46,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-chili)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-chili)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-steam)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-soy)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </nav>
  );
};

// ── Layout ────────────────────────────────────────────────────────────────────
export const AdminLayout = () => {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="admin-layout">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <AdminSidebar />
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
};
