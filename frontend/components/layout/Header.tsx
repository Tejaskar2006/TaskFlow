'use client';

import { Menu, Sun, Moon, Bell, Search } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuthStore } from '@/store/authStore';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export default function Header({ onToggleSidebar, onOpenMobileSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="border-theme px-4 pt-4 sm:px-6 lg:px-8">
      <div className="panel flex h-16 items-center gap-3 rounded-2xl px-3 sm:px-4">
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-xl p-2 text-secondary transition-colors hover:bg-slate-500/10 hover:text-primary lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleSidebar}
          className="hidden rounded-xl p-2 text-secondary transition-colors hover:bg-slate-500/10 hover:text-primary lg:flex"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, projects, and teammates"
              className="surface-secondary border-theme w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            className="rounded-xl p-2 text-secondary transition-colors hover:bg-slate-500/10 hover:text-primary"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button className="relative rounded-xl p-2 text-secondary transition-colors hover:bg-slate-500/10 hover:text-primary">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
          </button>

          {user && (
            <Link
              href="/settings"
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white transition-transform hover:scale-105',
                getAvatarColor(user?.name)
              )}
              title={user.name}
            >
              {getInitials(user?.name)}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
