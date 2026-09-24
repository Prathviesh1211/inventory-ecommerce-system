import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { COOKIE_NAME } from '../utils/auth-cookie.js';

export async function authenticate(req, res, next) {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    throw new AppError('Authentication is required.', 401);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new AppError('This user account no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Your session is invalid or has expired. Please log in again.', 401);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource.', 403));
    }
    next();
  };
}
