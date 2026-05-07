import { Response, NextFunction } from 'express';
import { Task } from '../models/Task.model';
import { Project } from '../models/Project.model';
import { ActivityLog } from '../models/ActivityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response.util';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const now = new Date();

    // Filter projects where the user is a member
    const projectFilter = { 'members.user': user._id };
    const projects = await Project.find(projectFilter).select('_id');
    const projectIds = projects.map(p => p._id);

    // Filter tasks belonging to those projects
    const taskFilter = { projectId: { $in: projectIds } };

    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      highPriorityTasks,
      myTasks,
      totalProjects,
      activeProjects,
      recentActivity,
      tasksByPriority,
      taskTrend,
    ] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'todo' }),
      Task.countDocuments({ ...taskFilter, status: 'in_progress' }),
      Task.countDocuments({ ...taskFilter, status: 'done' }),
      Task.countDocuments({ ...taskFilter, dueDate: { $lt: now }, status: { $ne: 'done' } }),
      Task.countDocuments({ ...taskFilter, priority: 'high', status: { $ne: 'done' } }),
      Task.countDocuments({ ...taskFilter, assignedTo: user._id }),
      Project.countDocuments(projectFilter),
      Project.countDocuments({ ...projectFilter, status: 'active' }),
      ActivityLog.find({ projectId: { $in: projectIds } })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Tasks by priority
      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      // Tasks created in last 7 days
      Task.aggregate([
        {
          $match: {
            ...taskFilter,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Tasks per user (top 5)
    const tasksPerUser = await Task.aggregate([
      { $match: { ...taskFilter, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
        },
      },
      { $unwind: '$user' },
    ]);

    const stats = {
      overview: {
        totalTasks,
        todoTasks,
        inProgressTasks,
        doneTasks,
        overdueTasks,
        highPriorityTasks,
        myTasks,
        totalProjects,
        activeProjects,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
      tasksByStatus: [
        { name: 'To Do', value: todoTasks, color: '#94a3b8' },
        { name: 'In Progress', value: inProgressTasks, color: '#f59e0b' },
        { name: 'Done', value: doneTasks, color: '#10b981' },
      ],
      tasksByPriority: tasksByPriority.map(item => ({
        name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
        value: item.count,
        color: item._id === 'high' ? '#ef4444' : item._id === 'medium' ? '#f59e0b' : '#10b981',
      })),
      tasksPerUser,
      taskTrend,
      recentActivity,
    };

    sendSuccess(res, stats, 'Dashboard stats fetched successfully');
  } catch (error) {
    next(error);
  }
};
