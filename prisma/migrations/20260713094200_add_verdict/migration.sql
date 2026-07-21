-- CreateTable
CREATE TABLE "Verdict" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "total" INTEGER NOT NULL,
    "dimensionScores" JSONB NOT NULL,
    "floorFailures" JSONB NOT NULL,
    "level" "CertLevel",
    "approved" BOOLEAN NOT NULL,
    "decidedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verdict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verdict_applicationId_key" ON "Verdict"("applicationId");

-- AddForeignKey
ALTER TABLE "Verdict" ADD CONSTRAINT "Verdict_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
