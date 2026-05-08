'use client';

import { create } from 'zustand';
import api from '@/lib/api';
import { Task, CreateTaskInput, TaskFilters, ApiResponse, TaskStatus } from '@/types';

interface TaskStore {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;
  pagination: { total: number; page: number; limit: number; pages: number } | null;

  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, data: Partial<CreateTaskInput>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus, order?: number) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
  setCurrentTask: (task: Task | null) => void;
  addTaskOptimistic: (task: Task) => void;
  updateTaskOptimistic: (task: Task) => void;
  removeTaskOptimistic: (taskId: string) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: null,

  fetchTasks: async (filters) => {
    const currentFilters = filters || get().filters;
    set({ isLoading: true, error: null, filters: currentFilters });
    try {
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, String(value));
      });

      const { data } = await api.get<ApiResponse<Task[]>>(`/tasks?${params.toString()}`);
      set({ tasks: data.data || [], pagination: data.pagination || null, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch tasks';
      set({ error: message, isLoading: false });
    }
  },

  createTask: async (taskData) => {
    try {
      const { data } = await api.post<ApiResponse<Task>>('/tasks', taskData);
      const newTask = data.data!;
      set((state) => {
        const existingIndex = state.tasks.findIndex((task) => task._id === newTask._id);
        if (existingIndex >= 0) {
          return {
            tasks: state.tasks.map((task) => (task._id === newTask._id ? newTask : task)),
          };
        }

        return { tasks: [newTask, ...state.tasks] };
      });
      return newTask;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create task';
      throw new Error(message);
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { data } = await api.put<ApiResponse<Task>>(`/tasks/${id}`, updates);
      const updated = data.data!;
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? updated : t)),
        currentTask: state.currentTask?._id === id ? updated : state.currentTask,
      }));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update task';
      throw new Error(message);
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== id),
        currentTask: state.currentTask?._id === id ? null : state.currentTask,
      }));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete task';
      throw new Error(message);
    }
  },

  updateTaskStatus: async (id, status, order) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === id ? { ...t, status, order: order ?? t.order } : t)),
    }));
    try {
      const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status, order });
      const updated = data.data!;
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? updated : t)),
      }));
    } catch (err: unknown) {
      // Revert optimistic
      await get().fetchTasks();
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update status';
      throw new Error(message);
    }
  },

  addComment: async (taskId, content) => {
    try {
      const { data } = await api.post<ApiResponse<Task>>(`/tasks/${taskId}/comments`, { content });
      const updated = data.data!;
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === taskId ? updated : t)),
        currentTask: state.currentTask?._id === taskId ? updated : state.currentTask,
      }));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add comment';
      throw new Error(message);
    }
  },

  setFilters: (filters) => set({ filters }),
  setCurrentTask: (task) => set({ currentTask: task }),
  addTaskOptimistic: (task) => set((state) => {
    const existingIndex = state.tasks.findIndex((currentTask) => currentTask._id === task._id);
    if (existingIndex >= 0) {
      return {
        tasks: state.tasks.map((currentTask) => (currentTask._id === task._id ? task : currentTask)),
      };
    }

    return { tasks: [task, ...state.tasks] };
  }),
  updateTaskOptimistic: (task) => set((state) => ({
    tasks: state.tasks.map((t) => (t._id === task._id ? task : t)),
    currentTask: state.currentTask?._id === task._id ? task : state.currentTask,
  })),
  removeTaskOptimistic: (taskId) => set((state) => ({ tasks: state.tasks.filter((t) => t._id !== taskId) })),
  clearError: () => set({ error: null }),
}));
