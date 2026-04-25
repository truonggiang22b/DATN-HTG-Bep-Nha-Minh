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
  listDeliveryOrdersService,
  updateDeliveryStatusService,
  getBranchDeliveryConfigService,
  updateBranchDeliveryConfigService,
} from './online-order.service';

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
  '/online-orders/:orderId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await getOnlineOrderService(req.params.orderId);
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
      const config = await getBranchDeliveryConfigService(req.params.branchId);
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
        req.params.id,
        input.deliveryStatus,
        input.reason
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
      const config = await getBranchDeliveryConfigService(req.params.id);
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
      const updated = await updateBranchDeliveryConfigService(req.params.id, input);
      return success(res, updated);
    } catch (err) {
      next(err);
    }
  }
);
