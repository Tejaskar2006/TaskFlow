import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: string;
  entityType: 'task' | 'project' | 'user';
  entityId: mongoose.Types.ObjectId;
  entityTitle: string;
  projectId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['task', 'project', 'user'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    entityTitle: {
      type: String,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    // Only keep createdAt, not updatedAt
  }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ projectId: 1, createdAt: -1 });
activityLogSchema.index({ entityId: 1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
