import type { CertLevel } from "@prisma/client";
import { DIMENSION_FLOOR, LEVEL_THRESHOLDS } from "@/lib/domain";

/**
 * Pure scoring engine for Lineamientos CENI v3.1.
 * 1,000 points per line, 6 dimensions, 30 criteria; each criterion is answered
 * on a 0 / 50 / 100 % compliance scale that multiplies its max points.
 * Levels: Bronce 500–649 · Plata 650–799 · Oro 800–1,000.
 * Floor rule: any dimension below 40% of its maximum blocks every level.
 */

export type ComplianceValue = 0 | 50 | 100;

export interface CriterionSpec {
  code: string;
  dimension: number;
  maxPoints: number;
}

export type AssessmentAnswers = Record<string, ComplianceValue>;

export interface DimensionScore {
  dimension: number;
  points: number;
  maxPoints: number;
  /** 0–1 share of the dimension maximum. */
  ratio: number;
  /** True when the dimension is below the 40% floor. */
  belowFloor: boolean;
}

export interface AssessmentResult {
  total: number;
  maxTotal: number;
  dimensions: DimensionScore[];
  /** Dimension numbers under the 40% floor. */
  floorFailures: number[];
  /** Level earned, or null when no level applies. */
  level: CertLevel | null;
  /** NIVEL = a level is granted · PLAN_DE_MEJORA = floor failure or score under 500. */
  outcome: "NIVEL" | "PLAN_DE_MEJORA";
  /** Criterion codes present in the spec but unanswered (counted as 0). */
  unanswered: string[];
}

/** Level for a total score, ignoring the floor rule. */
export function levelForScore(score: number): CertLevel | null {
  if (score >= LEVEL_THRESHOLDS.ORO.min && score <= LEVEL_THRESHOLDS.ORO.max) {
    return "ORO";
  }
  if (score >= LEVEL_THRESHOLDS.PLATA.min && score <= LEVEL_THRESHOLDS.PLATA.max) {
    return "PLATA";
  }
  if (score >= LEVEL_THRESHOLDS.BRONCE.min && score <= LEVEL_THRESHOLDS.BRONCE.max) {
    return "BRONCE";
  }
  return null;
}

/** Points a single criterion contributes for a compliance value. */
export function criterionPoints(maxPoints: number, value: ComplianceValue): number {
  return (maxPoints * value) / 100;
}

export function computeAssessment(
  criteria: readonly CriterionSpec[],
  answers: AssessmentAnswers,
): AssessmentResult {
  const byDimension = new Map<number, { points: number; maxPoints: number }>();
  const unanswered: string[] = [];

  for (const criterion of criteria) {
    const value = answers[criterion.code];
    if (value === undefined) unanswered.push(criterion.code);
    const earned = criterionPoints(criterion.maxPoints, value ?? 0);
    const bucket = byDimension.get(criterion.dimension) ?? { points: 0, maxPoints: 0 };
    bucket.points += earned;
    bucket.maxPoints += criterion.maxPoints;
    byDimension.set(criterion.dimension, bucket);
  }

  const dimensions: DimensionScore[] = [...byDimension.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dimension, { points, maxPoints }]) => {
      const ratio = maxPoints > 0 ? points / maxPoints : 0;
      return {
        dimension,
        points: Math.round(points),
        maxPoints,
        ratio,
        belowFloor: ratio < DIMENSION_FLOOR,
      };
    });

  const total = dimensions.reduce((sum, d) => sum + d.points, 0);
  const maxTotal = dimensions.reduce((sum, d) => sum + d.maxPoints, 0);
  const floorFailures = dimensions.filter((d) => d.belowFloor).map((d) => d.dimension);

  const levelByScore = levelForScore(total);
  const level = floorFailures.length > 0 ? null : levelByScore;

  return {
    total,
    maxTotal,
    dimensions,
    floorFailures,
    level,
    outcome: level ? "NIVEL" : "PLAN_DE_MEJORA",
    unanswered,
  };
}

/** answers validation guard for JSON coming from the database or the client. */
export function isComplianceValue(value: unknown): value is ComplianceValue {
  return value === 0 || value === 50 || value === 100;
}

export function parseAnswers(raw: unknown): AssessmentAnswers {
  const result: AssessmentAnswers = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
      const numeric = typeof value === "string" ? Number(value) : value;
      if (isComplianceValue(numeric)) result[code] = numeric;
    }
  }
  return result;
}
