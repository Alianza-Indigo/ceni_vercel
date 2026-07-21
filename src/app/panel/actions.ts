"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrgSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAnswers } from "@/lib/scoring";
import { STAGE_ORDER } from "@/lib/domain";

/** Stages in which the organization can still edit assessment and evidence. */
const EDITABLE_STAGES = STAGE_ORDER.slice(
  0,
  STAGE_ORDER.indexOf("REVISION_DOCUMENTAL") + 1,
);

async function getOwnedApplication(applicationId: string) {
  const session = await requireOrgSession();
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });
  if (!application || application.orgId !== session.user.orgId) {
    throw new Error("Expediente no encontrado");
  }
  return application;
}

const saveAssessmentSchema = z.object({
  applicationId: z.string().min(1),
  answers: z.record(z.string(), z.union([z.literal(0), z.literal(50), z.literal(100)])),
});

export type SaveAssessmentResult = { ok: true; savedAt: string } | { ok: false; error: string };

export async function saveAssessment(input: unknown): Promise<SaveAssessmentResult> {
  const parsed = saveAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Los datos recibidos no son válidos." };
  }
  const application = await getOwnedApplication(parsed.data.applicationId);
  if (!EDITABLE_STAGES.includes(application.stage)) {
    return {
      ok: false,
      error:
        "La autoevaluación ya no se puede editar: el expediente pasó la etapa de Revisión Documental.",
    };
  }

  // Keep only known criterion codes for this line.
  const criteria = await prisma.criterion.findMany({
    where: { line: application.line },
    select: { code: true },
  });
  const validCodes = new Set(criteria.map((c) => c.code));
  const answers = Object.fromEntries(
    Object.entries(parseAnswers(parsed.data.answers)).filter(([code]) =>
      validCodes.has(code),
    ),
  );

  await prisma.selfAssessment.upsert({
    where: { applicationId: application.id },
    update: { answers },
    create: { applicationId: application.id, answers },
  });

  return { ok: true, savedAt: new Date().toISOString() };
}

export async function deleteEvidence(evidenceId: string): Promise<void> {
  const session = await requireOrgSession();
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    include: { application: true },
  });
  if (!evidence || evidence.application.orgId !== session.user.orgId) {
    throw new Error("Evidencia no encontrada");
  }
  if (!EDITABLE_STAGES.includes(evidence.application.stage)) {
    throw new Error(
      "Las evidencias solo se pueden eliminar hasta la etapa de Revisión Documental",
    );
  }
  const { storage } = await import("@/lib/storage");
  await prisma.evidence.delete({ where: { id: evidenceId } });
  await storage.delete(evidence.storedPath);
  revalidatePath(`/panel/expediente/${evidence.applicationId}/evidencias`);
}

/** Creates a renewal file for the same line and scope of an owned certification. */
export async function startRenewal(certificationId: string): Promise<void> {
  const session = await requireOrgSession();
  const certification = await prisma.certification.findUnique({
    where: { id: certificationId },
  });
  if (!certification || certification.orgId !== session.user.orgId) {
    throw new Error("Certificación no encontrada");
  }
  const open = await prisma.application.findFirst({
    where: {
      orgId: session.user.orgId,
      line: certification.line,
      siteId: certification.siteId,
      status: "EN_PROCESO",
    },
  });
  if (open) {
    redirect(`/panel/expediente/${open.id}`);
  }
  const application = await prisma.application.create({
    data: {
      orgId: session.user.orgId,
      line: certification.line,
      siteId: certification.siteId,
      isRenewal: true,
    },
  });
  redirect(`/panel/expediente/${application.id}`);
}

/* ---------- Sites (establishments) ---------- */

const siteSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del establecimiento"),
  street: z.string().min(3, "Escribe calle y número"),
  city: z.string().min(2, "Escribe la ciudad o municipio"),
  state: z.string().min(2, "Elige un estado"),
  postalCode: z.string().regex(/^\d{5}$/, "El código postal tiene 5 dígitos"),
  latitude: z.coerce.number().min(14).max(33).nullable().optional(),
  longitude: z.coerce.number().min(-119).max(-86).nullable().optional(),
});

export type SiteActionResult =
  | { ok: true; siteId: string }
  | { ok: false; fieldErrors: Record<string, string> };

export async function createSite(input: unknown): Promise<SiteActionResult> {
  const session = await requireOrgSession();
  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const site = await prisma.site.create({
    data: {
      orgId: session.user.orgId,
      name: parsed.data.name,
      street: parsed.data.street,
      city: parsed.data.city,
      state: parsed.data.state,
      postalCode: parsed.data.postalCode,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
    },
  });
  revalidatePath("/panel");
  return { ok: true, siteId: site.id };
}

/* ---------- New applications (any line, any scope) ---------- */

const newApplicationSchema = z.object({
  line: z.enum(["LABORAL", "ESPACIOS"]),
  /// A site id, or "ORG" for organization-wide scope (LABORAL only).
  scope: z.string().min(1, "Elige el alcance del expediente"),
});

export type NewApplicationResult =
  | { ok: true; applicationId: string }
  | { ok: false; error: string };

export async function createApplication(input: unknown): Promise<NewApplicationResult> {
  const session = await requireOrgSession();
  const parsed = newApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { line, scope } = parsed.data;

  let siteId: string | null = null;
  if (scope === "ORG") {
    if (line === "ESPACIOS") {
      return {
        ok: false,
        error:
          "CENI Espacios evalúa condiciones físicas de un lugar concreto, así que el expediente debe apuntar a un establecimiento.",
      };
    }
  } else {
    const site = await prisma.site.findUnique({ where: { id: scope } });
    if (!site || site.orgId !== session.user.orgId) {
      return { ok: false, error: "Establecimiento no encontrado" };
    }
    siteId = site.id;
  }

  const open = await prisma.application.findFirst({
    where: { orgId: session.user.orgId, line, siteId, status: "EN_PROCESO" },
  });
  if (open) {
    return {
      ok: false,
      error:
        "Ya existe un expediente en proceso para esa línea y ese alcance. Puedes darle seguimiento desde tu panel.",
    };
  }

  const application = await prisma.application.create({
    data: { orgId: session.user.orgId, line, siteId },
  });
  revalidatePath("/panel");
  return { ok: true, applicationId: application.id };
}
