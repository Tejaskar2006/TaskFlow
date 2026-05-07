'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { toast } from 'sonner';
import { X, Loader2, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const addMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'member']).default('member'),
});

type AddMemberFormValues = z.input<typeof addMemberSchema>;
type AddMemberFormData = z.output<typeof addMemberSchema>;

interface AddMemberModalProps {
  projectId: string;
  onClose: () => void;
}

export default function AddMemberModal({ projectId, onClose }: AddMemberModalProps) {
  const { addMember } = useProjectStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<AddMemberFormValues, unknown, AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { role: 'member' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: AddMemberFormData) => {
    setIsSubmitting(true);
    try {
      await addMember(projectId, data.email, data.role);
      toast.success('Member added successfully');
      onClose();
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
            <UserPlus className="w-5 h-5 text-indigo-400" />
            Add Team Member
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <form id="add-member-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">User Email</label>
              <input
                {...register('email')}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="colleague@company.com"
                autoFocus
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Role in Project</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'admin', label: 'Admin', desc: 'Can manage project' },
                  { value: 'member', label: 'Member', desc: 'Can manage tasks' },
                ].map((option) => (
                  <label key={option.value} className={`relative flex flex-col gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRole === option.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}>
                    <input type="radio" value={option.value} {...register('role')} className="sr-only" />
                    <span className="text-white font-medium text-sm">{option.label}</span>
                    <span className="text-slate-400 text-xs">{option.desc}</span>
                  </label>
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
            form="add-member-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/25"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}
