import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import authRouter from './routes/auth.routes.js';
import healthRouter from './routes/health.routes.js';

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
