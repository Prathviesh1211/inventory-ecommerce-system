import mongoose from 'mongoose';
import { InventoryHistory } from '../models/inventory-history.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { Transaction } from '../models/transaction.model.js';
import { User } from '../models/user.model.js';
import { invalidateProductListCache } from '../services/product-cache.service.js';
import { AppError } from '../utils/app-error.js';
import { productResponse } from '../utils/product-response.js';

const ORDER_STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function orderResponse(order) {
  return order.toObject ? order.toObject() : order;
}

export async function getDashboard(req, res) {
  const [totalProducts, activeProducts, lowStockProducts, outOfStockProducts, totalUsers, totalOrders, statusCounts, revenue] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ stock: { $gt: 0, $lte: 5 }, status: 'active' }),
    Product.countDocuments({ stock: 0, status: 'active' }),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  res.status(200).json({
    products: { total: totalProducts, active: activeProducts, lowStock: lowStockProducts, outOfStock: outOfStockProducts },
    users: { total: totalUsers },
    orders: { total: totalOrders, byStatus: Object.fromEntries(statusCounts.map((item) => [item._id, item.count])) },
    revenue: revenue[0]?.total || 0,
  });
}

export async function getAdminOrders(req, res) {
  const query = {};
  if (ORDER_STATUSES.includes(req.query.status)) query.status = req.query.status;
  const orders = await Order.find(query).populate('user', 'name email role').populate('items').sort({ createdAt: -1 });
  res.status(200).json({ orders: orders.map(orderResponse) });
}

export async function getAdminOrderById(req, res) {
  const order = await Order.findById(req.params.orderId).populate('user', 'name email role').populate('items');
  if (!order) throw new AppError('Order not found.', 404);
  res.status(200).json({ order: orderResponse(order) });
}

export async function updateOrderStatus(req, res) {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${ORDER_STATUSES.join(', ')}.`, 400);
  }

  const session = await mongoose.startSession();
  let updatedOrder;
  let stockWasRestored = false;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.orderId).populate('items').session(session);
      if (!order) throw new AppError('Order not found.', 404);
      if (order.status === 'Cancelled' && status !== 'Cancelled') {
        throw new AppError('A cancelled order cannot be reopened.', 409);
      }

      // Cancellation returns items once. Keeping Cancelled terminal prevents accidental double restocking.
      if (status === 'Cancelled' && order.status !== 'Cancelled') {
        for (const item of order.items) {
          const product = await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { new: true, session },
          );
          if (!product) throw new AppError(`Product ${item.productName} no longer exists.`, 409);

          await InventoryHistory.create(
            [{
              product: product._id,
              previousStock: product.stock - item.quantity,
              changeAmount: item.quantity,
              newStock: product.stock,
              reason: 'order-cancelled',
              changedBy: req.user._id,
            }],
            { session },
          );
        }
        stockWasRestored = true;
      }

      order.status = status;
      await order.save({ session });
      updatedOrder = await Order.findById(order._id).populate('user', 'name email role').populate('items').session(session);
    });
  } finally {
    await session.endSession();
  }

  if (stockWasRestored) await invalidateProductListCache();
  res.status(200).json({ message: 'Order status updated.', order: orderResponse(updatedOrder) });
}

export async function getUsers(req, res) {
  const users = await User.find({}, 'name email role createdAt updatedAt').sort({ createdAt: -1 });
  res.status(200).json({ users });
}

export async function getTransactions(req, res) {
  const transactions = await Transaction.find().populate('order', 'orderNumber status totalAmount').populate('user', 'name email').sort({ createdAt: -1 });
  res.status(200).json({ transactions });
}

export async function getInventory(req, res) {
  const query = {};
  if (req.query.status === 'low') query.stock = { $gt: 0, $lte: 5 };
  if (req.query.status === 'out') query.stock = 0;
  const products = await Product.find(query).sort({ stock: 1, name: 1 });
  res.status(200).json({ products: products.map(productResponse) });
}

export async function getInventoryHistory(req, res) {
  const history = await InventoryHistory.find()
    .populate('product', 'name sku')
    .populate('changedBy', 'name email role')
    .sort({ createdAt: -1 });
  res.status(200).json({ history });
}
