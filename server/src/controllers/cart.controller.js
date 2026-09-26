import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { cartResponse } from '../utils/cart-response.js';

function parseQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new AppError('Quantity must be a whole number between 1 and 100.', 400);
  }
  return quantity;
}

async function getUserCart(userId) {
  return User.findById(userId).populate({ path: 'cart.product', match: { status: 'active' } });
}

export async function getCart(req, res) {
  const user = await getUserCart(req.user._id);
  res.status(200).json({ cart: cartResponse(user) });
}

export async function addCartItem(req, res) {
  const { productId } = req.body;
  const quantity = parseQuantity(req.body.quantity);
  const product = await Product.findOne({ _id: productId, status: 'active' });
  if (!product) throw new AppError('Product not found or unavailable.', 404);

  const user = await User.findById(req.user._id);
  const existingItem = user.cart.find((item) => item.product.toString() === product._id.toString());
  const requestedQuantity = (existingItem?.quantity || 0) + quantity;
  if (requestedQuantity > product.stock) {
    throw new AppError('Requested quantity exceeds current available stock.', 400);
  }

  if (existingItem) existingItem.quantity = requestedQuantity;
  else user.cart.push({ product: product._id, quantity });
  await user.save();

  const populatedUser = await getUserCart(user._id);
  res.status(201).json({ message: 'Item added to cart.', cart: cartResponse(populatedUser) });
}

export async function updateCartItem(req, res) {
  const quantity = parseQuantity(req.body.quantity);
  const product = await Product.findOne({ _id: req.params.productId, status: 'active' });
  if (!product) throw new AppError('Product not found or unavailable.', 404);
  if (quantity > product.stock) throw new AppError('Requested quantity exceeds current available stock.', 400);

  const user = await User.findById(req.user._id);
  const item = user.cart.find((cartItem) => cartItem.product.toString() === product._id.toString());
  if (!item) throw new AppError('This product is not in your cart.', 404);

  item.quantity = quantity;
  await user.save();
  const populatedUser = await getUserCart(user._id);
  res.status(200).json({ message: 'Cart quantity updated.', cart: cartResponse(populatedUser) });
}

export async function removeCartItem(req, res) {
  const user = await User.findById(req.user._id);
  const originalLength = user.cart.length;
  user.cart = user.cart.filter((item) => item.product.toString() !== req.params.productId);
  if (user.cart.length === originalLength) throw new AppError('This product is not in your cart.', 404);

  await user.save();
  const populatedUser = await getUserCart(user._id);
  res.status(200).json({ message: 'Item removed from cart.', cart: cartResponse(populatedUser) });
}

export async function clearCart(req, res) {
  await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
  res.status(200).json({ message: 'Cart cleared.', cart: { items: [], totalItems: 0, subtotal: 0 } });
}
