import { z } from "zod";

// Cliente HTTP server-to-server hacia curso_ceni (LMS de capacitación). Nunca
// se importa desde un componente cliente: CURSO_API_URL/CURSO_API_KEY solo
// existen en el server. Nunca lanza excepción por fallos esperables (timeout,
// red caída, 4xx/5xx) — devuelve un resultado discriminado para que la UI
// pueda degradar en vez de romperse.

const TIMEOUT_INVITAR_MS = 8_000;
const TIMEOUT_PROGRESO_MS = 5_000;

export type CursoError =
  | { ok: false; kind: "timeout" | "unreachable" | "http_error" | "invalid_response" | "no_configurado"; status?: number }
  | { ok: false; kind: "rejected"; status: number; motivo: string };

export type CursoResult<T> = { ok: true; data: T } | CursoError;

async function cursoFetch(path: string, init: RequestInit, timeoutMs: number): Promise<CursoResult<unknown>> {
  const baseUrl = process.env.CURSO_API_URL;
  const apiKey = process.env.CURSO_API_KEY;
  if (!baseUrl || !apiKey) {
    console.error("curso-client: CURSO_API_URL/CURSO_API_KEY no configuradas");
    return { ok: false, kind: "no_configurado" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    const json: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const motivo =
        json && typeof json === "object" && "motivo" in json && typeof (json as { motivo: unknown }).motivo === "string"
          ? (json as { motivo: string }).motivo
          : null;
      if (motivo) {
        return { ok: false, kind: "rejected", status: response.status, motivo };
      }
      return { ok: false, kind: "http_error", status: response.status };
    }

    if (json === null) return { ok: false, kind: "invalid_response" };
    return { ok: true, data: json };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, kind: "timeout" };
    }
    console.error("curso-client: fallo de red hacia curso_ceni", error);
    return { ok: false, kind: "unreachable" };
  } finally {
    clearTimeout(timeout);
  }
}

const inviteResponseSchema = z.object({
  token: z.string(),
  expiraEn: z.string(),
  emailEnviado: z.boolean(),
});

export type InviteEmployeeResult = CursoResult<z.infer<typeof inviteResponseSchema>>;

export async function inviteEmployeeInCurso(params: {
  organizacionId: string;
  email: string;
  invitadoPor?: string;
}): Promise<InviteEmployeeResult> {
  const result = await cursoFetch(
    "/invitaciones",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(params),
    },
    TIMEOUT_INVITAR_MS,
  );
  if (!result.ok) return result;

  const parsed = inviteResponseSchema.safeParse(result.data);
  if (!parsed.success) return { ok: false, kind: "invalid_response" };
  return { ok: true, data: parsed.data };
}

const employeeProgressSchema = z.object({
  organizacionId: z.string(),
  empleados: z.array(
    z.object({
      userId: z.string(),
      email: z.string().nullable(),
      nombre: z.string().nullable(),
      modulosCompletados: z.number(),
      modulosTotal: z.number(),
      porcentajeModulos: z.number(),
      examenAprobado: z.boolean(),
      certificado: z.boolean(),
      folio: z.string().nullable(),
    }),
  ),
  invitacionesPendientes: z.array(z.object({ email: z.string(), expiraEn: z.string() })),
});

export type ProgresoOrganizacion = z.infer<typeof employeeProgressSchema>;
export type FetchEmployeeProgressResult = CursoResult<ProgresoOrganizacion>;

export async function fetchEmployeeProgress(organizacionId: string): Promise<FetchEmployeeProgressResult> {
  const result = await cursoFetch(
    `/progreso?organizacionId=${encodeURIComponent(organizacionId)}`,
    { method: "GET" },
    TIMEOUT_PROGRESO_MS,
  );
  if (!result.ok) return result;

  const parsed = employeeProgressSchema.safeParse(result.data);
  if (!parsed.success) return { ok: false, kind: "invalid_response" };
  return { ok: true, data: parsed.data };
}
