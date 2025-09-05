import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../utils/auth';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface Socket {
  id: string;
  userId?: string;
  userRole?: string;
  handshake: any;
  emit: (event: string, ...args: any[]) => void;
  join: (room: string) => void;
  leave: (room: string) => void;
  disconnect: () => void;
  on: (event: string, listener: (...args: any[]) => void) => void;
}

export const socketHandler = (io: Server): void => {
  // Authentication middleware for Socket.io
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = AuthService.verifyAccessToken(token);
      if (!payload) {
        return next(new Error('Invalid token'));
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.user = user;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Update user online status
    if (socket.userId) {
      await prisma.user.update({
        where: { id: socket.userId },
        data: { 
          isOnline: true,
          lastSeen: new Date()
        }
      });

      // Join user to their personal room for notifications
      socket.join(`user:${socket.userId}`);

      // Emit online status to relevant users
      socket.broadcast.emit('user:online', {
        userId: socket.userId,
        isOnline: true
      });
    }

    // Handle joining task rooms (for task-specific communication)
    socket.on('task:join', async (data: { taskId: string }) => {
      try {
        const { taskId } = data;
        
        // Verify user has access to this task
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            OR: [
              { clientId: socket.userId },
              { freelancerId: socket.userId }
            ]
          }
        });

        if (task) {
          socket.join(`task:${taskId}`);
          socket.emit('task:joined', { taskId });
        } else {
          socket.emit('error', { message: 'Access denied to task' });
        }
      } catch (error) {
        console.error('Task join error:', error);
        socket.emit('error', { message: 'Failed to join task' });
      }
    });

    // Handle leaving task rooms
    socket.on('task:leave', (data: { taskId: string }) => {
      const { taskId } = data;
      socket.leave(`task:${taskId}`);
      socket.emit('task:left', { taskId });
    });

    // Handle sending messages
    socket.on('message:send', async (data: {
      taskId: string;
      content: string;
      type?: 'TEXT' | 'FILE';
      attachments?: string[];
    }) => {
      try {
        const { taskId, content, type = 'TEXT', attachments = [] } = data;

        // Verify user has access to this task
        const task = await prisma.task.findFirst({
          where: {
            id: taskId,
            OR: [
              { clientId: socket.userId },
              { freelancerId: socket.userId }
            ]
          },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            freelancer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        });

        if (!task) {
          socket.emit('error', { message: 'Access denied to task' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            content,
            type,
            attachments,
            senderId: socket.userId!,
            taskId
          },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                username: true
              }
            }
          }
        });

        // Emit message to task room
        io.to(`task:${taskId}`).emit('message:received', {
          id: message.id,
          content: message.content,
          type: message.type,
          attachments: message.attachments,
          sender: message.sender,
          taskId: message.taskId,
          createdAt: message.createdAt
        });

        // Send notification to the other party
        const recipientId = socket.userId === task.clientId ? task.freelancerId : task.clientId;
        if (recipientId) {
          io.to(`user:${recipientId}`).emit('notification:received', {
            type: 'NEW_MESSAGE',
            title: 'New Message',
            message: `${message.sender.firstName} sent you a message`,
            taskId,
            messageId: message.id,
            createdAt: new Date()
          });

          // Create notification in database
          await prisma.notification.create({
            data: {
              type: 'NEW_MESSAGE',
              title: 'New Message',
              message: `${message.sender.firstName} sent you a message`,
              userId: recipientId,
              metadata: {
                taskId,
                messageId: message.id,
                senderId: socket.userId
              }
            }
          });
        }
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (data: { taskId: string }) => {
      const { taskId } = data;
      socket.to(`task:${taskId}`).emit('typing:start', {
        userId: socket.userId,
        taskId
      });
    });

    socket.on('typing:stop', (data: { taskId: string }) => {
      const { taskId } = data;
      socket.to(`task:${taskId}`).emit('typing:stop', {
        userId: socket.userId,
        taskId
      });
    });

    // Handle bid notifications
    socket.on('bid:submit', async (data: { taskId: string, bidId: string }) => {
      try {
        const { taskId, bidId } = data;
        
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        });

        const bid = await prisma.bid.findUnique({
          where: { id: bidId },
          include: {
            freelancer: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        });

        if (task && bid) {
          // Notify client about new bid
          io.to(`user:${task.clientId}`).emit('notification:received', {
            type: 'NEW_BID',
            title: 'New Bid Received',
            message: `${bid.freelancer.firstName} ${bid.freelancer.lastName} submitted a bid on your task`,
            taskId,
            bidId,
            createdAt: new Date()
          });

          // Create notification in database
          await prisma.notification.create({
            data: {
              type: 'NEW_BID',
              title: 'New Bid Received',
              message: `${bid.freelancer.firstName} ${bid.freelancer.lastName} submitted a bid on your task`,
              userId: task.clientId,
              metadata: {
                taskId,
                bidId,
                freelancerId: bid.freelancer.id
              }
            }
          });
        }
      } catch (error) {
        console.error('Bid notification error:', error);
      }
    });

    // Handle bid acceptance notifications
    socket.on('bid:accept', async (data: { taskId: string, bidId: string, freelancerId: string }) => {
      try {
        const { taskId, bidId, freelancerId } = data;
        
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          select: { title: true }
        });

        if (task) {
          // Notify freelancer about bid acceptance
          io.to(`user:${freelancerId}`).emit('notification:received', {
            type: 'BID_ACCEPTED',
            title: 'Bid Accepted!',
            message: `Your bid on "${task.title}" has been accepted!`,
            taskId,
            bidId,
            createdAt: new Date()
          });

          // Create notification in database
          await prisma.notification.create({
            data: {
              type: 'BID_ACCEPTED',
              title: 'Bid Accepted!',
              message: `Your bid on "${task.title}" has been accepted!`,
              userId: freelancerId,
              metadata: {
                taskId,
                bidId,
                clientId: socket.userId
              }
            }
          });
        }
      } catch (error) {
        console.error('Bid acceptance notification error:', error);
      }
    });

    // Handle payment notifications
    socket.on('payment:released', async (data: { taskId: string, paymentId: string, freelancerId: string, amount: number }) => {
      try {
        const { taskId, paymentId, freelancerId, amount } = data;
        
        // Notify freelancer about payment release
        io.to(`user:${freelancerId}`).emit('notification:received', {
          type: 'PAYMENT_RELEASED',
          title: 'Payment Released',
          message: `Payment of $${amount} has been released to you`,
          taskId,
          paymentId,
          createdAt: new Date()
        });

        // Create notification in database
        await prisma.notification.create({
          data: {
            type: 'PAYMENT_RELEASED',
            title: 'Payment Released',
            message: `Payment of $${amount} has been released to you`,
            userId: freelancerId,
            metadata: {
              taskId,
              paymentId,
              amount,
              clientId: socket.userId
            }
          }
        });
      } catch (error) {
        console.error('Payment notification error:', error);
      }
    });

    // Handle milestone completion notifications
    socket.on('milestone:completed', async (data: { taskId: string, milestoneId: string, clientId: string }) => {
      try {
        const { taskId, milestoneId, clientId } = data;
        
        const milestone = await prisma.milestone.findUnique({
          where: { id: milestoneId },
          select: { title: true }
        });

        if (milestone) {
          // Notify client about milestone completion
          io.to(`user:${clientId}`).emit('notification:received', {
            type: 'MILESTONE_COMPLETED',
            title: 'Milestone Completed',
            message: `Milestone "${milestone.title}" has been completed`,
            taskId,
            milestoneId,
            createdAt: new Date()
          });

          // Create notification in database
          await prisma.notification.create({
            data: {
              type: 'MILESTONE_COMPLETED',
              title: 'Milestone Completed',
              message: `Milestone "${milestone.title}" has been completed`,
              userId: clientId,
              metadata: {
                taskId,
                milestoneId,
                freelancerId: socket.userId
              }
            }
          });
        }
      } catch (error) {
        console.error('Milestone completion notification error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);
      
      if (socket.userId) {
        // Update user offline status
        await prisma.user.update({
          where: { id: socket.userId },
          data: { 
            isOnline: false,
            lastSeen: new Date()
          }
        });

        // Emit offline status to relevant users
        socket.broadcast.emit('user:offline', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date()
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};
