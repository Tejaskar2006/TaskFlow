import { Response, NextFunction } from 'express';
import { User } from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError, getPaginationParams } from '../utils/response.util';
import { createError } from '../middleware/error.middleware';

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
    const { search } = req.query as { search?: string };

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, users, 'Users fetched successfully', 200, {
      total, page, limit, pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      next(createError('User not found', 404));
      return;
    }
    sendSuccess(res, user, 'User fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user!._id.toString() === id) {
      sendError(res, 'You cannot deactivate your own account.', 400);
      return;
    }

    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) {
      next(createError('User not found', 404));
      return;
    }

    sendSuccess(res, user, 'User deactivated successfully');
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email } = req.body;
    
    // Check if email is already taken by another user
    if (email && email !== req.user!.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        next(createError('Email already in use', 400));
        return;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user!._id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    sendSuccess(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};
