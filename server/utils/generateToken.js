const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const generateAccessToken = (userId, options = {}) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "60m",
    ...options,
  });
};

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
};

const revokeRefreshToken = async (token) => {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  revokeRefreshToken,
};
