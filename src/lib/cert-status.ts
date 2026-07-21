import type { CertStatus } from "@prisma/client";
import { POR_VENCER_DAYS } from "@/lib/domain";

const DAY_MS = 86_400_000;

/**
 * Effective public status of a certification, computed on the fly:
 * a stored VIGENTE becomes POR_VENCER (<= 60 days left) or VENCIDA (expired).
 * SUSPENDIDA / RETIRADA always win over date-based states.
 */
export function effectiveCertStatus(
  stored: CertStatus,
  expiresAt: Date,
  now: Date = new Date(),
): CertStatus {
  if (stored === "SUSPENDIDA" || stored === "RETIRADA") return stored;
  if (expiresAt.getTime() <= now.getTime()) return "VENCIDA";
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS);
  if (daysLeft <= POR_VENCER_DAYS) return "POR_VENCER";
  return "VIGENTE";
}

export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / DAY_MS);
}
