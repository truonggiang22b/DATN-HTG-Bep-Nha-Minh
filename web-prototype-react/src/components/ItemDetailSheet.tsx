import { useState, useCallback, useEffect } from 'react';
import type { ApiMenuItem, SelectedOption } from '../types';
import { useCart } from '../hooks/useClientSession';
import { formatPrice, getTagBadge } from './Toast';
import '../styles/customer.css';

interface ItemDetailSheetProps {
  item: ApiMenuItem | null;
  open: boolean;
  onClose: () => void;
  onAdded: (name: string) => void;
}

export const ItemDetailSheet = ({ item, open, onClose, onAdded }: ItemDetailSheetProps) => {
  const { addToCart } = useCart();
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [note, setNote] = useState('');
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset state whenever sheet opens or a different item is shown
  useEffect(() => {
    if (open && item) {
      setSelectedOptions([]);
      setNote('');
      setQty(1);
      setImgError(false);
      setValidationError(null);
    }
  }, [open, item?.id]);

  // Also clear error whenever user picks a new option
  const handleOptionSelect = useCallback((
    groupId: string, groupName: string,
    optId: string, optName: string, priceDelta: number,
    isMulti: boolean
  ) => {
    setValidationError(null);
    setSelectedOptions((prev) => {
      if (isMulti) {
        const exists = prev.find((o) => o.optionId === optId);
        return exists
          ? prev.filter((o) => o.optionId !== optId)
          : [...prev, { optionGroupId: groupId, optionGroupName: groupName, optionId: optId, optionName: optName, priceDelta }];
      } else {
        const withoutGroup = prev.filter((o) => o.optionGroupId !== groupId);
        return [...withoutGroup, { optionGroupId: groupId, optionGroupName: groupName, optionId: optId, optionName: optName, priceDelta }];
      }
    });
  }, []);

  const handleAdd = () => {
    if (!item) return;

    // Validate required option groups
    for (const group of item.optionGroups) {
      if (group.isRequired) {
        const picked = selectedOptions.filter((o) => o.optionGroupId === group.id);
        if (picked.length < group.minSelect) {
          setValidationError(`Vui lòng chọn "${group.name}" trước khi thêm vào giỏ`);
          // Scroll to top of sheet content
          document.querySelector('.item-sheet__content')?.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    // Snapshot current selections before any state change
    const optionsSnapshot = [...selectedOptions];
    const noteSnapshot = note;
    const qtySnapshot = qty;

    // Add to cart first, then close
    addToCart(item.id, item.name, item.price, item.imageUrl ?? '', qtySnapshot, optionsSnapshot, noteSnapshot);
    onAdded(item.name);
    onClose();
  };

  const optionsDelta = selectedOptions.reduce((s, o) => s + o.priceDelta, 0);
  const totalPrice = item ? (item.price + optionsDelta) * qty : 0;

  if (!open || !item) return null;

  return (
    <>
      <div className="item-sheet-backdrop" onClick={onClose} />
      <div className="item-sheet">
        <button className="item-sheet__close" onClick={onClose}>✕</button>
        {!imgError ? (
          <img
            className="item-sheet__img"
            src={item.imageUrl}
            alt={item.name}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="item-sheet__img img-placeholder">🍜</div>
        )}
        <div className="item-sheet__content">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            {item.tags.map((tag) => {
              const b = getTagBadge(tag);
              return b ? <span key={tag} className={b.cls}>{b.label}</span> : null;
            })}
            {item.status === 'SOLD_OUT' && <span className="badge badge-sold-out">Tạm hết</span>}
          </div>
          <div className="item-sheet__name">{item.name}</div>
          <div className="item-sheet__price">{formatPrice(item.price)}</div>
          <div className="item-sheet__desc">{item.shortDescription}</div>

          {/* Option groups */}
          {item.status === 'ACTIVE' && item.optionGroups.length > 0 && (
            <div>
              {/* Validation error banner */}
              {validationError && (
                <div style={{
                  background: 'rgba(216,58,46,0.08)',
                  border: '1px solid var(--color-chili)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  marginBottom: 12,
                  fontSize: 13,
                  color: 'var(--color-chili)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  ⚠️ {validationError}
                </div>
              )}
              {item.optionGroups.map((group) => (
                <div key={group.id} className="item-sheet__option-group">
                  <div className="item-sheet__option-group-title">
                    {group.name}
                    {group.isRequired && <span style={{ color: 'var(--color-chili)', marginLeft: '4px' }}>*</span>}
                    {group.isRequired && (
                      <span style={{ fontSize: 11, color: 'var(--color-soy)', marginLeft: 6, fontWeight: 400 }}>(bắt buộc)</span>
                    )}
                  </div>
                  <div className="option-chip-group">
                    {group.options.map((opt) => {
                      const isSelected = selectedOptions.some((o) => o.optionId === opt.id);
                      return (
                        <button
                          key={opt.id}
                          className={`option-chip ${isSelected ? 'option-chip--selected' : ''}`}
                          onClick={() => handleOptionSelect(
                            group.id, group.name,
                            opt.id, opt.name, opt.priceDelta,
                            group.maxSelect > 1
                          )}
                        >
                          {opt.name}
                          {opt.priceDelta > 0 && ` +${formatPrice(opt.priceDelta)}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Note */}
          {item.status === 'ACTIVE' && (
            <>
              <label className="item-sheet__note-label">Ghi chú (tuỳ chọn)</label>
              <textarea
                className="input-field"
                placeholder="vd: không hành, ít cay..."
                maxLength={200}
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ resize: 'none' }}
              />
            </>
          )}
        </div>

        {/* Footer — always visible at bottom, outside scroll area */}
        <div className="item-sheet__footer">
          {item.status === 'ACTIVE' ? (
            <>
              <div className="qty-stepper">
                <button className="qty-stepper__btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span className="qty-stepper__value">{qty}</span>
                <button className="qty-stepper__btn" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>
                Thêm vào giỏ — <span className="font-accent">{formatPrice(totalPrice)}</span>
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-full" disabled>
              Tạm hết — Không thể đặt
            </button>
          )}
        </div>
      </div>
    </>
  );
};
