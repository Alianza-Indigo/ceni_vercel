"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeAssessment, parseAnswers } from "@/lib/scoring";
import {
  formatFolio,
  LEVEL_VALIDITY_YEARS,
  STAGE_LABELS,
  STAGE_ORDER,
  STATUS_CHANGE_CAUSES,
} from "@/lib/domain";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

function failure(error: unknown, fallback: string): ActionResult {
  return {
    ok: false,
    error: error instanceof Error && error.message !== "" ? error.message : fallback,
  };
}

async function audit(
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  payload: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({
    data: { actorId, action, entity, entityId, payload },
  });
}

/* ---------- Stage transitions ---------- */

const transitionSchema = z.object({
  applicationId: z.string().min(1),
  note: z.string().trim().min(5, "La nota es obligatoria (mínimo 5 caracteres)"),
});

/** Advances a file to the immediate next stage. Stage skipping is rejected. */
export async function advanceStage(input: unknown): Promise<ActionResult> {
  try {
    const session = await requireAdminSession();
    const parsed = transitionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const application = await prisma.application.findUnique({
      where: { id: parsed.data.applicationId },
    });
    if (!application) return { ok: false, error: "Expediente no encontrado" };
    if (application.status !== "EN_PROCESO") {
      return { ok: false, error: "El expediente ya está cerrado" };
    }
    const currentIndex = STAGE_ORDER.indexOf(application.stage);
    const nextStage = STAGE_ORDER[currentIndex + 1];
    if (!nextStage) {
      return { ok: false, error: "El expediente ya está en la última etapa" };
    }
    if (nextStage === "CIERRE") {
      return {
        ok: false,
        error:
          "El paso a Cierre se hace con el dictamen del Comité, no con una transición manual.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: application.id },
        data: { stage: nextStage, stageEnteredAt: new Date() },
      });
      await tx.adminNote.create({
        data: {
          applicationId: application.id,
          authorId: session!.user.id,
          stage: nextStage,
          body: parsed.data.note,
        },
      });
    });
    await audit(session!.user.id, "STAGE_ADVANCED", "Application", application.id, {
      from: application.stage,
      to: nextStage,
      note: parsed.data.note,
    });
    revalidatePath("/admin/expedientes");
    revalidatePath(`/admin/expedientes/${application.id}`);
    return { ok: true, message: `Etapa actualizada a ${STAGE_LABELS[nextStage]}` };
  } catch (error) {
    return failure(error, "No se pudo actualizar la etapa");
  }
}

const noteSchema = z.object({
  applicationId: z.string().min(1),
  note: z.string().trim().min(5, "La nota es obligatoria (mínimo 5 caracteres)"),
});

export async function addNote(input: unknown): Promise<ActionResult> {
  try {
    const session = await requireAdminSession();
    const parsed = noteSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const application = await prisma.application.findUnique({
      where: { id: parsed.data.applicationId },
    });
    if (!application) return { ok: false, error: "Expediente no encontrado" };
    await prisma.adminNote.create({
      data: {
        applicationId: application.id,
        authorId: session!.user.id,
        stage: application.stage,
        body: parsed.data.note,
      },
    });
    await audit(session!.user.id, "NOTE_ADDED", "Application", application.id, {
      stage: application.stage,
    });
    revalidatePath(`/admin/expedientes/${application.id}`);
    return { ok: true, message: "Nota agregada" };
  } catch (error) {
    return failure(error, "No se pudo agregar la nota");
  }
}

/* ---------- Verdict (dictamen) ---------- */

const verdictSchema = z.object({
  applicationId: z.string().min(1),
  answers: z.record(z.string(), z.union([z.literal(0), z.literal(50), z.literal(100)])),
});

