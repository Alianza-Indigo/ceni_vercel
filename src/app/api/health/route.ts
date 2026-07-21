import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe for load balancers and container healthchecks. */
export async function GET() {
  const checks = {
    databaseUrl: Boolean(process.env.DATABASE_URL),
    authSecret: Boolean(process.env.AUTH_SECRET),
    blobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    storageDriver: process.env.STORAGE_DRIVER ?? "auto",
  };

  if (!checks.databaseUrl) {
    return NextResponse.json(
      { status: "missing_database_url", checks },
      { status: 503 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", checks });
  } catch (error) {
    return NextResponse.json(
      {
        status: "database_unreachable",
        checks,
        error: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 503 },
    );
  }
}
