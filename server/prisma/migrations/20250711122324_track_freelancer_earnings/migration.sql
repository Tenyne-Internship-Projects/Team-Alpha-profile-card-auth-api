-- CreateEnum
CREATE TYPE "ProjectProgressStatus" AS ENUM ('draft', 'ongoing', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "client_profiles" ALTER COLUMN "isHiringFrequently" SET DEFAULT true,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "progressStatus" "ProjectProgressStatus" NOT NULL DEFAULT 'draft';

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_projectId_key" ON "payments"("projectId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
