import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

/** Serves an evidence file to its owner organization or to an ADMIN. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const evidence = await prisma.evidence.findUnique({
    where: { id },
    include: { application: { select: { orgId: true } } },
  });
  if (!evidence) {
    return NextResponse.json({ error: "Evidencia no encontrada" }, { status: 404 });
  }
  const isOwner =
    session.user.role === "ORG" && session.user.orgId === evidence.application.orgId;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const buffer = await storage.read(evidence.storedPath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": evidence.mimeType,
      "Content-Length": String(evidence.sizeBytes),
      "Content-Disposition": `attachment; filename="${evidence.fileName}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
