'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Loader2, FolderKanban } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useRouter } from 'next/navigation';

const projectSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex').default('#6366f1'),
});

type ProjectFormValues = z.input<typeof projectSchema>;
type ProjectFormData = z.output<typeof projectSchema>;

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#64748b'
];

interface CreateProjectModalProps {
  onClose: () => void;
}

export default function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const { createProject } = useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProjectFormValues, unknown, ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { color: '#6366f1' },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const newProject = await createProject(data);
      toast.success('Project created successfully');
      onClose();
      router.push(`/projects/${newProject._id}`);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            Create Project
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <form id="create-project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Title *</label>
              <input
                {...register('title')}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Website Redesign"
                autoFocus
              />
              {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="What is this project about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Project Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue('color', c)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                      selectedColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
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
            form="create-project-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
