'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  FolderKanban, Users, Zap, Activity
} from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';

const StatCard = ({ icon: Icon, label, value, color, subtitle }: {
  icon: React.ElementType; label: string; value: number | string; color: string; subtitle?: string;
}) => (
  <div className="panel rounded-3xl p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-secondary">{label}</p>
        <p className="mt-1 text-3xl font-bold text-primary">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-tertiary">{subtitle}</p>}
      </div>
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl text-white', color)}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="panel rounded-3xl p-5 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-slate-500/15" />
        <div className="h-8 w-16 rounded bg-slate-500/15" />
      </div>
      <div className="h-11 w-11 rounded-2xl bg-slate-500/15" />
    </div>
  </div>
);

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel rounded-3xl p-5">
      <h3 className="mb-4 text-base font-semibold text-primary">{title}</h3>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div className="panel rounded-[2rem] px-6 py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              {greeting()}, {user?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-secondary">
              A live view of your team&apos;s workload, momentum, and the projects that need attention today.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Focus', value: stats?.overview.inProgressTasks ?? '--' },
              { label: 'Done', value: stats?.overview.doneTasks ?? '--' },
              { label: 'Overdue', value: stats?.overview.overdueTasks ?? '--' },
              { label: 'Rate', value: stats ? `${stats.overview.completionRate}%` : '--' },
            ].map((item) => (
              <div key={item.label} className="surface-secondary border-theme rounded-2xl border px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-tertiary">{item.label}</div>
                <div className="mt-1 text-xl font-semibold text-primary">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stats ? (
          <>
            <StatCard icon={CheckSquare} label="Total Tasks" value={stats.overview.totalTasks} color="bg-indigo-600" />
            <StatCard icon={Clock} label="In Progress" value={stats.overview.inProgressTasks} color="bg-amber-600" subtitle={`${stats.overview.todoTasks} to do`} />
            <StatCard icon={TrendingUp} label="Completed" value={stats.overview.doneTasks} color="bg-emerald-600" subtitle={`${stats.overview.completionRate}% completion`} />
            <StatCard icon={AlertTriangle} label="Overdue" value={stats.overview.overdueTasks} color="bg-rose-600" />
            <StatCard icon={FolderKanban} label="Active Projects" value={stats.overview.activeProjects} color="bg-violet-600" subtitle={`of ${stats.overview.totalProjects} total`} />
            <StatCard icon={Zap} label="High Priority" value={stats.overview.highPriorityTasks} color="bg-orange-600" />
            <StatCard icon={Users} label="My Tasks" value={stats.overview.myTasks} color="bg-cyan-600" />
            <StatCard icon={Activity} label="Completion Rate" value={`${stats.overview.completionRate}%`} color="bg-fuchsia-600" />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartPanel title="Tasks by Status">
          {isLoading ? (
            <div className="h-52 rounded-2xl bg-slate-500/10 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats?.tasksByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3}>
                  {stats?.tasksByStatus.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 16, color: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Tasks by Priority">
          {isLoading ? (
            <div className="h-52 rounded-2xl bg-slate-500/10 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.tasksByPriority} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 16, color: '#f8fafc' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {stats?.tasksByPriority.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Task Creation (7 days)">
          {isLoading ? (
            <div className="h-52 rounded-2xl bg-slate-500/10 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats?.taskTrend}>
                <XAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 16, color: '#f8fafc' }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartPanel title="Tasks per Team Member">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-slate-500/10 animate-pulse" />
              ))}
            </div>
          ) : stats?.tasksPerUser && stats.tasksPerUser.length > 0 ? (
            <div className="space-y-4">
              {stats.tasksPerUser.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {item.user?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="text-primary">{item.user?.name || 'Unknown'}</span>
                      <span className="text-secondary">{item.count} tasks</span>
                    </div>
                    <div className="surface-secondary h-2 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${Math.min((item.count / (stats?.tasksPerUser[0]?.count || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-secondary">No task assignments yet</div>
          )}
        </ChartPanel>

        <ChartPanel title="Recent Activity">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-500/10 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-slate-500/10 animate-pulse" />
                    <div className="h-2 w-1/3 rounded bg-slate-500/10 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {stats.recentActivity.map((log) => (
                <div key={log._id} className="surface-secondary border-theme flex items-start gap-3 rounded-2xl border p-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-400">
                    {log.user?.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-secondary">
                      <span className="font-medium text-primary">{log.user?.name}</span>{' '}
                      {log.action}{' '}
                      <span className="text-indigo-400">{log.entityTitle}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-tertiary">{formatRelativeTime(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-secondary">No recent activity</div>
          )}
        </ChartPanel>
      </div>
    </div>
  );
}
