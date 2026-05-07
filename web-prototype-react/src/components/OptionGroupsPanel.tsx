/**
 * OptionGroupsPanel.tsx
 * Quản lý nhóm phân loại (MenuOptionGroup) và các lựa chọn (MenuOption)
 * cho một MenuItem trong Admin UI.
 * 
 * Features:
 * - Hiển thị danh sách groups (accordion có thể collapse)
 * - Thêm/sửa/xóa group inline (không mở modal riêng)
 * - Thêm/sửa/xóa option inline trong từng group
 * - Confirm dialog trước khi xóa group
 * - Optimistic UI với React Query
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatPrice } from './Toast';
import {
  getOptionGroups,
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOption,
  updateOption,
  deleteOption,
  type ApiMenuOptionGroup,
  type ApiMenuOption,
} from '../services/internalApi';

// ── Sub-component: OptionRow ─────────────────────────────────────────────────

const OptionRow = ({
  option,
  onUpdate,
  onDelete,
}: {
  option: ApiMenuOption;
  onUpdate: (data: { name?: string; priceDelta?: number; isActive?: boolean }) => void;
  onDelete: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(option.name);
  const [priceDelta, setPriceDelta] = useState(String(option.priceDelta));

  const handleSave = () => {
    const delta = Number(priceDelta);
    if (!name.trim()) return;
    onUpdate({ name: name.trim(), priceDelta: isNaN(delta) ? 0 : delta });
    setEditing(false);
  };

  const handleCancel = () => {
    setName(option.name);
    setPriceDelta(String(option.priceDelta));
    setEditing(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderRadius: 8,
        background: option.isActive ? 'var(--color-cotton)' : 'rgba(0,0,0,0.04)',
        marginBottom: 6,
        opacity: option.isActive ? 1 : 0.55,
      }}
    >
      {/* Active toggle dot */}
      <button
        title={option.isActive ? 'Đang hiện — bấm để ẩn lựa chọn này' : 'Đang ẩn — bấm để hiện lại'}
        onClick={() => onUpdate({ isActive: !option.isActive })}
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: option.isActive ? 'var(--color-leaf)' : '#d1d5db',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          padding: 0,
        }}
      />

      {editing ? (
        <>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            placeholder="Tên lựa chọn"
            style={{ flex: 1, padding: '4px 8px', fontSize: 13, border: '1.5px solid var(--color-turmeric)', borderRadius: 6, fontFamily: 'var(--font-primary)', outline: 'none' }}
          />
          <input
            value={priceDelta}
            onChange={(e) => setPriceDelta(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            placeholder="±Giá"
            type="number"
            step={1000}
            style={{ width: 90, padding: '4px 8px', fontSize: 13, border: '1.5px solid var(--color-turmeric)', borderRadius: 6, fontFamily: 'var(--font-primary)', outline: 'none' }}
          />
          <button onClick={handleSave} style={btnStyle('var(--color-leaf)')}>✓</button>
          <button onClick={handleCancel} style={btnStyle('var(--color-soy)')}>✕</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{option.name}</span>
          <span style={{ fontSize: 12, color: option.priceDelta > 0 ? 'var(--color-turmeric)' : option.priceDelta < 0 ? 'var(--color-chili)' : 'var(--color-soy)', fontWeight: 600, minWidth: 70, textAlign: 'right' }}>
            {option.priceDelta === 0 ? 'Giá gốc' : (option.priceDelta > 0 ? '+' : '') + formatPrice(option.priceDelta)}
          </span>
          <button onClick={() => setEditing(true)} style={btnStyle('var(--color-turmeric)')} title="Sửa">✏️</button>
          <button
            onClick={() => {
              if (window.confirm(`Xóa lựa chọn "${option.name}"?`)) onDelete();
            }}
            style={btnStyle('var(--color-chili)')}
            title="Xóa"
          >✕</button>
        </>
      )}
    </div>
  );
};

// ── Sub-component: GroupBlock ────────────────────────────────────────────────

