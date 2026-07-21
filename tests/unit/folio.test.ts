import { describe, expect, it } from "vitest";
import { formatFolio, isValidFolio } from "@/lib/domain";
import { effectiveCertStatus } from "@/lib/cert-status";

describe("folio format", () => {
  it("formats per line and year with 4-digit consecutive", () => {
    expect(formatFolio("LABORAL", 2026, 1)).toBe("CENI-L-2026-0001");
    expect(formatFolio("ESPACIOS", 2026, 123)).toBe("CENI-E-2026-0123");
  });

  it("validates well-formed folios only", () => {
    expect(isValidFolio("CENI-L-2026-0001")).toBe(true);
    expect(isValidFolio("ceni-l-2026-0001")).toBe(true); // normalized upstream
    expect(isValidFolio("CENI-X-2026-0001")).toBe(false);
    expect(isValidFolio("CENI-L-26-0001")).toBe(false);
    expect(isValidFolio("CENI-L-2026-001")).toBe(false);
    expect(isValidFolio("")).toBe(false);
  });
});

describe("effectiveCertStatus", () => {
  const now = new Date("2026-07-13T00:00:00Z");

  it("VIGENTE far from expiry stays VIGENTE", () => {
    expect(effectiveCertStatus("VIGENTE", new Date("2027-07-13T00:00:00Z"), now)).toBe(
      "VIGENTE",
    );
  });

  it("VIGENTE with 60 days or fewer becomes POR_VENCER", () => {
    expect(effectiveCertStatus("VIGENTE", new Date("2026-09-11T00:00:00Z"), now)).toBe(
      "POR_VENCER",
    );
    expect(effectiveCertStatus("VIGENTE", new Date("2026-09-12T00:00:00Z"), now)).toBe(
      "VIGENTE",
    );
  });

  it("past expiry becomes VENCIDA", () => {
    expect(effectiveCertStatus("VIGENTE", new Date("2026-07-12T00:00:00Z"), now)).toBe(
      "VENCIDA",
    );
  });

  it("SUSPENDIDA and RETIRADA always win", () => {
    expect(effectiveCertStatus("SUSPENDIDA", new Date("2020-01-01T00:00:00Z"), now)).toBe(
      "SUSPENDIDA",
    );
    expect(effectiveCertStatus("RETIRADA", new Date("2030-01-01T00:00:00Z"), now)).toBe(
      "RETIRADA",
    );
  });
});
