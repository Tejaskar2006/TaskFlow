'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Users, Trash2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import AddMemberModal from '@/components/projects/AddMemberModal';
import { cn, formatDate, getAvatarColor, getInitials } from '@/lib/utils';
import { getSocket } from '@/lib/socket';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentProject, fetchProjectById, deleteProject, removeMember, isLoading: projectLoading } = useProjectStore();
  const { tasks, fetchTasks, isLoading: tasksLoading } = useTaskStore();
  const { user } = useAuthStore();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState<'kanban' | 'members'>('kanban');

  const isProjectAdmin = currentProject?.members.some(
    (m) => m.user._id === user?._id && m.role === 'admin'
  );

  useEffect(() => {
    if (id) {
      fetchProjectById(id);
      fetchTasks({ projectId: id });
      
      const socket = getSocket();
      socket.emit('join:project', id);
      
      return () => {
        socket.emit('leave:project', id);
      };
    }
  }, [id, fetchProjectById, fetchTasks]);

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject(id);
      toast.success('Project deleted');
      router.push('/projects');
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this project?`)) return;
    try {
      await removeMember(id, memberId);
      toast.success('Member removed');
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  if (!currentProject && !projectLoading && !tasksLoading) {
    return (
      <div className="panel flex flex-col items-center justify-center rounded-[2rem] py-20 text-center">
        <p className="text-secondary">Project not found.</p>
        <Link href="/projects" className="mt-4 text-sm font-medium text-indigo-400 hover:text-indigo-300">
          Back to projects
        </Link>
      </div>
    );
  }

  const projectTasks = tasks.filter((t) => {
    const taskProjectId = typeof t.projectId === 'string' ? t.projectId : t.projectId._id;
    return taskProjectId === id;
  });

  return (
    <div className="space-y-6">
      <div className="panel rounded-[2rem] px-6 py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <Link href="/projects" className="mb-4 inline-flex items-center gap-2 text-sm text-secondary transition-colors hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Back to projects
            </Link>

            {currentProject ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: currentProject.color }} />
                  <h1 className="truncate text-3xl font-bold text-primary">{currentProject.title}</h1>
                  <span className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    currentProject.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                    currentProject.status === 'completed' ? 'bg-blue-500/15 text-blue-400' :
                    'bg-slate-500/10 text-secondary'
                  )}>
                    {currentProject.status}
                  </span>
                </div>
                {currentProject.description && (
                  <p className="mt-3 max-w-3xl text-sm text-secondary">{currentProject.description}</p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-secondary">
                  <span className="surface-secondary border-theme rounded-full border px-3 py-1.5">
                    {projectTasks.length} tasks
                  </span>
                  <span className="surface-secondary border-theme rounded-full border px-3 py-1.5">
                    {currentProject.members.length} team members
                  </span>
                  <span className="surface-secondary border-theme rounded-full border px-3 py-1.5">
                    Created {formatDate(currentProject.createdAt)}
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="h-8 w-60 rounded bg-slate-500/10 animate-pulse" />
                <div className="h-4 w-80 rounded bg-slate-500/10 animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isProjectAdmin && (
              <>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-theme bg-transparent px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-slate-500/10 hover:text-primary"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </button>
                <button
                  onClick={() => setShowCreateTask(true)}
                  id="create-task-btn"
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  <Plus className="h-4 w-4" />
                  New Task
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="rounded-2xl p-3 text-secondary transition-colors hover:bg-red-500/10 hover:text-red-400"
                  aria-label="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-fit gap-1 rounded-2xl border border-theme bg-transparent p-1">
        {[
          { id: 'kanban', label: 'Kanban Board', count: projectTasks.length },
          { id: 'members', label: 'Members', count: currentProject?.members.length ?? 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'kanban' | 'members')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-secondary hover:bg-slate-500/10 hover:text-primary'
            )}
          >
            {tab.label}
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-xs',
              activeTab === tab.id ? 'bg-white/20 text-white' : 'surface-secondary text-secondary'
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'kanban' ? (
        <KanbanBoard
          tasks={projectTasks}
          isLoading={tasksLoading}
          projectId={id}
          canManage={!!isProjectAdmin}
        />
      ) : (
        <div className="panel overflow-hidden rounded-[2rem]">
          <div className="border-theme flex items-center justify-between border-b px-5 py-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-primary">
              <Users className="h-4 w-4 text-secondary" />
              Team Members ({currentProject?.members.length || 0})
            </h3>
            {isProjectAdmin && (
              <button
                onClick={() => setShowAddMember(true)}
                className="text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Add member
              </button>
            )}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {currentProject?.members.map((member) => (
              <div key={member.user._id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white', getAvatarColor(member.user?.name))}>
                  {getInitials(member.user?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-primary">{member.user.name}</div>
                  <div className="truncate text-sm text-secondary">{member.user.email}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    member.role === 'admin' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-500/10 text-secondary'
                  )}>
                    {member.role}
                  </span>
                  <span className="text-xs text-tertiary">Joined {formatDate(member.joinedAt)}</span>
                  {isProjectAdmin && member.user._id !== user?._id && (
                    <button
                      onClick={() => handleRemoveMember(member.user._id, member.user.name)}
                      className="rounded-xl p-2 text-secondary transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateTask && currentProject && (
        <CreateTaskModal
          projectId={id}
          members={currentProject.members}
          onClose={() => setShowCreateTask(false)}
        />
      )}
      {showAddMember && (
        <AddMemberModal projectId={id} onClose={() => setShowAddMember(false)} />
      )}
    </div>
  );
}
