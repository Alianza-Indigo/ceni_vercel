import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-indigo text-white",
        secondary: "border-transparent bg-surface text-indigo",
        outline: "border-border text-ink",
        gold: "border-transparent bg-cream text-gold-text",
        ok: "border-status-ok/40 bg-status-ok/10 text-status-ok",
        warn: "border-status-warn/40 bg-status-warn/10 text-status-warn",
        bad: "border-status-bad/40 bg-status-bad/10 text-status-bad",
        neutral: "border-border bg-surface text-muted-ink",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
