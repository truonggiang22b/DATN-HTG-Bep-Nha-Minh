export type RealtimeOrderEvent = {
  type: 'order.created' | 'order.status.updated' | 'delivery.status.updated' | 'order.cancelled';
  orderId: string;
  orderCode: string;
  storeId: string;
  branchId: string;
  orderType: 'DINE_IN' | 'ONLINE';
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  deliveryStatus?: 'PENDING' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
  updatedAt: string;
};

export type RealtimeConnectionState = 'connecting' | 'open' | 'fallback' | 'closed';

type ConnectOptions = {
  path: string;
  auth?: 'internal' | 'public';
  onEvent: (event: RealtimeOrderEvent) => void;
  onStateChange?: (state: RealtimeConnectionState) => void;
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
const ACCESS_TOKEN_KEY = 'bnm-auth-token';
const REFRESH_TOKEN_KEY = 'bnm-refresh-token';

export function connectRealtimeStream(options: ConnectOptions) {
  let closed = false;
  let controller: AbortController | null = null;
  let reconnectTimer: number | null = null;
  let attempt = 0;
  let refreshTried = false;

  const setState = (state: RealtimeConnectionState) => options.onStateChange?.(state);

  const connect = async () => {
    if (closed) return;
    controller = new AbortController();
    setState('connecting');

    try {
      const response = await fetch(buildUrl(options.path), {
        method: 'GET',
        headers: buildHeaders(options.auth),
        signal: controller.signal,
      });

      if (response.status === 401 && options.auth === 'internal' && !refreshTried) {
        refreshTried = true;
        const refreshed = await refreshAccessToken();
        if (refreshed && !closed) {
          connect();
          return;
        }
      }

      if (!response.ok || !response.body) {
        throw new Error(`Realtime stream failed: ${response.status}`);
      }

      attempt = 0;
      refreshTried = false;
      setState('open');
      await readSseStream(response.body, options.onEvent);
      scheduleReconnect();
    } catch (err) {
      if (closed || isAbortError(err)) return;
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (closed) return;
    setState('fallback');
    const delay = Math.min(1_000 * 2 ** attempt, 10_000);
    attempt += 1;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  };

  connect();

  return () => {
    closed = true;
    setState('closed');
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
    }
    controller?.abort();
  };
}

export function connectInternalOrderStream(options: Omit<ConnectOptions, 'path' | 'auth'> & { branchId?: string }) {
  const query = options.branchId ? `?branchId=${encodeURIComponent(options.branchId)}` : '';
  return connectRealtimeStream({
    path: `/internal/events${query}`,
    auth: 'internal',
    onEvent: options.onEvent,
    onStateChange: options.onStateChange,
  });
}

export function connectOnlineTrackingStream(
  orderId: string,
  trackingToken: string,
  options: Omit<ConnectOptions, 'path' | 'auth'>
) {
  const token = encodeURIComponent(trackingToken);
  return connectRealtimeStream({
    path: `/public/online-orders/${encodeURIComponent(orderId)}/events?token=${token}`,
    auth: 'public',
    onEvent: options.onEvent,
    onStateChange: options.onStateChange,
  });
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildHeaders(auth: ConnectOptions['auth']) {
  const headers: Record<string, string> = { Accept: 'text/event-stream' };
  if (auth === 'internal') {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return false;
  const json = await response.json() as { data?: { accessToken?: string; refreshToken?: string } };
  const nextAccess = json.data?.accessToken;
  const nextRefresh = json.data?.refreshToken;
  if (!nextAccess || !nextRefresh) return false;

  localStorage.setItem(ACCESS_TOKEN_KEY, nextAccess);
  localStorage.setItem(REFRESH_TOKEN_KEY, nextRefresh);
  return true;
}

async function readSseStream(stream: ReadableStream<Uint8Array>, onEvent: (event: RealtimeOrderEvent) => void) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const parsed = parseSseFrame(frame);
      if (!parsed || parsed.eventName !== 'order') continue;

      const payload = JSON.parse(parsed.data) as unknown;
      if (isRealtimeOrderEvent(payload)) {
        onEvent(payload);
      }
    }
  }
}

function parseSseFrame(frame: string) {
  const data: string[] = [];
  let eventName = 'message';

  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      data.push(line.slice(5).trimStart());
    }
  }

  if (data.length === 0) return null;
  return { eventName, data: data.join('\n') };
}

function isRealtimeOrderEvent(value: unknown): value is RealtimeOrderEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<RealtimeOrderEvent>;
  return typeof event.type === 'string' && typeof event.orderId === 'string';
}

function isAbortError(err: unknown) {
  return err instanceof DOMException && err.name === 'AbortError';
}
