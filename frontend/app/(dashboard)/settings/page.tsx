'use client';

import { useState } from 'react';
import { Moon, Sun, UserCircle2, Mail, Edit3, Check, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/providers/ThemeProvider';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    
    setIsLoading(true);
    try {
      await updateProfile({ name, email });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="panel rounded-[2rem] px-6 py-6">
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
        <p className="mt-2 text-sm text-secondary">
          Personal account details and quick workspace preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-primary">Profile Details</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                <Edit3 className="h-4 w-4" /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="surface-secondary border-theme flex items-center gap-3 rounded-2xl border px-4 py-4">
              <UserCircle2 className="h-5 w-5 text-secondary" />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.18em] text-tertiary">Full Name</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full bg-transparent text-sm font-medium text-primary focus:outline-none"
                    placeholder="Enter your name"
                    autoFocus
                  />
                ) : (
                  <div className="text-sm font-medium text-primary">{user?.name || 'Unknown user'}</div>
                )}
              </div>
            </div>

            <div className="surface-secondary border-theme flex items-center gap-3 rounded-2xl border px-4 py-4">
              <Mail className="h-5 w-5 text-secondary" />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.18em] text-tertiary">Email Address</div>
                {isEditing ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full bg-transparent text-sm font-medium text-primary focus:outline-none"
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="text-sm font-medium text-primary">{user?.email || 'No email available'}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="panel rounded-[2rem] p-6">
          <h2 className="text-lg font-semibold text-primary">Appearance</h2>
          <p className="mt-2 text-sm text-secondary">
            Switch between light and dark themes.
          </p>

          <button
            onClick={toggleTheme}
            className="surface-secondary border-theme mt-6 flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors hover:bg-slate-500/10"
          >
            <div>
              <div className="text-sm font-medium text-primary">{theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}</div>
              <div className="text-sm text-secondary">Click to switch the workspace theme.</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
