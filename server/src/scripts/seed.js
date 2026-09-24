import bcrypt from 'bcrypt';
import { connectDatabase } from '../config/database.js';
import { InventoryHistory } from '../models/inventory-history.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';

const sampleProducts = [
  ['Wireless Headphones', 'AUD-001', 'Comfortable over-ear headphones with clear sound.', 'Audio', 79.99, 20],
  ['Bluetooth Speaker', 'AUD-002', 'Portable speaker with all-day battery life.', 'Audio', 49.99, 3],
  ['USB-C Earbuds', 'AUD-003', 'Wired earbuds with an in-line microphone.', 'Audio', 19.99, 0],
  ['Mechanical Keyboard', 'CMP-001', 'Compact mechanical keyboard with tactile switches.', 'Computers', 89.99, 14],
  ['Wireless Mouse', 'CMP-002', 'Ergonomic wireless mouse for everyday work.', 'Computers', 29.99, 30],
  ['Laptop Stand', 'CMP-003', 'Adjustable aluminium stand for laptops.', 'Computers', 34.99, 5],
  ['27-inch Monitor', 'CMP-004', 'Full HD monitor with a slim bezel.', 'Computers', 179.99, 8],
  ['Smart LED Bulb', 'HOM-001', 'Dimmable colour-changing Wi-Fi bulb.', 'Home', 14.99, 26],
  ['Robot Vacuum', 'HOM-002', 'Compact vacuum with scheduled cleaning.', 'Home', 229.99, 4],
  ['Desk Lamp', 'HOM-003', 'LED desk lamp with adjustable brightness.', 'Home', 24.99, 16],
  ['Insulated Bottle', 'LIF-001', 'Stainless-steel bottle that keeps drinks cold.', 'Lifestyle', 22.99, 25],
  ['Canvas Backpack', 'LIF-002', 'Everyday backpack with padded laptop sleeve.', 'Lifestyle', 54.99, 9],
  ['Yoga Mat', 'LIF-003', 'Non-slip mat for home workouts.', 'Lifestyle', 31.99, 2],
  ['Phone Tripod', 'MOB-001', 'Foldable tripod for phones and compact cameras.', 'Mobile', 27.99, 17],
  ['Power Bank', 'MOB-002', '10,000 mAh portable battery pack.', 'Mobile', 39.99, 11],
];

async function upsertUser({ name, email, role }) {
  const passwordHash = await bcrypt.hash('Password123!', 12);
  return User.findOneAndUpdate(
    { email },
    { $set: { name, email, role, passwordHash } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function seed() {
  await connectDatabase();

  const admin = await upsertUser({ name: 'Admin User', email: 'admin@example.com', role: 'admin' });
  await upsertUser({ name: 'Aarav Sharma', email: 'aarav@example.com', role: 'user' });
  await upsertUser({ name: 'Maya Patel', email: 'maya@example.com', role: 'user' });

  for (const [name, sku, description, category, price, stock] of sampleProducts) {
    const product = await Product.findOneAndUpdate(
      { sku },
      { $set: { name, sku, description, category, price, stock, status: 'active' } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const historyExists = await InventoryHistory.exists({ product: product._id, reason: 'initial-stock' });
    if (!historyExists) {
      await InventoryHistory.create({
        product: product._id,
        previousStock: 0,
        changeAmount: stock,
        newStock: stock,
        reason: 'initial-stock',
        changedBy: admin._id,
      });
    }
  }

  console.log('Seed complete: 1 admin, 2 users, and 15 products.');
  console.log('Demo password for all seeded accounts: Password123!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
