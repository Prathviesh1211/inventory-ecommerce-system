import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is missing. Add it to server/.env before starting the API.');
  }

  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
