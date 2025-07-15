-- CreateTable
CREATE TABLE "profile_visits" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "profile_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_visits_profileId_visitorId_key" ON "profile_visits"("profileId", "visitorId");

-- AddForeignKey
ALTER TABLE "profile_visits" ADD CONSTRAINT "profile_visits_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_visits" ADD CONSTRAINT "profile_visits_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
