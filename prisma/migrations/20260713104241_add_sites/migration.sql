-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "siteId" TEXT;

-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "siteId" TEXT;

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Site_orgId_idx" ON "Site"("orgId");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every existing organization gets a primary site copied from its
-- legal address, and existing applications/certifications anchor to it.
INSERT INTO "Site" ("id", "orgId", "name", "street", "city", "state", "postalCode", "latitude", "longitude", "isPrimary")
SELECT
    'site_' || substr(md5(random()::text || o."id"), 1, 24),
    o."id",
    'Sede principal',
    o."street",
    o."city",
    o."state",
    o."postalCode",
    o."latitude",
    o."longitude",
    true
FROM "Organization" o;

UPDATE "Application" a
SET "siteId" = s."id"
FROM "Site" s
WHERE s."orgId" = a."orgId" AND s."isPrimary" = true AND a."siteId" IS NULL;

UPDATE "Certification" c
SET "siteId" = s."id"
FROM "Site" s
WHERE s."orgId" = c."orgId" AND s."isPrimary" = true AND c."siteId" IS NULL;
