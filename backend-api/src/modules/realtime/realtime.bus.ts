import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import type { RealtimeOrderEvent } from './realtime.types';

type InternalClient = {
  id: string;
  kind: 'internal';
  res: Response;
  storeId: string;
  branchId?: string;
  heartbeat: NodeJS.Timeout;
};

type PublicClient = {
  id: string;
  kind: 'public';
  res: Response;
  orderId: string;
  heartbeat: NodeJS.Timeout;
};

type RealtimeClient = InternalClient | PublicClient;

const clients = new Map<string, RealtimeClient>();
const HEARTBEAT_MS = 25_000;

export function subscribeInternalOrderEvents(
  req: Request,
  res: Response,
  scope: { storeId: string; branchId?: string }
) {
  const client = registerClient(req, res, {
    kind: 'internal',
    storeId: scope.storeId,
    branchId: scope.branchId,
  });

  return () => unregisterClient(client.id);
}

export function subscribePublicOrderEvents(req: Request, res: Response, orderId: string) {
  const client = registerClient(req, res, {
    kind: 'public',
    orderId,
  });

  return () => unregisterClient(client.id);
}

export function publishOrderEvent(event: RealtimeOrderEvent) {
  for (const client of clients.values()) {
    if (!shouldReceive(client, event)) continue;
    sendEvent(client, event);
  }
}

function registerClient(
  req: Request,
  res: Response,
  scope: Omit<InternalClient, 'id' | 'res' | 'heartbeat'> | Omit<PublicClient, 'id' | 'res' | 'heartbeat'>
) {
  prepareSseResponse(res);

  const id = randomUUID();
  const heartbeat = setInterval(() => {
    safeWrite(id, res, ': heartbeat\n\n');
  }, HEARTBEAT_MS);

  const client = { id, res, heartbeat, ...scope } as RealtimeClient;
  clients.set(id, client);

  safeWrite(id, res, `event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  req.on('close', () => unregisterClient(id));
  req.on('aborted', () => unregisterClient(id));

  return client;
}

function prepareSseResponse(res: Response) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
}

function unregisterClient(id: string) {
  const client = clients.get(id);
  if (!client) return;

  clearInterval(client.heartbeat);
  clients.delete(id);
  if (!client.res.destroyed) {
    client.res.end();
  }
}

function shouldReceive(client: RealtimeClient, event: RealtimeOrderEvent) {
  if (client.kind === 'public') {
    return client.orderId === event.orderId;
  }

  return client.storeId === event.storeId && (!client.branchId || client.branchId === event.branchId);
}

function sendEvent(client: RealtimeClient, event: RealtimeOrderEvent) {
  safeWrite(client.id, client.res, `event: order\ndata: ${JSON.stringify(event)}\n\n`);
}

function safeWrite(id: string, res: Response, payload: string) {
  try {
    if (res.destroyed || res.writableEnded) {
      unregisterClient(id);
      return;
    }
    res.write(payload);
  } catch {
    unregisterClient(id);
  }
}
