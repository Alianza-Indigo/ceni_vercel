import Image from "next/image";
import type { CertLevel } from "@prisma/client";
import { LEVEL_LABELS } from "@/lib/domain";
import { cn } from "@/lib/utils";

const BADGE_SRC: Record<CertLevel, string> = {
  BRONCE: "/assets/badge-bronce.svg",
  PLATA: "/assets/badge-plata.svg",
  ORO: "/assets/badge-oro.svg",
};

/** Level medallion. Meaning is always duplicated in text by the caller or alt. */
export function LevelBadge({
  level,
  size = 64,
  className,
}: {
  level: CertLevel;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={BADGE_SRC[level]}
      alt={`Insignia de nivel ${LEVEL_LABELS[level]}`}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}
