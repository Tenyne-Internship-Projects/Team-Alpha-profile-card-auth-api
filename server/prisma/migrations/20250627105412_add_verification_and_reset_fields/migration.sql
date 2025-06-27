-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpires" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpires" TIMESTAMP(3);
