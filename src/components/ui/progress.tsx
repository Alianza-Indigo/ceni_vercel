import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Static progress bar (no animation). Color communicates together with the
 * visible percentage text, never alone.
 */
export function Progress({
  value,
  max = 100,
  label,
  className,
  barClassName,
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
  barClassName?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("h-3 w-full overflow-hidden rounded-full bg-surface", className)}
    >
      <div
        className={cn("h-full rounded-full bg-indigo", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
