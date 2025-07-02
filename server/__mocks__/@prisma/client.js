const mockUser = {
  id: "client123",
  email: "john@example.com",
  password: "hashedpassword",
  token: null,
};

const mockProject = {
  id: "project123",
  title: "Sample Project",
  description: "Project Description",
  budget: 1000,
  tags: ["react", "node"],
  responsibilities: "Responsibilities",
  location: "Remote",
  deadline: new Date().toISOString(),
  requirement: "Must have experience",
  clientId: "client123",
};

const mockApplication = {
  id: "app1",
  projectId: "project123",
  freelancerId: "freelancer1",
  message: "Interested",
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prisma = {
  user: {
    findUnique: jest.fn(() => Promise.resolve(mockUser)),
  },
  project: {
    create: jest.fn(() => Promise.resolve(mockProject)),
    findUnique: jest.fn(() => Promise.resolve(mockProject)),
    update: jest.fn(() => Promise.resolve({ ...mockProject, deleted: true })),
    findMany: jest.fn(() => Promise.resolve([mockProject])),
    count: jest.fn(() => Promise.resolve(1)),
  },
  application: {
    create: jest.fn(() => Promise.resolve(mockApplication)),
    findUnique: jest.fn(() => Promise.resolve(null)), // Override in tests as needed
    findMany: jest.fn(() => Promise.resolve([mockApplication])),
    update: jest.fn(() =>
      Promise.resolve({ ...mockApplication, status: "approved" })
    ),
  },
};

module.exports = {
  PrismaClient: jest.fn(() => prisma),
};
