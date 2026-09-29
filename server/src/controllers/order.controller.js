import crypto from "node:crypto";
import mongoose from "mongoose";
import { InventoryHistory } from "../models/inventory-history.model.js";
import { OrderItem } from "../models/order-item.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Transaction } from "../models/transaction.model.js";
import { User } from "../models/user.model.js";
import { invalidateProductListCache } from "../services/product-cache.service.js";
import { AppError } from "../utils/app-error.js";

function orderResponse(order) {
  const source = order.toObject ? order.toObject() : order;
  return source;
}

export async function checkout(req, res) {
  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(req.user._id).session(session);

      if (!user) {
        throw new AppError("User not found.", 404);
      }

      if (user.cart.length === 0) {
        throw new AppError("Your cart is empty.", 400);
      }

      const purchasedItems = [];

      for (const cartItem of user.cart) {
        if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1) {
          throw new AppError("Cart contains an invalid quantity.", 400);
        }

        // Atomic conditional update: succeeds only when sufficient stock exists.
        const product = await Product.findOneAndUpdate(
          {
            _id: cartItem.product,
            status: "active",
            stock: { $gte: cartItem.quantity },
          },
          { $inc: { stock: -cartItem.quantity } },
          { new: true, session },
        );

        if (!product) {
          const exists = await Product.exists({
            _id: cartItem.product,
          }).session(session);

          if (!exists) {
            throw new AppError(
              "A product in your cart no longer exists.",
              404,
            );
          }

          throw new AppError(
            "One or more products have insufficient stock.",
            409,
          );
        }

        purchasedItems.push({
          product,
          quantity: cartItem.quantity,
          previousStock: product.stock + cartItem.quantity,
        });
      }

      const totalAmount = Number(
        purchasedItems
          .reduce(
            (total, item) => total + item.product.price * item.quantity,
            0,
          )
          .toFixed(2),
      );

      const [order] = await Order.create(
        [
          {
            orderNumber: `ORD-${Date.now()}-${crypto
              .randomUUID()
              .slice(0, 8)
              .toUpperCase()}`,
            user: user._id,
            items: [],
            totalAmount,
            status: "Placed",
          },
        ],
        { session, ordered: true },
      );

      const orderItems = await OrderItem.create(
        purchasedItems.map((item) => ({
          order: order._id,
          product: item.product._id,
          productName: item.product.name,
          sku: item.product.sku,
          unitPrice: item.product.price,
          quantity: item.quantity,
          lineTotal: Number(
            (item.product.price * item.quantity).toFixed(2),
          ),
        })),
        { session, ordered: true },
      );

      order.items = orderItems.map((item) => item._id);

      await order.save({ session });

      await Transaction.create(
        [
          {
            order: order._id,
            user: user._id,
            amount: totalAmount,
            paymentMethod: "Not Applicable",
            paymentStatus: "Not Required",
          },
        ],
        { session, ordered: true },
      );

      await InventoryHistory.create(
        purchasedItems.map((item) => ({
          product: item.product._id,
          previousStock: item.previousStock,
          changeAmount: -item.quantity,
          newStock: item.product.stock,
          reason: "order-placed",
          changedBy: user._id,
        })),
        { session, ordered: true },
      );

      user.cart = [];
      await user.save({ session });

      createdOrder = await Order.findById(order._id)
        .populate("items")
        .session(session);
    });
  } catch (error) {
    if (error?.errorLabels?.includes("TransientTransactionError")) {
      throw new AppError(
        "Checkout encountered a stock conflict. Please try again.",
        409,
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  await invalidateProductListCache();

  res.status(201).json({
    message: "Order placed successfully.",
    order: orderResponse(createdOrder),
  });
}

export async function getMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id })
    .populate("items")
    .sort({ createdAt: -1 });

  res.status(200).json({
    orders: orders.map(orderResponse),
  });
}

export async function getMyOrderById(req, res) {
  const order = await Order.findOne({
    _id: req.params.orderId,
    user: req.user._id,
  }).populate("items");

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  res.status(200).json({
    order: orderResponse(order),
  });
}