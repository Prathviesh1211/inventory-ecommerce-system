import { Router } from 'express';
import { getProductById, getProductCategories, getProducts } from '../controllers/product.controller.js';
const router = Router();
router.get('/', getProducts);
router.get('/categories', getProductCategories);
router.get('/:productId', getProductById);
export default router;
