import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task.model';
import { Project } from '../models/Project.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError, getPaginationParams } from '../utils/response.util';
import { createError } from '../middleware/error.middleware';
import { logActivity } from '../utils/activity.util';
import { emitTaskUpdate, emitUserNotification } from '../config/socket';
import { Server } from 'socket.io';

const taskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  projectId: z.string().min(1, 'Project ID is required'),
  tags: z.array(z.string()).optional().default([]),
  estimatedHours: z.number().min(0).optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1),
    isCompleted: z.boolean().default(false),
  })).optional().default([]),
});

// Helper: check project membership
const checkProjectAccess = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) return null;

  const isMember = project.members.some(m => m.user.toString() === userId);
  if (!isMember) return null;

  return project;
};

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);

    const { projectId, status, priority, assignedTo, search } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};

    if (projectId) {
      filter.projectId = projectId;
    } else {
      // Regular members see only tasks from their projects
      filter.projectId = { $in: user.projects };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo === 'me' ? user._id : assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .populate('projectId', 'title color')
        .populate('comments.user', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    sendSuccess(res, tasks, 'Tasks fetched successfully', 200, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    const parsed = taskSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const project = await checkProjectAccess(parsed.data.projectId, user._id.toString());
    if (!project) {
      next(createError('Project not found or access denied.', 404));
      return;
    }

    // Only admins can create tasks (RBAC)
    const isProjectAdmin = project.members.some(
      m => m.user.toString() === user._id.toString() && m.role === 'admin'
    );
    if (!isProjectAdmin) {
      next(createError('Only project admins can create tasks.', 403));
      return;
    }

    // Get highest order for the status column
    const lastTask = await Task.findOne({ projectId: parsed.data.projectId, status: parsed.data.status })
      .sort({ order: -1 });
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      ...parsed.data,
      assignedTo: parsed.data.assignedTo || null,
      createdBy: user._id,
      order,
    });

    // Add task to project
    await Project.findByIdAndUpdate(parsed.data.projectId, { $push: { tasks: task._id } });

    await logActivity({
      userId: user._id,
      action: 'created task',
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
      projectId: project._id,
    });

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'projectId', select: 'title color' },
    ]);

    // Real-time update
    const io = req.app.get('io') as Server;
    emitTaskUpdate(io, parsed.data.projectId, 'task:created', populated);

    // Notify assigned user
    if (parsed.data.assignedTo) {
      emitUserNotification(io, parsed.data.assignedTo, 'task:assigned', {
        task: populated,
        message: `You have been assigned a new task: "${task.title}"`,
      });
    }

    sendSuccess(res, populated, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      next(createError('Task not found', 404));
      return;
    }

    const project = await checkProjectAccess(task.projectId.toString(), user._id.toString());
    if (!project) {
      next(createError('Access denied.', 403));
      return;
    }

    const isProjectAdmin = project.members.some(
      m => m.user.toString() === user._id.toString() && m.role === 'admin'
    );

    // Members can only update status of their own tasks
    if (!isProjectAdmin) {
      const isAssigned = task.assignedTo?.toString() === user._id.toString();
      if (!isAssigned) {
        next(createError('You can only update tasks assigned to you.', 403));
        return;
      }
      // Members can only change status
      const allowedFields = ['status'];
      const requestedFields = Object.keys(req.body);
      const forbidden = requestedFields.filter(f => !allowedFields.includes(f));
      if (forbidden.length > 0) {
        next(createError(`Members can only update: ${allowedFields.join(', ')}`, 403));
        return;
      }
    }

    const updateSchema = taskSchema.partial().omit({ projectId: true });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const updated = await Task.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'title color')
      .populate('comments.user', 'name email avatar');

    await logActivity({
      userId: user._id,
      action: 'updated task',
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
      projectId: task.projectId,
    });

    const io = req.app.get('io') as Server;
    emitTaskUpdate(io, task.projectId.toString(), 'task:updated', updated);

    sendSuccess(res, updated, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      next(createError('Task not found', 404));
      return;
    }

    const project = await checkProjectAccess(task.projectId.toString(), user._id.toString());
    if (!project) {
      next(createError('Access denied.', 403));
      return;
    }

    const isProjectAdmin = project.members.some(
      m => m.user.toString() === user._id.toString() && m.role === 'admin'
    );
    if (!isProjectAdmin) {
      next(createError('Only project admins can delete tasks.', 403));
      return;
    }

    await task.deleteOne();
    await Project.findByIdAndUpdate(task.projectId, { $pull: { tasks: task._id } });

    await logActivity({
      userId: user._id,
      action: 'deleted task',
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
      projectId: task.projectId,
    });

    const io = req.app.get('io') as Server;
    emitTaskUpdate(io, task.projectId.toString(), 'task:deleted', { taskId: id });

    sendSuccess(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const schema = z.object({
      status: z.enum(['todo', 'in_progress', 'done']),
      order: z.number().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      next(createError('Task not found', 404));
      return;
    }

    const project = await checkProjectAccess(task.projectId.toString(), user._id.toString());
    if (!project) {
      next(createError('Access denied.', 403));
      return;
    }

    const updated = await Task.findByIdAndUpdate(id, parsed.data, { new: true })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'title color')
      .populate('comments.user', 'name email avatar');

    await logActivity({
      userId: user._id,
      action: `moved task to ${parsed.data.status}`,
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
      projectId: task.projectId,
    });

    const io = req.app.get('io') as Server;
    emitTaskUpdate(io, task.projectId.toString(), 'task:status_changed', updated);

    sendSuccess(res, updated, 'Task status updated');
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const schema = z.object({ content: z.string().min(1).max(1000) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map(e => e.message).join(', '), 400);
      return;
    }

    const task = await Task.findById(id);
    if (!task) {
      next(createError('Task not found', 404));
      return;
    }

    task.comments.push({ user: user._id, content: parsed.data.content } as never);
    await task.save();

    const updated = await Task.findById(id)
      .populate('comments.user', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'title color');

    const io = req.app.get('io') as Server;
    emitTaskUpdate(io, task.projectId.toString(), 'task:comment_added', updated);

    sendSuccess(res, updated, 'Comment added successfully');
  } catch (error) {
    next(error);
  }
};
