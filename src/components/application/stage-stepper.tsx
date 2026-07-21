import type { Stage } from "@prisma/client";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/domain";
import { cn } from "@/lib/utils";

/** Horizontal 6-stage stepper. The current stage is marked with text + color. */
export function StageStepper({ current }: { current: Stage }) {
  const currentIndex = STAGE_ORDER.indexOf(current);
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Etapas del expediente">
      {STAGE_ORDER.map((stage, index) => {
        const state =
          index < currentIndex ? "done" : index === currentIndex ? "current" : "pending";
        return (
          <li
            key={stage}
            aria-current={state === "current" ? "step" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold",
              state === "done" && "border-status-ok/40 bg-status-ok/10 text-status-ok",
              state === "current" && "border-indigo bg-indigo text-white",
              state === "pending" && "border-border bg-surface text-muted-ink",
            )}
          >
            <span aria-hidden="true">
              {state === "done" ? "✓" : index + 1}
            </span>
            <span>{STAGE_LABELS[stage]}</span>
            {state === "current" && <span className="sr-only">(etapa actual)</span>}
            {state === "done" && <span className="sr-only">(completada)</span>}
          </li>
        );
      })}
    </ol>
  );
}
