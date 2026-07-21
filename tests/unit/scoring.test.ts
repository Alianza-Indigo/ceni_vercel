import { describe, expect, it } from "vitest";
import {
  computeAssessment,
  levelForScore,
  parseAnswers,
  type AssessmentAnswers,
  type CriterionSpec,
} from "@/lib/scoring";
import { CRITERIA, criteriaForLine, DIMENSION_MAX_POINTS } from "@/lib/criteria-data";

const LABORAL = criteriaForLine("LABORAL");
const ESPACIOS = criteriaForLine("ESPACIOS");

function answersAt(criteria: CriterionSpec[], value: 0 | 50 | 100): AssessmentAnswers {
  return Object.fromEntries(criteria.map((c) => [c.code, value]));
}

/**
 * Starts from uniform 50% compliance (500 points, every dimension at 50%,
 * safely above the 40% floor) and applies explicit per-criterion overrides.
 */
function answersFrom50(
  criteria: CriterionSpec[],
  overrides: Record<string, 0 | 50 | 100>,
): AssessmentAnswers {
  return { ...answersAt(criteria, 50), ...overrides };
}

describe("normative catalog integrity", () => {
  it("has 30 criteria per line and 1000 points per line", () => {
    expect(LABORAL).toHaveLength(30);
    expect(ESPACIOS).toHaveLength(30);
    expect(LABORAL.reduce((s, c) => s + c.maxPoints, 0)).toBe(1000);
    expect(ESPACIOS.reduce((s, c) => s + c.maxPoints, 0)).toBe(1000);
  });

  it("matches the per-dimension maximums of Lineamientos v3.1", () => {
    for (const line of ["LABORAL", "ESPACIOS"] as const) {
      for (const [dim, max] of Object.entries(DIMENSION_MAX_POINTS[line])) {
        const sum = CRITERIA.filter(
          (c) => c.line === line && c.dimension === Number(dim),
        ).reduce((s, c) => s + c.maxPoints, 0);
        expect(sum, `${line} D${dim}`).toBe(max);
      }
    }
  });

  it("has unique codes", () => {
    const codes = CRITERIA.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("levelForScore boundaries", () => {
  it.each([
    [499, null],
    [500, "BRONCE"],
    [649, "BRONCE"],
    [650, "PLATA"],
    [799, "PLATA"],
    [800, "ORO"],
    [1000, "ORO"],
    [0, null],
  ])("score %i → %s", (score, expected) => {
    expect(levelForScore(score)).toBe(expected);
  });
});

describe("computeAssessment", () => {
  it("full compliance gives Oro with 1000 points", () => {
    const result = computeAssessment(LABORAL, answersAt(LABORAL, 100));
    expect(result.total).toBe(1000);
    expect(result.level).toBe("ORO");
    expect(result.outcome).toBe("NIVEL");
    expect(result.floorFailures).toEqual([]);
  });

  it("50% compliance across the board gives 500 → Bronce (every dimension at 50% ≥ floor)", () => {
    const result = computeAssessment(LABORAL, answersAt(LABORAL, 50));
    expect(result.total).toBe(500);
    expect(result.level).toBe("BRONCE");
  });

  it("just below 500 gives no level (Plan de Mejora)", () => {
    // 499 is not reachable with 0/50/100 steps (all increments are multiples
    // of 5); 490 = uniform 50% minus D5-C1 (20 pts criterion → −10). D5 stays
    // at exactly 40% so only the total blocks the level.
    const result = computeAssessment(
      LABORAL,
      answersFrom50(LABORAL, { "D5-C1": 0 }),
    );
    expect(result.total).toBe(490);
    expect(result.floorFailures).toEqual([]);
    expect(result.level).toBeNull();
    expect(result.outcome).toBe("PLAN_DE_MEJORA");
  });

  it("exact boundary 500 earns BRONCE when floors pass", () => {
    const result = computeAssessment(LABORAL, answersAt(LABORAL, 50));
    expect(result.total).toBe(500);
    expect(result.floorFailures).toEqual([]);
    expect(result.level).toBe("BRONCE");
  });

  it("exact boundary 650 earns PLATA when floors pass", () => {
    // 500 + D3-C1/C2 to 100% (+50) + all D2 to 100% (+100) = 650.
    const result = computeAssessment(
      LABORAL,
      answersFrom50(LABORAL, {
        "D3-C1": 100, "D3-C2": 100,
        "D2-C1": 100, "D2-C2": 100, "D2-C3": 100, "D2-C4": 100, "D2-C5": 100,
      }),
    );
    expect(result.total).toBe(650);
    expect(result.floorFailures).toEqual([]);
    expect(result.level).toBe("PLATA");
  });

  it("exact boundary 800 earns ORO when floors pass", () => {
    // 500 + all D3 (+125) + all D2 (+100) + D4-C1..C3 (+60) + D1-C1 (+15) = 800.
    const result = computeAssessment(
      LABORAL,
      answersFrom50(LABORAL, {
        "D3-C1": 100, "D3-C2": 100, "D3-C3": 100, "D3-C4": 100, "D3-C5": 100,
        "D2-C1": 100, "D2-C2": 100, "D2-C3": 100, "D2-C4": 100, "D2-C5": 100,
        "D4-C1": 100, "D4-C2": 100, "D4-C3": 100,
        "D1-C1": 100,
      }),
    );
    expect(result.total).toBe(800);
    expect(result.floorFailures).toEqual([]);
    expect(result.level).toBe("ORO");
  });

  it("top of Bronce band (645) stays Bronce; top of Plata band (795) stays Plata", () => {
    // 649/799 are unreachable with 5-point steps; 645 and 795 are the closest
    // reachable totals inside each band. Exact 649→BRONCE and 799→PLATA are
    // covered by the levelForScore boundary table above.
    const bronce = computeAssessment(
      LABORAL,
      answersFrom50(LABORAL, {
        "D3-C1": 100, "D3-C2": 100, "D3-C3": 100, "D3-C4": 100, "D3-C5": 100, // +125
        "D2-C1": 100, // +20
      }),
    );
    expect(bronce.total).toBe(645);
    expect(bronce.level).toBe("BRONCE");

    const plata = computeAssessment(
      LABORAL,
      answersFrom50(LABORAL, {
        "D3-C1": 100, "D3-C2": 100, "D3-C3": 100, "D3-C4": 100, "D3-C5": 100, // +125
        "D2-C1": 100, "D2-C2": 100, "D2-C3": 100, "D2-C4": 100, "D2-C5": 100, // +100
        "D4-C1": 100, "D4-C2": 100, // +40
        "D1-C1": 100, "D1-C2": 100, // +30
      }),
    );
    expect(plata.total).toBe(795);
    expect(plata.level).toBe("PLATA");
  });

  it("a dimension below the 40% floor blocks the level even with a high total", () => {
    // Laboral D5 has 100 max points; leave it at 0 and max everything else:
    // total = 900 (Oro range) but D5 = 0% < 40% → Plan de Mejora.
    const answers = answersAt(LABORAL, 100);
    for (const c of LABORAL.filter((c) => c.dimension === 5)) answers[c.code] = 0;
    const result = computeAssessment(LABORAL, answers);
    expect(result.total).toBe(900);
    expect(result.level).toBeNull();
    expect(result.outcome).toBe("PLAN_DE_MEJORA");
    expect(result.floorFailures).toEqual([5]);
  });

  it("dimension exactly at 40% passes the floor; just below fails", () => {
    // Laboral D6: 5 criteria × 20 pts = 100 max. Two at 100% = 40 pts = 40%.
    const answers = answersAt(LABORAL, 100);
    for (const c of LABORAL.filter((c) => c.dimension === 6)) answers[c.code] = 0;
    answers["D6-C1"] = 100;
    answers["D6-C2"] = 100;
    const atFloor = computeAssessment(LABORAL, answers);
    expect(atFloor.dimensions.find((d) => d.dimension === 6)?.ratio).toBeCloseTo(0.4);
    expect(atFloor.floorFailures).toEqual([]);
    expect(atFloor.level).not.toBeNull();

    // 35 pts = 35% < 40% → floor failure (39%-style case, not reachable at
    // exactly 39% with 20-point criteria).
    answers["D6-C2"] = 50;
    answers["D6-C3"] = 0;
    const below = computeAssessment(LABORAL, answers);
    expect(below.dimensions.find((d) => d.dimension === 6)?.ratio).toBeCloseTo(0.3);
    expect(below.floorFailures).toEqual([6]);
    expect(below.level).toBeNull();
  });

  it("floor rule works with 39% vs 40% on a synthetic 100-point dimension", () => {
    const synthetic: CriterionSpec[] = [
      { code: "X1-C1", dimension: 1, maxPoints: 78 },
      { code: "X1-C2", dimension: 1, maxPoints: 22 },
      { code: "X2-C1", dimension: 2, maxPoints: 900 },
    ];
    // Dimension 1 at 39/100 = 39% → fails even though total is Oro range.
    const failing = computeAssessment(synthetic, {
      "X1-C1": 50, // 39 points
      "X1-C2": 0,
      "X2-C1": 100,
    });
    expect(failing.dimensions[0].points).toBe(39);
    expect(failing.floorFailures).toEqual([1]);
    expect(failing.level).toBeNull();

    // Dimension 1 at 40% exactly → passes.
    const passing = computeAssessment(
      [
        { code: "Y1-C1", dimension: 1, maxPoints: 80 },
        { code: "Y1-C2", dimension: 1, maxPoints: 20 },
        { code: "Y2-C1", dimension: 2, maxPoints: 900 },
      ],
      { "Y1-C1": 50, "Y1-C2": 0, "Y2-C1": 100 },
    );
    expect(passing.dimensions[0].ratio).toBeCloseTo(0.4);
    expect(passing.floorFailures).toEqual([]);
    expect(passing.level).toBe("ORO");
  });

  it("both lines compute independently (double line)", () => {
    const laboral = computeAssessment(LABORAL, answersAt(LABORAL, 100));
    const espacios = computeAssessment(ESPACIOS, answersAt(ESPACIOS, 50));
    expect(laboral.level).toBe("ORO");
    expect(espacios.total).toBe(500);
    expect(espacios.level).toBe("BRONCE");
  });

  it("unanswered criteria count as 0 and are reported", () => {
    const answers = answersAt(LABORAL, 100);
    delete answers["D1-C1"];
    const result = computeAssessment(LABORAL, answers);
    expect(result.total).toBe(970);
    expect(result.unanswered).toEqual(["D1-C1"]);
  });

  it("renewal assessments use the same engine (isRenewal only affects cost copy)", () => {
    // The engine has no renewal switch by design; verify identical output for
    // identical answers, which is what a renewal file relies on.
    const a = computeAssessment(ESPACIOS, answersAt(ESPACIOS, 100));
    const b = computeAssessment(ESPACIOS, answersAt(ESPACIOS, 100));
    expect(a).toEqual(b);
    expect(a.level).toBe("ORO");
  });
});

describe("parseAnswers", () => {
  it("keeps only valid 0/50/100 values", () => {
    expect(
      parseAnswers({ "D1-C1": 100, "D1-C2": "50", "D1-C3": 30, "D1-C4": null, x: "abc" }),
    ).toEqual({ "D1-C1": 100, "D1-C2": 50 });
  });

  it("tolerates non-object payloads", () => {
    expect(parseAnswers(null)).toEqual({});
    expect(parseAnswers([1, 2])).toEqual({});
    expect(parseAnswers("{}")).toEqual({});
  });
});
