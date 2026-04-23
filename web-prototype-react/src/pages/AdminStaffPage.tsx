/**
 * AdminStaffPage.tsx
 * Quản lý nhân viên: xem danh sách, tạo mới, đổi role, khóa/mở.
 * ADMIN only — Sprint C của plan 16_staff_account_admin_cleanup_plan
 */
import { useEffect, useState, useCallback } from 'react';
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
type RoleFilter = 'ALL' | 'ADMIN' | 'MANAGER' | 'KITCHEN';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type RoleValue = 'ADMIN' | 'MANAGER' | 'KITCHEN';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị',
  MANAGER: 'Quản lý',
  KITCHEN: 'Bếp',
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: '#d83a2e',
  MANAGER: '#e07b39',
  KITCHEN: '#3a8a6e',
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

// ─── Create Staff Modal ───────────────────────────────────────────────────────
interface CreateModalProps {
  onClose: () => void;
  onCreated: (staff: ApiStaff) => void;
}

function CreateStaffModal({ onClose, onCreated }: CreateModalProps) {
  const { addToast } = useStore();
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
      addToast({ type: 'success', message: `Đã tạo tài khoản cho ${staff.displayName}` });
      onCreated(staff);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Tạo tài khoản thất bại';
      addToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        padding: 28, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>Thêm nhân viên mới</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {([
            { label: 'Tên hiển thị *', key: 'displayName', type: 'text', placeholder: 'Nguyễn Văn A' },
            { label: 'Email *', key: 'email', type: 'email', placeholder: 'nhanvien@example.com' },
            { label: 'Mật khẩu tạm *', key: 'temporaryPassword', type: 'password', placeholder: 'Tối thiểu 8 ký tự' },
          ] as const).map(({ label, key, type, placeholder }) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-soy)' }}>{label}</span>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key as keyof CreateStaffData] as string}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required
                style={{
                  padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-steam)', fontSize: 14,
                  outline: 'none', background: 'var(--color-bg)',
                  color: 'var(--color-ink)',
                }}
              />
            </label>
          ))}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-soy)' }}>Vai trò *</span>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as RoleValue }))}
              style={{
                padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-steam)', fontSize: 14,
                background: 'var(--color-bg)', color: 'var(--color-ink)',
              }}
            >
              <option value="KITCHEN">Bếp (Kitchen)</option>
              <option value="MANAGER">Quản lý (Manager)</option>
              <option value="ADMIN">Quản trị (Admin)</option>
            </select>
          </label>

          <p style={{ fontSize: 12, color: 'var(--color-soy)', margin: 0, padding: '8px 12px', background: 'var(--color-steam-light, rgba(0,0,0,0.04))', borderRadius: 8 }}>
            Nhân viên sẽ nhận mật khẩu tạm và đăng nhập tại trang /login.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-steam)', background: 'transparent', cursor: 'pointer', fontSize: 13 }}>
              Hủy
            </button>
            <button type="submit" disabled={loading}
              style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--color-chili)', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AdminStaffPage() {
  const { addToast } = useStore();
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
      addToast({ type: 'error', message: 'Không thể tải danh sách nhân viên' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (s: ApiStaff) => {
    const next = !s.isActive;
    const action = next ? 'Mở lại' : 'Khóa';
    if (!window.confirm(`${action} tài khoản "${s.displayName}"?`)) return;
    try {
      setActionLoading(s.id);
      const updated = await updateStaffStatus(s.id, next);
      setStaff((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      addToast({ type: 'success', message: `Đã ${action.toLowerCase()} tài khoản ${s.displayName}` });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Thao tác thất bại';
      addToast({ type: 'error', message: msg });
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
      addToast({ type: 'success', message: 'Đã cập nhật vai trò' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Cập nhật thất bại';
      addToast({ type: 'error', message: msg });
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
          {(['ALL', 'ADMIN', 'MANAGER', 'KITCHEN'] as RoleFilter[]).map((r) => (
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
                        <select
                          autoFocus
                          value={editingRole.role}
                          onChange={(e) => setEditingRole({ id: s.id, role: e.target.value as RoleValue })}
                          onBlur={() => handleChangeRole(s.id, editingRole.role)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1.5px solid var(--color-chili)', fontSize: 12 }}
                        >
                          <option value="KITCHEN">Bếp</option>
                          <option value="MANAGER">Quản lý</option>
                          <option value="ADMIN">Quản trị</option>
                        </select>
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
