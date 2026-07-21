import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, sanitizeFileName, storage } from "@/lib/storage";
import { STAGE_ORDER } from "@/lib/domain";

const EDITABLE_STAGES = STAGE_ORDER.slice(
  0,
  STAGE_ORDER.indexOf("REVISION_DOCUMENTAL") + 1,
);

/** Uploads one evidence file for a dimension of an owned application. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ORG" || !session.user.orgId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application || application.orgId !== session.user.orgId) {
    return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
  }
  if (!EDITABLE_STAGES.includes(application.stage)) {
    return NextResponse.json(
      {
        error:
          "Las evidencias solo se pueden subir hasta la etapa de Revisión Documental.",
      },
      { status: 409 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const dimension = Number(form?.get("dimension"));
  if (!(file instanceof File) || !Number.isInteger(dimension) || dimension < 1 || dimension > 6) {
    return NextResponse.json(
      { error: "Falta el archivo o la dimensión (1 a 6)." },
      { status: 400 },
    );
  }
  if (!ALLOWED_MIME_TYPES[file.type]) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usa PDF, PNG o JPG." },
      { status: 415 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "El archivo pesa más de 10 MB. Reduce su tamaño e inténtalo de nuevo." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storedPath = await storage.save(buffer, file.name, file.type);
  const evidence = await prisma.evidence.create({
    data: {
      applicationId: application.id,
      dimension,
      fileName: sanitizeFileName(file.name),
      storedPath,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });

  return NextResponse.json({ ok: true, evidenceId: evidence.id });
}