const GroupBlock = ({
  group,
  menuItemId,
  onGroupUpdated,
  onGroupDeleted,
}: {
  group: ApiMenuOptionGroup;
  menuItemId: string;
  onGroupUpdated: () => void;
  onGroupDeleted: () => void;
}) => {
  const queryClient = useQueryClient();
  const qk = ['optionGroups', menuItemId];

  const [collapsed, setCollapsed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [isRequired, setIsRequired] = useState(group.isRequired);

  // New option form
  const [addingOption, setAddingOption] = useState(false);
  const [newOptName, setNewOptName] = useState('');
  const [newOptPrice, setNewOptPrice] = useState('0');

  const { mutate: doUpdateGroup } = useMutation({
    mutationFn: (data: Parameters<typeof updateOptionGroup>[1]) => updateOptionGroup(group.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk }); setEditingName(false); onGroupUpdated(); },
  });

  const { mutate: doDeleteGroup, isPending: deletingGroup } = useMutation({
    mutationFn: () => deleteOptionGroup(group.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk }); onGroupDeleted(); },
  });

  const { mutate: doCreateOption } = useMutation({
    mutationFn: (data: { name: string; priceDelta: number }) =>
      createOption(group.id, { ...data, sortOrder: group.options.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk });
      setNewOptName('');
      setNewOptPrice('0');
      setAddingOption(false);
    },
  });

  const { mutate: doUpdateOption } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateOption>[1] }) =>
      updateOption(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const { mutate: doDeleteOption } = useMutation({
    mutationFn: (optionId: string) => deleteOption(optionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const handleSaveGroupName = () => {
    if (!groupName.trim()) return;
    doUpdateGroup({ name: groupName.trim(), isRequired });
  };

  return (
    <div
      style={{
        border: '1.5px solid var(--color-steam)',
        borderRadius: 10,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      {/* Group header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          background: isRequired ? 'rgba(216,58,46,0.04)' : 'var(--color-cotton)',
          borderBottom: collapsed ? 'none' : '1px solid var(--color-steam)',
          cursor: 'pointer',
        }}
        onClick={() => !editingName && setCollapsed((c) => !c)}
      >
        <span style={{ fontSize: 13, color: 'var(--color-soy)', marginRight: 2 }}>
          {collapsed ? '▶' : '▼'}
        </span>

        {editingName ? (
          <>
            <input
              autoFocus
              value={groupName}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveGroupName(); if (e.key === 'Escape') { setGroupName(group.name); setEditingName(false); } }}
              style={{ flex: 1, padding: '4px 8px', fontSize: 13, fontWeight: 600, border: '1.5px solid var(--color-turmeric)', borderRadius: 6, fontFamily: 'var(--font-primary)', outline: 'none' }}
            />
            <label
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Bắt buộc
            </label>
            <button
              onClick={(e) => { e.stopPropagation(); handleSaveGroupName(); }}
              style={btnStyle('var(--color-leaf)')}
            >✓</button>
            <button
              onClick={(e) => { e.stopPropagation(); setGroupName(group.name); setIsRequired(group.isRequired); setEditingName(false); }}
              style={btnStyle('var(--color-soy)')}
            >✕</button>
          </>
        ) : (
          <>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{group.name}</span>
            {group.isRequired && (
              <span style={{ fontSize: 11, background: 'rgba(216,58,46,0.1)', color: 'var(--color-chili)', borderRadius: 6, padding: '2px 7px', fontWeight: 600 }}>
                Bắt buộc
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--color-soy)' }}>{group.options.length} lựa chọn</span>
            <button
              onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
              style={btnStyle('var(--color-turmeric)')}
              title="Đổi tên nhóm"
            >✏️</button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(
                  `⚠️ Xóa nhóm phân loại "${group.name}" và TẤT CẢ ${group.options.length} lựa chọn bên trong?\n\nCác đơn hàng cũ đã đặt vẫn lưu đầy đủ lịch sử, không bị ảnh hưởng.`
                )) {
                  doDeleteGroup();
                }
              }}
              disabled={deletingGroup}
              style={btnStyle('var(--color-chili)')}
              title="Xóa nhóm này và toàn bộ lựa chọn"
            >🗑</button>
          </>
        )}
      </div>

      {/* Options list */}
      {!collapsed && (
        <div style={{ padding: '10px 12px' }}>
          {group.options.length === 0 && !addingOption && (
            <div style={{ fontSize: 12, color: 'var(--color-soy)', textAlign: 'center', padding: '8px 0' }}>
              Chưa có lựa chọn nào — bấm "+ Thêm" bên dưới
            </div>
          )}

          {group.options.map((opt) => (
            <OptionRow
              key={opt.id}
              option={opt}
              onUpdate={(data) => doUpdateOption({ id: opt.id, data })}
              onDelete={() => doDeleteOption(opt.id)}
            />
          ))}

          {/* Add option form */}
          {addingOption ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <input
                autoFocus
                value={newOptName}
                onChange={(e) => setNewOptName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newOptName.trim()) {
                    doCreateOption({ name: newOptName.trim(), priceDelta: Number(newOptPrice) || 0 });
                  }
                  if (e.key === 'Escape') { setAddingOption(false); setNewOptName(''); setNewOptPrice('0'); }
                }}
                placeholder="Tên lựa chọn (VD: 10 chiếc)"
                style={{ flex: 1, padding: '6px 10px', fontSize: 13, border: '1.5px solid var(--color-turmeric)', borderRadius: 6, fontFamily: 'var(--font-primary)', outline: 'none' }}
              />
              <input
                value={newOptPrice}
                onChange={(e) => setNewOptPrice(e.target.value)}
                type="number"
                step={1000}
                placeholder="Thêm giá"
                title="Giá thêm so với giá gốc (0 = giá gốc, 30000 = +30,000đ)"
                style={{ width: 100, padding: '6px 10px', fontSize: 13, border: '1.5px solid var(--color-turmeric)', borderRadius: 6, fontFamily: 'var(--font-primary)', outline: 'none' }}
              />
              <button
                onClick={() => {
                  if (!newOptName.trim()) return;
                  doCreateOption({ name: newOptName.trim(), priceDelta: Number(newOptPrice) || 0 });
                }}
                style={{ ...btnStyle('var(--color-leaf)'), padding: '6px 12px', fontSize: 13 }}
              >
                ✓ Thêm
              </button>
              <button
                onClick={() => { setAddingOption(false); setNewOptName(''); setNewOptPrice('0'); }}
                style={{ ...btnStyle('var(--color-soy)'), padding: '6px 10px' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingOption(true)}
              style={{ marginTop: 8, fontSize: 12, color: 'var(--color-turmeric)', background: 'none', border: '1.5px dashed var(--color-turmeric)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-primary)', width: '100%' }}
            >
              + Thêm lựa chọn
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Component: OptionGroupsPanel ────────────────────────────────────────

interface OptionGroupsPanelProps {
  menuItemId: string;
  menuItemName: string;
}

export const OptionGroupsPanel = ({ menuItemId, menuItemName }: OptionGroupsPanelProps) => {
  const queryClient = useQueryClient();
  const qk = ['optionGroups', menuItemId];
  const { showToast } = (window as any).__bnmStore ?? { showToast: () => {} };

  const { data: groups = [], isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => getOptionGroups(menuItemId),
    staleTime: 10_000,
  });

  // New group form
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRequired, setNewGroupRequired] = useState(false);

  const { mutate: doCreateGroup, isPending: creating } = useMutation({
    mutationFn: () =>
      createOptionGroup(menuItemId, {
        name: newGroupName.trim(),
        isRequired: newGroupRequired,
        sortOrder: groups.length,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk });
      setNewGroupName('');
      setNewGroupRequired(false);
      setAddingGroup(false);
    },
    onError: () => showToast?.('Không thể tạo nhóm phân loại', 'error'),
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Phân loại của "{menuItemName}"</div>
          <div style={{ fontSize: 12, color: 'var(--color-soy)', marginTop: 2 }}>
            Thêm nhóm như "Số lượng", "Topping",... và các lựa chọn trong mỗi nhóm
          </div>
        </div>
        {!addingGroup && (
          <button
            onClick={() => setAddingGroup(true)}
            style={{ padding: '7px 14px', fontSize: 13, background: 'var(--color-chili)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-primary)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            + Thêm nhóm
          </button>
        )}
      </div>

      {/* Add group form */}
      {addingGroup && (
        <div style={{ background: 'rgba(216,58,46,0.04)', border: '1.5px dashed var(--color-chili)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-chili)', marginBottom: 10 }}>Nhóm phân loại mới</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newGroupName.trim()) doCreateGroup(); if (e.key === 'Escape') setAddingGroup(false); }}
              placeholder='VD: Số lượng, Topping, Size,...'
              style={{ flex: 1, minWidth: 160, padding: '7px 10px', fontSize: 13, border: '1.5px solid var(--color-turmeric)', borderRadius: 6, fontFamily: 'var(--font-primary)', outline: 'none' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={newGroupRequired}
                onChange={(e) => setNewGroupRequired(e.target.checked)}
              />
              Bắt buộc chọn
            </label>
            <button
              disabled={creating || !newGroupName.trim()}
              onClick={() => doCreateGroup()}
              style={{ padding: '7px 16px', background: 'var(--color-chili)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-primary)', fontWeight: 600 }}
            >
              {creating ? '...' : '✓ Tạo nhóm'}
            </button>
            <button
              onClick={() => { setAddingGroup(false); setNewGroupName(''); setNewGroupRequired(false); }}
              style={{ padding: '7px 10px', background: 'none', color: 'var(--color-soy)', border: '1px solid var(--color-steam)', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-primary)' }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Groups list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-soy)', fontSize: 13 }}>Đang tải...</div>
      ) : groups.length === 0 && !addingGroup ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-soy)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Chưa có nhóm phân loại</div>
          <div style={{ fontSize: 12 }}>Bấm "+ Thêm nhóm" để tạo nhóm đầu tiên</div>
        </div>
      ) : (
        groups.map((group) => (
          <GroupBlock
            key={group.id}
            group={group}
            menuItemId={menuItemId}
            onGroupUpdated={() => queryClient.invalidateQueries({ queryKey: qk })}
            onGroupDeleted={() => queryClient.invalidateQueries({ queryKey: qk })}
          />
        ))
      )}

      {groups.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-soy)', background: 'var(--color-cotton)', borderRadius: 8, padding: '8px 12px' }}>
          💡 Khách hàng sẽ thấy các nhóm này khi click vào món. Nhóm "Bắt buộc" yêu cầu khách phải chọn trước khi thêm vào giỏ.
        </div>
      )}
    </div>
  );
};

// ── Shared button style helper ────────────────────────────────────────────────
function btnStyle(color: string): React.CSSProperties {
  return {
    padding: '4px 8px',
    fontSize: 12,
    border: `1.5px solid ${color}`,
    color,
    background: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'var(--font-primary)',
    flexShrink: 0,
    lineHeight: 1.4,
  };
}
