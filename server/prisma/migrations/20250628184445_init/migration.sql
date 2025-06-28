-- CreateEnum
CREATE TYPE "Role" AS ENUM ('client', 'admin', 'freelancer');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('open', 'closed', 'repost');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "verificationToken" TEXT,
    "verificationTokenExpires" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'freelancer',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "profession" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "bio" TEXT,
    "skills" TEXT[],
    "avatarUrl" TEXT,
    "documents" TEXT[],
    "linkedIn" TEXT,
    "github" TEXT,
    "primaryEmail" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "salaryExpectation" INTEGER,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "companyName" TEXT,
    "companyWebsite" TEXT,
    "companyIndustry" TEXT,
    "companySize" TEXT,
    "companyAddress" TEXT,
    "isHiringFrequently" BOOLEAN NOT NULL DEFAULT false,
    "companyLogo" TEXT,
    "hiringCategories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "tags" TEXT[],
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'open',
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "projects_budget_idx" ON "projects"("budget");

-- CreateIndex
CREATE INDEX "projects_tags_idx" ON "projects"("tags");

-- CreateIndex
CREATE INDEX "projects_deadline_idx" ON "projects"("deadline");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
