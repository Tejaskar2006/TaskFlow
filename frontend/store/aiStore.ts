import { create } from 'zustand';
import api from '@/lib/api';

interface AIStore {
  isGenerating: boolean;
  generateSubtasks: (title: string, description?: string) => Promise<string[]>;
  suggestPriority: (title: string, description?: string, dueDate?: string) => Promise<'low' | 'medium' | 'high'>;
  summarizeTask: (taskId: string) => Promise<string>;
}

export const useAIStore = create<AIStore>((set) => ({
  isGenerating: false,

  generateSubtasks: async (title, description) => {
    set({ isGenerating: true });
    try {
      const { data } = await api.post('/ai/subtasks', { title, description });
      return data.data;
    } catch (error) {
      console.error('AI Subtask Generation failed:', error);
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },

  suggestPriority: async (title, description, dueDate) => {
    set({ isGenerating: true });
    try {
      const { data } = await api.post('/ai/suggest-priority', { title, description, dueDate });
      return data.data.priority;
    } catch (error) {
      console.error('AI Priority Suggestion failed:', error);
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },

  summarizeTask: async (taskId) => {
    set({ isGenerating: true });
    try {
      const { data } = await api.get(`/ai/summarize/${taskId}`);
      return data.data.summary;
    } catch (error) {
      console.error('AI Summarization failed:', error);
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },
}));
