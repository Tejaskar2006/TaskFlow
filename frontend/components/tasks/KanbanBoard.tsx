'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '@/types';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { cn, PRIORITY_CONFIG, STATUS_CONFIG, formatDueDate, getInitials, getAvatarColor, truncate } from '@/lib/utils';
import { Calendar, MessageSquare, AlertCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import TaskDetailModal from './TaskDetailModal';

const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string }[] = [
  { id: 'todo', label: 'To Do', color: 'text-slate-400', bg: 'border-slate-700' },
  { id: 'in_progress', label: 'In Progress', color: 'text-amber-400', bg: 'border-amber-500/40' },
  { id: 'done', label: 'Done', color: 'text-emerald-400', bg: 'border-emerald-500/40' },
];

interface KanbanBoardProps {
  tasks: Task[];
  isLoading: boolean;
  projectId: string;
  canManage: boolean;
}

function TaskCard({ task, index, canManage, userId, onClick }: {
  task: Task; index: number; canManage: boolean; userId?: string; onClick: (task: Task) => void;
}) {
  const isAssigned = task.assignedTo?._id === userId;
  const canDrag = canManage || isAssigned;

  const { deleteTask } = useTaskStore();
  const priority = PRIORITY_CONFIG[task.priority];
  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(task._id);
      toast.success('Task deleted');
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={!canDrag}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...(canDrag ? provided.dragHandleProps : {})}
          onClick={() => onClick(task)}
          className={cn(
            'task-card bg-slate-800 border border-slate-700/50 rounded-xl p-3.5 group',
            canDrag ? 'cursor-pointer' : 'cursor-default',
            snapshot.isDragging && 'shadow-2xl shadow-indigo-500/20 rotate-1 border-indigo-500/50'
          )}
        >
          {/* Priority badge */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', priority.bg, priority.color)}>
              {priority.label}
            </span>
            {canManage && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleDelete}
                  className="p-1 text-slate-500 hover:text-red-400 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <h4 className="text-white text-sm font-medium leading-snug mb-2">
            {truncate(task.title, 80)}
          </h4>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-700/50">
            <div className="flex items-center gap-2.5">
              {dueInfo && (
                <div className={cn('flex items-center gap-1 text-xs', dueInfo.isOverdue ? 'text-red-400' : 'text-slate-400')}>
                  {dueInfo.isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                  {dueInfo.text}
                </div>
              )}
              {task.comments.length > 0 && (
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <MessageSquare className="w-3 h-3" />
                  {task.comments.length}
                </div>
              )}
            </div>
            {task.assignedTo && (
              <div
                className={cn('w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold', getAvatarColor(task.assignedTo?.name))}
                title={task.assignedTo?.name}
              >
                {getInitials(task.assignedTo?.name)}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanBoard({ tasks, isLoading, projectId, canManage }: KanbanBoardProps) {
  const { updateTaskStatus } = useTaskStore();
  const { user } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination, source } = result;

    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Check if user is allowed to move this specific task
    const task = tasks.find(t => t._id === draggableId);
    const isAssigned = task?.assignedTo?._id === user?._id;

    if (!canManage && !isAssigned) {
      toast.error('You can only move tasks assigned to you.');
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;

    try {
      await updateTaskStatus(draggableId, newStatus, destination.index);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const getColumnTasks = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="h-5 w-24 bg-slate-800 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className={cn('bg-slate-900/80 border rounded-2xl p-4', col.bg)}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-semibold', col.color)}>{col.label}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full bg-slate-800', col.color)}>
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Droppable */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'space-y-3 kanban-column min-h-[200px] rounded-xl transition-colors',
                        snapshot.isDraggingOver && 'bg-indigo-500/5'
                      )}
                    >
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-2">
                            <span className="text-lg">{STATUS_CONFIG[col.id].icon}</span>
                          </div>
                          <p className="text-xs">No tasks yet</p>
                        </div>
                      )}
                      {colTasks.map((task, index) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          index={index}
                          canManage={canManage}
                          userId={user?._id}
                          onClick={setSelectedTask}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          projectId={projectId}
        />
      )}
    </>
  );
}
