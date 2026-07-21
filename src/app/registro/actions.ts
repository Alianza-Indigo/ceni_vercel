"use server";

import { headers } from "next/headers";
import { hash } from "@node-rs/argon2";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { MX_STATES } from "@/lib/domain";

const registrationSchema = z.object({
  email: z.string().email("El correo no tiene un formato válido").toLowerCase(),
  password: z
    .string()
    .min(10, "La contraseña debe tener al menos 10 caracteres"),
  legalName: z.string().min(3, "Escribe la razón social completa"),
  tradeName: z.string().min(2, "Escribe el nombre comercial"),
  rfc: z.string().max(13).optional().or(z.literal("")),
  sector: z.string().min(2, "Escribe el sector o giro"),
  size: z.enum(["PEQUENA", "MEDIANA", "GRANDE", "CORPORATIVO"]),
  street: z.string().min(3, "Escribe calle y número"),
  city: z.string().min(2, "Escribe la ciudad o municipio"),
  state: z.enum(MX_STATES, { message: "Elige un estado de la lista" }),
  postalCode: z.string().regex(/^\d{5}$/, "El código postal tiene 5 dígitos"),
  latitude: z.coerce.number().min(14).max(33).nullable().optional(),
  longitude: z.coerce.number().min(-119).max(-86).nullable().optional(),
  contactName: z.string().min(3, "Escribe el nombre de la persona de contacto"),
  phone: z.string().max(20).optional().or(z.literal("")),
  website: z.string().url("La página web debe iniciar con https://").optional().or(z.literal("")),
  referralCode: z.string().max(40).optional().or(z.literal("")),
  lines: z
    .array(z.enum(["LABORAL", "ESPACIOS"]))
    .min(1, "Elige al menos una línea de certificación"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export type RegistrationResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string>; formError?: string };

export async function registerOrganization(
  input: unknown,
): Promise<RegistrationResult> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`register:${ip}`, 5)) {
    return {
      ok: false,
      fieldErrors: {},
      formError:
        "Qué pasó: se recibieron demasiados registros seguidos desde tu conexión. Cómo corregirlo: espera un minuto y vuelve a enviar el formulario; tus datos siguen escritos.",
    };
  }

  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return {
      ok: false,
      fieldErrors: {
        email:
          "Ya existe una cuenta con este correo. Si es tuya, usa la página Entrar.",
      },
    };
  }

  const passwordHash = await hash(data.password);

  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        legalName: data.legalName,
        tradeName: data.tradeName,
        rfc: data.rfc || null,
        sector: data.sector,
        size: data.size,
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        contactName: data.contactName,
        contactEmail: data.email,
        phone: data.phone || null,
        website: data.website || null,
        referralCode: data.referralCode || null,
      },
    });
    // Every organization starts with a primary site (its registered address).
    // Chains add more establishments from the panel.
    const primarySite = await tx.site.create({
      data: {
        orgId: organization.id,
        name: "Sede principal",
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        isPrimary: true,
      },
    });
    await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "ORG",
        orgId: organization.id,
      },
    });
    for (const line of data.lines) {
      await tx.application.create({
        data: { orgId: organization.id, line, siteId: primarySite.id },
      });
    }
  });

  return { ok: true };
}
