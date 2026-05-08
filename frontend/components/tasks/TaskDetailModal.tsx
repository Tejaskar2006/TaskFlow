'use client';

import { useState } from 'react';
import { Task, Subtask } from '@/types';
import { useTaskStore } from '@/store/taskStore';
import { toast } from 'sonner';
import {
  X, CheckSquare, Calendar, Flag, Clock, MessageSquare, Send,
  MoreVertical, Trash2, Sparkles, Bot, Loader2, Check
} from 'lucide-react';
import { cn, PRIORITY_CONFIG, STATUS_CONFIG, formatDate, formatRelativeTime, getInitials, getAvatarColor } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useAIStore } from '@/store/aiStore';


interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  projectId: string;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { addComment, deleteTask, updateTask } = useTaskStore();
  const { summarizeTask, isGenerating } = useAIStore();
  const { user } = useAuthStore();
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const priorityInfo = PRIORITY_CONFIG[task.priority];
  const statusInfo = STATUS_CONFIG[task.status];

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addComment(task._id, commentContent.trim());
      setCommentContent('');
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(task._id);
      toast.success('Task deleted');
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleAISummarize = async () => {
    try {
      const summary = await summarizeTask(task._id);
      setAiSummary(summary);
    } catch (err) {
      toast.error('Summarization failed');
    }
  };

  const toggleSubtask = async (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st =>
      st._id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    try {
      await updateTask(task._id, { subtasks: updatedSubtasks as any });
    } catch (err) {
      toast.error('Failed to update subtask');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden">

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col border-r border-slate-800 overflow-y-auto">
          <div className="p-6 md:p-8 flex-1">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border', statusInfo.bg, statusInfo.color, 'border-current/20')}>
                  <span>{statusInfo.icon}</span> {statusInfo.label}
                </span>
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium', priorityInfo.bg, priorityInfo.color)}>
                  {priorityInfo.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden">
                      <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Task
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={onClose} className="md:hidden p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-6 leading-snug">
              {task.title}
            </h2>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" /> Description
              </h3>
              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800/50">
                {task.description ? (
                  <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{task.description}</p>
                ) : (
                  <p className="text-slate-500 italic text-sm">No description provided.</p>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" /> Checklist
                </h3>
              </div>
              <div className="space-y-2">
                {task.subtasks && task.subtasks.length > 0 ? (
                  task.subtasks.map((st) => (
                    <button
                      key={st._id}
                      onClick={() => toggleSubtask(st._id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/20 border border-slate-800 hover:border-slate-700 transition-colors group"
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                        st.isCompleted ? "bg-indigo-500 border-indigo-500" : "border-slate-700 bg-slate-900 group-hover:border-slate-600"
                      )}>
                        {st.isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={cn(
                        "text-sm transition-all",
                        st.isCompleted ? "text-slate-500 line-through" : "text-slate-300"
                      )}>
                        {st.title}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic px-1">No checklist items yet.</p>
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Activity & Comments ({task.comments.length})
                </h3>
                <button
                  onClick={handleAISummarize}
                  disabled={isGenerating || task.comments.length === 0}
                  className="text-xs flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Summarize
                </button>
              </div>

              {aiSummary && (
                <div className="mb-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                  <div className="flex items-center gap-2 mb-2 text-indigo-400 font-medium text-xs">
                    <Sparkles className="w-3 h-3" /> AI SUMMARY
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    &quot;{aiSummary}&quot;
                  </p>
                  <button
                    onClick={() => setAiSummary(null)}
                    className="absolute top-2 right-2 p-1 text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {task.comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1', getAvatarColor(comment.user?.name))}>
                      {getInitials(comment.user?.name)}
                    </div>
                    <div className="flex-1 bg-slate-800/50 rounded-xl p-3 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{comment.user?.name || 'Deleted User'}</span>
                        <span className="text-xs text-slate-500">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="flex gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1', getAvatarColor(user?.name || 'User'))}>
                  {getInitials(user?.name || 'User')}
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none pr-12 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentContent.trim()}
                    className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar details */}
        <div className="w-full md:w-72 bg-slate-900/50 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="hidden md:flex justify-end mb-2 -mt-2 -mr-2">
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Assignee</h4>
            {task.assignedTo ? (
              <div className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', getAvatarColor(task.assignedTo?.name))}>
                  {getInitials(task.assignedTo?.name)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{task.assignedTo?.name}</div>
                  <div className="text-xs text-slate-500">{task.assignedTo?.email}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">Unassigned</div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Dates</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-slate-400 text-xs">Due Date</div>
                  <div className={cn("font-medium", task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-slate-200')}>
                    {task.dueDate ? formatDate(task.dueDate) : 'None'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-slate-400 text-xs">Created</div>
                  <div className="text-slate-200 font-medium">{formatDate(task.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Flag className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-slate-400 text-xs">Priority</div>
                  <div className="text-slate-200 capitalize font-medium">{task.priority}</div>
                </div>
              </div>
              {task.estimatedHours !== undefined && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-slate-400 text-xs">Est. Time</div>
                    <div className="text-slate-200 font-medium">{task.estimatedHours}h</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {task.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="text-xs text-slate-500 text-center">
              Created by {task.createdBy?.name || 'Unknown'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
