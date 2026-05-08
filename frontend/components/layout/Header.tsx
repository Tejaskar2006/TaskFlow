'use client';

import { Menu, Sun, Moon, Bell, Search } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuthStore } from '@/store/authStore';
import { cn, getInitials, getAvatarColor, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/store/notificationStore';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export default function Header({ onToggleSidebar, onOpenMobileSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAllAsRead, isLoading: notificationsLoading } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "relative rounded-xl p-2 text-secondary transition-colors hover:bg-slate-500/10 hover:text-primary",
                showNotifications && "bg-slate-500/10 text-primary"
              )}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900 z-50">
                <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-primary">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-medium bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto py-2">
                  {notificationsLoading ? (
                    <div className="p-4 text-center text-xs text-secondary">Loading...</div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        className="w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-primary">{notification.title}</span>
                          <span className="text-[10px] text-tertiary">
                            {formatRelativeTime(new Date(notification.time))}
                          </span>
                        </div>
                        <p className="text-xs text-secondary line-clamp-2">{notification.description}</p>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <Bell className="h-6 w-6 text-tertiary" />
                      </div>
                      <p className="text-xs text-secondary">No notifications yet</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="mt-2 border-t border-slate-100 p-2 dark:border-slate-800">
                    <button 
                      onClick={() => markAllAsRead()}
                      className="w-full rounded-xl py-2 text-center text-xs font-medium text-indigo-500 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
