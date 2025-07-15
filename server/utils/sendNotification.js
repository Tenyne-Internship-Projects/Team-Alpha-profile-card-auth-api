const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const sendNotification = async ({ userId, title, message, type, io }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });

    // Emit to user's Socket.IO room
    if (io) {
      console.log(`📤 Emitting notification to room ${userId}`);
      io.to(userId).emit("new_notification", notification);
    } else {
      console.warn("⚠️ Socket.IO instance not available");
    }

    return notification;
  } catch (error) {
    console.error("❌ Error sending notification:", error.message);
    throw error;
  }
};

module.exports = sendNotification;
