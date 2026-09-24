import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const COOKIE_NAME = 'inventory_token';

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function sendAuthCookie(res, user) {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is missing. Add it to server/.env.');
  }

  const token = jwt.sign({ role: user.role }, env.jwtSecret, {
    subject: user._id.toString(),
    expiresIn: '7d',
  });

  res.cookie(COOKIE_NAME, token, cookieOptions);
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  });
}

export { COOKIE_NAME };
