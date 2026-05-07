import { Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Project } from '../models/Project.model';
import { Task } from '../models/Task.model';
import { User } from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError, getPaginationParams } from '../utils/response.util';
import { createError } from '../middleware/error.middleware';
import { logActivity } from '../utils/activity.util';
import { emitTaskUpdate } from '../config/socket';
import { Server } from 'socket.io';

const projectSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional().default('#6366f1'),
  dueDate: z.string().datetime({ offset: true }).optional(),
});

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);

    const filter = { 'members.user': user._id };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('createdBy', 'name email avatar')
        .populate('members.user', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    sendSuccess(res, projects, 'Projects fetched successfully', 200, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const project = await Project.create({
      ...parsed.data,
      createdBy: user._id,
      members: [{ user: user._id, role: 'admin' }],
    });

    // Add project to user's projects list
    await User.findByIdAndUpdate(user._id, { $push: { projects: project._id } });

    await logActivity({
      userId: user._id,
      action: 'created project',
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.title,
      projectId: project._id,
    });

    const populated = await project.populate([
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' },
    ]);

    sendSuccess(res, populated, 'Project created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      next(createError('Project not found', 404));
      return;
    }

    const isMember = project.members.some(m => m.user._id.toString() === user._id.toString());

    if (!isMember) {
      next(createError('Access denied. You are not a member of this project.', 403));
      return;
    }

    sendSuccess(res, project, 'Project fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      next(createError('Project not found', 404));
      return;
    }

    const isProjectAdmin = project.members.some(
      m => m.user.toString() === user._id.toString() && m.role === 'admin'
    );

    if (!isProjectAdmin) {
      next(createError('Only project admins can update this project.', 403));
      return;
    }

    const updateSchema = projectSchema.partial().extend({
      status: z.enum(['active', 'completed', 'archived']).optional(),
    });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const updated = await Project.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    })
      .populate('createdBy', 'name email avatar')
      .populate('members.user', 'name email avatar');

    await logActivity({
      userId: user._id,
      action: 'updated project',
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.title,
      projectId: project._id,
    });

    const io = req.app.get('io') as Server;
    emitTaskUpdate(io, id, 'project:updated', updated);

    sendSuccess(res, updated, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      next(createError('Project not found', 404));
      return;
    }

    const isProjectAdmin = project.members.some(
      m => m.user.toString() === user._id.toString() && m.role === 'admin'
    );
    
    if (!isProjectAdmin) {
      next(createError('Only project admins can delete this project.', 403));
      return;
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ projectId: id });

    // Remove project from all members
    const memberIds = project.members.map(m => m.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { projects: new mongoose.Types.ObjectId(id) } }
    );

    await project.deleteOne();

    await logActivity({
      userId: user._id,
      action: 'deleted project',
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.title,
    });

    sendSuccess(res, null, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const schema = z.object({
      email: z.string().email(),
      role: z.enum(['admin', 'member']).optional().default('member'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const project = await Project.findById(id);
    if (!project) {
      next(createError('Project not found', 404));
      return;
    }

    const isProjectAdmin = project.members.some(
      m => m.user.toString() === user._id.toString() && m.role === 'admin'
    );
    if (!isProjectAdmin) {
      next(createError('Only project admins can add members.', 403));
      return;
    }

    const memberUser = await User.findOne({ email: parsed.data.email });
    if (!memberUser) {
      sendError(res, 'User with this email not found.', 404);
      return;
    }

    const alreadyMember = project.members.some(
      m => m.user.toString() === memberUser._id.toString()
    );
    if (alreadyMember) {
      sendError(res, 'User is already a member of this project.', 409);
      return;
    }

    project.members.push({ user: memberUser._id, role: parsed.data.role, joinedAt: new Date() });
    await project.save();

    await User.findByIdAndUpdate(memberUser._id, { $addToSet: { projects: project._id } });

    await logActivity({
      userId: user._id,
      action: `added ${memberUser.name} as ${parsed.data.role}`,
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.title,
      projectId: project._id,
    });

    const updated = await Project.findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('members.user', 'name email avatar');

    sendSuccess(res, updated, 'Member added successfully');
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id, memberId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      next(createError('Project not found', 404));
      return;
    }

    const isProjectAdmin = project.members.some(
      m => m.user.toString() === user._id.toString() && m.role === 'admin'
    );
    if (!isProjectAdmin) {
      next(createError('Only project admins can remove members.', 403));
      return;
    }

    project.members = project.members.filter(m => m.user.toString() !== memberId);
    await project.save();

    await User.findByIdAndUpdate(memberId, { $pull: { projects: new mongoose.Types.ObjectId(id) } });

    const updated = await Project.findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('members.user', 'name email avatar');

    sendSuccess(res, updated, 'Member removed successfully');
  } catch (error) {
    next(error);
  }
};
