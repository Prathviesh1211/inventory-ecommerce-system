import bcrypt from 'bcrypt';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { clearAuthCookie, sendAuthCookie } from '../utils/auth-cookie.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistrationInput({ name, email, password }) {
  if (!name?.trim() || name.trim().length < 2) {
    throw new AppError('Name must contain at least 2 characters.', 400);
  }
  if (!emailPattern.test(email || '')) {
    throw new AppError('Please provide a valid email address.', 400);
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  validateRegistrationInput({ name, email, password });

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.exists({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'user',
  });

  sendAuthCookie(res, user);
  res.status(201).json({ message: 'Registration successful.', user: publicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!emailPattern.test(email || '') || typeof password !== 'string') {
    throw new AppError('Email and password are required.', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));

  if (!passwordMatches) {
    throw new AppError('Invalid email or password.', 401);
  }

  sendAuthCookie(res, user);
  res.status(200).json({ message: 'Login successful.', user: publicUser(user) });
}

export function logout(req, res) {
  clearAuthCookie(res);
  res.status(200).json({ message: 'Logout successful.' });
}

export function getCurrentUser(req, res) {
  res.status(200).json({ user: publicUser(req.user) });
}
