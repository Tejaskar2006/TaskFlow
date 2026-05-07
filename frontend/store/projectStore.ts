'use client';

import { create } from 'zustand';
import api from '@/lib/api';
import { Project, CreateProjectInput, ApiResponse } from '@/types';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: { total: number; page: number; limit: number; pages: number } | null;

  fetchProjects: (page?: number, limit?: number) => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, data: Partial<CreateProjectInput & { status: string }>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMember: (projectId: string, email: string, role?: 'admin' | 'member') => Promise<void>;
  removeMember: (projectId: string, memberId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: null,

  fetchProjects: async (page = 1, limit = 100) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<ApiResponse<Project[]>>(`/projects?page=${page}&limit=${limit}`);
      set({ projects: data.data || [], pagination: data.pagination || null, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch projects';
      set({ error: message, isLoading: false });
    }
  },

  fetchProjectById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
      set({ currentProject: data.data || null, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch project';
      set({ error: message, isLoading: false });
    }
  },

  createProject: async (projectData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post<ApiResponse<Project>>('/projects', projectData);
      const newProject = data.data!;
      set((state) => ({ projects: [newProject, ...state.projects], isLoading: false }));
      return newProject;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create project';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  updateProject: async (id, updates) => {
    try {
      const { data } = await api.put<ApiResponse<Project>>(`/projects/${id}`, updates);
      const updated = data.data!;
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? updated : p)),
        currentProject: state.currentProject?._id === id ? updated : state.currentProject,
      }));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update project';
      set({ error: message });
      throw new Error(message);
    }
  },

  deleteProject: async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        currentProject: state.currentProject?._id === id ? null : state.currentProject,
      }));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete project';
      set({ error: message });
      throw new Error(message);
    }
  },

  addMember: async (projectId, email, role = 'member') => {
    try {
      const { data } = await api.post<ApiResponse<Project>>(`/projects/${projectId}/members`, { email, role });
      const updated = data.data!;
      set((state) => ({
        projects: state.projects.map((p) => (p._id === projectId ? updated : p)),
        currentProject: state.currentProject?._id === projectId ? updated : state.currentProject,
      }));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add member';
      throw new Error(message);
    }
  },

  removeMember: async (projectId, memberId) => {
    try {
      const { data } = await api.delete<ApiResponse<Project>>(`/projects/${projectId}/members/${memberId}`);
      const updated = data.data!;
      set((state) => ({
        projects: state.projects.map((p) => (p._id === projectId ? updated : p)),
        currentProject: state.currentProject?._id === projectId ? updated : state.currentProject,
      }));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to remove member';
      throw new Error(message);
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),
  clearError: () => set({ error: null }),

  // Expose getter for external use
  ...{ _get: get },
}));