export async function submitVerdict(input: unknown): Promise<ActionResult> {
  try {
    const session = await requireAdminSession();
    const parsed = verdictSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const application = await prisma.application.findUnique({
      where: { id: parsed.data.applicationId },
    });
    if (!application) return { ok: false, error: "Expediente no encontrado" };
    if (application.stage !== "DICTAMEN" || application.status !== "EN_PROCESO") {
      return { ok: false, error: "El expediente no está en etapa de Dictamen" };
    }

    const criteria = await prisma.criterion.findMany({
      where: { line: application.line },
      select: { code: true, dimension: true, maxPoints: true },
    });
    const answers = parseAnswers(parsed.data.answers);
    const missing = criteria.filter((c) => answers[c.code] === undefined);
    if (missing.length > 0) {
      return {
        ok: false,
        error: `Faltan ${missing.length} criterios por calificar (por ejemplo ${missing[0].code}).`,
      };
    }
    const result = computeAssessment(criteria, answers);
    const approved = result.level !== null;

    await prisma.$transaction(async (tx) => {
      await tx.verdict.upsert({
        where: { applicationId: application.id },
        update: {
          answers,
          total: result.total,
          dimensionScores: Object.fromEntries(
            result.dimensions.map((d) => [String(d.dimension), d.points]),
          ),
          floorFailures: result.floorFailures,
          level: result.level,
          approved,
          decidedById: session!.user.id,
        },
        create: {
          applicationId: application.id,
          answers,
          total: result.total,
          dimensionScores: Object.fromEntries(
            result.dimensions.map((d) => [String(d.dimension), d.points]),
          ),
          floorFailures: result.floorFailures,
          level: result.level,
          approved,
          decidedById: session!.user.id,
        },
      });
      await tx.application.update({
        where: { id: application.id },
        data: approved
          ? { stage: "CIERRE", stageEnteredAt: new Date() }
          : {
              stage: "CIERRE",
              stageEnteredAt: new Date(),
              status: "PLAN_DE_MEJORA",
              decidedAt: new Date(),
            },
      });
      await tx.adminNote.create({
        data: {
          applicationId: application.id,
          authorId: session!.user.id,
          stage: "CIERRE",
          body: approved
            ? `Dictamen del Comité: se aprueba el nivel ${result.level} con ${result.total} puntos. Pasa a Cierre para emisión del certificado.`
            : `Dictamen del Comité: Plan de Mejora. Total ${result.total} puntos. Dimensión(es) bajo el piso del 40%: ${
                result.floorFailures.length > 0
                  ? result.floorFailures.map((d) => `D${d}`).join(", ")
                  : "ninguna (el total quedó por debajo de 500 puntos)"
              }.`,
        },
      });
    });
    await audit(session!.user.id, "VERDICT_SUBMITTED", "Application", application.id, {
      total: result.total,
      level: result.level,
      floorFailures: result.floorFailures,
      approved,
    });
    revalidatePath(`/admin/expedientes/${application.id}`);
    revalidatePath("/admin/expedientes");
    return {
      ok: true,
      message: approved
        ? `Dictamen registrado: nivel ${result.level} (${result.total} puntos).`
        : `Dictamen registrado: Plan de Mejora (${result.total} puntos).`,
    };
  } catch (error) {
    return failure(error, "No se pudo registrar el dictamen");
  }
}

/* ---------- Certificate emission ---------- */

export async function issueCertificate(applicationId: string): Promise<ActionResult> {
  try {
    const session = await requireAdminSession();
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { verdict: true, certification: true },
    });
    if (!application) return { ok: false, error: "Expediente no encontrado" };
    if (application.certification) {
      return { ok: false, error: "Este expediente ya tiene certificado emitido" };
    }
    if (
      application.stage !== "CIERRE" ||
      application.status !== "EN_PROCESO" ||
      !application.verdict?.approved ||
      !application.verdict.level
    ) {
      return {
        ok: false,
        error: "El expediente no tiene un dictamen aprobatorio en etapa de Cierre",
      };
    }
    const verdict = application.verdict;
    const level = verdict.level as NonNullable<typeof verdict.level>;

    const now = new Date();
    const year = now.getUTCFullYear();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + LEVEL_VALIDITY_YEARS[level]);

    const folio = await prisma.$transaction(
      async (tx) => {
        // Transactional consecutive folio per line and year.
        const counter = await tx.folioCounter.upsert({
          where: { line_year: { line: application.line, year } },
          update: { lastNumber: { increment: 1 } },
          create: { line: application.line, year, lastNumber: 1 },
        });
        const newFolio = formatFolio(application.line, year, counter.lastNumber);

        // Only one VIGENTE certification per line per scope (a specific site,
        // or the whole organization): any still-valid previous certificate of
        // the same scope is superseded now.
        await tx.certification.updateMany({
          where: {
            orgId: application.orgId,
            line: application.line,
            siteId: application.siteId,
            status: { in: ["VIGENTE", "POR_VENCER"] },
          },
          data: {
            status: "VENCIDA",
            statusReason: `Sustituida por el folio ${newFolio}`,
          },
        });

        await tx.certification.create({
          data: {
            orgId: application.orgId,
            siteId: application.siteId,
            applicationId: application.id,
            line: application.line,
            level,
            score: verdict.total,
            dimensionScores: verdict.dimensionScores as Prisma.InputJsonValue,
            folio: newFolio,
            issuedAt: now,
            expiresAt,
            status: "VIGENTE",
            qrToken: randomBytes(24).toString("base64url"),
          },
        });
        await tx.application.update({
          where: { id: application.id },
          data: { status: "CERTIFICADO", decidedAt: now },
        });
        return newFolio;
      },
      { isolationLevel: "Serializable" },
    );

    await audit(session!.user.id, "CERT_ISSUED", "Application", application.id, {
      folio,
      level,
      score: verdict.total,
    });
    revalidatePath("/admin/expedientes");
    revalidatePath(`/admin/expedientes/${application.id}`);
    revalidatePath("/directorio");
    return { ok: true, message: `Certificado emitido con folio ${folio}` };
  } catch (error) {
    return failure(error, "No se pudo emitir el certificado");
  }
}

