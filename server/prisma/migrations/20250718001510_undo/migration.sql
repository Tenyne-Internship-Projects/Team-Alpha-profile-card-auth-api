/*
  Warnings:

  - You are about to drop the column `senderId` on the `notifications` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_senderId_fkey";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "senderId";
