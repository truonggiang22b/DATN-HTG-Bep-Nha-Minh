import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { getTables, createTable, deactivateTable, restoreTableApi, resetTableSession } from '../services/internalApi';
import '../styles/admin.css';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IconExternalLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
export const AdminTablesPage = () => {
  const { showToast } = useStore();
  const queryClient = useQueryClient();

  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({ tableCode: '', displayName: '' });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // ── Query ─────────────────────────────────────────────────────────────────
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
    staleTime: 30_000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: doReset, isPending: resetPending } = useMutation({
    mutationFn: (tableId: string) => resetTableSession(tableId),
    onSuccess: (_result, tableId) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      const table = tables.find((t) => t.id === tableId);
      showToast(`Đã reset phiên — ${table?.displayName ?? tableId}`);
      setConfirmReset(null);
    },
    onError: (err: any) => {
      const code = err.code ?? err.response?.data?.error?.code;
      if (code === 'ACTIVE_ORDERS_EXIST') {
        showToast('Không thể reset — bàn còn đơn đang xử lý. Hãy hoàn tất hoặc hủy đơn trước.', 'error');
      } else {
        showToast('Không thể reset phiên', 'error');
      }
      setConfirmReset(null);
    },
  });

  const { mutate: doCreateTable, isPending: createPending } = useMutation({
    mutationFn: createTable,
    onSuccess: (table) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showToast(`Đã tạo ${table.displayName}`);
      setAddModalOpen(false);
      setNewTable({ tableCode: '', displayName: '' });
    },
    onError: () => showToast('Không thể tạo bàn mới', 'error'),
  });

  const { mutate: doToggleStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      if (status === 'INACTIVE') return deactivateTable(id);
      return restoreTableApi(id);
    },
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      const t = tables.find((x) => x.id === vars.id);
      const label = vars.status === 'INACTIVE' ? 'Ngừng sử dụng' : 'Bật lại';
      showToast(`${label} — ${t?.displayName ?? vars.id}`);
      setConfirmDeactivate(null);
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      const msg = err?.response?.data?.error?.message ?? 'Không thể đổi trạng thái bàn';
      showToast(msg, 'error');
      setConfirmDeactivate(null);
    },
  });

  const handleCopyQR = (qrToken: string) => {
    const url = `${window.location.origin}/qr/${qrToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(qrToken);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleOpenQR = (qrToken: string) => {
    window.open(`/qr/${qrToken}`, '_blank');
  };

  return (
    <div>
      <div className="admin-topbar">
        <span className="admin-topbar__title">Quản lý bàn & phiên</span>
        <button className="btn btn-primary" style={{ fontSize: 13, padding: '6px 14px', minHeight: 36 }} onClick={() => setAddModalOpen(true)}>
          + Thêm bàn mới
        </button>
      </div>

      <div className="admin-content">
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-soy)' }}>Đang tải...</div>
        ) : (
        <>
            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {([['ACTIVE', 'Đang sử dụng'], ['INACTIVE', 'Ngừng sử dụng'], ['ALL', 'Tất cả']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setStatusFilter(v)}
                  style={{
                    padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: '1.5px solid', transition: 'all 0.15s',
                    borderColor: statusFilter === v ? 'var(--color-chili)' : 'var(--color-steam)',
                    background: statusFilter === v ? 'rgba(216,58,46,0.1)' : 'transparent',
                    color: statusFilter === v ? 'var(--color-chili)' : 'var(--color-soy)',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Info banner */}
            <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#374151' }}>
              <span style={{ marginTop: 1 }}>ℹ️</span>
              <span>"Ngừng sử dụng" bàn sẽ ẩn bàn khỏi danh sách đang dùng nhưng không xóa lịch sử. QR cũ sẽ không nhận order mới. Bạn có thể bật lại bất cứ lúc nào.</span>
            </div>

            <div className="admin-table-wrapper">
              <div className="admin-table-header">
                <span className="admin-table-title">
                  {statusFilter === 'ACTIVE' ? 'Bàn đang sử dụng' : statusFilter === 'INACTIVE' ? 'Bàn ngừng sử dụng' : 'Tất cả bàn'}
                  {' '}({tables.filter(t => statusFilter === 'ALL' || t.status === statusFilter).length})
                </span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bàn</th><th>Mã bàn</th><th>QR Token</th><th>Phiên hiện tại</th><th>Trạng thái</th><th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = tables.filter(t => statusFilter === 'ALL' || t.status === statusFilter);
                    if (filtered.length === 0) return (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-soy)' }}>Không có bàn nào</td></tr>
                    );
                    return filtered.map((table) => (
                      <tr key={table.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{table.displayName}</div>
                        </td>
                        <td><code style={{ fontSize: 12, background: 'var(--color-steam)', padding: '2px 6px', borderRadius: 4 }}>{table.tableCode}</code></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <code style={{ fontSize: 12, color: 'var(--color-soy)' }}>
                              {table.qrToken.slice(0, 16)}{table.qrToken.length > 16 ? '…' : ''}
                            </code>
                            <button
                              title="Copy URL QR"
                              onClick={() => handleCopyQR(table.qrToken)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedToken === table.qrToken ? 'var(--color-leaf)' : 'var(--color-soy)', padding: '2px 4px' }}
                            >
                              <IconCopy />
                            </button>
                            <button
                              title="Mở QR page"
                              onClick={() => handleOpenQR(table.qrToken)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-soy)', padding: '2px 4px' }}
                            >
                              <IconExternalLink />
                            </button>
                          </div>
                        </td>
                        <td>
                          {table.hasActiveSession ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', color: '#166534', fontSize: 12, fontWeight: 600 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
                              Đang phục vụ
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--color-soy)' }}>Trống</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 12, fontWeight: 600,
                            background: table.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.15)',
                            color: table.status === 'ACTIVE' ? '#166534' : '#6b7280',
                          }}>
                            {table.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'}
                          </span>
                        </td>
                        <td>
                          <div className="quick-actions">
                            {/* Reset session */}
                            {confirmReset === table.id ? (
                              <span style={{ display: 'flex', gap: 4 }}>
                                <button className="qa-btn qa-btn--danger" disabled={resetPending}
                                  onClick={() => doReset(table.id)}>
                                  {resetPending ? '...' : 'Xác nhận'}
                                </button>
                                <button className="qa-btn" onClick={() => setConfirmReset(null)}>Hủy</button>
                              </span>
                            ) : (
                              <button
                                className="qa-btn"
                                style={{ borderColor: 'var(--color-chili)', color: 'var(--color-chili)', display: 'flex', alignItems: 'center', gap: 4 }}
                                onClick={() => setConfirmReset(table.id)}
                                title="Reset phiên bàn"
                              >
                                <IconTrash /> Reset phiên
                              </button>
                            )}
                             {confirmDeactivate === table.id ? (
                               <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                 <span style={{ fontSize: 12, color: 'var(--color-chili)', display: 'block', width: '100%', marginBottom: 4 }}>
                                   {table.hasActiveSession ? '⚠️ Bàn có phiên đang mở!' : 'Ngừng sử dụng bàn này?'}
                                 </span>
                                 <button className="qa-btn qa-btn--danger"
                                   onClick={() => doToggleStatus({ id: table.id, status: 'INACTIVE' })}>
                                   Xác nhận
                                 </button>
                                 <button className="qa-btn" onClick={() => setConfirmDeactivate(null)}>Hủy</button>
                               </span>
                             ) : (
                               <button
                                 className="qa-btn"
                                 style={table.status === 'ACTIVE'
                                   ? { borderColor: 'rgba(216,58,46,0.4)', color: 'var(--color-chili)' }
                                   : { borderColor: 'rgba(34,197,94,0.4)', color: '#166534' }}
                                 onClick={() => {
                                   if (table.status === 'ACTIVE') {
                                     setConfirmDeactivate(table.id);
                                   } else {
                                     doToggleStatus({ id: table.id, status: 'ACTIVE' });
                                   }
                                 }}
                               >
                                 {table.status === 'ACTIVE' ? 'Ngừng sử dụng' : 'Bật lại'}
                               </button>
                             )}
                           </div>
                         </td>
                       </tr>
                     ));
                  })()}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add table modal */}
      {addModalOpen && (
        <div className="modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">+ Thêm bàn mới</span>
              <button className="modal-close" onClick={() => setAddModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Mã bàn <span style={{ color: 'var(--color-chili)' }}>*</span></label>
                <input className="form-input" placeholder="VD: table-10" value={newTable.tableCode}
                  onChange={(e) => setNewTable((n) => ({ ...n, tableCode: e.target.value.trim() }))} />
                <div style={{ fontSize: 11, color: 'var(--color-soy)', marginTop: 4 }}>Dùng làm phần cuối URL QR code. Không dấu, không khoảng trắng.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Tên hiển thị <span style={{ color: 'var(--color-chili)' }}>*</span></label>
                <input className="form-input" placeholder="VD: Bàn 10" value={newTable.displayName}
                  onChange={(e) => setNewTable((n) => ({ ...n, displayName: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setAddModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" disabled={createPending || !newTable.tableCode || !newTable.displayName}
                onClick={() => doCreateTable(newTable)}>
                {createPending ? 'Đang tạo...' : 'Tạo bàn'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};
