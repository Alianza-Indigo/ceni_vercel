import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  businessDaysBetween,
  deadlineSemaphore,
  isBusinessDay,
} from "@/lib/business-days";
import { STAGE_DEADLINES, TOTAL_PROCESS_BUSINESS_DAYS } from "@/lib/domain";

// 2026-07-13 is a Monday.
const MONDAY = new Date("2026-07-13T00:00:00Z");

describe("isBusinessDay", () => {
  it("weekdays yes, weekend no", () => {
    expect(isBusinessDay(new Date("2026-07-13T00:00:00Z"))).toBe(true); // Mon
    expect(isBusinessDay(new Date("2026-07-17T00:00:00Z"))).toBe(true); // Fri
    expect(isBusinessDay(new Date("2026-07-18T00:00:00Z"))).toBe(false); // Sat
    expect(isBusinessDay(new Date("2026-07-19T00:00:00Z"))).toBe(false); // Sun
  });

  it("injected holidays are skipped", () => {
    expect(isBusinessDay(new Date("2026-07-14T00:00:00Z"), ["2026-07-14"])).toBe(false);
  });
});

describe("addBusinessDays", () => {
  it("adds within the same week", () => {
    expect(addBusinessDays(MONDAY, 4).toISOString().slice(0, 10)).toBe("2026-07-17");
  });

  it("skips weekends", () => {
    expect(addBusinessDays(MONDAY, 5).toISOString().slice(0, 10)).toBe("2026-07-20");
  });

  it("skips injected holidays", () => {
    expect(
      addBusinessDays(MONDAY, 1, ["2026-07-14"]).toISOString().slice(0, 10),
    ).toBe("2026-07-15");
  });
});

describe("businessDaysBetween", () => {
  it("Monday to Friday of the same week = 4", () => {
    expect(businessDaysBetween(MONDAY, new Date("2026-07-17T00:00:00Z"))).toBe(4);
  });

  it("across a weekend", () => {
    expect(businessDaysBetween(MONDAY, new Date("2026-07-20T12:00:00Z"))).toBe(5);
  });

  it("returns 0 for same day or inverted ranges", () => {
    expect(businessDaysBetween(MONDAY, MONDAY)).toBe(0);
    expect(businessDaysBetween(new Date("2026-07-20T00:00:00Z"), MONDAY)).toBe(0);
  });
});

describe("deadlineSemaphore", () => {
  it("green when more than 40% of the allowance remains", () => {
    const s = deadlineSemaphore(MONDAY, 15, new Date("2026-07-16T00:00:00Z"));
    expect(s.used).toBe(3);
    expect(s.remaining).toBe(12);
    expect(s.color).toBe("green");
    expect(s.label).toContain("12 días hábiles restantes");
  });

  it("amber when 40% or less remains", () => {
    const s = deadlineSemaphore(MONDAY, 5, new Date("2026-07-16T00:00:00Z"));
    expect(s.remaining).toBe(2);
    expect(s.color).toBe("amber");
  });

  it("red when overdue, with literal label", () => {
    const s = deadlineSemaphore(MONDAY, 2, new Date("2026-07-20T00:00:00Z"));
    expect(s.remaining).toBeLessThanOrEqual(0);
    expect(s.color).toBe("red");
    expect(s.label).toContain("Plazo vencido");
  });
});

describe("normative deadlines", () => {
  it("keeps the normative per-stage allowances and the 80-day published total", () => {
    // The six stage maxima sum to 70; the published process total is 80
    // business days (the margin covers subsanación/prórroga). Both figures
    // are normative and displayed as-is.
    const total = Object.values(STAGE_DEADLINES).reduce((a, b) => a + b, 0);
    expect(total).toBe(70);
    expect(TOTAL_PROCESS_BUSINESS_DAYS).toBe(80);
    expect(STAGE_DEADLINES.SOLICITUD).toBe(5);
    expect(STAGE_DEADLINES.REVISION_DOCUMENTAL).toBe(15);
    expect(STAGE_DEADLINES.PROGRAMACION).toBe(20);
    expect(STAGE_DEADLINES.AUDITORIA).toBe(10);
    expect(STAGE_DEADLINES.DICTAMEN).toBe(15);
    expect(STAGE_DEADLINES.CIERRE).toBe(5);
  });
});
