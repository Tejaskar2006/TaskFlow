'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useEffect } from 'react';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users,
  Settings, LogOut, ChevronRight
} from 'lucide-react';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { href: '/team', icon: Users, label: 'Team' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  isOpen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isOpen, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLogout = () => {
    logout();
    onMobileClose();
  };

  const expanded = isOpen || mobileOpen;

  const sidebarContent = (
    <div className="panel flex h-full flex-col rounded-r-3xl lg:rounded-3xl">
      <div className="border-theme flex items-center gap-3 border-b px-4 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
          <CheckSquare className="h-5 w-5" />
        </div>
        {expanded && (
          <div className="min-w-0">
            <div className="text-base font-semibold text-primary">TaskFlow</div>
            <div className="text-xs capitalize text-secondary">Team workspace</div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-secondary hover:bg-slate-500/10 hover:text-primary'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-white' : 'text-secondary group-hover:text-primary')} />
                {expanded && <span className="text-sm font-medium">{item.label}</span>}
                {isActive && expanded && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </div>

        {expanded && (
          <div>
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-tertiary">
              Active Projects
            </div>
            <div className="space-y-1">
              {projects.slice(0, 6).map((project) => {
                const isActive = pathname.startsWith(`/projects/${project._id}`);
                return (
                  <Link
                    key={project._id}
                    href={`/projects/${project._id}`}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                      isActive ? 'bg-slate-500/10 text-primary' : 'text-secondary hover:bg-slate-500/10 hover:text-primary'
                    )}
                  >
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                    <span className="truncate">{project.title}</span>
                  </Link>
                );
              })}
              {projects.length === 0 && (
                <div className="rounded-xl px-3 py-3 text-sm text-secondary">No projects yet</div>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="border-theme space-y-2 border-t p-3">
        {expanded && user ? (
          <div className="surface-secondary border-theme flex items-center gap-3 rounded-2xl border px-3 py-3">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white', getAvatarColor(user?.name))}>
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-primary">{user.name}</div>
              <div className="truncate text-xs text-secondary">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl p-2 text-secondary transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          user && (
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-2xl p-3 text-secondary transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn('hidden px-4 py-4 lg:flex lg:flex-col sidebar-transition', isOpen ? 'w-80' : 'w-24')}>
        {sidebarContent}
      </aside>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-80 p-4 lg:hidden transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
