"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  computeAssessment,
  type AssessmentAnswers,
  type ComplianceValue,
} from "@/lib/scoring";
import { LEVEL_LABELS } from "@/lib/domain";
import { submitVerdict, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface CriterionView {
  code: string;
  dimension: number;
  title: string;
  helpText: string | null;
  maxPoints: number;
}

const OPTIONS: ComplianceValue[] = [0, 50, 100];

export function VerdictForm({
  applicationId,
  criteria,
  dimensionNames,
  initialAnswers,
}: {
  applicationId: string;
  criteria: CriterionView[];
  dimensionNames: Record<number, string>;
  initialAnswers: AssessmentAnswers;
}) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<AssessmentAnswers>(initialAnswers);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ActionResult | null>(null);

  const computed = computeAssessment(criteria, answers);
  const complete = Object.keys(answers).length === criteria.length;
  const dimensions = [...new Set(criteria.map((c) => c.dimension))].sort((a, b) => a - b);

  async function onSubmit() {
    setBusy(true);
    const response = await submitVerdict({ applicationId, answers });
    setResult(response);
    setBusy(false);
    if (response.ok) router.refresh();
  }

  return (
    <div className="mt-4">
      <section
        aria-label="Resultado calculado del dictamen"
        className="rounded-xl border border-border bg-card p-4"
      >
        <p className="text-2xl font-bold text-indigo">
          {computed.total} / {computed.maxTotal} puntos
        </p>
        <p className="text-sm font-bold text-ink">
          {computed.level
            ? `Resultado calculado: nivel ${LEVEL_LABELS[computed.level]}`
            : computed.floorFailures.length > 0
              ? `Resultado calculado: Plan de Mejora — dimensión(es) bajo el piso del 40%: ${computed.floorFailures.map((d) => `D${d}`).join(", ")}`
              : "Resultado calculado: Plan de Mejora — el total queda por debajo de 500 puntos"}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2 text-xs">
          {computed.dimensions.map((d) => (
            <li
              key={d.dimension}
              className={cn(
                "rounded-md border px-2 py-1 font-bold",
                d.belowFloor
                  ? "border-status-warn/50 bg-status-warn/10 text-status-warn"
                  : "border-border bg-surface text-muted-ink",
              )}
            >
              D{d.dimension}: {d.points}/{d.maxPoints} ({Math.round(d.ratio * 100)}%)
            </li>
          ))}
        </ul>
      </section>

      <Accordion type="multiple" defaultValue={[]} className="mt-4 space-y-3">
        {dimensions.map((dimension) => (
          <AccordionItem key={dimension} value={`vd-${dimension}`}>
            <AccordionTrigger>
              Dimensión {dimension}: {dimensionNames[dimension]}
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {criteria
                .filter((c) => c.dimension === dimension)
                .map((criterion) => (
                  <fieldset
                    key={criterion.code}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <legend className="sr-only">
                      {criterion.code}: {criterion.title}
                    </legend>
                    <div className="min-w-0 max-w-lg">
                      <p className="text-sm font-bold text-ink">
                        {criterion.code} · {criterion.title}{" "}
                        <span className="text-xs text-muted-ink">
                          ({criterion.maxPoints} pts)
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-1.5" role="radiogroup" aria-label={`Cumplimiento de ${criterion.code}`}>
                      {OPTIONS.map((value) => {
                        const checked = answers[criterion.code] === value;
                        return (
                          <label
                            key={value}
                            className={cn(
                              "inline-flex min-h-11 min-w-16 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-bold",
                              checked
                                ? "border-indigo bg-indigo text-white"
                                : "border-border bg-background text-ink",
                            )}
                          >
                            <input
                              type="radio"
                              name={`v-${criterion.code}`}
                              value={value}
                              checked={checked}
                              onChange={() =>
                                setAnswers((prev) => ({ ...prev, [criterion.code]: value }))
                              }
                              className="sr-only"
                            />
                            {value}%
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-4 space-y-3">
        {!complete && (
          <p className="text-sm font-bold text-status-warn">
            ⚠ Faltan {criteria.length - Object.keys(answers).length} criterios por
            calificar. El dictamen requiere los 30.
          </p>
        )}
        {result && (
          <p
            role="status"
            className={cn(
              "rounded-lg p-3 text-sm font-bold",
              result.ok
                ? "bg-status-ok/10 text-status-ok"
                : "bg-status-bad/10 text-status-bad",
            )}
          >
            {result.ok ? `✓ ${result.message}` : result.error}
          </p>
        )}
        <Button type="button" disabled={busy || !complete} onClick={onSubmit}>
          {busy ? "Registrando dictamen…" : "Emitir dictamen"}
        </Button>
        <p className="max-w-prose text-sm text-muted-ink">
          Si el resultado calculado tiene nivel, el expediente pasa a Cierre para la
          emisión del certificado. Si no, el expediente se cierra como Plan de Mejora
          con las dimensiones señaladas. La decisión queda en bitácora.
        </p>
      </div>
    </div>
  );
}
