'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Loader2, Calendar, Flag, AlertCircle, Sparkles, Plus, Trash2, Bot } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useAIStore } from '@/store/aiStore';
import { ProjectMember } from '@/types';
import { PRIORITY_CONFIG, cn } from '@/lib/utils';

const taskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  estimatedHours: z.number().min(0).optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1),
    isCompleted: z.boolean().default(false),
  })).default([]),
});

type TaskFormValues = z.input<typeof taskSchema>;
type TaskFormData = z.output<typeof taskSchema>;

interface CreateTaskModalProps {
  projectId: string;
  members: ProjectMember[];
  onClose: () => void;
}

export default function CreateTaskModal({ projectId, members, onClose }: CreateTaskModalProps) {
  const { createTask } = useTaskStore();
  const { generateSubtasks, suggestPriority, isGenerating } = useAIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue, control } = useForm<TaskFormValues, unknown, TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium', subtasks: [] },
  });

  const selectedPriority = watch('priority');
  const taskTitle = watch('title');
  const taskDesc = watch('description');
  const taskDueDate = watch('dueDate');
  const currentSubtasks = watch('subtasks') || [];

  const handleAISuggestPriority = async () => {
    if (!taskTitle) {
      toast.error('Enter a task title first');
      return;
    }
    try {
      const priority = await suggestPriority(taskTitle, taskDesc, taskDueDate);
      setValue('priority', priority);
      toast.success(`AI suggested ${priority} priority`);
    } catch (err) {
      toast.error('AI suggestion failed');
    }
  };

  const handleAIGenerateSubtasks = async () => {
    if (!taskTitle) {
      toast.error('Enter a task title first');
      return;
    }
    try {
      const suggested = await generateSubtasks(taskTitle, taskDesc);
      const newSubtasks = suggested.map(title => ({ title, isCompleted: false }));
      setValue('subtasks', [...currentSubtasks, ...newSubtasks]);
      toast.success(`AI generated ${suggested.length} subtasks`);
    } catch (err) {
      toast.error('AI generation failed');
    }
  };

  const addManualSubtask = () => {
    setValue('subtasks', [...currentSubtasks, { title: '', isCompleted: false }]);
  };

  const removeSubtask = (index: number) => {
    setValue('subtasks', currentSubtasks.filter((_, i) => i !== index));
  };

  const updateSubtask = (index: number, title: string) => {
    const updated = [...currentSubtasks];
    updated[index].title = title;
    setValue('subtasks', updated);
  };

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      await createTask({
        ...data,
        projectId,
        assignedTo: data.assignedTo || null,
        status: 'todo',
      });
      toast.success('Task created successfully');
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-400" />
            Create New Task
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <form id="create-task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Task Title *</label>
              <input
                {...register('title')}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Update landing page copy"
                autoFocus
              />
              {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Add more details about this task..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> Priority</span>
                  <button
                    type="button"
                    onClick={handleAISuggestPriority}
                    disabled={isGenerating}
                    className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full transition-colors"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> AI Suggest
                  </button>
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setValue('priority', p)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        selectedPriority === p
                          ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border-current`
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Due Date
                </label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Assignee</label>
                <select
                  {...register('assignedTo')}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user._id} value={m.user._id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Est. Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('estimatedHours', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.0"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300 flex items-center gap-1.5">
                  Checklist
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAIGenerateSubtasks}
                    disabled={isGenerating}
                    className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <Bot className="w-2.5 h-2.5" /> AI Generate
                  </button>
                  <button
                    type="button"
                    onClick={addManualSubtask}
                    className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full transition-colors border border-slate-700"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add
                  </button>
                </div>
              </div>

              {currentSubtasks.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {currentSubtasks.map((st, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <div className="w-4 h-4 rounded border border-slate-700 bg-slate-800/50 flex-shrink-0" />
                      <input
                        value={st.title}
                        onChange={(e) => updateSubtask(idx, e.target.value)}
                        placeholder="Subtask title..."
                        className="flex-1 bg-transparent text-sm text-slate-300 focus:outline-none placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeSubtask(idx)}
                        className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-500 italic tracking-wide">No subtasks added yet.</p>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
