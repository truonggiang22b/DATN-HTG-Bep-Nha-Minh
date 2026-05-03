/**
 * ItemDetailModal.tsx
 * Modal hiển thị chi tiết món + chọn option (Phase 2 Online Order)
 * Sử dụng inline styles để đảm bảo CSS luôn được áp dụng đúng
 */
import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export type PublicOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type PublicOptionGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: PublicOption[];
};

export type PublicMenuItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  shortDescription?: string;
  status: string;
  optionGroups: PublicOptionGroup[];
};

type SelectedOptions = Record<string, string[]>;

interface Props {
  item: PublicMenuItem;
  onClose: () => void;
  onConfirm: (payload: {
    menuItemId: string;
    name: string;
    imageUrl?: string;
    basePrice: number;
    unitPrice: number;
    quantity: number;
    selectedOptions: { optionGroupId: string; optionId: string; name: string; priceDelta: number }[];
    note: string;
  }) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// ── Inline style objects ─────────────────────────────────────────────────────

const S: Record<string, CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(10,6,2,0.72)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sheet: {
    background: '#fff',
    width: '100%',
    maxWidth: 520,
    maxHeight: '90vh',
    borderRadius: '22px 22px 0 0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 -8px 48px rgba(0,0,0,0.28)',
    animation: 'idm-slide 0.32s cubic-bezier(0.22,0.61,0.36,1) both',
  },
  handle: {
    width: 40,
    height: 4,
    background: '#e0d8d0',
    borderRadius: 4,
    margin: '12px auto 8px',
    flexShrink: 0,
    zIndex: 5,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(8px)',
    fontSize: 15,
    color: '#555',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    lineHeight: 1,
    transition: 'transform 0.15s',
  },
  imgWrap: {
    width: '100%',
    height: 220,
    flexShrink: 0,
    overflow: 'hidden',
    background: '#f5ede0',
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 20px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    scrollbarWidth: 'none',
  },
  itemInfo: {
    paddingBottom: 16,
    borderBottom: '1.5px solid #f0e8dc',
  },
  itemName: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: '#18100a',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    fontFamily: "'Be Vietnam Pro','Sora','Inter',sans-serif",
  },
  itemDesc: {
    margin: '6px 0 0',
    fontSize: 13,
    color: '#a09080',
    lineHeight: 1.55,
  },
  basePrice: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 800,
    color: '#E94F37',
    fontFamily: "'Sora','Be Vietnam Pro',sans-serif",
    letterSpacing: '-0.02em',
  },
  group: {
    borderRadius: 14,
    border: '1.5px solid #ede5d8',
    overflow: 'hidden',
  },
  groupError: {
    border: '1.5px solid #E94F37',
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 16px',
    background: '#faf6f0',
    borderBottom: '1px solid #ede5d8',
  },
  groupName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#18100a',
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    padding: '3px 10px',
    borderRadius: 50,
    background: '#ede5d8',
    color: '#9a8878',
  },
  badgeReq: {
    background: '#ffe8e5',
    color: '#E94F37',
  },
  groupHint: {
    margin: 0,
    padding: '5px 16px',
    fontSize: 11,
    color: '#b5a898',
    background: '#faf6f0',
    borderBottom: '1px solid #ede5d8',
  },
  groupErr: {
    margin: 0,
    padding: '5px 16px',
    fontSize: 11,
    fontWeight: 600,
    color: '#E94F37',
    background: '#fff4f2',
  },
  optList: {
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#fff',
  },
  opt: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '13px 16px',
    border: 'none',
    borderTop: '1px solid #f5ede4',
    borderLeft: '3px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
    fontFamily: "'Be Vietnam Pro','Inter',sans-serif",
    transition: 'background 0.12s, border-color 0.12s',
  },
  optChosen: {
    background: '#fff4f1',
    borderLeft: '3px solid #E94F37',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '2px solid #cdc5ba',
    background: '#fff',
    flexShrink: 0,
    transition: 'border-color 0.15s, border-width 0.15s',
  },
  radioOn: {
    borderColor: '#E94F37',
    borderWidth: 7,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 7,
    border: '2px solid #cdc5ba',
    background: '#fff',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, border-color 0.15s',
  },
  checkOn: {
    background: '#E94F37',
    borderColor: '#E94F37',
    color: '#fff',
  },
  optName: {
    flex: 1,
    fontSize: 15,
    fontWeight: 500,
    color: '#18100a',
    lineHeight: 1.4,
  },
  optNameChosen: {
    fontWeight: 700,
  },
  optDelta: {
    fontSize: 14,
    fontWeight: 700,
    color: '#E94F37',
    whiteSpace: 'nowrap' as const,
    fontFamily: "'Sora',sans-serif",
  },
  noteSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#b5a898',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  noteInput: {
    width: '100%',
    border: '1.5px solid #ede5d8',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 14,
    fontFamily: "'Be Vietnam Pro','Inter',sans-serif",
    color: '#18100a',
    resize: 'none' as const,
    background: '#faf6f0',
    outline: 'none',
    lineHeight: 1.5,
    boxSizing: 'border-box' as const,
  },
  qtyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  qtyLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: '#18100a',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    background: '#f5ede4',
    borderRadius: 50,
    padding: 4,
    gap: 0,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: 'none',
    background: '#fff',
    color: '#E94F37',
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    transition: 'background 0.12s, transform 0.1s',
  },
  stepperVal: {
    minWidth: 44,
    textAlign: 'center' as const,
    fontSize: 18,
    fontWeight: 800,
    color: '#18100a',
    fontFamily: "'Sora','Be Vietnam Pro',sans-serif",
  },
  footer: {
    padding: '14px 20px 24px',
    background: '#fff',
    flexShrink: 0,
    borderTop: '1px solid #f0e8dc',
  },
  addBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderRadius: 50,
    border: 'none',
    background: 'linear-gradient(135deg,#f05a40 0%,#d63820 100%)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Be Vietnam Pro','Inter',sans-serif",
    letterSpacing: '0.01em',
    boxShadow: '0 6px 22px rgba(233,79,55,0.48)',
    transition: 'transform 0.12s, box-shadow 0.18s',
  },
  addBtnPrice: {
    fontSize: 16,
    fontWeight: 800,
    fontFamily: "'Sora','Be Vietnam Pro',sans-serif",
    letterSpacing: '-0.01em',
  },
};

