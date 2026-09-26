import { Router } from 'express';
import { checkout, getMyOrderById, getMyOrders } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.post('/checkout', checkout);
router.get('/', getMyOrders);
router.get('/:orderId', getMyOrderById);
export default router;
