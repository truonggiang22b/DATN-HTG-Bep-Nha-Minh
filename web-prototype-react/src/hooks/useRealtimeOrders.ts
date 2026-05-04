import { useEffect, useMemo, useState } from 'react';
import {
  connectInternalOrderStream,
  type RealtimeConnectionState,
  type RealtimeOrderEvent,
} from '../services/realtimeClient';

type UseRealtimeOrdersOptions = {
  enabled?: boolean;
  branchId?: string;
  onEvent: (event: RealtimeOrderEvent) => void;
};

export function useRealtimeOrders({ enabled = true, branchId, onEvent }: UseRealtimeOrdersOptions) {
  const [state, setState] = useState<RealtimeConnectionState>(enabled ? 'connecting' : 'closed');

  useEffect(() => {
    if (!enabled) {
      setState('closed');
      return undefined;
    }

    return connectInternalOrderStream({
      branchId,
      onEvent,
      onStateChange: setState,
    });
  }, [branchId, enabled, onEvent]);

  return useMemo(() => ({
    state,
    isRealtime: state === 'open',
    statusText: state === 'open' ? 'Đang cập nhật realtime' : 'Đang dùng cập nhật dự phòng',
  }), [state]);
}
