import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/requireRole';
import { getActiveOrders, updateOrderStatus, getOrderHistory } from './orders.controller';
import { listCategories, createCategory, updateCategory } from './categories.controller';
import { listMenuItems, createMenuItem, updateMenuItem, updateMenuItemStatus } from './menuItems.controller';
import { listTables, createTable, updateTable } from './tables.controller';
import { resetTableSession } from './sessions.controller';
import { getMe } from '../auth/auth.controller';
import { upload, uploadImage } from './upload.controller';

export const internalRouter = Router();

// All internal routes require authentication
internalRouter.use(authMiddleware);

// ─── Me (any authenticated user) ─────────────────────────────────────────────
internalRouter.get('/me', getMe);

// ─── KDS — Kitchen/Staff (KITCHEN, MANAGER, ADMIN) ──────────────────────────
internalRouter.get(
  '/orders/active',
  requireRole('KITCHEN', 'MANAGER', 'ADMIN'),
  getActiveOrders
);
internalRouter.patch(
  '/orders/:id/status',
  requireRole('KITCHEN', 'MANAGER', 'ADMIN'),
  updateOrderStatus
);

// ─── Order History (MANAGER, ADMIN) ──────────────────────────────────────────
internalRouter.get(
  '/orders/history',
  requireRole('MANAGER', 'ADMIN'),
  getOrderHistory
);

// ─── Table Session Reset (MANAGER, ADMIN) ─────────────────────────────────────
internalRouter.post(
  '/tables/:id/reset-session',
  requireRole('MANAGER', 'ADMIN'),
  resetTableSession
);

// ─── Admin CRUD ───────────────────────────────────────────────────────────────
internalRouter.get('/categories', requireRole('ADMIN', 'MANAGER'), listCategories);
internalRouter.post('/categories', requireRole('ADMIN'), createCategory);
internalRouter.patch('/categories/:id', requireRole('ADMIN'), updateCategory);

internalRouter.get('/menu-items', requireRole('ADMIN', 'MANAGER'), listMenuItems);
internalRouter.post('/menu-items', requireRole('ADMIN'), createMenuItem);
internalRouter.patch('/menu-items/:id', requireRole('ADMIN'), updateMenuItem);
internalRouter.patch('/menu-items/:id/status', requireRole('ADMIN', 'MANAGER'), updateMenuItemStatus);

internalRouter.get('/tables', requireRole('ADMIN', 'MANAGER', 'KITCHEN'), listTables);
internalRouter.post('/tables', requireRole('ADMIN'), createTable);
internalRouter.patch('/tables/:id', requireRole('ADMIN'), updateTable);

// ─── File Upload ────────────────────────────────────────────────────────
internalRouter.post('/upload', requireRole('ADMIN', 'MANAGER'), upload.single('file'), uploadImage);
