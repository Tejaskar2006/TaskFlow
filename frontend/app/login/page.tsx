'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, CheckSquare } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
      toast.success('Welcome back!');
      router.replace('/dashboard');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <CheckSquare className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">TaskFlow</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Manage your team&apos;s tasks with confidence
          </h2>
          <p className="text-lg leading-relaxed text-white/70">
            Visualize workflows, track progress, and collaborate with your team using focused Kanban boards.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Projects Created', value: '10K+' },
              { label: 'Tasks Completed', value: '100K+' },
              { label: 'Teams Onboarded', value: '2K+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['A', 'B', 'C', 'D'].map((letter, i) => (
              <div key={letter} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 text-xs font-bold text-white ${['bg-violet-500', 'bg-blue-500', 'bg-teal-500', 'bg-amber-500'][i]}`}>
                {letter}
              </div>
            ))}
          </div>
          <p className="text-sm text-white/70">Join thousands of teams already using TaskFlow</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <CheckSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-white">Welcome back</h1>
            <p className="text-slate-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@company.com"
              />
              {errors.email && <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 pr-12 text-white placeholder-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
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

            <button
              type="submit"
              disabled={isLoading}
              id="login-submit-btn"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-indigo-400 transition-colors hover:text-indigo-300">
                Create one free
              </Link>
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <p className="mb-2 text-xs font-medium text-slate-400">Demo credentials</p>
            <p className="text-xs text-slate-300">Email: <span className="text-indigo-400">admin@taskflow.com</span></p>
            <p className="text-xs text-slate-300">Password: <span className="text-indigo-400">password123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
