'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ListTodo, Search, Calendar, FolderKanban } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { PRIORITY_CONFIG, STATUS_CONFIG, cn, formatDueDate, formatRelativeTime } from '@/lib/utils';

export default function TasksPage() {
  const { tasks, fetchTasks, isLoading } = useTaskStore();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    if (!user?._id) return;
    fetchTasks({ assignedTo: 'me', limit: 100 });
  }, [fetchTasks, user?._id]);

  const myTasks = useMemo(() => {
    if (!user?._id) return [];

    return tasks
      .filter((task) => task.assignedTo?._id === user._id)
      .filter((task) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return `${task.title} ${task.description || ''}`.toLowerCase().includes(query);
      });
  }, [tasks, user?._id, search]);

  return (
    <div className="space-y-6">
      <div className="panel rounded-[2rem] px-6 py-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">My Tasks</h1>
            <p className="mt-2 text-sm text-secondary">
              Track your assigned work, watch approaching deadlines, and jump back into active deliverables.
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title or description"
              className="surface-secondary border-theme w-full rounded-2xl border py-3 pl-9 pr-4 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="panel h-32 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : myTasks.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center rounded-[2rem] px-6 py-20 text-center">
          <div className="surface-secondary mb-4 flex h-16 w-16 items-center justify-center rounded-3xl">
            <ListTodo className="h-8 w-8 text-secondary" />
          </div>
          <h3 className="text-xl font-semibold text-primary">No matching tasks</h3>
          <p className="mt-2 max-w-md text-sm text-secondary">
            All tasks assigned to you across your projects will appear here. Try a different search or assign work to this account.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {myTasks.map((task) => {
            const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;
            const project = typeof task.projectId === 'string' ? null : task.projectId;
            return (
              <Link
                key={task._id}
                href={project ? `/projects/${project._id}` : '/projects'}
                className="panel rounded-3xl p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', PRIORITY_CONFIG[task.priority].bg, PRIORITY_CONFIG[task.priority].color)}>
                        {PRIORITY_CONFIG[task.priority].label}
                      </span>
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_CONFIG[task.status].bg, STATUS_CONFIG[task.status].color)}>
                        {STATUS_CONFIG[task.status].label}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-primary">{task.title}</h3>
                    {task.description && <p className="mt-2 line-clamp-2 text-sm text-secondary">{task.description}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-secondary">
                      {project && (
                        <span className="inline-flex items-center gap-1.5">
                          <FolderKanban className="h-4 w-4" />
                          {project.title}
                        </span>
                      )}
                      {dueInfo && (
                        <span className={cn('inline-flex items-center gap-1.5', dueInfo.isOverdue ? 'text-red-400' : 'text-secondary')}>
                          <Calendar className="h-4 w-4" />
                          {dueInfo.text}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-tertiary">
                    Updated {formatRelativeTime(task.updatedAt)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
