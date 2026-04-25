/**
 * OnlineOrderPage.tsx — Trang đặt hàng online 3 bước
 * Phase 2: Bếp Nhà Mình Online Ordering
 *
 * Bước 1: Chọn món (menu + online cart)
 * Bước 2: Thông tin giao hàng + tính phí ship
 * Bước 3: Xác nhận & đặt hàng
 *
 * Route: /order-online/menu
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { publicApi } from '../services/publicApi';
import { onlineApi, type CreateOnlineOrderPayload } from '../services/onlineApi';
import { useOnlineCart } from '../store/useOnlineCart';
import { useGuestInfo } from '../store/useGuestInfo';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStore } from '../store/useStore';
import './OnlineOrderPage.css';

const BRANCH_ID = 'branch-bep-nha-minh-q1';

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = ['Chọn món', 'Thông tin giao', 'Xác nhận'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="oop__stepbar">
      {STEPS.map((label, i) => (
        <div
          key={label}
          className={`oop__step${i === current ? ' oop__step--active' : i < current ? ' oop__step--done' : ''}`}
        >
          <div className="oop__step-circle">{i < current ? '✓' : i + 1}</div>
          <span className="oop__step-label">{label}</span>
          {i < STEPS.length - 1 && <div className="oop__step-line" aria-hidden />}
        </div>
      ))}
    </div>
  );
}

// ─── Quantity Stepper ─────────────────────────────────────────────────────────

function QtyBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="qty-btn"
      onClick={onClick}
      disabled={disabled}
      type="button"
      aria-label={label}
    >
      {label}
    </button>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// ─── Step 1: Menu ─────────────────────────────────────────────────────────────

function Step1Menu({ onNext }: { onNext: () => void }) {
  const { addItem, items, updateQuantity, getSubtotal, getTotalItems } = useOnlineCart();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const { data: menu, isLoading } = useQuery({
    queryKey: ['online-menu', BRANCH_ID],
    queryFn: () => publicApi.getMenu(BRANCH_ID),
    staleTime: 5 * 60_000,
  });

  const categories = menu?.categories ?? [];
  const activeCatId = selectedCat ?? categories[0]?.id ?? null;
  const activeItems =
    categories.find((c: { id: string }) => c.id === activeCatId)?.items ?? [];

  const cartQty = (menuItemId: string) =>
    items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0;

  const cartItem = (menuItemId: string) =>
    items.find((i) => i.menuItemId === menuItemId);

  function handleAdd(item: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    optionGroups?: unknown[];
  }) {
    // Đơn giản hóa: không có option → thêm thẳng
    // Nếu có option group required → cần mở modal (MVP: bỏ qua option cho online order)
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

  if (isLoading) {
    return (
      <div className="oop__loading">
        <div className="oop__spinner" />
        <p>Đang tải thực đơn...</p>
      </div>
    );
  }

  return (
    <div className="oop__step-content">
      {/* Category tabs */}
      <div className="oop__cat-tabs" role="tablist">
        {categories.map((cat: { id: string; name: string }) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={cat.id === activeCatId}
            className={`oop__cat-tab${cat.id === activeCatId ? ' active' : ''}`}
            onClick={() => setSelectedCat(cat.id)}
            type="button"
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu items */}
      <div className="oop__menu-grid">
        {activeItems
          .filter((it: { status: string }) => it.status === 'ACTIVE')
          .map((item: {
            id: string;
            name: string;
            price: number;
            imageUrl?: string;
            shortDescription?: string;
            status: string;
          }) => {
            const qty = cartQty(item.id);
            const ci = cartItem(item.id);
            return (
              <div key={item.id} className="menu-card">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="menu-card__img"
                    loading="lazy"
                  />
                )}
                <div className="menu-card__body">
                  <h3 className="menu-card__name">{item.name}</h3>
                  {item.shortDescription && (
                    <p className="menu-card__desc">{item.shortDescription}</p>
                  )}
                  <div className="menu-card__footer">
                    <span className="menu-card__price">{fmt(item.price)}</span>
                    {qty === 0 ? (
                      <button
                        className="menu-card__add"
                        onClick={() => handleAdd(item)}
                        type="button"
                        id={`add-${item.id}`}
                      >
                        + Thêm
                      </button>
                    ) : (
                      <div className="menu-card__stepper">
                        <QtyBtn
                          label="−"
                          onClick={() => updateQuantity(ci!.id, qty - 1)}
                        />
                        <span className="menu-card__qty">{qty}</span>
                        <QtyBtn
                          label="+"
                          onClick={() => updateQuantity(ci!.id, qty + 1)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Sticky cart summary */}
      {getTotalItems() > 0 && (
        <div className="oop__cart-bar">
          <div className="oop__cart-bar-info">
            <span className="oop__cart-badge">{getTotalItems()}</span>
            <span className="oop__cart-subtotal">{fmt(getSubtotal())}</span>
          </div>
          <button
            className="oop__cart-next"
            onClick={onNext}
            type="button"
            id="btn-next-to-delivery"
          >
            Tiếp tục →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Delivery Info ────────────────────────────────────────────────────

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
        reason: 'Không thể tính phí ship. Vui lòng thử lại.',
      });
    } finally {
      setIsEstimating(false);
    }
  }, [lat, lng, setShippingFee]);

  // Auto-estimate when coords become available
  useState(() => {
    if (lat && lng) handleEstimate();
  });

  const canProceed = isInfoComplete();

  return (
    <div className="oop__step-content">
      <form className="delivery-form" onSubmit={(e) => { e.preventDefault(); if (canProceed) onNext(); }}>
        <div className="delivery-form__section">
          <h3 className="delivery-form__section-title">📋 Thông tin người nhận</h3>

          <div className="form-field">
            <label htmlFor="f-name">Họ tên *</label>
            <input
              id="f-name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={guestInfo.customerName}
              onChange={(e) => setGuestInfo({ customerName: e.target.value })}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="form-field">
            <label htmlFor="f-phone">Số điện thoại *</label>
            <input
              id="f-phone"
              type="tel"
              placeholder="0912345678"
              value={guestInfo.phone}
              onChange={(e) => setGuestInfo({ phone: e.target.value.replace(/\D/g, '') })}
              required
              pattern="^(0[3-9]\d{8})$"
              maxLength={10}
            />
          </div>

          <div className="form-field">
            <label htmlFor="f-address">Địa chỉ giao hàng *</label>
            <input
              id="f-address"
              type="text"
              placeholder="Số nhà, tên đường, phường/xã"
              value={guestInfo.address}
              onChange={(e) => setGuestInfo({ address: e.target.value })}
              required
              minLength={5}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="f-ward">Phường/Xã</label>
              <input
                id="f-ward"
                type="text"
                placeholder="Phường Bến Nghé"
                value={guestInfo.ward}
                onChange={(e) => setGuestInfo({ ward: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label htmlFor="f-district">Quận/Huyện</label>
              <input
                id="f-district"
                type="text"
                placeholder="Quận 1"
                value={guestInfo.district}
                onChange={(e) => setGuestInfo({ district: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="f-note">Ghi chú (tùy chọn)</label>
            <textarea
              id="f-note"
              placeholder="Để cổng, gọi trước khi đến..."
              value={guestInfo.note}
              onChange={(e) => setGuestInfo({ note: e.target.value })}
              rows={2}
              maxLength={500}
            />
          </div>
        </div>

        {/* GPS + Fee estimate */}
        <div className="delivery-form__section">
          <h3 className="delivery-form__section-title">📍 Tính phí giao hàng</h3>
          <p className="delivery-form__hint">
            Cho phép định vị để tự động tính phí ship chính xác.
          </p>

          <button
            type="button"
            className={`geo-btn${geoStatus === 'loading' ? ' geo-btn--loading' : ''}${geoStatus === 'success' ? ' geo-btn--done' : ''}`}
            onClick={() => {
              requestLocation();
            }}
            disabled={geoStatus === 'loading' || isEstimating}
            id="btn-request-location"
          >
            {geoStatus === 'loading' && '⏳ Đang lấy vị trí...'}
            {geoStatus === 'idle' && '📍 Xác định vị trí của tôi'}
            {geoStatus === 'error' && '🔄 Thử lại định vị'}
            {geoStatus === 'success' && !isEstimating && '✓ Đã lấy vị trí'}
            {geoStatus === 'success' && isEstimating && '⏳ Đang tính phí...'}
          </button>

          {/* Auto-estimate once we have coords */}
          {geoStatus === 'success' && lat && lng && !estimateResult && (
            <button
              type="button"
              className="geo-btn"
              onClick={handleEstimate}
              disabled={isEstimating}
              id="btn-estimate-fee"
            >
              {isEstimating ? '⏳ Đang tính...' : '💰 Tính phí ship'}
            </button>
          )}

          {geoStatus === 'error' && errorMsg && (
            <div className="geo-error" role="alert">⚠️ {errorMsg}</div>
          )}

          {estimateResult && (
            <div className={`fee-result${estimateResult.isDeliverable ? ' fee-result--ok' : ' fee-result--no'}`}>
              {estimateResult.isDeliverable ? (
                <>
                  <div className="fee-result__row">
                    <span>📏 Khoảng cách</span>
                    <strong>{estimateResult.distanceKm.toFixed(1)} km</strong>
                  </div>
                  <div className="fee-result__row">
                    <span>💵 Phí giao hàng</span>
                    <strong className="fee-result__fee">{fmt(shippingFee)}</strong>
                  </div>
                  {estimateResult.estimatedMinutes && (
                    <div className="fee-result__row">
                      <span>⏱️ Dự kiến giao</span>
                      <strong>~{estimateResult.estimatedMinutes} phút</strong>
                    </div>
                  )}
                </>
              ) : (
                <p className="fee-result__error">
                  🚫 {estimateResult.reason ?? 'Địa chỉ ngoài vùng giao hàng'}
                </p>
              )}
            </div>
          )}

          {/* Manual fee fallback */}
          {(geoStatus === 'error' || geoStatus === 'idle') && (
            <p className="delivery-form__hint delivery-form__hint--small">
              Không dùng định vị? Phí ship sẽ được tính khi xác nhận đơn.
            </p>
          )}
        </div>

        <div className="oop__nav-row">
          <button type="button" className="oop__btn-back" onClick={onBack} id="btn-back-to-menu">
            ← Quay lại
          </button>
          <button
            type="submit"
            className="oop__btn-next"
            disabled={!canProceed}
            id="btn-next-to-confirm"
          >
            Xác nhận đơn →
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Step 3: Confirm & Submit ─────────────────────────────────────────────────

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
      navigate(`/online-tracking/${data.order.id}`);
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
    <div className="oop__step-content">
      <div className="confirm-panel">
        {/* Order Items */}
        <div className="confirm-section">
          <h3 className="confirm-section__title">🍜 Món đã chọn</h3>
          <div className="confirm-items">
            {items.map((item) => (
              <div key={item.id} className="confirm-item">
                <span className="confirm-item__name">{item.name}</span>
                <span className="confirm-item__qty">×{item.quantity}</span>
                <span className="confirm-item__price">{fmt(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Info */}
        <div className="confirm-section">
          <h3 className="confirm-section__title">📋 Thông tin giao hàng</h3>
          <div className="confirm-info-grid">
            <div className="confirm-info-row">
              <span>Người nhận</span>
              <strong>{guestInfo.customerName}</strong>
            </div>
            <div className="confirm-info-row">
              <span>SĐT</span>
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
              <strong>💵 COD — Tiền mặt khi nhận</strong>
            </div>
          </div>
        </div>

        {/* Bill */}
        <div className="confirm-section confirm-bill">
          <div className="bill-row">
            <span>Tạm tính</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="bill-row">
            <span>Phí giao hàng</span>
            <span>{shippingFee > 0 ? fmt(shippingFee) : 'Sẽ xác nhận sau'}</span>
          </div>
          <div className="bill-row bill-row--total">
            <strong>Tổng cộng</strong>
            <strong className="bill-total">{fmt(total)}</strong>
          </div>
        </div>

        <div className="oop__nav-row">
          <button
            type="button"
            className="oop__btn-back"
            onClick={onBack}
            disabled={mutation.isPending}
            id="btn-back-to-delivery"
          >
            ← Sửa thông tin
          </button>
          <button
            type="button"
            className="oop__btn-submit"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            id="btn-submit-order"
          >
            {mutation.isPending ? '⏳ Đang đặt hàng...' : '✅ Đặt hàng ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OnlineOrderPage() {
  const [step, setStep] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const { lat, lng } = useGeolocation();
  const { getTotalItems } = useOnlineCart();

  const goNext = () => setStep((s) => Math.min(s + 1, 2));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="oop">
      {/* Header */}
      <header className="oop__header">
        <div className="oop__header-inner">
          <h1 className="oop__header-title">🏠 Bếp Nhà Mình — Đặt hàng online</h1>
          {getTotalItems() > 0 && step === 0 && (
            <div className="oop__cart-count">{getTotalItems()} món</div>
          )}
        </div>
        <StepBar current={step} />
      </header>

      {/* Content */}
      <main className="oop__main">
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
      </main>
    </div>
  );
}
