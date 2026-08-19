import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { inviteEmployeeInCurso, fetchEmployeeProgress } from "@/lib/curso-client";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("curso-client", () => {
  const ORIGINAL_URL = process.env.CURSO_API_URL;
  const ORIGINAL_KEY = process.env.CURSO_API_KEY;

  beforeEach(() => {
    process.env.CURSO_API_URL = "https://curso.example/api/partner";
    process.env.CURSO_API_KEY = "clave-de-prueba";
  });

  afterEach(() => {
    process.env.CURSO_API_URL = ORIGINAL_URL;
    process.env.CURSO_API_KEY = ORIGINAL_KEY;
    vi.unstubAllGlobals();
  });

  it("inviteEmployeeInCurso: éxito con payload válido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ token: "tok123", expiraEn: "2026-08-26T00:00:00.000Z", emailEnviado: true }),
      ),
    );
    const result = await inviteEmployeeInCurso({ organizacionId: "org1", email: "a@b.com" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.token).toBe("tok123");
  });

  it("inviteEmployeeInCurso: payload inválido -> invalid_response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ algo: "raro" })));
    const result = await inviteEmployeeInCurso({ organizacionId: "org1", email: "a@b.com" });
    expect(result).toEqual({ ok: false, kind: "invalid_response" });
  });

  it("inviteEmployeeInCurso: 500 sin motivo -> http_error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(null, 500)));
    const result = await inviteEmployeeInCurso({ organizacionId: "org1", email: "a@b.com" });
    expect(result).toEqual({ ok: false, kind: "http_error", status: 500 });
  });

  it("inviteEmployeeInCurso: 409 con motivo -> rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ ok: false, motivo: "ya_pertenece" }, 409)),
    );
    const result = await inviteEmployeeInCurso({ organizacionId: "org1", email: "a@b.com" });
    expect(result).toEqual({ ok: false, kind: "rejected", status: 409, motivo: "ya_pertenece" });
  });

  it("inviteEmployeeInCurso: error de red -> unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const result = await inviteEmployeeInCurso({ organizacionId: "org1", email: "a@b.com" });
    expect(result).toEqual({ ok: false, kind: "unreachable" });
  });

  it("inviteEmployeeInCurso: timeout -> kind timeout", async () => {
    const abortError = Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    const result = await inviteEmployeeInCurso({ organizacionId: "org1", email: "a@b.com" });
    expect(result).toEqual({ ok: false, kind: "timeout" });
  });

  it("no_configurado si faltan las env vars", async () => {
    delete process.env.CURSO_API_URL;
    delete process.env.CURSO_API_KEY;
    vi.stubGlobal("fetch", vi.fn());
    const result = await fetchEmployeeProgress("org1");
    expect(result).toEqual({ ok: false, kind: "no_configurado" });
  });

  it("fetchEmployeeProgress: éxito con payload válido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          organizacionId: "org1",
          empleados: [
            {
              userId: "u1",
              email: "a@b.com",
              nombre: "Ana",
              modulosCompletados: 3,
              modulosTotal: 10,
              porcentajeModulos: 30,
              examenAprobado: false,
              certificado: false,
              folio: null,
            },
          ],
          invitacionesPendientes: [],
        }),
      ),
    );
    const result = await fetchEmployeeProgress("org1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.empleados).toHaveLength(1);
  });
});
