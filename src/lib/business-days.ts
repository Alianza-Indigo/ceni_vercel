/**
 * Business-day arithmetic (Mon–Fri). Official Mexican holidays are phase 2:
 * every function accepts an injectable holiday list (ISO date strings).
 */

function isHoliday(date: Date, holidays: readonly string[]): boolean {
  const iso = date.toISOString().slice(0, 10);
  return holidays.includes(iso);
}

export function isBusinessDay(date: Date, holidays: readonly string[] = []): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6 && !isHoliday(date, holidays);
}

/** Adds n business days to a date (n >= 0). Result is a new Date at UTC midnight. */
export function addBusinessDays(
  start: Date,
  n: number,
  holidays: readonly string[] = [],
): Date {
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  let remaining = n;
  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isBusinessDay(d, holidays)) remaining--;
  }
  return d;
}

/** Business days elapsed from `from` (exclusive) to `to` (inclusive). */
export function businessDaysBetween(
  from: Date,
  to: Date,
  holidays: readonly string[] = [],
): number {
  const a = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const b = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  if (b <= a) return 0;
  let count = 0;
  const d = new Date(a);
  while (d < b) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isBusinessDay(d, holidays)) count++;
  }
  return count;
}

export type DeadlineSemaphore = {
  /** Business days already used in the stage. */
  used: number;
  /** Stage allowance in business days. */
  allowed: number;
  /** Business days left (negative when overdue). */
  remaining: number;
  /** green: >40% of the allowance left · amber: 1 day–40% left · red: overdue. */
  color: "green" | "amber" | "red";
  /** Literal label, always shown next to the color. */
  label: string;
};

/** Traffic-light deadline status for a stage entered at `enteredAt`. */
export function deadlineSemaphore(
  enteredAt: Date,
  allowedBusinessDays: number,
  now: Date = new Date(),
  holidays: readonly string[] = [],
): DeadlineSemaphore {
  const used = businessDaysBetween(enteredAt, now, holidays);
  const remaining = allowedBusinessDays - used;
  let color: DeadlineSemaphore["color"];
  if (remaining <= 0) {
    color = "red";
  } else if (remaining / allowedBusinessDays > 0.4) {
    color = "green";
  } else {
    color = "amber";
  }
  const label =
    remaining <= 0
      ? `Plazo vencido (${Math.abs(remaining)} día${Math.abs(remaining) === 1 ? "" : "s"} hábil${Math.abs(remaining) === 1 ? "" : "es"} de retraso)`
      : `${remaining} día${remaining === 1 ? "" : "s"} hábil${remaining === 1 ? "" : "es"} restante${remaining === 1 ? "" : "s"}`;
  return { used, allowed: allowedBusinessDays, remaining, color, label };
}
