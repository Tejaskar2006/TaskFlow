import { ActivityLog } from '../models/ActivityLog.model';
import mongoose from 'mongoose';

interface LogActivityParams {
  userId: mongoose.Types.ObjectId;
  action: string;
  entityType: 'task' | 'project' | 'user';
  entityId: mongoose.Types.ObjectId;
  entityTitle: string;
  projectId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await ActivityLog.create(params);
  } catch (error) {
    // Non-critical — don't throw
    console.error('Failed to log activity:', error);
  }
};
