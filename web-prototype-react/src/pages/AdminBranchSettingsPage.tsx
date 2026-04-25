/**
 * AdminBranchSettingsPage.tsx — Cấu hình phí ship chi nhánh
 * Phase 2: Bếp Nhà Mình Online Ordering
 *
 * Route: /admin/branch-settings
 * Admin điều chỉnh tọa độ quán + bảng phí giao hàng
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { deliveryApi, type BranchDeliveryConfigFull } from '../services/deliveryApi';
import './AdminBranchSettingsPage.css';

const BRANCH_ID = 'branch-bep-nha-minh-q1';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// ─── Fee Preview Calculator ───────────────────────────────────────────────────

function FeePreview({
  baseKm,
  baseFee,
  feePerKm,
  maxKm,
}: {
  baseKm: number;
  baseFee: number;
  feePerKm: number;
  maxKm: number;
}) {
  const examples = [0.5, 1, 2, 3, 5, 7, maxKm];
  return (
    <div className="absp__fee-preview">
      <h4 className="absp__preview-title">📊 Bảng phí ước tính</h4>
      <div className="absp__preview-table">
        <div className="absp__preview-row absp__preview-row--header">
          <span>Khoảng cách</span>
          <span>Phí ship</span>
        </div>
        {examples.map((km) => {
          if (km > maxKm) return null;
          const fee = km <= baseKm ? baseFee : Math.round(baseFee + (km - baseKm) * feePerKm);
          return (
            <div key={km} className="absp__preview-row">
              <span>{km} km</span>
              <span className="absp__preview-fee">{fmt(fee)}</span>
            </div>
          );
        })}
        <div className="absp__preview-row absp__preview-row--max">
          <span>&gt; {maxKm} km</span>
          <span className="absp__preview-out">Ngoài vùng giao</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminBranchSettingsPage() {
  const { showToast } = useStore();

  const { data: config, isLoading } = useQuery<BranchDeliveryConfigFull>({
    queryKey: ['branchDeliveryConfig', BRANCH_ID],
    queryFn: () => deliveryApi.getBranchConfig(BRANCH_ID),
    staleTime: 60_000,
  });

  // Form state
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [baseKm, setBaseKm] = useState('');
  const [baseFee, setBaseFee] = useState('');
  const [feePerKm, setFeePerKm] = useState('');
  const [maxKm, setMaxKm] = useState('');

  // Sync from loaded config
  useEffect(() => {
    if (config) {
      setLat(config.latitude?.toString() ?? '');
      setLng(config.longitude?.toString() ?? '');
      setBaseKm(config.deliveryBaseKm?.toString() ?? '2');
      setBaseFee(config.deliveryBaseFee?.toString() ?? '15000');
      setFeePerKm(config.deliveryFeePerKm?.toString() ?? '5000');
      setMaxKm(config.deliveryMaxKm?.toString() ?? '10');
    }
  }, [config]);

  const { mutate: saveConfig, isPending: isSaving } = useMutation({
    mutationFn: () =>
      deliveryApi.updateBranchConfig(BRANCH_ID, {
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined,
        deliveryBaseKm: baseKm ? parseFloat(baseKm) : undefined,
        deliveryBaseFee: baseFee ? parseInt(baseFee) : undefined,
        deliveryFeePerKm: feePerKm ? parseInt(feePerKm) : undefined,
        deliveryMaxKm: maxKm ? parseFloat(maxKm) : undefined,
      }),
    onSuccess: () => showToast('Đã lưu cấu hình giao hàng', 'success'),
    onError: () => showToast('Lỗi khi lưu cấu hình', 'error'),
  });

  const baseKmNum   = parseFloat(baseKm)   || 2;
  const baseFeeNum  = parseInt(baseFee)    || 15000;
  const feePerKmNum = parseInt(feePerKm)   || 5000;
  const maxKmNum    = parseFloat(maxKm)    || 10;

  if (isLoading) {
    return (
      <div>
        <div className="admin-topbar"><span className="admin-topbar__title">Cấu hình chi nhánh</span></div>
        <div className="absp__loading"><div className="absp__spinner" /><p>Đang tải...</p></div>
      </div>
    );
  }

  return (
    <div>
      {/* Topbar */}
      <div className="admin-topbar">
        <span className="admin-topbar__title">Cấu hình chi nhánh</span>
        <span className="absp__branch-name">{config?.name ?? 'Chi nhánh 1'}</span>
      </div>

      <div className="admin-content">
        <div className="absp__layout">
          {/* Left: Form */}
          <div className="absp__form-col">
            {/* Location */}
            <section className="absp__section">
              <h2 className="absp__section-title">📍 Tọa độ quán</h2>
              <p className="absp__section-hint">
                Dùng để tính khoảng cách đến khách hàng.
                {' '}<a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="absp__link">
                  Tra Google Maps →
                </a>
              </p>

              <div className="absp__form-row">
                <div className="absp__field">
                  <label htmlFor="f-lat">Vĩ độ (Latitude)</label>
                  <input
                    id="f-lat"
                    type="number"
                    step="any"
                    placeholder="10.7769"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </div>
                <div className="absp__field">
                  <label htmlFor="f-lng">Kinh độ (Longitude)</label>
                  <input
                    id="f-lng"
                    type="number"
                    step="any"
                    placeholder="106.7009"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </div>
              </div>

              {lat && lng && (
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absp__verify-link"
                >
                  🗺️ Kiểm tra tọa độ trên Google Maps
                </a>
              )}
            </section>

            {/* Delivery fee config */}
            <section className="absp__section">
              <h2 className="absp__section-title">💵 Cấu hình phí giao hàng</h2>

              <div className="absp__field">
                <label htmlFor="f-base-km">
                  Bán kính miễn phí giao (km)
                  <span className="absp__field-hint">Giao hàng trong bán kính này tính phí cố định</span>
                </label>
                <input
                  id="f-base-km"
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={baseKm}
                  onChange={(e) => setBaseKm(e.target.value)}
                />
              </div>

              <div className="absp__field">
                <label htmlFor="f-base-fee">
                  Phí cố định trong bán kính (VNĐ)
                  <span className="absp__field-hint">Phí ship tối thiểu</span>
                </label>
                <input
                  id="f-base-fee"
                  type="number"
                  step="1000"
                  min="0"
                  value={baseFee}
                  onChange={(e) => setBaseFee(e.target.value)}
                />
                {baseFeeNum > 0 && <span className="absp__preview-inline">{fmt(baseFeeNum)}</span>}
              </div>

              <div className="absp__field">
                <label htmlFor="f-fee-per-km">
                  Phí mỗi km vượt (VNĐ/km)
                  <span className="absp__field-hint">Tính thêm mỗi km ngoài bán kính</span>
                </label>
                <input
                  id="f-fee-per-km"
                  type="number"
                  step="500"
                  min="0"
                  value={feePerKm}
                  onChange={(e) => setFeePerKm(e.target.value)}
                />
                {feePerKmNum > 0 && <span className="absp__preview-inline">{fmt(feePerKmNum)}/km</span>}
              </div>

              <div className="absp__field">
                <label htmlFor="f-max-km">
                  Bán kính giao tối đa (km)
                  <span className="absp__field-hint">Đơn ngoài bán kính này sẽ bị từ chối</span>
                </label>
                <input
                  id="f-max-km"
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  value={maxKm}
                  onChange={(e) => setMaxKm(e.target.value)}
                />
              </div>
            </section>

            {/* Save button */}
            <button
              className="absp__btn-save"
              onClick={() => saveConfig()}
              disabled={isSaving}
              id="btn-save-delivery-config"
              type="button"
            >
              {isSaving ? '⏳ Đang lưu...' : '💾 Lưu cấu hình'}
            </button>
          </div>

          {/* Right: Preview */}
          <div className="absp__preview-col">
            <FeePreview
              baseKm={baseKmNum}
              baseFee={baseFeeNum}
              feePerKm={feePerKmNum}
              maxKm={maxKmNum}
            />

            {/* Formula explanation */}
            <div className="absp__formula">
              <h4 className="absp__section-title">📐 Công thức tính phí</h4>
              <div className="absp__formula-box">
                <p>Nếu <strong>khoảng cách ≤ {baseKmNum} km</strong>:</p>
                <code>Phí ship = {fmt(baseFeeNum)}</code>
                <p style={{ marginTop: 12 }}>Nếu <strong>khoảng cách &gt; {baseKmNum} km</strong>:</p>
                <code>Phí ship = {fmt(baseFeeNum)} + (km - {baseKmNum}) × {fmt(feePerKmNum)}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
