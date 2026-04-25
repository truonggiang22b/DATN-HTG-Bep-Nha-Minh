import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { requireRole } from '../../middlewares/requireRole';
import { getActiveOrders, updateOrderStatus, getOrderHistory } from './orders.controller';
import { listCategories, createCategory, updateCategory, deleteCategory, restoreCategory } from './categories.controller';
import { listMenuItems, createMenuItem, updateMenuItem, updateMenuItemStatus, deleteMenuItem, restoreMenuItem } from './menuItems.controller';
import { listTables, createTable, updateTable, deactivateTable, restoreTable } from './tables.controller';
import { resetTableSession } from './sessions.controller';
import { getMe } from '../auth/auth.controller';
import { upload, uploadImage } from './upload.controller';
import { listStaff, createStaff, updateStaff, updateStaffStatus } from './users.controller';
import { onlineOrderInternalRouter } from '../public/online-orders/online-order.router';

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
internalRouter.delete('/categories/:id', requireRole('ADMIN'), deleteCategory);
internalRouter.patch('/categories/:id/restore', requireRole('ADMIN'), restoreCategory);

internalRouter.get('/menu-items', requireRole('ADMIN', 'MANAGER'), listMenuItems);
internalRouter.post('/menu-items', requireRole('ADMIN'), createMenuItem);
internalRouter.patch('/menu-items/:id', requireRole('ADMIN'), updateMenuItem);
internalRouter.patch('/menu-items/:id/status', requireRole('ADMIN', 'MANAGER'), updateMenuItemStatus);
internalRouter.delete('/menu-items/:id', requireRole('ADMIN'), deleteMenuItem);
internalRouter.patch('/menu-items/:id/restore', requireRole('ADMIN'), restoreMenuItem);

internalRouter.get('/tables', requireRole('ADMIN', 'MANAGER', 'KITCHEN'), listTables);
internalRouter.post('/tables', requireRole('ADMIN'), createTable);
internalRouter.patch('/tables/:id', requireRole('ADMIN'), updateTable);
internalRouter.delete('/tables/:id', requireRole('ADMIN'), deactivateTable);
internalRouter.patch('/tables/:id/restore', requireRole('ADMIN'), restoreTable);

// ─── Staff Management (ADMIN only) ───────────────────────────────────────────
internalRouter.get('/users', requireRole('ADMIN'), listStaff);
internalRouter.post('/users', requireRole('ADMIN'), createStaff);
internalRouter.patch('/users/:id', requireRole('ADMIN'), updateStaff);
internalRouter.patch('/users/:id/status', requireRole('ADMIN'), updateStaffStatus);

// ─── File Upload ────────────────────────────────────────────────────────
internalRouter.post('/upload', requireRole('ADMIN', 'MANAGER'), upload.single('file'), uploadImage);

// ─── Phase 2: Delivery Orders & Branch Config ──────────────────────────────────
// GET/PATCH /delivery-orders, GET/PATCH /branches/:id/delivery-config
internalRouter.use(
  '/',
  requireRole('KITCHEN', 'MANAGER', 'ADMIN'),
  onlineOrderInternalRouter
);
