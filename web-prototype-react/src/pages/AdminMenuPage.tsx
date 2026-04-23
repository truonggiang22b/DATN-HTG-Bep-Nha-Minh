import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { formatPrice } from '../components/Toast';
import type { ItemStatus, ApiMenuItem } from '../types';
import {
  getCategories, createCategory, updateCategory, deleteCategory, restoreCategory,
  getMenuItems, createMenuItem, updateMenuItem, updateItemStatus,
  deleteMenuItem, restoreMenuItem,
  uploadMenuImage,
} from '../services/internalApi';
import '../styles/admin.css';

const BLANK_FORM = {
  name: '',
  categoryId: '',
  price: '',
  shortDescription: '',
  imageUrl: '',
  tags: [] as string[],
  status: 'ACTIVE' as ItemStatus,
};

const ALL_TAGS = [
  { value: 'popular',    label: '⭐ Phổ biến' },
  { value: 'spicy',      label: '🌶 Cay' },
  { value: 'vegetarian', label: '🌿 Chay' },
  { value: 'new',        label: '🆕 Mới' },
  { value: 'healthy',    label: '💚 Healthy' },
  { value: 'combo',      label: '🎁 Combo' },
];

export const AdminMenuPage = () => {
  const { showToast } = useStore();
  const queryClient = useQueryClient();

  // ── Query: categories + menu items ────────────────────────────────────────
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 60_000,
  });

  const { data: menuItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: getMenuItems,
    staleTime: 30_000,
  });

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  // ── Item modal state ──────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });

  // ── Upload state ──────────────────────────────────────────────────────────
  const [uploadProgress, setUploadProgress] = useState<'idle'|'uploading'|'done'|'error'>('idle');
  const [previewUrl, setPreviewUrl]         = useState<string>('');
  const fileInputRef                        = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver]         = useState(false);

  // ── Category panel state ──────────────────────────────────────────────────
  const [catPanelOpen, setCatPanelOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: doUpdateItemStatus, isPending: statusPending } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ItemStatus }) =>
      updateItemStatus(id, status),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      const label = item.status === 'ACTIVE' ? 'Đang bán' : item.status === 'SOLD_OUT' ? 'Tạm hết' : 'Đã ẩn';
      showToast(`${item.name} → ${label}`);
    },
    onError: () => showToast('Không thể cập nhật trạng thái', 'error'),
  });

  const { mutate: doCreateItem, isPending: createItemPending } = useMutation({
    mutationFn: createMenuItem,
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      showToast(`Đã thêm "${item.name}"`, 'success');
      setModalOpen(false);
    },
    onError: () => showToast('Không thể tạo món mới', 'error'),
  });

  const { mutate: doUpdateItem, isPending: updateItemPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateMenuItem>[1] }) =>
      updateMenuItem(id, data),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      showToast(`Đã cập nhật "${item.name}"`, 'success');
      setModalOpen(false);
    },
    onError: () => showToast('Không thể cập nhật món', 'error'),
  });

  const { mutate: doCreateCat } = useMutation({
    mutationFn: (name: string) => createCategory({ name }),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast(`Đã thêm danh mục "${cat.name}"`);
      setNewCatName('');
    },
    onError: () => showToast('Không thể tạo danh mục', 'error'),
  });

  const { mutate: doUpdateCat } = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateCategory(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast('Đã cập nhật danh mục');
      setEditingCatId(null);
    },
    onError: () => showToast('Không thể cập nhật danh mục', 'error'),
  });

  const { mutate: doDeleteCat } = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      const hidden = result?.hiddenItemsCount ?? 0;
      showToast(`Đã ẩn danh mục${hidden > 0 ? ` và ${hidden} món` : ''}`);
    },
    onError: () => showToast('Không thể ẩn danh mục', 'error'),
  });

  const { mutate: doRestoreCat } = useMutation({
    mutationFn: (id: string) => restoreCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast('Đã khôi phục danh mục');
    },
    onError: () => showToast('Không thể khôi phục danh mục', 'error'),
  });

  const { mutate: doDeleteItem } = useMutation({
    mutationFn: (id: string) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      showToast('Đã ẩn món');
    },
    onError: () => showToast('Không thể ẩn món', 'error'),
  });

  const { mutate: doRestoreItem } = useMutation({
    mutationFn: (id: string) => restoreMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      showToast('Đã hiện lại món');
    },
    onError: () => showToast('Không thể khôi phục món', 'error'),
  });

  // ── Filtered items ────────────────────────────────────────────────────────
  const filtered = menuItems.filter((item) => {
    if (filterCat !== 'all' && item.categoryId !== filterCat) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleStatusChange = (item: ApiMenuItem, action: 'toggle_sold' | 'restore' | 'hide' | 'soft_delete' | 'restore_item') => {
    if (action === 'soft_delete') { doDeleteItem(item.id); return; }
    if (action === 'restore_item') { doRestoreItem(item.id); return; }
    let newStatus: ItemStatus;
    if (action === 'toggle_sold') newStatus = item.status === 'SOLD_OUT' ? 'ACTIVE' : 'SOLD_OUT';
    else if (action === 'restore') newStatus = 'ACTIVE';
    else newStatus = 'HIDDEN';
    doUpdateItemStatus({ id: item.id, status: newStatus });
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...BLANK_FORM, categoryId: categories[0]?.id ?? '' });
    setPreviewUrl('');
    setUploadProgress('idle');
    setModalOpen(true);
  };

  const openEditModal = (item: ApiMenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      categoryId: item.categoryId,
      price: String(item.price),
      shortDescription: item.shortDescription ?? '',
      imageUrl: item.imageUrl ?? '',
      tags: [...item.tags],
      status: item.status,
    });
    setPreviewUrl(item.imageUrl ?? '');
    setUploadProgress(item.imageUrl ? 'done' : 'idle');
    setModalOpen(true);
  };

  const handleModalSubmit = () => {
    if (!form.name.trim()) { showToast('Vui lòng nhập tên món', 'error'); return; }
    if (!form.categoryId) { showToast('Vui lòng chọn danh mục', 'error'); return; }
    const price = Number(form.price);
    if (!price || price <= 0) { showToast('Vui lòng nhập giá hợp lệ', 'error'); return; }

    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      price,
      shortDescription: form.shortDescription.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
      tags: form.tags,
    };

    if (editingId) {
      doUpdateItem({ id: editingId, data: payload });
    } else {
      doCreateItem(payload);
    }
  };

  // ── Upload handlers ───────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ảnh phải nhỏ hơn 5MB', 'error');
      return;
    }
    // Preview local tức thì
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploadProgress('uploading');
    try {
      const result = await uploadMenuImage(file);
      setForm((f) => ({ ...f, imageUrl: result.url }));
      setPreviewUrl(result.url);
      setUploadProgress('done');
    } catch {
      showToast('Upload ảnh thất bại', 'error');
      setUploadProgress('error');
      setPreviewUrl('');
    }
  }, [showToast]);

  const handleDropZone = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const toggleTag = (tag: string) => setForm((f) => ({
    ...f,
    tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
  }));

  const statusBadge = (status: ItemStatus) => {
    if (status === 'ACTIVE') return <span className="qa-btn qa-btn--active" style={{ pointerEvents: 'none' }}>Đang bán</span>;
    if (status === 'SOLD_OUT') return <span className="qa-btn qa-btn--soldout" style={{ pointerEvents: 'none' }}>Tạm hết</span>;
    return <span className="qa-btn" style={{ pointerEvents: 'none', opacity: 0.5 }}>Đã ẩn</span>;
  };

  const isLoading = catsLoading || itemsLoading;
  const isSaving = createItemPending || updateItemPending;

  return (
    <div>
      <div className="admin-topbar">
        <span className="admin-topbar__title">Quản lý thực đơn</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 14px', minHeight: 36 }} onClick={() => setCatPanelOpen(true)}>
            🗂 Danh mục
          </button>
          <button className="btn btn-primary" style={{ fontSize: 13, padding: '6px 14px', minHeight: 36 }} onClick={openAddModal}>
            + Thêm món mới
          </button>
        </div>
      </div>

      <div className="admin-content">
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-soy)' }}>Đang tải...</div>
        ) : (
          <>
            {/* Search */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Tìm tên món..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--color-steam)', fontSize: 14, background: 'var(--color-white)', minWidth: 200, outline: 'none', fontFamily: 'var(--font-primary)' }}
              />
            </div>

            {/* Category chips */}
            <div className="filter-chips">
              <button className={`filter-chip ${filterCat === 'all' ? 'filter-chip--active' : ''}`} onClick={() => setFilterCat('all')}>Tất cả</button>
              {categories.map((cat) => (
                <button key={cat.id} className={`filter-chip ${filterCat === cat.id ? 'filter-chip--active' : ''}`} onClick={() => setFilterCat(cat.id)}>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Status chips */}
            <div className="filter-chips" style={{ marginBottom: 24 }}>
              {(['all', 'ACTIVE', 'SOLD_OUT', 'HIDDEN'] as const).map((s) => (
                <button key={s} className={`filter-chip ${filterStatus === s ? 'filter-chip--active' : ''}`} onClick={() => setFilterStatus(s)}>
                  {s === 'all' ? 'Mọi trạng thái' : s === 'ACTIVE' ? 'Đang bán' : s === 'SOLD_OUT' ? 'Tạm hết' : 'Đã ẩn'}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="admin-table-wrapper">
              <div className="admin-table-header">
                <span className="admin-table-title">Danh sách món ({filtered.length})</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ảnh</th><th>Tên món</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th><th>Thao tác nhanh</th><th>Sửa</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-soy)' }}>Không có món nào phù hợp bộ lọc</td></tr>
                  ) : (
                    filtered.map((item) => {
                      const cat = categories.find((c) => c.id === item.categoryId);
                      return (
                        <tr key={item.id}>
                          <td>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} style={{ width: 48, height: 48, borderRadius: 'var(--radius-xs)', objectFit: 'cover', display: 'block' }}
                                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
                            ) : (
                              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-xs)', background: 'var(--color-steam)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽</div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-soy)', marginTop: 2 }}>{item.shortDescription}</div>
                            {item.tags.length > 0 && (
                              <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {item.tags.map((t) => <span key={t} style={{ fontSize: 10, background: 'var(--color-steam)', borderRadius: 4, padding: '1px 6px', color: 'var(--color-soy)' }}>{ALL_TAGS.find((x) => x.value === t)?.label ?? t}</span>)}
                              </div>
                            )}
                          </td>
                          <td style={{ color: 'var(--color-soy)', fontSize: 13 }}>{cat?.name ?? '—'}</td>
                          <td><span style={{ fontFamily: 'var(--font-accent)', fontWeight: 600, fontSize: 14 }}>{formatPrice(item.price)}</span></td>
                          <td>{statusBadge(item.status)}</td>
                          <td>
                            <div className="quick-actions">
                              {item.status === 'ACTIVE' && <button className="qa-btn qa-btn--danger" disabled={statusPending} onClick={() => handleStatusChange(item, 'toggle_sold')}>Tạm hết</button>}
                              {item.status === 'SOLD_OUT' && <button className="qa-btn" style={{ borderColor: 'var(--color-leaf)', color: 'var(--color-leaf)' }} disabled={statusPending} onClick={() => handleStatusChange(item, 'restore')}>Bán lại</button>}
                              {item.status === 'ACTIVE' && <button className="qa-btn" disabled={statusPending} onClick={() => handleStatusChange(item, 'hide')}>Ẩn</button>}
                              {(item.status === 'ACTIVE' || item.status === 'SOLD_OUT') && (
                                <button className="qa-btn qa-btn--danger" disabled={statusPending}
                                  onClick={() => { if (window.confirm(`Ẩn mềm "${item.name}"? Có thể khôi phục sau.`)) handleStatusChange(item, 'soft_delete'); }}
                                  title="Xóa mềm — ẩn khỏi menu, giữ lại lịch sử">
                                  Xóa
                                </button>
                              )}
                              {item.status === 'HIDDEN' && <button className="qa-btn" style={{ borderColor: 'var(--color-leaf)', color: 'var(--color-leaf)' }} disabled={statusPending} onClick={() => handleStatusChange(item, 'restore_item')}>Hiện lại</button>}
                            </div>
                          </td>
                          <td>
                            <button className="qa-btn" style={{ borderColor: 'var(--color-turmeric)', color: 'var(--color-turmeric)' }} onClick={() => openEditModal(item)}>✏️ Sửa</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Add/Edit Item Modal ────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingId ? '✏️ Chỉnh sửa món' : '+ Thêm món mới'}</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tên món <span style={{ color: 'var(--color-chili)' }}>*</span></label>
                <input className="form-input" placeholder="VD: Bún bò Huế đặc biệt" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Danh mục <span style={{ color: 'var(--color-chili)' }}>*</span></label>
                  <select className="form-input" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái</label>
                  <select className="form-input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ItemStatus }))}>
                    <option value="ACTIVE">Đang bán</option>
                    <option value="SOLD_OUT">Tạm hết</option>
                    <option value="HIDDEN">Ẩn</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Giá (VND) <span style={{ color: 'var(--color-chili)' }}>*</span></label>
                <input className="form-input" type="number" min={0} step={1000} placeholder="VD: 65000" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả ngắn</label>
                <textarea className="form-input" rows={2} placeholder="VD: Bún bò Huế đậm đà..." value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Ảnh món ăn</label>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDropZone}
                  onClick={() => uploadProgress !== 'uploading' && fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragOver ? 'var(--color-chili)' : 'var(--color-steam)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                    cursor: uploadProgress === 'uploading' ? 'wait' : 'pointer',
                    background: isDragOver ? 'rgba(216,58,46,0.04)' : 'var(--color-cotton)',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    minHeight: 82,
                  }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--color-steam)' }}
                    />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--color-steam)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🖼️</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {uploadProgress === 'uploading' ? (
                      <div style={{ fontSize: 13, color: 'var(--color-turmeric)', fontWeight: 600 }}>⏳ Đang tải ảnh lên...</div>
                    ) : uploadProgress === 'done' ? (
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--color-leaf)', fontWeight: 600 }}>✅ Ảnh đã sẵn sàng</div>
                        <div style={{ fontSize: 11, color: 'var(--color-soy)', marginTop: 2 }}>Bấm để thay ảnh khác</div>
                      </div>
                    ) : uploadProgress === 'error' ? (
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--color-chili)', fontWeight: 600 }}>❌ Upload thất bại</div>
                        <div style={{ fontSize: 11, color: 'var(--color-soy)', marginTop: 2 }}>Thử lại hoặc nhập URL bên dưới</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-charcoal)' }}>Kéo &amp; thả ảnh vào đây</div>
                        <div style={{ fontSize: 11, color: 'var(--color-soy)', marginTop: 3 }}>hoặc bấm để chọn file · JPG, PNG, WEBP · tối đa 5MB</div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                      e.target.value = '';
                    }}
                  />
                </div>

                {/* Fallback: URL thủ công */}
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-soy)', whiteSpace: 'nowrap' }}>Hoặc URL:</span>
                  <input
                    className="form-input"
                    style={{ fontSize: 12, padding: '6px 10px', flex: 1 }}
                    placeholder="https://example.com/image.jpg"
                    value={form.imageUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => ({ ...f, imageUrl: val }));
                      setPreviewUrl(val);
                      setUploadProgress(val ? 'done' : 'idle');
                    }}
                  />
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => { setForm((f) => ({ ...f, imageUrl: '' })); setPreviewUrl(''); setUploadProgress('idle'); }}
                      style={{ fontSize: 18, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-soy)', padding: '0 2px', flexShrink: 0 }}
                      title="Xóa ảnh"
                    >×</button>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {ALL_TAGS.map((t) => (
                    <button key={t.value} type="button" onClick={() => toggleTag(t.value)} style={{ padding: '5px 12px', borderRadius: 'var(--radius-pill)', fontSize: 13, cursor: 'pointer', border: `1.5px solid ${form.tags.includes(t.value) ? 'var(--color-chili)' : 'var(--color-steam)'}`, background: form.tags.includes(t.value) ? 'rgba(216,58,46,0.08)' : 'transparent', color: form.tags.includes(t.value) ? 'var(--color-chili)' : 'var(--color-soy)', fontWeight: form.tags.includes(t.value) ? 600 : 400, fontFamily: 'var(--font-primary)' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" disabled={isSaving} onClick={handleModalSubmit}>
                {isSaving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm món'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Panel ─────────────────────────────────────────────────── */}
      {catPanelOpen && (
        <div className="modal-backdrop" onClick={() => setCatPanelOpen(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🗂 Quản lý danh mục</span>
              <button className="modal-close" onClick={() => setCatPanelOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20 }}>
                {categories.map((cat) => {
                  const itemCount = menuItems.filter((m) => m.categoryId === cat.id).length;
                  return (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-steam)' }}>
                      {editingCatId === cat.id ? (
                        <>
                          <input className="form-input" style={{ flex: 1 }} value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') doUpdateCat({ id: cat.id, name: editingCatName.trim() });
                              if (e.key === 'Escape') setEditingCatId(null);
                            }}
                          />
                          <button className="qa-btn" style={{ borderColor: 'var(--color-leaf)', color: 'var(--color-leaf)' }} onClick={() => doUpdateCat({ id: cat.id, name: editingCatName.trim() })}>✓</button>
                          <button className="qa-btn" onClick={() => setEditingCatId(null)}>✕</button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{cat.name}</span>
                          <span style={{ fontSize: 12, color: 'var(--color-soy)' }}>{itemCount} món</span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: cat.status === 'INACTIVE' ? 'rgba(156,163,175,0.15)' : 'rgba(34,197,94,0.1)', color: cat.status === 'INACTIVE' ? '#6b7280' : '#166534', fontWeight: 600 }}>
                            {cat.status === 'INACTIVE' ? 'Ẩn' : 'Hiện'}
                          </span>
                          <button className="qa-btn" style={{ borderColor: 'var(--color-turmeric)', color: 'var(--color-turmeric)' }}
                            onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}>✏️</button>
                          {cat.status !== 'INACTIVE' ? (
                            <button className="qa-btn qa-btn--danger" title="Ẩn danh mục và toàn bộ món"
                              onClick={() => { if (window.confirm(`Ẩn danh mục "${cat.name}" và ${itemCount} món con?`)) doDeleteCat(cat.id); }}>
                              Ẩn
                            </button>
                          ) : (
                            <button className="qa-btn" style={{ borderColor: 'var(--color-leaf)', color: 'var(--color-leaf)' }}
                              onClick={() => doRestoreCat(cat.id)}>
                              Khôi phục
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="form-group">
                <label className="form-label">Thêm danh mục mới</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" style={{ flex: 1 }} placeholder="VD: Đặc sản địa phương" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && newCatName.trim()) doCreateCat(newCatName.trim()); }}
                  />
                  <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => { if (!newCatName.trim()) return; doCreateCat(newCatName.trim()); }}>+ Thêm</button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setCatPanelOpen(false)}>Xong</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
