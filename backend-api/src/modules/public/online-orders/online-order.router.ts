/**
 * online-order.router.ts — Routes for online ordering (public + internal admin)
 * Phase 2: Bếp Nhà Mình Online Ordering
 *
 * Public routes (no auth):
 *   POST /api/public/delivery/estimate-fee
 *   POST /api/public/online-orders
 *   GET  /api/public/online-orders/:orderId
 *   GET  /api/public/branches/:branchId/delivery-config
 *
 * Internal/Admin routes (registered via internal.router.ts):
 *   GET   /api/internal/delivery-orders
 *   PATCH /api/internal/delivery-orders/:id/status
 *   GET   /api/internal/branches/:id/delivery-config
 *   PATCH /api/internal/branches/:id/delivery-config
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/errors';
import { success } from '../../../utils/apiResponse';
import {
  estimateFeeSchema,
  createOnlineOrderSchema,
  updateDeliveryStatusSchema,
  updateDeliveryConfigSchema,
} from './online-order.schema';
import {
  estimateDeliveryFeeService,
  createOnlineOrderService,
  getOnlineOrderService,
  verifyOnlineOrderTrackingAccessService,
  listDeliveryOrdersService,
  updateDeliveryStatusService,
  getBranchDeliveryConfigService,
  updateBranchDeliveryConfigService,
} from './online-order.service';
import { subscribePublicOrderEvents } from '../../realtime/realtime.bus';

export const onlineOrderPublicRouter = Router();

// ─── POST /delivery/estimate-fee ──────────────────────────────────────────────
onlineOrderPublicRouter.post(
  '/delivery/estimate-fee',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = estimateFeeSchema.parse(req.body);
      const result = await estimateDeliveryFeeService(input);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /online-orders ──────────────────────────────────────────────────────
onlineOrderPublicRouter.post(
  '/online-orders',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createOnlineOrderSchema.parse(req.body);
      const result = await createOnlineOrderService(input);
      return success(res, result, result.isIdempotent ? 200 : 201);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /online-orders/:orderId ─────────────────────────────────────────────
onlineOrderPublicRouter.get(
  '/online-orders/:orderId/events',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = routeParam(req.params.orderId, 'orderId');
      const { token } = req.query as { token?: string };
      if (!token) {
        throw AppError.badRequest('MISSING_TOKEN', 'Can token de xem don hang');
      }
      await verifyOnlineOrderTrackingAccessService(orderId, token);
      subscribePublicOrderEvents(req, res, orderId);
    } catch (err) {
      next(err);
    }
  }
);

onlineOrderPublicRouter.get(
  '/online-orders/:orderId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = routeParam(req.params.orderId, 'orderId');
      const { token } = req.query as { token?: string };
      if (!token) {
        throw AppError.badRequest('MISSING_TOKEN', 'Can token de xem don hang');
      }
      const order = await getOnlineOrderService(orderId, token);
      return success(res, order);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /branches/:branchId/delivery-config ──────────────────────────────────
onlineOrderPublicRouter.get(
  '/branches/:branchId/delivery-config',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await getBranchDeliveryConfigService(routeParam(req.params.branchId, 'branchId'));
      return success(res, config);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Internal (Admin) routes ─────────────────────────────────────────────────
// These are registered in internal.router.ts under authMiddleware + requireRole

export const onlineOrderInternalRouter = Router();

// GET /delivery-orders
onlineOrderInternalRouter.get(
  '/delivery-orders',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as Request & { user?: { storeId?: string } }).user;
      const storeId = user?.storeId;
      if (!storeId) throw new Error('storeId missing from JWT');

      const orders = await listDeliveryOrdersService({
        storeId,
        branchId: req.query.branchId as string | undefined,
        deliveryStatus: req.query.deliveryStatus as string | undefined,
        date: req.query.date as string | undefined,
      });
      return success(res, { orders });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /delivery-orders/:id/status
onlineOrderInternalRouter.patch(
  '/delivery-orders/:id/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateDeliveryStatusSchema.parse(req.body);
      const result = await updateDeliveryStatusService(
        routeParam(req.params.id, 'id'),
        input.deliveryStatus,
        input.reason,
        req.user?.storeId
      );
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /branches/:id/delivery-config
onlineOrderInternalRouter.get(
  '/branches/:id/delivery-config',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      assertManagerOrAdmin(req);
      const config = await getBranchDeliveryConfigService(routeParam(req.params.id, 'id'), req.user?.storeId);
      return success(res, config);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /branches/:id/delivery-config
onlineOrderInternalRouter.patch(
  '/branches/:id/delivery-config',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateDeliveryConfigSchema.parse(req.body);
      assertManagerOrAdmin(req);
      const updated = await updateBranchDeliveryConfigService(routeParam(req.params.id, 'id'), input, req.user?.storeId);
      return success(res, updated);
    } catch (err) {
      next(err);
    }
  }
);

function assertManagerOrAdmin(req: Request) {
  const roles = req.user?.roles ?? [];
  if (!roles.includes('ADMIN') && !roles.includes('MANAGER')) {
    throw AppError.forbidden('Requires ADMIN or MANAGER role');
  }
}

function routeParam(value: string | string[], name: string) {
  if (Array.isArray(value)) {
    throw AppError.badRequest('VALIDATION_ERROR', `${name} must be a string`);
  }
  return value;
}
