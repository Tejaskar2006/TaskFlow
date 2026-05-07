'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { Project } from '@/types';
import Link from 'next/link';
import { Plus, FolderKanban, Users, CheckSquare, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import CreateProjectModal from '@/components/projects/CreateProjectModal';

const ProjectCard = ({ project, onDelete, isAdmin }: { project: Project; onDelete: (id: string) => void; isAdmin: boolean }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="panel group relative rounded-3xl p-5">
      <div className="absolute left-5 right-5 top-0 h-1 rounded-b-full" style={{ backgroundColor: project.color }} />

      <div className="mt-2 flex items-start justify-between gap-3">
        <Link href={`/projects/${project._id}`} className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${project.color}20` }}>
              <FolderKanban className="h-5 w-5" style={{ color: project.color }} />
            </div>
            <h3 className="truncate text-lg font-semibold text-primary transition-colors group-hover:text-indigo-400">
              {project.title}
            </h3>
          </div>
        </Link>

        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-xl p-2 text-secondary transition-colors hover:bg-slate-500/10 hover:text-primary"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="panel absolute right-0 z-10 mt-2 w-40 overflow-hidden rounded-2xl">
                <Link
                  href={`/projects/${project._id}`}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-secondary transition-colors hover:bg-slate-500/10 hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Open
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(project._id); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Link href={`/projects/${project._id}`}>
        {project.description && (
          <p className="mt-2 line-clamp-2 text-sm text-secondary">{project.description}</p>
        )}

        <div className="border-theme mt-5 flex items-center gap-4 border-t pt-4">
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <Users className="h-3.5 w-3.5" />
            <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-secondary">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>{project.tasks.length} task{project.tasks.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={cn(
            'ml-auto rounded-full px-2.5 py-1 text-xs font-medium',
            project.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
            project.status === 'completed' ? 'bg-blue-500/15 text-blue-400' :
            'bg-slate-500/10 text-secondary'
          )}>
            {project.status}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((member) => (
              <div
                key={member.user._id}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white dark:border-slate-900"
                style={{ backgroundColor: project.color }}
                title={member.user.name}
              >
                {member.user.name?.charAt(0)}
              </div>
            ))}
            {project.members.length > 4 && (
              <div className="surface-secondary flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-secondary dark:border-slate-900">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-tertiary">{formatDate(project.createdAt)}</span>
        </div>
      </Link>
    </div>
  );
};

export default function ProjectsPage() {
  const { projects, fetchProjects, deleteProject, isLoading } = useProjectStore();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? All tasks will be deleted.')) return;
    try {
      await deleteProject(id);
      toast.success('Project deleted');
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel rounded-[2rem] px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Projects</h1>
            <p className="mt-2 text-sm text-secondary">
              Browse active workspaces, recent collaboration, and project ownership across the team.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            id="create-project-btn"
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel h-56 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center rounded-[2rem] px-6 py-20 text-center">
          <div className="surface-secondary mb-4 flex h-16 w-16 items-center justify-center rounded-3xl">
            <FolderKanban className="h-8 w-8 text-secondary" />
          </div>
          <h3 className="text-xl font-semibold text-primary">No projects yet</h3>
          <p className="mt-2 max-w-md text-sm text-secondary">
            Create your first project to start organizing tasks with your team.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onDelete={handleDelete}
              isAdmin={project.members.some(m => m.user._id === user?._id && m.role === 'admin')}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
