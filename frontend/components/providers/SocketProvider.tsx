'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { useNotificationStore } from '@/store/notificationStore';

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { updateTaskOptimistic, addTaskOptimistic, removeTaskOptimistic } = useTaskStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket(user._id);
      const socket = getSocket();

      socket.on('task:created', (task) => {
        addTaskOptimistic(task);
      });

      socket.on('task:updated', (task) => {
        updateTaskOptimistic(task);
      });

      socket.on('task:status_changed', (task) => {
        updateTaskOptimistic(task);
      });

      socket.on('task:deleted', ({ taskId }) => {
        removeTaskOptimistic(taskId);
      });

      socket.on('task:comment_added', (task) => {
        updateTaskOptimistic(task);
      });

      socket.on('task:assigned', ({ task, message }) => {
        toast.info(message);
        addNotification({
          _id: `socket-${Date.now()}`,
          title: 'Task Assigned',
          description: message,
          time: new Date().toISOString(),
          isRead: false,
          type: 'task'
        });
        updateTaskOptimistic(task);
      });

      return () => {
        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:status_changed');
        socket.off('task:deleted');
        socket.off('task:comment_added');
        socket.off('task:assigned');
        disconnectSocket();
      };
    }
  }, [isAuthenticated, user, addTaskOptimistic, updateTaskOptimistic, removeTaskOptimistic]);

  return <>{children}</>;
};
