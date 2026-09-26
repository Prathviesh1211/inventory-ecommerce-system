import { InventoryHistory } from '../models/inventory-history.model.js';
import { Product } from '../models/product.model.js';
import { invalidateProductListCache } from '../services/product-cache.service.js';
import { AppError } from '../utils/app-error.js';
import { productResponse } from '../utils/product-response.js';

function numberField(value, fieldName, { integer = false, minimum = 0 } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed)) || parsed < minimum) throw new AppError(`${fieldName} must be a valid ${integer ? 'whole ' : ''}number of at least ${minimum}.`, 400);
  return parsed;
}
function textField(value, fieldName, maximum = 2000) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) throw new AppError(`${fieldName} is required and must be at most ${maximum} characters.`, 400);
  return value.trim();
}
function productValues(body, includeStock) {
  const values = { name: textField(body.name, 'Name', 160), sku: textField(body.sku, 'SKU', 80).toUpperCase(), description: textField(body.description, 'Description'), category: textField(body.category, 'Category', 80), price: numberField(body.price, 'Price'), image: typeof body.image === 'string' ? body.image.trim() : '' };
  if (includeStock) values.stock = numberField(body.stock, 'Stock', { integer: true });
  return values;
}

export async function getAdminProducts(req, res) {
  const query = {};
  if (['active', 'disabled'].includes(req.query.status)) query.status = req.query.status;
  if (req.query.inventory === 'low') query.stock = { $gt: 0, $lte: 5 };
  if (req.query.inventory === 'out') query.stock = 0;
  const products = await Product.find(query).sort({ createdAt: -1 });
  res.status(200).json({ products: products.map(productResponse) });
}

export async function createProduct(req, res) {
  const product = await Product.create(productValues(req.body, true));
  await InventoryHistory.create({ product: product._id, previousStock: 0, changeAmount: product.stock, newStock: product.stock, reason: 'initial-stock', changedBy: req.user._id });
  await invalidateProductListCache();
  res.status(201).json({ message: 'Product created.', product: productResponse(product) });
}

export async function updateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.productId, productValues(req.body, false), { new: true, runValidators: true });
  if (!product) throw new AppError('Product not found.', 404);
  await invalidateProductListCache();
  res.status(200).json({ message: 'Product updated.', product: productResponse(product) });
}

export async function changeProductStock(req, res) {
  const changeAmount = numberField(req.body.changeAmount, 'Stock change', { integer: true, minimum: -1000000 });
  if (changeAmount === 0) throw new AppError('Stock change cannot be zero.', 400);
  const stockCondition = changeAmount < 0 ? { $gte: Math.abs(changeAmount) } : { $gte: 0 };
  const product = await Product.findOneAndUpdate({ _id: req.params.productId, stock: stockCondition }, { $inc: { stock: changeAmount } }, { new: true, runValidators: true });
  if (!product) {
    if (!(await Product.exists({ _id: req.params.productId }))) throw new AppError('Product not found.', 404);
    throw new AppError('Stock cannot become negative.', 400);
  }
  await InventoryHistory.create({ product: product._id, previousStock: product.stock - changeAmount, changeAmount, newStock: product.stock, reason: 'admin-adjustment', changedBy: req.user._id });
  await invalidateProductListCache();
  res.status(200).json({ message: 'Stock updated.', product: productResponse(product) });
}

export async function disableProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.productId, { status: 'disabled' }, { new: true });
  if (!product) throw new AppError('Product not found.', 404);
  await invalidateProductListCache();
  res.status(200).json({ message: 'Product disabled.', product: productResponse(product) });
}
