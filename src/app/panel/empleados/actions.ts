"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { inviteEmployeeInCurso } from "@/lib/curso-client";

const inviteEmployeeSchema = z.object({
  email: z.string().email("El correo no tiene un formato válido").toLowerCase(),
});

export type InviteEmployeeActionResult = { ok: true } | { ok: false; error: string };

const MOTIVO_LABELS: Record<string, string> = {
  ya_pertenece: "Este correo ya forma parte de tu equipo.",
  ya_pertenece_a_otra_organizacion: "Este correo ya pertenece a otra organización.",
  limite_excedido: "Se enviaron demasiadas invitaciones en la última hora. Intenta más tarde.",
};

export async function inviteEmployee(input: unknown): Promise<InviteEmployeeActionResult> {
  const session = await requireOrgSession();

  const parsed = inviteEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Correo inválido" };
  }

  // orgId sale de la sesión, nunca del input del cliente.
  if (!checkRateLimit(`invite-employee:${session.user.orgId}`, 30)) {
    return { ok: false, error: "Demasiadas invitaciones seguidas. Espera un minuto e intenta de nuevo." };
  }

  const resultado = await inviteEmployeeInCurso({
    organizacionId: session.user.orgId,
    email: parsed.data.email,
    invitadoPor: session.user.email,
  });

  if (!resultado.ok) {
    if (resultado.kind === "rejected") {
      return { ok: false, error: MOTIVO_LABELS[resultado.motivo] ?? "No se pudo enviar la invitación." };
    }
    return {
      ok: false,
      error: "No se pudo contactar al servicio de capacitación. Intenta de nuevo en unos minutos.",
    };
  }

  revalidatePath("/panel/empleados");
  return { ok: true };
}
