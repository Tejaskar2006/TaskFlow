import { Response, NextFunction } from 'express';
import { Task } from '../models/Task.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response.util';
import { createError } from '../middleware/error.middleware';
import * as aiUtil from '../utils/ai.util';

export const getAISubtasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description } = req.body;
    if (!title) {
      sendError(res, 'Task title is required', 400);
      return;
    }

    const subtasks = await aiUtil.generateSubtasks(title, description);
    sendSuccess(res, subtasks, 'AI subtasks generated successfully');
  } catch (error) {
    next(error);
  }
};

export const getAIPriority = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, dueDate } = req.body;
    const priority = await aiUtil.suggestPriority(title, description, dueDate ? new Date(dueDate) : undefined);
    sendSuccess(res, { priority }, 'AI priority suggested successfully');
  } catch (error) {
    next(error);
  }
};

export const getAISummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate('comments.user', 'name');
    
    if (!task) {
      next(createError('Task not found', 404));
      return;
    }

    if (task.comments.length === 0) {
      sendSuccess(res, { summary: 'No comments to summarize yet.' }, 'AI summary generated successfully');
      return;
    }

    const summary = await aiUtil.summarizeComments(task.comments);
    sendSuccess(res, { summary }, 'AI summary generated successfully');
  } catch (error) {
    next(error);
  }
};
