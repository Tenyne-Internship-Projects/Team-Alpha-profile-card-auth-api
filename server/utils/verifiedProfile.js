// utils/verifiedProfile.js

// ⚠️ [Deprecated] Email verification is no longer required before profile completion.
// Retained for future use if email verification gating is reintroduced.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const isVerifiedProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verified: true },
  });

  return user?.verified || false;
};

module.exports = isVerifiedProfile;
