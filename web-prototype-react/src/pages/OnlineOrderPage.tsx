/**
 * OnlineOrderPage.tsx — Trang đặt hàng online 3 bước (Web-first redesign)
 * Layout: 3 cột desktop (category nav | menu | cart sidebar) / 1 cột mobile
 * Route: /order-online/menu
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getMenu } from '../services/publicApi';
import { onlineApi, type CreateOnlineOrderPayload } from '../services/onlineApi';
import { ItemDetailModal, type PublicMenuItem } from '../components/ItemDetailModal';
import { useOnlineCart } from '../store/useOnlineCart';
import { useGuestInfo } from '../store/useGuestInfo';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStore } from '../store/useStore';
import './OnlineOrderPage.css';

const BRANCH_ID = 'branch-bep-nha-minh-q1';

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// Format số không kèm đơn vị tiền tệ (để render đ riêng)
const fmtNum = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n);

// ── Step Indicator ─────────────────────────────────────────────────────────────

const STEPS = ['Chọn món', 'Thông tin giao hàng', 'Xác nhận'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="oop__stepbar">
      {STEPS.map((label, i) => (
        <div
          key={label}
          className={`oop__step-item${i === current ? ' oop__step-item--active' : i < current ? ' oop__step-item--done' : ''}`}
        >
          {/* Circle + connector row */}
          <div className="oop__step-row">
            {/* Left side: connector or empty spacer */}
            {i > 0
              ? <div className={`oop__step-connector${i <= current ? ' oop__step-connector--done' : ''}`} aria-hidden />
              : <div className="oop__step-connector-empty" aria-hidden />
            }
            <div className="oop__step-circle">
              {i < current ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : i + 1}
            </div>
            {/* Right side: connector or empty spacer */}
            {i < STEPS.length - 1
              ? <div className={`oop__step-connector${i < current ? ' oop__step-connector--done' : ''}`} aria-hidden />
              : <div className="oop__step-connector-empty" aria-hidden />
            }
          </div>
          {/* Label below, centered */}
          <span className="oop__step-label">{label}</span>
        </div>
      ))}
    </div>
  );
}


// ── Step 1: Menu ───────────────────────────────────────────────────────────────

type MenuItem = PublicMenuItem;

type Category = {
  id: string;
  name: string;
  items: MenuItem[];
};

