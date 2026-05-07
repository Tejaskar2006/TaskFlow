'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Users, FolderKanban, ShieldCheck } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { cn, getAvatarColor, getInitials } from '@/lib/utils';

export default function TeamPage() {
  const { projects, fetchProjects, isLoading } = useProjectStore();

  useEffect(() => {
    fetchProjects(1, 100);
  }, [fetchProjects]);

  const teamMembers = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      email: string;
      role: 'admin' | 'member';
      projects: { id: string; title: string; role: 'admin' | 'member' }[];
    }>();

    projects.forEach((project) => {
      project.members.forEach((member) => {
        const existing = map.get(member.user._id);
        if (existing) {
          if (member.role === 'admin') existing.role = 'admin';
          existing.projects.push({
            id: project._id,
            title: project.title,
            role: member.role,
          });
        } else {
          map.set(member.user._id, {
            id: member.user._id,
            name: member.user.name,
            email: member.user.email,
            role: member.role,
            projects: [{
              id: project._id,
              title: project.title,
              role: member.role,
            }],
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  return (
    <div className="space-y-6">
      <div className="panel rounded-[2rem] px-6 py-6">
        <h1 className="text-3xl font-bold text-primary">Team</h1>
        <p className="mt-2 text-sm text-secondary">
          A simple roster of everyone collaborating across projects, including access level and exactly which projects they belong to.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'People', value: teamMembers.length, icon: Users },
          { label: 'Projects', value: projects.length, icon: FolderKanban },
          { label: 'Admins', value: teamMembers.filter((m) => m.role === 'admin').length, icon: ShieldCheck },
        ].map((item) => (
          <div key={item.label} className="panel rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-secondary">{item.label}</div>
                <div className="mt-1 text-3xl font-bold text-primary">{item.value}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400">
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel overflow-hidden rounded-[2rem]">
        <div className="border-theme border-b px-5 py-4 text-sm font-medium text-secondary">
          Team members
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-500/10 animate-pulse" />
            ))}
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-secondary">No members found yet.</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white', getAvatarColor(member.name))}>
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-primary">{member.name}</div>
                  <div className="truncate text-sm text-secondary">{member.email}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    member.role === 'admin' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-500/10 text-secondary'
                  )}>
                    {member.role}
                  </span>
                  <span className="text-secondary">
                    {member.projects.length} project{member.projects.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:max-w-xl">
                  {member.projects.map((project) => (
                    <Link
                      key={`${member.id}-${project.id}`}
                      href={`/projects/${project.id}`}
                      className="surface-secondary border-theme rounded-full border px-3 py-1 text-xs text-secondary transition-colors hover:border-indigo-500/40 hover:text-primary"
                      title={`${project.title} (${project.role})`}
                    >
                      {project.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
