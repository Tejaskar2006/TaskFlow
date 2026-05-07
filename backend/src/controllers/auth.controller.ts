import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/User.model';
import { sendTokenResponse } from '../utils/jwt.util';
import { sendSuccess, sendError } from '../utils/response.util';
import { createError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const { name, email, password } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      sendError(res, 'Email already registered. Please login.', 409);
      return;
    }

    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      sendError(res, 'Invalid email or password.', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Your account has been deactivated.', 403);
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      sendError(res, 'Invalid email or password.', 401);
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      next(createError('Not authenticated', 401));
      return;
    }
    sendSuccess(res, req.user, 'User fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      next(createError('Not authenticated', 401));
      return;
    }

    const updateSchema = z.object({
      name: z.string().min(2).max(50).optional(),
      bio: z.string().max(200).optional(),
      avatar: z.string().url().optional(),
    });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const user = await User.findByIdAndUpdate(req.user._id, parsed.data, {
      new: true,
      runValidators: true,
    });

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      next(createError('Not authenticated', 401));
      return;
    }

    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      next(createError('User not found', 404));
      return;
    }

    const isMatch = await user.comparePassword(parsed.data.currentPassword);
    if (!isMatch) {
      sendError(res, 'Current password is incorrect.', 400);
      return;
    }

    user.password = parsed.data.newPassword;
    await user.save();

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
