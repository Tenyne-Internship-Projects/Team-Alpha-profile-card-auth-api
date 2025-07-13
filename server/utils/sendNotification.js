const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sendNotification = async ({ userId, title, message, type, io }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });

    if (io) {
      io.to(userId).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
};

module.exports = sendNotification;
