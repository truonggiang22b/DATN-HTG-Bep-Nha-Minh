/**
 * AdminStaffPage.tsx
 * Quản lý nhân viên: xem danh sách, tạo mới, đổi role, khóa/mở.
 * ADMIN only — Sprint C của plan 16_staff_account_admin_cleanup_plan
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  listStaff,
  createStaff,
  updateStaff,
  updateStaffStatus,
  type ApiStaff,
  type CreateStaffData,
} from '../services/internalApi';
import { useStore } from '../store/useStore';

// ─── Types ────────────────────────────────────────────────────────────────────
type RoleFilter = 'ALL' | 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'SHIPPER';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type RoleValue = 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'SHIPPER';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị',
  MANAGER: 'Quản lý',
  KITCHEN: 'Bếp',
  SHIPPER: 'Giao hàng',
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: '#d83a2e',
  MANAGER: '#e07b39',
  KITCHEN: '#3a8a6e',
  SHIPPER: '#6366f1',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getRole = (staff: ApiStaff): string => staff.roles[0] ?? 'KITCHEN';

const badgeStyle = (role: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.5,
  background: `${ROLE_COLOR[role] ?? '#888'}20`,
  color: ROLE_COLOR[role] ?? '#888',
  border: `1.5px solid ${ROLE_COLOR[role] ?? '#888'}40`,
});

// ─── Role Dropdown (custom — native select không hỗ trợ bo tròn) ──────────────
const ROLE_OPTIONS: { value: RoleValue; label: string; desc: string }[] = [
  { value: 'KITCHEN',  label: 'Bếp',       desc: 'Nhận và cập nhật tiến độ món' },
  { value: 'SHIPPER',  label: 'Giao hàng', desc: 'Theo dõi và giao đơn online' },
  { value: 'MANAGER',  label: 'Quản lý',   desc: 'Xem báo cáo, quản lý vận hành' },
  { value: 'ADMIN',    label: 'Quản trị',  desc: 'Toàn quyền hệ thống' },
];

function RoleDropdown({ value, onChange }: { value: RoleValue; onChange: (v: RoleValue) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = ROLE_OPTIONS.find((o) => o.value === value) ?? ROLE_OPTIONS[0];

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#3d3530' }}>
        Vai trò <span style={{ color: '#d83a2e' }}>*</span>
      </span>
      <div ref={ref} style={{ position: 'relative' }}>
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: '100%', padding: '10px 14px',
            borderRadius: 10,
            border: `1.5px solid ${open ? '#d83a2e' : '#ddd5cc'}`,
            background: '#faf9f7', color: '#1a1714',
            fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxSizing: 'border-box', transition: 'border-color 0.15s',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontWeight: 500 }}>{selected.label}</span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#7a6f65" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown list */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#ffffff',
            border: '1.5px solid #ddd5cc',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 10, overflow: 'hidden',
          }}>
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: opt.value === value ? 'rgba(216,58,46,0.06)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                  borderBottom: '1px solid #f0ece8',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { if (opt.value !== value) e.currentTarget.style.background = '#faf9f7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = opt.value === value ? 'rgba(216,58,46,0.06)' : 'transparent'; }}
              >
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: opt.value === value ? '#d83a2e' : '#1a1714',
                }}>
                  {opt.label}
                  {opt.value === value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d83a2e"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ marginLeft: 6, verticalAlign: 'middle' }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span style={{ fontSize: 11, color: '#9a8f85', textAlign: 'left' }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Staff Modal ───────────────────────────────────────────────────────
interface CreateModalProps {
  onClose: () => void;
  onCreated: (staff: ApiStaff) => void;
}

function CreateStaffModal({ onClose, onCreated }: CreateModalProps) {
  const { showToast } = useStore();
  const [form, setForm] = useState<CreateStaffData>({
    displayName: '',
    email: '',
    role: 'KITCHEN',
    temporaryPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName || !form.email || !form.temporaryPassword) return;
    try {
      setLoading(true);
      const staff = await createStaff(form);
      showToast(`Đã tạo tài khoản cho ${staff.displayName}`, 'success');
      onCreated(staff);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Tạo tài khoản thất bại';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '32px 28px',
        width: '100%', maxWidth: 460,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#1a1714' }}>
            Thêm nhân viên mới
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#7a6f65' }}>
            Điền thông tin để tạo tài khoản đăng nhập cho nhân viên.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {([
            { label: 'Tên hiển thị', key: 'displayName', type: 'text', placeholder: 'Nguyễn Văn A' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'nhanvien@bepnhaminh.vn' },
          ] as const).map(({ label, key, type, placeholder }) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#3d3530' }}>
                {label} <span style={{ color: '#d83a2e' }}>*</span>
              </span>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key as keyof CreateStaffData] as string}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #ddd5cc',
                  fontSize: 14,
                  outline: 'none',
                  background: '#faf9f7',
                  color: '#1a1714',
                  transition: 'border-color 0.15s',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#d83a2e'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#ddd5cc'}
              />
            </label>
          ))}

          {/* Mật khẩu — tách riêng để hiện inline validation */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#3d3530' }}>
              Mật khẩu tạm thời <span style={{ color: '#d83a2e' }}>*</span>
            </span>
            <input
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              value={form.temporaryPassword}
              onChange={(e) => setForm((f) => ({ ...f, temporaryPassword: e.target.value }))}
              required
              minLength={8}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: `1.5px solid ${form.temporaryPassword.length > 0 && form.temporaryPassword.length < 8 ? '#d83a2e' : '#ddd5cc'}`,
                fontSize: 14,
                outline: 'none',
                background: '#faf9f7',
                color: '#1a1714',
                transition: 'border-color 0.15s',
                width: '100%',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { if (form.temporaryPassword.length >= 8 || form.temporaryPassword.length === 0) e.currentTarget.style.borderColor = '#d83a2e'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = form.temporaryPassword.length > 0 && form.temporaryPassword.length < 8 ? '#d83a2e' : '#ddd5cc'; }}
            />
            {form.temporaryPassword.length > 0 && form.temporaryPassword.length < 8 && (
              <span style={{ fontSize: 11, color: '#d83a2e', marginTop: 2 }}>
                ⚠ Cần ít nhất 8 ký tự ({form.temporaryPassword.length}/8)
              </span>
            )}
          </label>

          <RoleDropdown
            value={form.role}
            onChange={(r) => setForm((f) => ({ ...f, role: r }))}
          />

          <div style={{
            fontSize: 12, color: '#7a6f65', margin: 0,
            padding: '10px 14px',
            background: '#fff8f0',
            borderRadius: 8,
            border: '1px solid #fde8c8',
            lineHeight: 1.6,
          }}>
            💡 Nhân viên sẽ dùng email + mật khẩu tạm để đăng nhập tại{' '}
            <strong style={{ color: '#d83a2e' }}>/login</strong>.
            Nên đổi mật khẩu sau lần đăng nhập đầu tiên.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px', borderRadius: 10,
                border: '1.5px solid #ddd5cc',
                background: '#fff', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: '#3d3530',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: loading ? '#e8a09b' : '#d83a2e',
                color: '#fff', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Inline Role Dropdown (trong bảng nhân viên) ────────────────────────────
function InlineRoleDropdown({
  value, onChange, onConfirm, onCancel,
}: {
  value: RoleValue;
  onChange: (v: RoleValue) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true); // mở ngay khi mount

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCancel]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', minWidth: 120 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '4px 10px', borderRadius: 8,
          border: '1.5px solid #d83a2e',
          background: '#fff', color: '#1a1714',
          fontSize: 12, fontWeight: 600,
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: 6,
          fontFamily: 'inherit',
        }}
      >
        {ROLE_LABEL[value] ?? value}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#7a6f65" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0,
          background: '#fff',
          border: '1.5px solid #e8ddd6',
          borderRadius: 10,
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
          zIndex: 50, minWidth: 140, overflow: 'hidden',
        }}>
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); onConfirm(); setOpen(false); }}
              style={{
                width: '100%', padding: '8px 12px',
                background: opt.value === value ? 'rgba(216,58,46,0.07)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid #f5f0eb',
                cursor: 'pointer', textAlign: 'left',
                fontSize: 13, fontWeight: opt.value === value ? 700 : 400,
                color: opt.value === value ? '#d83a2e' : '#1a1714',
                fontFamily: 'inherit',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={(e) => { if (opt.value !== value) e.currentTarget.style.background = '#faf9f7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = opt.value === value ? 'rgba(216,58,46,0.07)' : 'transparent'; }}
            >
              {opt.label}
              {opt.value === value && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d83a2e"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AdminStaffPage() {
  const { showToast } = useStore();
  const [staff, setStaff] = useState<ApiStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{ id: string; role: RoleValue } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listStaff();
      setStaff(data);
    } catch {
      showToast('Không thể tải danh sách nhân viên', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (s: ApiStaff) => {
    const next = !s.isActive;
    const action = next ? 'Mở lại' : 'Khóa';
    if (!window.confirm(`${action} tài khoản "${s.displayName}"?`)) return;
    try {
      setActionLoading(s.id);
      const updated = await updateStaffStatus(s.id, next);
      setStaff((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      showToast(`Đã ${action.toLowerCase()} tài khoản ${s.displayName}`, 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Thao tác thất bại';
      showToast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (id: string, role: RoleValue) => {
    try {
      setActionLoading(id);
      const updated = await updateStaff(id, { role });
      setStaff((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setEditingRole(null);
      showToast('Đã cập nhật vai trò', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Cập nhật thất bại';
      showToast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = staff.filter((s) => {
    const roleOk = roleFilter === 'ALL' || getRole(s) === roleFilter;
    const statusOk = statusFilter === 'ALL'
      ? true
      : statusFilter === 'ACTIVE' ? s.isActive : !s.isActive;
    return roleOk && statusOk;
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Nhân viên</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-soy)' }}>
            Quản lý tài khoản nhân viên trong quán
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '9px 18px', borderRadius: 'var(--radius-sm)',
            border: 'none', background: 'var(--color-chili)',
            color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Thêm nhân viên
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Role filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'ADMIN', 'MANAGER', 'KITCHEN', 'SHIPPER'] as RoleFilter[]).map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s',
                borderColor: roleFilter === r ? 'var(--color-chili)' : 'var(--color-steam)',
                background: roleFilter === r ? 'rgba(216,58,46,0.1)' : 'transparent',
                color: roleFilter === r ? 'var(--color-chili)' : 'var(--color-soy)',
              }}>
              {r === 'ALL' ? 'Tất cả vai trò' : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <div style={{ height: 1, width: '100%', background: 'none' }} />
        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {([['ALL', 'Tất cả'], ['ACTIVE', 'Đang hoạt động'], ['INACTIVE', 'Đã khóa']] as [StatusFilter, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s',
                borderColor: statusFilter === v ? 'var(--color-chili)' : 'var(--color-steam)',
                background: statusFilter === v ? 'rgba(216,58,46,0.1)' : 'transparent',
                color: statusFilter === v ? 'var(--color-chili)' : 'var(--color-soy)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-soy)' }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-soy)' }}>
          Không có nhân viên nào phù hợp bộ lọc
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-steam)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-steam-light, rgba(0,0,0,0.04))' }}>
                {['Nhân viên', 'Email', 'Vai trò', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--color-soy)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => {
                const role = getRole(s);
                const isRowLoading = actionLoading === s.id;
                return (
                  <tr key={s.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--color-steam)', opacity: isRowLoading ? 0.5 : 1 }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: 14 }}>{s.displayName}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--color-soy)' }}>{s.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {editingRole?.id === s.id ? (
                        <InlineRoleDropdown
                          value={editingRole.role}
                          onChange={(r) => setEditingRole({ id: s.id, role: r })}
                          onConfirm={() => handleChangeRole(s.id, editingRole.role)}
                          onCancel={() => setEditingRole(null)}
                        />
                      ) : (
                        <span style={badgeStyle(role)} title="Nhấn để đổi" onClick={() => setEditingRole({ id: s.id, role: role as RoleValue })} role="button" tabIndex={0}>
                          {ROLE_LABEL[role] ?? role}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: s.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                        color: s.isActive ? '#166534' : '#6b7280',
                        border: `1.5px solid ${s.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.3)'}`,
                      }}>
                        {s.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setEditingRole({ id: s.id, role: role as RoleValue })}
                          disabled={isRowLoading}
                          title="Đổi vai trò"
                          style={{
                            padding: '5px 12px', borderRadius: 6, border: '1.5px solid var(--color-steam)',
                            background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--color-soy)',
                          }}
                        >
                          Đổi role
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s)}
                          disabled={isRowLoading}
                          style={{
                            padding: '5px 12px', borderRadius: 6, border: '1.5px solid',
                            background: 'transparent', fontSize: 12, cursor: 'pointer',
                            borderColor: s.isActive ? 'rgba(216,58,46,0.3)' : 'rgba(34,197,94,0.3)',
                            color: s.isActive ? 'var(--color-chili)' : '#166534',
                          }}
                        >
                          {s.isActive ? 'Khóa' : 'Mở lại'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-soy)' }}>
          Hiển thị {filtered.length} / {staff.length} nhân viên
        </p>
      )}

      {showCreateModal && (
        <CreateStaffModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(s) => setStaff((prev) => [s, ...prev])}
        />
      )}
    </div>
  );
}
