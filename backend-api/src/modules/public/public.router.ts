import { Router } from 'express';
import { resolveQr } from './qr.controller';
import { getMenu } from './menu.controller';
import { createOrder, streamOrderEvents, trackOrder } from './order.controller';
import { onlineOrderPublicRouter } from './online-orders/online-order.router';

export const publicRouter = Router();

// ─── Phase 1: QR Dine-in (unchanged) ──────────────────────────────────────────
publicRouter.get('/qr/:qrToken', resolveQr);
publicRouter.get('/branches/:branchId/menu', getMenu);
publicRouter.post('/orders', createOrder);
publicRouter.get('/orders/:orderId/events', streamOrderEvents);
publicRouter.get('/orders/:orderId', trackOrder);

// ─── Phase 2: Online Ordering (new) ───────────────────────────────────────────
publicRouter.use('/', onlineOrderPublicRouter);

