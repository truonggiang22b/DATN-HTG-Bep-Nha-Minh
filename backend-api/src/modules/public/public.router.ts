import { Router } from 'express';
import { resolveQr } from './qr.controller';
import { getMenu } from './menu.controller';
import { createOrder, trackOrder } from './order.controller';

export const publicRouter = Router();

publicRouter.get('/qr/:qrToken', resolveQr);
publicRouter.get('/branches/:branchId/menu', getMenu);
publicRouter.post('/orders', createOrder);
publicRouter.get('/orders/:orderId', trackOrder);