/* ---------- National registry status changes ---------- */

const statusChangeSchema = z.object({
  certificationId: z.string().min(1),
  action: z.enum(["SUSPENDER", "REACTIVAR", "RETIRAR"]),
  cause: z.string().optional(),
});

export async function changeCertificationStatus(input: unknown): Promise<ActionResult> {
  try {
    const session = await requireAdminSession();
    const parsed = statusChangeSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Datos inválidos" };
    }
    const { certificationId, action, cause } = parsed.data;
    const certification = await prisma.certification.findUnique({
      where: { id: certificationId },
    });
    if (!certification) return { ok: false, error: "Certificación no encontrada" };

    if (action !== "REACTIVAR") {
      if (!cause || !STATUS_CHANGE_CAUSES.includes(cause as (typeof STATUS_CHANGE_CAUSES)[number])) {
        return { ok: false, error: "La causal es obligatoria y debe ser del catálogo" };
      }
    }

    if (action === "SUSPENDER" && certification.status === "RETIRADA") {
      return { ok: false, error: "Una certificación retirada no se puede suspender" };
    }
    if (action === "REACTIVAR" && certification.status !== "SUSPENDIDA") {
      return { ok: false, error: "Solo se puede reactivar una certificación suspendida" };
    }

    const nextStatus =
      action === "SUSPENDER" ? "SUSPENDIDA" : action === "RETIRAR" ? "RETIRADA" : "VIGENTE";

    await prisma.certification.update({
      where: { id: certificationId },
      data: {
        status: nextStatus,
        statusReason: action === "REACTIVAR" ? null : cause,
      },
    });
    await audit(session!.user.id, `CERT_${nextStatus}`, "Certification", certificationId, {
      folio: certification.folio,
      cause: cause ?? null,
    });
    revalidatePath("/admin/registro");
    revalidatePath("/directorio");
    revalidatePath(`/verificar/${certification.folio}`);
    return { ok: true, message: `Estado actualizado: ${nextStatus}` };
  } catch (error) {
    return failure(error, "No se pudo cambiar el estado");
  }
}

/* ---------- Users ---------- */

const createAdminSchema = z.object({
  email: z.string().email("El correo no tiene un formato válido").toLowerCase(),
  password: z.string().min(10, "La contraseña debe tener al menos 10 caracteres"),
});

export async function createAdminUser(input: unknown): Promise<ActionResult> {
  try {
    const session = await requireAdminSession();
    const parsed = createAdminSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return { ok: false, error: "Ya existe una cuenta con ese correo" };
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash: await hash(parsed.data.password),
        role: "ADMIN",
      },
    });
    await audit(session!.user.id, "ADMIN_CREATED", "User", user.id, {
      email: user.email,
    });
    revalidatePath("/admin/usuarios");
    return { ok: true, message: `Cuenta ADMIN creada para ${user.email}` };
  } catch (error) {
    return failure(error, "No se pudo crear la cuenta");
  }
}

const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(10, "La contraseña debe tener al menos 10 caracteres"),
});

export async function resetOrgPassword(input: unknown): Promise<ActionResult> {
  try {
    const session = await requireAdminSession();
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!user || user.role !== "ORG") {
      return { ok: false, error: "Solo se puede resetear la contraseña de cuentas ORG" };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(parsed.data.password) },
    });
    await audit(session!.user.id, "ORG_PASSWORD_RESET", "User", user.id, {
      email: user.email,
    });
    return { ok: true, message: `Contraseña actualizada para ${user.email}` };
  } catch (error) {
    return failure(error, "No se pudo actualizar la contraseña");
  }
}

/* ---------- Site metrics ---------- */

const metricSchema = z.object({
  key: z.literal("people_trained"),
  value: z.coerce.number().int().min(0),
});

export async function updateSiteMetric(input: unknown): Promise<ActionResult> {
  try {
    const session = await requireAdminSession();
    const parsed = metricSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "El valor debe ser un número entero positivo" };
    }
    await prisma.siteMetric.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value },
      create: {
        key: parsed.data.key,
        label: "Personas capacitadas",
        value: parsed.data.value,
      },
    });
    await audit(session!.user.id, "METRIC_UPDATED", "SiteMetric", parsed.data.key, {
      value: parsed.data.value,
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, message: "Contador actualizado" };
  } catch (error) {
    return failure(error, "No se pudo actualizar el contador");
  }
}
