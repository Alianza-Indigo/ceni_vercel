CREATE TYPE "OrgNetworkStatus" AS ENUM ('AFILIADA');

ALTER TABLE "Organization"
ADD COLUMN "networkStatus" "OrgNetworkStatus" NOT NULL DEFAULT 'AFILIADA';
