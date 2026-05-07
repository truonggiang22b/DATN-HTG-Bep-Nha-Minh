/**
 * geo-utils.test.ts — Unit tests for Haversine formula and shipping fee calc
 * Phase 2: Bếp Nhà Mình Online Ordering
 */

import { describe, it, expect } from 'vitest';
import { haversineKm, calcShippingFee, estimateDeliveryMinutes } from '../src/modules/public/online-orders/geo.utils';


const DEFAULT_CONFIG = {
  deliveryBaseKm: 2,
  deliveryBaseFee: 15000,
  deliveryFeePerKm: 5000,
  deliveryMaxKm: 10,
};

// Tọa độ quán (giả định: Q.1, TP.HCM)
const BRANCH_LAT = 10.762622;
const BRANCH_LNG = 106.660172;

describe('haversineKm', () => {
  it('returns 0 for same coordinates', () => {
    const dist = haversineKm(BRANCH_LAT, BRANCH_LNG, BRANCH_LAT, BRANCH_LNG);
    expect(dist).toBe(0);
  });

  it('calculates distance correctly for known points (~5km)', () => {
    // Q.5 HCMC ≈ 4-5km từ Q.1
    const dist = haversineKm(BRANCH_LAT, BRANCH_LNG, 10.747, 106.668);
    expect(dist).toBeGreaterThan(1.5);
    expect(dist).toBeLessThan(2.5);
  });

  it('returns a positive number for different coordinates', () => {
    const dist = haversineKm(10.0, 106.0, 10.5, 106.5);
    expect(dist).toBeGreaterThan(0);
  });

  it('returns value with 2 decimal places', () => {
    const dist = haversineKm(10.0, 106.0, 10.1, 106.1);
    const str = dist.toString();
    const decimals = str.includes('.') ? str.split('.')[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });
});

describe('calcShippingFee', () => {
  describe('within base km (≤ 2km)', () => {
    it('returns base fee for 0km', () => {
      const result = calcShippingFee(0, DEFAULT_CONFIG);
      expect(result.isDeliverable).toBe(true);
      expect(result.fee).toBe(15000);
    });

    it('returns base fee for 1km', () => {
      const result = calcShippingFee(1, DEFAULT_CONFIG);
      expect(result.isDeliverable).toBe(true);
      expect(result.fee).toBe(15000);
    });

    it('returns base fee for exactly 2km', () => {
      const result = calcShippingFee(2, DEFAULT_CONFIG);
      expect(result.isDeliverable).toBe(true);
      expect(result.fee).toBe(15000);
    });
  });

  describe('beyond base km (2–10km)', () => {
    it('adds per-km fee for 3km', () => {
      const result = calcShippingFee(3, DEFAULT_CONFIG);
      expect(result.isDeliverable).toBe(true);
      // 15000 + (3-2) * 5000 = 20000
      expect(result.fee).toBe(20000);
    });

    it('calculates correctly for 5km', () => {
      const result = calcShippingFee(5, DEFAULT_CONFIG);
      expect(result.isDeliverable).toBe(true);
      // 15000 + (5-2) * 5000 = 30000
      expect(result.fee).toBe(30000);
    });

    it('calculates correctly for 10km (boundary)', () => {
      const result = calcShippingFee(10, DEFAULT_CONFIG);
      expect(result.isDeliverable).toBe(true);
      // 15000 + (10-2) * 5000 = 55000
      expect(result.fee).toBe(55000);
    });
  });

  describe('out of range (> 10km)', () => {
    it('returns not deliverable for 10.1km', () => {
      const result = calcShippingFee(10.1, DEFAULT_CONFIG);
      expect(result.isDeliverable).toBe(false);
      expect(result.fee).toBe(0);
      expect(result.reason).toContain('vượt quá phạm vi');
    });

    it('returns not deliverable for 50km', () => {
      const result = calcShippingFee(50, DEFAULT_CONFIG);
      expect(result.isDeliverable).toBe(false);
    });
  });

  describe('custom config', () => {
    it('respects custom base fee and per km fee', () => {
      const customConfig = {
        deliveryBaseKm: 1,
        deliveryBaseFee: 20000,
        deliveryFeePerKm: 8000,
        deliveryMaxKm: 5,
      };
      const result = calcShippingFee(3, customConfig);
      expect(result.isDeliverable).toBe(true);
      // 20000 + (3-1) * 8000 = 36000
      expect(result.fee).toBe(36000);
    });
  });
});

describe('estimateDeliveryMinutes', () => {
  it('adds at least 10 minutes for preparation', () => {
    const mins = estimateDeliveryMinutes(1);
    expect(mins).toBeGreaterThanOrEqual(10);
  });

  it('increases with distance', () => {
    const short = estimateDeliveryMinutes(1);
    const long = estimateDeliveryMinutes(5);
    expect(long).toBeGreaterThan(short);
  });
});
