import { Router } from 'express';
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', getCart);
router.post('/items', addCartItem);
router.patch('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);
export default router;
