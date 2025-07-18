// server/tests/utils/mockAuthMiddleware.js
let mockUser = { userId: "client123", role: "client" };

const mockAuthMiddleware = (req, res, next) => {
  req.user = mockUser;
  next();
};

const setMockUser = (user) => {
  mockUser = user;
};

const resetMockUser = () => {
  mockUser = { userId: "client123", role: "client" };
};

module.exports = {
  mockAuthMiddleware,
  setMockUser,
  resetMockUser,
};