// ── Component ────────────────────────────────────────────────────────────────

export function ItemDetailModal({ item, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<SelectedOptions>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [addBtnHover, setAddBtnHover] = useState(false);

  // Lock scroll khi modal mở
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Keyframe animation injection
  useEffect(() => {
    const id = 'idm-keyframes';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        @keyframes idm-slide {
          from { transform: translateY(100%); opacity: 0.5; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Tính giá
  const priceDeltaTotal = Object.entries(selected).reduce((sum, [, optIds]) => {
    optIds.forEach((optId) => {
      item.optionGroups.forEach((grp) => {
        const opt = grp.options.find((o) => o.id === optId);
        if (opt) sum += opt.priceDelta;
      });
    });
    return sum;
  }, 0);
  const unitPrice = item.price + priceDeltaTotal;
  const totalPrice = unitPrice * quantity;

  function toggleOption(group: PublicOptionGroup, optId: string) {
    setSelected((prev) => {
      const cur = prev[group.id] ?? [];
      if (group.maxSelect === 1) return { ...prev, [group.id]: [optId] };
      if (cur.includes(optId)) return { ...prev, [group.id]: cur.filter((id) => id !== optId) };
      if (cur.length >= group.maxSelect) return prev;
      return { ...prev, [group.id]: [...cur, optId] };
    });
    setErrors((e) => ({ ...e, [group.id]: false }));
  }

  function handleConfirm() {
    const newErrors: Record<string, boolean> = {};
    let valid = true;
    item.optionGroups.forEach((grp) => {
      const chosen = selected[grp.id] ?? [];
      if (grp.isRequired && chosen.length < grp.minSelect) {
        newErrors[grp.id] = true;
        valid = false;
      }
    });
    setErrors(newErrors);
    if (!valid) return;

    const selectedOptions: { optionGroupId: string; optionId: string; name: string; priceDelta: number }[] = [];
    Object.entries(selected).forEach(([groupId, optIds]) => {
      optIds.forEach((optId) => {
        const grp = item.optionGroups.find((g) => g.id === groupId);
        const opt = grp?.options.find((o) => o.id === optId);
        if (opt) selectedOptions.push({ optionGroupId: groupId, optionId: optId, name: opt.name, priceDelta: opt.priceDelta });
      });
    });

    onConfirm({ menuItemId: item.id, name: item.name, imageUrl: item.imageUrl, basePrice: item.price, unitPrice, quantity, selectedOptions, note });
  }

  return (
    <div style={S.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>

        {/* Close button — overlay lên ảnh */}
        <button style={S.closeBtn} onClick={onClose} aria-label="Đóng">✕</button>

        {/* Ảnh món — đặt trên cùng, không bị che */}
        {item.imageUrl ? (
          <div style={S.imgWrap}>
            {/* Handle overlay lên ảnh */}
            <div style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 40,
              height: 4,
              background: 'rgba(255,255,255,0.7)',
              borderRadius: 4,
              zIndex: 6,
            }} />
            <img
              src={item.imageUrl}
              alt={item.name}
              style={S.img}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          /* Không có ảnh: hiển thị handle bình thường */
          <div style={S.handle} />
        )}

        {/* Scrollable body */}
        <div style={S.body}>

          {/* Tên + giá gốc */}
          <div style={S.itemInfo}>
            <h2 style={S.itemName}>{item.name}</h2>
            {item.shortDescription && <p style={S.itemDesc}>{item.shortDescription}</p>}
            <div style={S.basePrice}>{fmt(item.price)}</div>
          </div>

          {/* Option groups */}
          {item.optionGroups.map((grp) => {
            const chosen = selected[grp.id] ?? [];
            const isRadio = grp.maxSelect === 1;
            const hasError = errors[grp.id];

            return (
              <div key={grp.id} style={{ ...S.group, ...(hasError ? S.groupError : {}) }}>
                {/* Header */}
                <div style={S.groupHeader}>
                  <span style={S.groupName}>{grp.name}</span>
                  <span style={{ ...S.badge, ...(grp.isRequired ? S.badgeReq : {}) }}>
                    {grp.isRequired ? 'Bắt buộc' : 'Tùy chọn'}
                  </span>
                </div>
                {!isRadio && grp.maxSelect > 1 && (
                  <p style={S.groupHint}>Chọn tối đa {grp.maxSelect}</p>
                )}
                {hasError && (
                  <p style={S.groupErr}>Vui lòng chọn ít nhất {grp.minSelect} lựa chọn</p>
                )}

                {/* Options */}
                <div style={S.optList}>
                  {grp.options.map((opt, idx) => {
                    const isChosen = chosen.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        style={{
                          ...S.opt,
                          ...(isChosen ? S.optChosen : {}),
                          borderTop: idx === 0 ? 'none' : '1px solid #f5ede4',
                        }}
                        onClick={() => toggleOption(grp, opt.id)}
                      >
                        {/* Indicator */}
                        {isRadio ? (
                          <div style={{ ...S.radio, ...(isChosen ? S.radioOn : {}) }} />
                        ) : (
                          <div style={{ ...S.check, ...(isChosen ? S.checkOn : {}) }}>
                            {isChosen && (
                              <svg width={12} height={10} viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 5 4.5 9 11 1" />
                              </svg>
                            )}
                          </div>
                        )}
                        <span style={{ ...S.optName, ...(isChosen ? S.optNameChosen : {}) }}>{opt.name}</span>
                        {opt.priceDelta !== 0 && (
                          <span style={S.optDelta}>
                            {opt.priceDelta > 0 ? '+' : ''}{fmt(opt.priceDelta)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Ghi chú */}
          <div style={S.noteSection}>
            <label style={S.noteLabel} htmlFor="idm-note">Ghi chú (tùy chọn)</label>
            <textarea
              id="idm-note"
              style={S.noteInput}
              placeholder="Ít cay, không hành, để riêng nước chấm..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Số lượng */}
          <div style={S.qtyRow}>
            <span style={S.qtyLabel}>Số lượng</span>
            <div style={S.stepper}>
              <button
                type="button"
                style={S.stepperBtn}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Giảm"
              >−</button>
              <span style={S.stepperVal}>{quantity}</span>
              <button
                type="button"
                style={S.stepperBtn}
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Tăng"
              >+</button>
            </div>
          </div>

        </div>{/* end body */}

        {/* Footer CTA */}
        <div style={S.footer}>
          <button
            type="button"
            id="btn-idm-add-to-cart"
            style={{
              ...S.addBtn,
              ...(addBtnHover ? { transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(233,79,55,0.6)' } : {}),
            }}
            onMouseEnter={() => setAddBtnHover(true)}
            onMouseLeave={() => setAddBtnHover(false)}
            onClick={handleConfirm}
          >
            <span>Thêm vào giỏ hàng</span>
            <span style={S.addBtnPrice}>{fmt(totalPrice)}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
