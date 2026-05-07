'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, CheckSquare, Shield, Users } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormValues = z.input<typeof signupSchema>;
type SignupFormData = z.output<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues, unknown, SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup({ name: data.name, email: data.email, password: data.password });
      toast.success('Account created! Welcome to TaskFlow.');
      router.replace('/dashboard');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Signup failed');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <CheckSquare className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">TaskFlow</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
              Start organizing your team today
            </h2>
            <p className="text-lg text-white/70">
              Get started in minutes. No credit card required.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: CheckSquare, title: 'Kanban Boards', desc: 'Drag and drop tasks across visual columns' },
              { icon: Users, title: 'Team Collaboration', desc: 'Invite members and assign tasks easily' },
              { icon: Shield, title: 'Role-Based Access', desc: 'Control who can create, edit, and delete' },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">{feature.title}</div>
                  <div className="text-sm text-white/60">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/50">
          Already trusted by 2,000+ teams worldwide
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <CheckSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-white">Create your account</h1>
            <p className="text-slate-400">Start managing tasks with your team</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...register('name')}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
              />
              {errors.name && <p className="mt-1.5 text-sm text-red-400">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@company.com"
              />
              {errors.email && <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>}
            </div>



            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 pr-12 text-white placeholder-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              id="signup-submit-btn"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-400 transition-colors hover:text-indigo-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
