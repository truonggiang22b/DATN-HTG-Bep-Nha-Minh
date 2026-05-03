import { useEffect, useMemo, useState } from 'react';
import {
  connectOnlineTrackingStream,
  type RealtimeConnectionState,
  type RealtimeOrderEvent,
} from '../services/realtimeClient';

type UseRealtimeTrackingOptions = {
  orderId?: string;
  trackingToken?: string;
  onEvent: (event: RealtimeOrderEvent) => void;
};

export function useRealtimeTracking({ orderId, trackingToken, onEvent }: UseRealtimeTrackingOptions) {
  const enabled = Boolean(orderId && trackingToken);
  const [state, setState] = useState<RealtimeConnectionState>(enabled ? 'connecting' : 'closed');

  useEffect(() => {
    if (!orderId || !trackingToken) {
      setState('closed');
      return undefined;
    }

    return connectOnlineTrackingStream(orderId, trackingToken, {
      onEvent,
      onStateChange: setState,
    });
  }, [orderId, onEvent, trackingToken]);

  return useMemo(() => ({
    state,
    isRealtime: state === 'open',
    statusText: state === 'open' ? 'Đang cập nhật realtime' : 'Đang dùng cập nhật dự phòng',
  }), [state]);
}
