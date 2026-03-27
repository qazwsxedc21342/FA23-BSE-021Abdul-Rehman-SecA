import { Server } from 'socket.io';
import logger from './logger.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // If we want users to join specific rooms (like their own user ID) for private notifications
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      logger.info(`User ${userId} joined room user_${userId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};