function Step1Menu({ onNext }: { onNext: () => void }) {
  const { addItem, items, updateQuantity, getSubtotal, getTotalItems } = useOnlineCart();
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: menu, isLoading } = useQuery({
    queryKey: ['online-menu', BRANCH_ID],
    queryFn: () => getMenu(BRANCH_ID),
    staleTime: 5 * 60_000,
  });

  const categories: Category[] = menu?.categories ?? [];
  const currentCatId = activeCatId ?? categories[0]?.id ?? null;

  // Scroll tới category section khi click nav
  const scrollToCategory = (catId: string) => {
    setActiveCatId(catId);
    const el = document.getElementById(`cat-section-${catId}`);
    if (el) {
      const offset = 80; // header height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const cartQty = (menuItemId: string) =>
    items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0;
  const cartItem = (menuItemId: string) =>
    items.find((i) => i.menuItemId === menuItemId);

  function handleAdd(item: MenuItem) {
    // Nếu có option group → mở modal chọn trước
    if (item.optionGroups && item.optionGroups.length > 0) {
      setDetailItem(item);
      return;
    }
    // Không có option → add thẳng
    addItem({
      menuItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      basePrice: item.price,
      quantity: 1,
      selectedOptions: [],
      note: '',
      unitPrice: item.price,
    });
  }

  function handleModalConfirm(payload: {
    menuItemId: string;
    name: string;
    imageUrl?: string;
    basePrice: number;
    unitPrice: number;
    quantity: number;
    selectedOptions: { optionGroupId: string; optionId: string; name: string; priceDelta: number }[];
    note: string;
  }) {
    addItem({
      menuItemId: payload.menuItemId,
      name: payload.name,
      imageUrl: payload.imageUrl,
      basePrice: payload.basePrice,
      unitPrice: payload.unitPrice,
      quantity: payload.quantity,
      selectedOptions: payload.selectedOptions,
      note: payload.note,
    });
    setDetailItem(null);
  }

  if (isLoading) {
    return (
      <div className="oop__body">
        <div className="oop__loading" style={{ gridColumn: '1 / -1' }}>
          <div className="oop__spinner" />
          <p className="oop__loading-text">Đang tải thực đơn...</p>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const totalItems = getTotalItems();

  return (
    <div className="oop__body" ref={menuRef}>

      {/* ── COL 1: Category sidebar (desktop only) ── */}
      <aside className="oop__cat-nav" aria-label="Danh mục">
        <div className="oop__cat-nav-title">Thực đơn</div>
        {categories.map((cat) => {
          const activeCount = cat.items.filter(i => i.status === 'ACTIVE').length;
          return (
            <button
              key={cat.id}
              className={`oop__cat-nav-item${cat.id === currentCatId ? ' active' : ''}`}
              onClick={() => scrollToCategory(cat.id)}
              type="button"
            >
              {cat.name}
              <span className="oop__cat-nav-count">{activeCount}</span>
            </button>
          );
        })}
      </aside>

      {/* ── COL 2: Menu ── */}
      <main className="oop__menu-section">
        {/* Mobile: tab ngang */}
        <div className="oop__cat-tabs-mobile" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={cat.id === currentCatId}
              className={`oop__cat-tab-m${cat.id === currentCatId ? ' active' : ''}`}
              onClick={() => scrollToCategory(cat.id)}
              type="button"
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* All categories rendered (scroll) */}
        {categories.map((cat) => {
          const activeItems = cat.items.filter(i => i.status === 'ACTIVE');
          if (activeItems.length === 0) return null;
          return (
            <div key={cat.id} id={`cat-section-${cat.id}`} className="oop__cat-group">
              <h2 className="oop__cat-group-title">{cat.name}</h2>
              <div className="oop__menu-list">
                {activeItems.map((item) => {
                  const qty = cartQty(item.id);
                  const ci = cartItem(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`menu-card${item.status === 'SOLD_OUT' ? ' menu-card--soldout' : ''}`}
                      onClick={() => handleAdd(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd(item)}
                      aria-label={`Xem chi tiết ${item.name}`}
                    >
                      {/* Ảnh trên cùng */}
                      <div className="menu-card__img-wrap">
                        <img
                          src={item.imageUrl || '/placeholder-food.jpg'}
                          alt={item.name}
                          className="menu-card__img"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-food.jpg';
                          }}
                        />
                        {/* Nút + nổi trên góc phải ảnh */}
                        {qty === 0 ? (
                          <div className="menu-card__add-fab" aria-hidden>+</div>
                        ) : (
                          <div
                            className="menu-card__stepper-fab"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="fab-btn"
                              onClick={(e) => { e.stopPropagation(); updateQuantity(ci!.id, qty - 1); }}
                              type="button"
                              aria-label="Giảm"
                            >−</button>
                            <span className="fab-qty">{qty}</span>
                            <button
                              className="fab-btn"
                              onClick={(e) => { e.stopPropagation(); updateQuantity(ci!.id, qty + 1); }}
                              type="button"
                              aria-label="Tăng"
                            >+</button>
                          </div>
                        )}
                      </div>
                      {/* Text body bên dưới ảnh */}
                      <div className="menu-card__body" style={{ textAlign: 'left' }}>
                        <h3 className="menu-card__name" style={{ textAlign: 'left' }}>{item.name}</h3>
                        {item.shortDescription && (
                          <p className="menu-card__desc" style={{ textAlign: 'left' }}>{item.shortDescription}</p>
                        )}
                        <div className="menu-card__footer" style={{ textAlign: 'left' }}>
                          <span className="menu-card__price" style={{ textAlign: 'left' }}>
                            {fmtNum(item.price)}<span className="menu-card__price-unit">đ</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* ── COL 3: Cart sidebar (desktop) ── */}
      <aside className="oop__cart-sidebar">
        <div className="oop__cart-sidebar-head">
          <span className="oop__cart-sidebar-title">Giỏ hàng</span>
          <span className="oop__cart-sidebar-count">
            {totalItems > 0 ? `${totalItems} món` : 'Chưa có món'}
          </span>
        </div>

        {totalItems === 0 ? (
          <div className="oop__cart-empty">
            <div className="oop__cart-empty-icon">
              <svg viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <p className="oop__cart-empty-text">Chọn món từ thực đơn<br />để bắt đầu đặt hàng</p>
          </div>
        ) : (
          <>
            <div className="oop__cart-items">
              {items.map((ci) => (
                <div key={ci.id} className="oop__cart-item">
                  {ci.imageUrl && (
                    <img src={ci.imageUrl} alt={ci.name} className="oop__ci-img"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div className="oop__ci-body">
                    <div className="oop__ci-name">{ci.name}</div>
                    <div className="oop__ci-controls">
                      <div className="oop__ci-stepper">
                        <button className="oop__ci-btn" type="button"
                          onClick={() => updateQuantity(ci.id, ci.quantity - 1)}>−</button>
                        <span className="oop__ci-qty">{ci.quantity}</span>
                        <button className="oop__ci-btn" type="button"
                          onClick={() => updateQuantity(ci.id, ci.quantity + 1)}>+</button>
                      </div>
                      <span className="oop__ci-price">{fmt(ci.lineTotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="oop__cart-footer">
              <div className="oop__cart-subtotal">
                <span>Tạm tính</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="oop__cart-total">
                <span className="oop__cart-total-label">Tổng cộng</span>
                <span className="oop__cart-total-val">{fmt(subtotal)}</span>
              </div>
              <button
                type="button"
                className="oop__btn-checkout"
                onClick={onNext}
                id="btn-cart-checkout-desktop"
              >
                Tiến hành đặt hàng
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Mobile: sticky cart bar */}
      {totalItems > 0 && (
        <div className="oop__cart-bar">
          <button
            type="button"
            className="oop__cart-bar-btn"
            onClick={onNext}
            id="btn-cart-bar-mobile"
          >
            <div className="oop__cart-bar-left">
              <span className="oop__cart-bar-badge">{totalItems}</span>
              <span className="oop__cart-bar-label">Xem giỏ hàng</span>
            </div>
            <span className="oop__cart-bar-price">{fmt(subtotal)}</span>
          </button>
        </div>
      )}

      {/* Item Detail Modal — hiện khi món có option groups */}
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onConfirm={handleModalConfirm}
        />
      )}
    </div>
  );
}


// ── Order Summary (sidebar dùng chung Step 2 & 3) ────────────────────────────

function OrderSummary({ shippingFee }: { shippingFee: number }) {
  const { items, getSubtotal } = useOnlineCart();
  const subtotal = getSubtotal();
  const total = subtotal + shippingFee;

  return (
    <div className="oop__order-summary">
      <div className="oop__form-card-title">Đơn hàng của bạn</div>
      <div className="oop__os-items">
        {items.map((ci) => (
          <div key={ci.id} className="oop__os-item">
            <div className="oop__os-qty-badge">{ci.quantity}</div>
            <span className="oop__os-name">{ci.name}</span>
            <span className="oop__os-price">{fmt(ci.lineTotal)}</span>
          </div>
        ))}
      </div>
      <div className="oop__os-footer">
        <div className="oop__os-row">
          <span>Tạm tính</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="oop__os-row">
          <span>Phí giao hàng</span>
          <span>{shippingFee > 0 ? fmt(shippingFee) : '—'}</span>
        </div>
        <div className="oop__os-row oop__os-row--total">
          <strong>Tổng cộng</strong>
          <strong className="oop__os-total-val">{fmt(total)}</strong>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Delivery Info ──────────────────────────────────────────────────────

function Step2Delivery({
  onNext,
  onBack,
  shippingFee,
  setShippingFee,
}: {
  onNext: () => void;
  onBack: () => void;
  shippingFee: number;
  setShippingFee: (fee: number) => void;
}) {
  const { guestInfo, setGuestInfo, isInfoComplete } = useGuestInfo();
  const { status: geoStatus, lat, lng, requestLocation, errorMsg } = useGeolocation();
  const [estimateResult, setEstimateResult] = useState<{
    distanceKm: number;
    estimatedMinutes: number | null;
    isDeliverable: boolean;
    reason?: string;
  } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Scroll to top when entering Step 2
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  const handleEstimate = useCallback(async () => {
    if (!lat || !lng) return;
    setIsEstimating(true);
    try {
      const res = await onlineApi.estimateFee({
        branchId: BRANCH_ID,
        customerLat: lat,
        customerLng: lng,
      });
      setEstimateResult({
        distanceKm: res.distanceKm,
        estimatedMinutes: res.estimatedMinutes,
        isDeliverable: res.isDeliverable,
        reason: res.reason,
      });
      setShippingFee(res.shippingFee);
    } catch {
      setEstimateResult({
        distanceKm: 0,
        estimatedMinutes: null,
        isDeliverable: false,
        reason: 'Không thể tính phí. Phí ship sẽ được xác nhận sau.',
      });
    } finally {
      setIsEstimating(false);
    }
  }, [lat, lng, setShippingFee]);

  useEffect(() => {
    if (lat && lng && !estimateResult) handleEstimate();
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const canProceed = isInfoComplete();

  // Field-level error flags (shown only after first submit attempt)
  const nameErr  = showErrors && guestInfo.customerName.trim().length < 2;
  const phoneErr = showErrors && !/^(0[3-9]\d{8})$/.test(guestInfo.phone);
  const addrErr  = showErrors && guestInfo.address.trim().length < 5;

  const handleNext = () => {
    if (!canProceed) {
      setShowErrors(true);
      setTimeout(() => {
        const firstErr = document.querySelector<HTMLElement>('.oop__input--error');
        if (firstErr) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErr.focus();
        }
      }, 50);
      return;
    }
    onNext();
  };

  const geoLabel = (() => {
    if (geoStatus === 'loading') return 'Đang lấy vị trí...';
    if (geoStatus === 'error')   return 'Thử lại định vị';
    if (geoStatus === 'success' && isEstimating) return 'Đang tính phí ship...';
    if (geoStatus === 'success') return 'Đã lấy được vị trí';
    return 'Xác định vị trí của tôi';
  })();

  return (
    <div className="oop__body">
      <div className="oop__step-wrapper">

        {/* Thông tin người nhận */}
        <div className="oop__form-card">
          <div className="oop__form-card-title">Thông tin người nhận</div>
          <div className="oop__form-body">
            <div className="oop__field">
              <label className="oop__label" htmlFor="f-name">
                Họ tên <span className="req">*</span>
              </label>
              <input
                id="f-name"
                className={`oop__input${nameErr ? ' oop__input--error' : ''}`}
                type="text"
                placeholder="Nguyễn Văn A"
                value={guestInfo.customerName}
                onChange={(e) => setGuestInfo({ customerName: e.target.value })}
                required minLength={2} maxLength={100}
              />
              {nameErr && <span className="oop__field-err">Vui lòng nhập họ tên (ít nhất 2 ký tự)</span>}
            </div>

            <div className="oop__field">
              <label className="oop__label" htmlFor="f-phone">
                Số điện thoại <span className="req">*</span>
              </label>
              <input
                id="f-phone"
                className={`oop__input${phoneErr ? ' oop__input--error' : ''}`}
                type="tel"
                placeholder="0912345678"
                value={guestInfo.phone}
                onChange={(e) => setGuestInfo({ phone: e.target.value.replace(/\D/g, '') })}
                maxLength={10}
              />
              {phoneErr && <span className="oop__field-err">Số điện thoại không hợp lệ (VD: 0912345678)</span>}
            </div>

            <div className="oop__field">
              <label className="oop__label" htmlFor="f-address">
                Địa chỉ giao hàng <span className="req">*</span>
              </label>
              <input
                id="f-address"
                className={`oop__input${addrErr ? ' oop__input--error' : ''}`}
                type="text"
                placeholder="Số nhà, tên đường"
                value={guestInfo.address}
                onChange={(e) => setGuestInfo({ address: e.target.value })}
              />
              {addrErr && <span className="oop__field-err">Vui lòng nhập địa chỉ giao hàng</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="oop__field">
                <label className="oop__label" htmlFor="f-ward">Phường/Xã</label>
                <input id="f-ward" className="oop__input" type="text"
                  placeholder="Phường Bến Nghé"
                  value={guestInfo.ward}
                  onChange={(e) => setGuestInfo({ ward: e.target.value })} />
              </div>
              <div className="oop__field">
                <label className="oop__label" htmlFor="f-district">Quận/Huyện</label>
                <input id="f-district" className="oop__input" type="text"
                  placeholder="Quận 1"
                  value={guestInfo.district}
                  onChange={(e) => setGuestInfo({ district: e.target.value })} />
              </div>
            </div>

            <div className="oop__field">
              <label className="oop__label" htmlFor="f-note">Ghi chú (tùy chọn)</label>
              <textarea
                id="f-note"
                className="oop__textarea"
                placeholder="Để cổng, gọi trước khi đến..."
                value={guestInfo.note}
                onChange={(e) => setGuestInfo({ note: e.target.value })}
                rows={3} maxLength={500}
              />
            </div>
          </div>
        </div>

        {/* Phí giao hàng */}
        <div className="oop__form-card">
          <div className="oop__form-card-title">Tính phí giao hàng</div>
          <div className="oop__form-body">
            <p className="oop__hint">
              Nhấn định vị để tự động tính phí ship chính xác đến địa chỉ của bạn.
            </p>

            <button
              type="button"
              className="oop__geo-btn"
              onClick={() => requestLocation()}
              disabled={geoStatus === 'loading' || isEstimating}
              id="btn-request-location"
            >
              <svg viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {geoLabel}
            </button>

            {geoStatus === 'success' && lat && lng && !estimateResult && (
              <button type="button" className="oop__geo-btn" onClick={handleEstimate}
                disabled={isEstimating} id="btn-estimate-fee">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2v20M2 12h20"/>
                </svg>
                {isEstimating ? 'Đang tính...' : 'Tính phí ship'}
              </button>
            )}

            {geoStatus === 'error' && errorMsg && (
              <p className="oop__err-text">{errorMsg}</p>
            )}

            {estimateResult && (
              <div className={`oop__estimate${estimateResult.isDeliverable ? ' oop__estimate--ok' : ' oop__estimate--err'}`}>
                <div className="oop__estimate__dot" />
                {estimateResult.isDeliverable ? (
                  <span>
                    Cách {estimateResult.distanceKm.toFixed(1)} km —
                    phí ship <strong>{fmt(shippingFee)}</strong>
                    {estimateResult.estimatedMinutes ? ` — khoảng ${estimateResult.estimatedMinutes} phút` : ''}
                  </span>
                ) : (
                  <span>{estimateResult.reason ?? 'Địa chỉ ngoài vùng giao hàng'}</span>
                )}
              </div>
            )}

            {(geoStatus === 'error' || geoStatus === 'idle') && (
              <p className="oop__hint">
                Không dùng định vị? Phí ship sẽ được xác nhận khi bếp gọi lại.
              </p>
            )}
          </div>
        </div>

        <div className="oop__nav-row">
          <button type="button" className="oop__btn-back" onClick={onBack} id="btn-back-to-menu">
            Quay lại
          </button>
          <button
            type="button"
            className="oop__btn-next"
            onClick={handleNext}
            id="btn-next-to-confirm"
          >
            Xác nhận đặt hàng
          </button>
        </div>

        {/* ── Order Summary sidebar (col 2 on desktop) ── */}
        <OrderSummary shippingFee={shippingFee} />
      </div>
    </div>
  );
}

// ── Step 3: Confirm & Submit ───────────────────────────────────────────────────

function Step3Confirm({
  onBack,
  shippingFee,
  geoCoords,
}: {
  onBack: () => void;
  shippingFee: number;
  geoCoords: { lat: number | null; lng: number | null };
}) {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart, branchId } = useOnlineCart();
  const { guestInfo } = useGuestInfo();
  const { showToast } = useStore();

  const mutation = useMutation({
    mutationFn: (payload: CreateOnlineOrderPayload) => onlineApi.createOrder(payload),
    onSuccess: (data) => {
      clearCart();
      showToast('Đặt hàng thành công! Đang theo dõi đơn...', 'success');
      // Luu trackingToken de tracking page co the xac thuc quyen xem don
      if (data.trackingToken) {
        localStorage.setItem(`tracking-token-${data.order.id}`, data.trackingToken);
      }
      navigate(`/order-online/track/${data.order.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Có lỗi xảy ra. Vui lòng thử lại.';
      showToast(msg, 'error');
    },
  });

  const handleSubmit = () => {
    const payload: CreateOnlineOrderPayload = {
      branchId,
      clientSessionId: `guest-${Date.now()}`,
      idempotencyKey: `online-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      items: items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        selectedOptions: i.selectedOptions,
        note: i.note,
      })),
      deliveryInfo: {
        customerName: guestInfo.customerName,
        phone: guestInfo.phone,
        address: guestInfo.address,
        ward: guestInfo.ward || undefined,
        district: guestInfo.district || undefined,
        customerLat: geoCoords.lat ?? undefined,
        customerLng: geoCoords.lng ?? undefined,
        shippingFee,
        note: guestInfo.note || undefined,
      },
    };
    mutation.mutate(payload);
  };

  const subtotal = getSubtotal();
  const total = subtotal + shippingFee;

  return (
    <div className="oop__body">
      <div className="oop__step-wrapper">

        {/* Món đã chọn */}
        <div className="oop__form-card">
          <div className="oop__form-card-title">Món đã chọn</div>
          <div className="oop__form-body">
            <div className="confirm-info-block">
              {items.map((item) => (
                <div key={item.id} className="confirm-item-row">
                  <div className="confirm-item-qty">{item.quantity}</div>
                  <span className="confirm-item-name">{item.name}</span>
                  <span className="confirm-item-price">{fmt(item.lineTotal)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Thông tin giao hàng */}
        <div className="oop__form-card">
          <div className="oop__form-card-title">Thông tin giao hàng</div>
          <div className="oop__form-body">
            <div className="confirm-info-block">
              <div className="confirm-info-row">
                <span>Người nhận</span>
                <strong>{guestInfo.customerName}</strong>
              </div>
              <div className="confirm-info-row">
                <span>Điện thoại</span>
                <strong>{guestInfo.phone}</strong>
              </div>
              <div className="confirm-info-row">
                <span>Địa chỉ</span>
                <strong>
                  {guestInfo.address}
                  {guestInfo.ward ? `, ${guestInfo.ward}` : ''}
                  {guestInfo.district ? `, ${guestInfo.district}` : ''}
                </strong>
              </div>
              {guestInfo.note && (
                <div className="confirm-info-row">
                  <span>Ghi chú</span>
                  <strong>{guestInfo.note}</strong>
                </div>
              )}
              <div className="confirm-info-row">
                <span>Thanh toán</span>
                <strong>COD — Tiền mặt khi nhận</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Hoá đơn */}
        <div className="oop__form-card">
          <div className="oop__form-card-title">Chi phí</div>
          <div className="oop__form-body">
            <div className="bill-row">
              <span>Tạm tính</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="bill-row">
              <span>Phí giao hàng</span>
              <span>{shippingFee > 0 ? fmt(shippingFee) : 'Xác nhận sau'}</span>
            </div>
            <div className="bill-row bill-row--total">
              <strong>Tổng cộng</strong>
              <strong className="bill-total">{fmt(total)}</strong>
            </div>
          </div>
        </div>

        <div className="oop__nav-row">
          <button type="button" className="oop__btn-back" onClick={onBack}
            disabled={mutation.isPending} id="btn-back-to-delivery">
            Sửa thông tin
          </button>
          <button type="button" className="oop__btn-submit" onClick={handleSubmit}
            disabled={mutation.isPending} id="btn-submit-order">
            {mutation.isPending ? 'Đang đặt hàng...' : 'Xác nhận đặt hàng'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function OnlineOrderPage() {
  const [step, setStep] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const { lat, lng } = useGeolocation();

  const goNext = () => setStep((s) => Math.min(s + 1, 2));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="oop">
      {/* Header */}
      <header className="oop__header">
        <div className="oop__header-inner">
          <a href="/order-online" className="oop__brand">
            <img src="/logo.png" alt="Bếp Nhà Mình" />
            Bếp Nhà Mình
          </a>
          <StepBar current={step} />
          <div className="oop__header-right">
            {/* placeholder for future user icon or info */}
          </div>
        </div>
      </header>

      {/* Content */}
      {step === 0 && <Step1Menu onNext={goNext} />}
      {step === 1 && (
        <Step2Delivery
          onNext={goNext}
          onBack={goBack}
          shippingFee={shippingFee}
          setShippingFee={setShippingFee}
        />
      )}
      {step === 2 && (
        <Step3Confirm
          onBack={goBack}
          shippingFee={shippingFee}
          geoCoords={{ lat, lng }}
        />
      )}
    </div>
  );
}
