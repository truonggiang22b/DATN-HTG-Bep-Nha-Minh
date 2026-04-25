/**
 * geo.utils.ts — Geolocation utilities for delivery fee calculation
 * Phase 2: Bếp Nhà Mình Online Ordering
 * Uses Haversine formula (zero cost — pure math, no external API)
 */

export interface BranchDeliveryConfig {
  deliveryBaseKm: number;   // km mà phí cơ bản áp dụng (default: 2)
  deliveryBaseFee: number;  // phí cơ bản (VND) (default: 15000)
  deliveryFeePerKm: number; // phí mỗi km vượt (VND) (default: 5000)
  deliveryMaxKm: number;    // bán kính giao hàng tối đa (default: 10)
}

export interface ShippingFeeResult {
  fee: number;
  isDeliverable: boolean;
  reason?: string;
}

/**
 * Haversine formula: tính khoảng cách đường chim bay (km) giữa 2 tọa độ
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Tính phí ship dựa trên khoảng cách và config chi nhánh
 *
 * Bảng phí mặc định (có thể cấu hình qua Admin):
 *   0 – 2 km    → 15.000 đ (base fee)
 *   2 – 10 km   → 15.000 + (km - 2) × 5.000
 *   > 10 km     → Ngoài vùng giao hàng
 */
export function calcShippingFee(
  distanceKm: number,
  config: BranchDeliveryConfig
): ShippingFeeResult {
  if (distanceKm > config.deliveryMaxKm) {
    return {
      fee: 0,
      isDeliverable: false,
      reason: `Địa chỉ của bạn cách quán ${distanceKm.toFixed(1)} km, vượt quá phạm vi giao hàng ${config.deliveryMaxKm} km`,
    };
  }

  if (distanceKm <= config.deliveryBaseKm) {
    return {
      fee: config.deliveryBaseFee,
      isDeliverable: true,
    };
  }

  const extraKm = distanceKm - config.deliveryBaseKm;
  const extraFee = Math.ceil(extraKm * config.deliveryFeePerKm);
  return {
    fee: config.deliveryBaseFee + extraFee,
    isDeliverable: true,
  };
}

/**
 * Ước tính thời gian giao hàng (phút) — rough estimate
 * ~3 km/phút xe máy trong thành phố + 10 phút chuẩn bị
 */
export function estimateDeliveryMinutes(distanceKm: number): number {
  const travelMinutes = Math.ceil(distanceKm / 3 * 60 / 60 * 60); // 30 km/h = 0.5 km/min
  return 10 + Math.ceil(distanceKm / 0.5); // 10 mins prep + travel
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
