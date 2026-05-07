import { Server, Socket } from 'socket.io';

export const setupSocketIO = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join project room
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`📂 Socket ${socket.id} joined project:${projectId}`);
    });

    // Leave project room
    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Join user room for personal notifications
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`👤 Socket ${socket.id} joined user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

export const emitTaskUpdate = (io: Server, projectId: string, event: string, data: unknown): void => {
  io.to(`project:${projectId}`).emit(event, data);
};

export const emitUserNotification = (io: Server, userId: string, event: string, data: unknown): void => {
  io.to(`user:${userId}`).emit(event, data);
};
