import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, beforeEach, test } from 'node:test';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { InventoryHistory } from '../src/models/inventory-history.model.js';
import { OrderItem } from '../src/models/order-item.model.js';
import { Order } from '../src/models/order.model.js';
import { Product } from '../src/models/product.model.js';
import { Transaction } from '../src/models/transaction.model.js';
import { User } from '../src/models/user.model.js';
import { connectRedis, redisClient } from '../src/config/redis.js';
import { invalidateProductListCache } from '../src/services/product-cache.service.js';

const testUri = process.env.MONGODB_URI_TEST;

if (!testUri) {
  test('integration tests require MONGODB_URI_TEST', { skip: 'Create server/.env.test with a dedicated test database URI.' }, () => {});
} else {
  let server;
  let baseUrl;

  async function request(path, { method = 'GET', body, cookie } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get('set-cookie')?.split(';')[0],
    };
  }

  async function registerUser(name, email) {
    const response = await request('/api/auth/register', {
      method: 'POST', body: { name, email, password: 'Password123!' },
    });
    assert.equal(response.status, 201);
    return response;
  }

  async function createProduct({ stock = 5, price = 100 } = {}) {
    return Product.create({
      name: 'Test Product', sku: `TEST-${new mongoose.Types.ObjectId().toString().slice(-8)}`,
      description: 'A product used only by integration tests.', category: 'Testing', price, stock,
    });
  }

  before(async () => {
    if (!/\/[^/?]*test[^/?]*(?:\?|$)/i.test(testUri)) {
      throw new Error('MONGODB_URI_TEST must point to a database whose name contains "test".');
    }
    await mongoose.connect(testUri);
    await Promise.all([User.init(), Product.init(), Order.init(), OrderItem.init(), Transaction.init(), InventoryHistory.init()]);
    
    await connectRedis();


    server = http.createServer(app);

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await invalidateProductListCache();
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
      if (redisClient?.isOpen) {
    await redisClient.quit();
  }
    await mongoose.disconnect();
  });

  test('registers, logs in, and rejects invalid credentials', async () => {
    const registered = await registerUser('Test User', 'test@example.com');
    assert.equal(registered.body.user.role, 'user');
    assert.ok(registered.cookie);

    const currentUser = await request('/api/auth/me', { cookie: registered.cookie });
    assert.equal(currentUser.status, 200);
    assert.equal(currentUser.body.user.email, 'test@example.com');

    const invalidLogin = await request('/api/auth/login', {
      method: 'POST', body: { email: 'test@example.com', password: 'WrongPassword!' },
    });
    assert.equal(invalidLogin.status, 401);
  });

  test('enforces admin authorization', async () => {
    const user = await registerUser('Regular User', 'user@example.com');
    const forbidden = await request('/api/admin/users', { cookie: user.cookie });
    assert.equal(forbidden.status, 403);

    await User.create({
      name: 'Admin User', email: 'admin@example.com', role: 'admin', passwordHash: await bcrypt.hash('Password123!', 12),
    });
    const adminLogin = await request('/api/auth/login', {
      method: 'POST', body: { email: 'admin@example.com', password: 'Password123!' },
    });
    const permitted = await request('/api/admin/users', { cookie: adminLogin.cookie });
    assert.equal(permitted.status, 200);
  });

  test('allows stock adjustments but never negative stock', async () => {
    const admin = await User.create({
      name: 'Admin User', email: 'admin@example.com', role: 'admin', passwordHash: await bcrypt.hash('Password123!', 12),
    });
    const login = await request('/api/auth/login', { method: 'POST', body: { email: admin.email, password: 'Password123!' } });
    const product = await createProduct({ stock: 3 });

    const decrease = await request(`/api/admin/products/${product._id}/stock`, { method: 'PATCH', cookie: login.cookie, body: { changeAmount: -2 } });
    assert.equal(decrease.status, 200);
    assert.equal(decrease.body.product.stock, 1);

    const negative = await request(`/api/admin/products/${product._id}/stock`, { method: 'PATCH', cookie: login.cookie, body: { changeAmount: -2 } });
    assert.equal(negative.status, 400);
    assert.equal((await Product.findById(product._id)).stock, 1);
  });

  test('uses Redis product caching when REDIS_URL is configured', { skip: !process.env.REDIS_URL }, async () => {
    await createProduct({ stock: 4 });
    const firstRequest = await request('/api/products');
    const secondRequest = await request('/api/products');
    assert.equal(firstRequest.body.fromCache, false);
    assert.equal(secondRequest.body.fromCache, true);
  });

  test('uses database prices and prevents another user viewing an order', async () => {
    const product = await createProduct({ stock: 2, price: 100 });
    const buyer = await registerUser('Buyer One', 'buyer1@example.com');
    await request('/api/cart/items', { method: 'POST', cookie: buyer.cookie, body: { productId: product._id, quantity: 1 } });

    // price is deliberately supplied but checkout does not accept it; MongoDB's price remains authoritative.
    const checkout = await request('/api/orders/checkout', { method: 'POST', cookie: buyer.cookie, body: { price: 1 } });
    assert.equal(checkout.status, 201);
    assert.equal(checkout.body.order.totalAmount, 100);
    assert.equal((await Product.findById(product._id)).stock, 1);

    const otherUser = await registerUser('Buyer Two', 'buyer2@example.com');
    const forbiddenOrder = await request(`/api/orders/${checkout.body.order._id}`, { cookie: otherUser.cookie });
    assert.equal(forbiddenOrder.status, 404);
  });

  test('allows only one concurrent checkout for the final unit', async () => {
    const product = await createProduct({ stock: 1, price: 50 });
    const firstBuyer = await registerUser('First Buyer', 'first@example.com');
    const secondBuyer = await registerUser('Second Buyer', 'second@example.com');
    await request('/api/cart/items', { method: 'POST', cookie: firstBuyer.cookie, body: { productId: product._id, quantity: 1 } });
    await request('/api/cart/items', { method: 'POST', cookie: secondBuyer.cookie, body: { productId: product._id, quantity: 1 } });

    const results = await Promise.all([
      request('/api/orders/checkout', { method: 'POST', cookie: firstBuyer.cookie }),
      request('/api/orders/checkout', { method: 'POST', cookie: secondBuyer.cookie }),
    ]);
    assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
    assert.equal((await Product.findById(product._id)).stock, 0);
  });
}
