// ==================== User Types ====================
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  projects: string[];
  isActive: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Auth Types ====================
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// ==================== Project Types ====================
export interface ProjectMember {
  user: User;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Project {
  _id: string;
  title: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'archived';
  createdBy: User;
  members: ProjectMember[];
  tasks: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  color?: string;
  dueDate?: string;
}

// ==================== Task Types ====================
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface TaskComment {
  _id: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  assignedTo?: User;
  projectId: Project | string;
  createdBy: User;
  tags: string[];
  comments: TaskComment[];
  order: number;
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assignedTo?: string | null;
  projectId: string;
  tags?: string[];
  estimatedHours?: number;
}

// ==================== Dashboard Types ====================
export interface DashboardStats {
  overview: {
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
    myTasks: number;
    totalProjects: number;
    activeProjects: number;
    completionRate: number;
  };
  tasksByStatus: { name: string; value: number; color: string }[];
  tasksByPriority: { name: string; value: number; color: string }[];
  tasksPerUser: { _id: string; count: number; user: User }[];
  taskTrend: { _id: string; count: number }[];
  recentActivity: ActivityLog[];
}

// ==================== Activity Log ====================
export interface ActivityLog {
  _id: string;
  user: User;
  action: string;
  entityType: 'task' | 'project' | 'user';
  entityId: string;
  entityTitle: string;
  projectId?: string;
  createdAt: string;
}

// ==================== API Response ====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ==================== Kanban ====================
export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

// ==================== Filter / Query ====================
export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}
