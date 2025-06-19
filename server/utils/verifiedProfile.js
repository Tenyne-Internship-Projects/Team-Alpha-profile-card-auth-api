//@ Import Prisma Client to interact with the database
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//@ Function to check if a user's profile is verified
const isVerifiedProfile = async (userId) => {
  // Try to find the user by their ID and only select the "verified" field
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verified: true },
  });

  //@ Return true if the user is verified, otherwise return false
  return user?.verified || false;
};
//@ Export the function so it can be used in other files
module.exports = isVerifiedProfile;
