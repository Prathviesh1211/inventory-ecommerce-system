import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import authRouter from './routes/auth.routes.js';
import adminProductRouter from './routes/admin-product.routes.js';
import cartRouter from './routes/cart.routes.js';
import healthRouter from './routes/health.routes.js';
import orderRouter from './routes/order.routes.js';
import productRouter from './routes/product.routes.js';

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/admin', adminProductRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
