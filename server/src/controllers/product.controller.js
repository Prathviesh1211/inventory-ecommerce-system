import { Product } from '../models/product.model.js';
import { cacheProductList, getCachedProductList, productListCacheKey } from '../services/product-cache.service.js';
import { AppError } from '../utils/app-error.js';
import { productResponse } from '../utils/product-response.js';

const SORT_OPTIONS = {
  newest: { createdAt: -1 }, oldest: { createdAt: 1 }, price_asc: { price: 1 },
  price_desc: { price: -1 }, name_asc: { name: 1 }, name_desc: { name: -1 },
};

function positiveInteger(value, fallback, maximum) {
  const parsed = Number(value);
  return !Number.isInteger(parsed) || parsed < 1 ? fallback : Math.min(parsed, maximum);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getProducts(req, res) {
  const page = positiveInteger(req.query.page, 1, 100000);
  const limit = positiveInteger(req.query.limit, 12, 50);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
  if (!SORT_OPTIONS[sort]) throw new AppError('Unsupported sort option.', 400);

  const filters = { page, limit, search: search.toLowerCase(), category: category.toLowerCase(), sort };
  const cacheKey = productListCacheKey(filters);
  const cachedResult = await getCachedProductList(cacheKey);
  if (cachedResult) return res.status(200).json({ ...cachedResult, fromCache: true });

  const query = { status: 'active' };
  if (category) query.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: 'i' };
    query.$or = [{ name: pattern }, { sku: pattern }, { description: pattern }];
  }
  const [products, total] = await Promise.all([
    Product.find(query).sort(SORT_OPTIONS[sort]).skip((page - 1) * limit).limit(limit), Product.countDocuments(query),
  ]);
  const result = { products: products.map(productResponse), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  await cacheProductList(cacheKey, result);
  res.status(200).json({ ...result, fromCache: false });
}

export async function getProductCategories(req, res) {
  const categories = await Product.distinct('category', { status: 'active' });
  res.status(200).json({ categories: categories.sort() });
}

export async function getProductById(req, res) {
  const product = await Product.findOne({ _id: req.params.productId, status: 'active' });
  if (!product) throw new AppError('Product not found.', 404);
  res.status(200).json({ product: productResponse(product) });
}
