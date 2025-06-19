const mockUser = {
  id: 1,
  email: "john@example.com",
  password: "hashedpassword",
  token: null,
};

const prisma = {
  user: {
    findUnique: jest.fn(({ where }) => {
      if (where.email === "existing@example.com") {
        return Promise.resolve(mockUser); // simulate found user
      }
      return Promise.resolve(null); // simulate user not found
    }),
    create: jest.fn((data) => Promise.resolve({ id: 2, ...data.data })),
    update: jest.fn((args) => Promise.resolve({ ...args.data })),
  },
};

module.exports = {
  PrismaClient: jest.fn(() => prisma),
};
