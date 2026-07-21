import type { CertStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { CERT_STATUS_LABELS } from "@/lib/domain";

const STATUS_VARIANT: Record<
  CertStatus,
  "ok" | "warn" | "neutral" | "bad"
> = {
  VIGENTE: "ok",
  POR_VENCER: "warn",
  SUSPENDIDA: "warn",
  VENCIDA: "neutral",
  RETIRADA: "neutral",
};

const STATUS_ICON: Record<CertStatus, string> = {
  VIGENTE: "✓",
  POR_VENCER: "⏱",
  SUSPENDIDA: "⏸",
  VENCIDA: "⊘",
  RETIRADA: "⊘",
};

/** Status chip: icon + literal text, never color alone. */
export function StatusBadge({ status }: { status: CertStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      <span aria-hidden="true">{STATUS_ICON[status]}</span>
      {CERT_STATUS_LABELS[status]}
    </Badge>
  );
}
