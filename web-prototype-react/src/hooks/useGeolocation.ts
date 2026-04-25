/**
 * useGeolocation.ts — Hook lấy tọa độ GPS của khách
 * Phase 2: Bếp Nhà Mình Online Ordering
 *
 * Dùng Browser Geolocation API (miễn phí, không cần API key).
 * Trả về trạng thái: idle | loading | success | error
 */

import { useState, useCallback } from 'react';

export type GeoStatus = 'idle' | 'loading' | 'success' | 'error';

export interface GeoState {
  status: GeoStatus;
  lat: number | null;
  lng: number | null;
  errorMsg: string | null;
}

export interface UseGeolocationReturn extends GeoState {
  requestLocation: () => void;
  reset: () => void;
}

const INITIAL_STATE: GeoState = {
  status: 'idle',
  lat: null,
  lng: null,
  errorMsg: null,
};

/**
 * Hook để yêu cầu vị trí GPS của người dùng.
 *
 * @example
 * const { status, lat, lng, requestLocation } = useGeolocation();
 * // gọi requestLocation() khi user nhấn nút "Xác định vị trí của tôi"
 */
export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeoState>(INITIAL_STATE);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        status: 'error',
        lat: null,
        lng: null,
        errorMsg: 'Trình duyệt của bạn không hỗ trợ định vị GPS',
      });
      return;
    }

    setState({ status: 'loading', lat: null, lng: null, errorMsg: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: 'success',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          errorMsg: null,
        });
      },
      (error) => {
        let msg = 'Không thể lấy vị trí của bạn';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Không thể xác định vị trí. Vui lòng kiểm tra GPS/WiFi.';
            break;
          case error.TIMEOUT:
            msg = 'Hết thời gian chờ lấy vị trí. Thử lại nhé.';
            break;
        }
        setState({ status: 'error', lat: null, lng: null, errorMsg: msg });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60_000, // cache vị trí trong 1 phút
      }
    );
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { ...state, requestLocation, reset };
}
