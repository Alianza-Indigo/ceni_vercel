import type { Stage } from "@prisma/client";
import { deadlineSemaphore } from "@/lib/business-days";
import { STAGE_DEADLINES } from "@/lib/domain";
import { cn } from "@/lib/utils";

const COLOR_CLASSES = {
  green: "border-status-ok/40 bg-status-ok/10 text-status-ok",
  amber: "border-status-warn/40 bg-status-warn/10 text-status-warn",
  red: "border-status-bad/40 bg-status-bad/10 text-status-bad",
} as const;

const COLOR_ICON = { green: "●", amber: "◐", red: "○" } as const;
const COLOR_TEXT = {
  green: "En plazo",
  amber: "Cerca del plazo",
  red: "Fuera de plazo",
} as const;

/** Stage-deadline traffic light: icon + literal text, never color alone. */
export function DeadlineChip({
  stage,
  stageEnteredAt,
}: {
  stage: Stage;
  stageEnteredAt: Date;
}) {
  const semaphore = deadlineSemaphore(stageEnteredAt, STAGE_DEADLINES[stage]);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold",
        COLOR_CLASSES[semaphore.color],
      )}
    >
      <span aria-hidden="true">{COLOR_ICON[semaphore.color]}</span>
      {COLOR_TEXT[semaphore.color]}: {semaphore.label} de {semaphore.allowed}
    </span>
  );
}
