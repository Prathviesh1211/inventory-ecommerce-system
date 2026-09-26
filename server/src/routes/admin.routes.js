import { Router } from 'express';
import {
  getAdminOrderById,
  getAdminOrders,
  getDashboard,
  getInventory,
  getInventoryHistory,
  getTransactions,
  getUsers,
  updateOrderStatus,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/dashboard', getDashboard);
router.get('/orders', getAdminOrders);
router.get('/orders/:orderId', getAdminOrderById);
router.patch('/orders/:orderId/status', updateOrderStatus);
router.get('/users', getUsers);
router.get('/transactions', getTransactions);
router.get('/inventory', getInventory);
router.get('/inventory/history', getInventoryHistory);
export default router;
