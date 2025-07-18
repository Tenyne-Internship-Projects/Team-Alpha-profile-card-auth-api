jest.mock("@prisma/client", () => {
  const mockNotifications = [
    {
      id: "notif1",
      userId: "client123",
      message: "New project posted!",
      read: false,
      createdAt: new Date(),
    },
    {
      id: "notif2",
      userId: "client123",
      message: "Your application was approved!",
      read: true,
      createdAt: new Date(),
    },
  ];

  const prismaMock = {
    notification: {
      findMany: jest.fn(() => Promise.resolve(mockNotifications)),
      findUnique: jest.fn(({ where }) => {
        return Promise.resolve(
          mockNotifications.find((n) => n.id === where.id) || null
        );
      }),
      update: jest.fn(({ where }) => {
        return Promise.resolve({
          ...mockNotifications.find((n) => n.id === where.id),
          read: true,
        });
      }),
      updateMany: jest.fn(() => Promise.resolve({ count: 1 })),
      count: jest.fn(() => Promise.resolve(1)),
      delete: jest.fn(() => Promise.resolve({})),
    },
  };

  return {
    PrismaClient: jest.fn(() => prismaMock),
  };
});

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} = require("../controllers/notification.controller");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Notification Controller", () => {
  const mockUser = { userId: "client123" };

  test("should return all notifications for a user", async () => {
    const req = { user: mockUser };
    const res = mockResponse();

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        notifications: expect.any(Array),
      })
    );
  });

  test("should mark a notification as read", async () => {
    const req = { user: mockUser, params: { id: "notif1" } };
    const res = mockResponse();

    await markAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        notification: expect.any(Object),
      })
    );
  });

  test("should return 403 when marking another user's notification", async () => {
    const req = { user: { userId: "otherUser" }, params: { id: "notif1" } };
    const res = mockResponse();

    await markAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.any(String) })
    );
  });

  test("should mark all notifications as read", async () => {
    const req = { user: mockUser };
    const res = mockResponse();

    await markAllAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        updatedCount: expect.any(Number),
      })
    );
  });

  test("should return unread count", async () => {
    const req = { user: mockUser };
    const res = mockResponse();

    await getUnreadCount(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        unreadCount: expect.any(Number),
      })
    );
  });

  test("should delete a notification", async () => {
    const req = { user: mockUser, params: { id: "notif1" } };
    const res = mockResponse();

    await deleteNotification(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: expect.any(String) })
    );
  });

  test("should return 404 when deleting non-existent notification", async () => {
    const req = { user: mockUser, params: { id: "nonexistent" } };
    const res = mockResponse();

    await deleteNotification(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
