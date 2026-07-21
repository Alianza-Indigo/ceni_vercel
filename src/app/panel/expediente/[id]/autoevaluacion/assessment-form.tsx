"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  computeAssessment,
  type AssessmentAnswers,
  type ComplianceValue,
} from "@/lib/scoring";
import { DIMENSION_FLOOR, ESTIMATE_LEGEND, LEVEL_LABELS } from "@/lib/domain";
import { saveAssessment } from "@/app/panel/actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CriterionView {
  code: string;
  dimension: number;
  title: string;
  helpText: string | null;
  maxPoints: number;
}

const OPTIONS: { value: ComplianceValue; label: string; hint: string }[] = [
  { value: 0, label: "0%", hint: "No cumplimos este criterio todavía" },
  { value: 50, label: "50%", hint: "Cumplimos de forma parcial" },
  { value: 100, label: "100%", hint: "Cumplimos por completo y hay evidencia" },
];

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

export function AssessmentForm({
  applicationId,
  criteria,
  dimensionNames,
  initialAnswers,
  editable,
}: {
  applicationId: string;
  criteria: CriterionView[];
  dimensionNames: Record<number, string>;
  initialAnswers: AssessmentAnswers;
  editable: boolean;
}) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<AssessmentAnswers>(initialAnswers);
  const [saveState, setSaveState] = React.useState<SaveState>({ kind: "idle" });
  const [finishing, setFinishing] = React.useState(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftAt = React.useRef<number | null>(null);
  const draftKey = React.useMemo(
    () => `ceni:assessment-draft:${applicationId}`,
    [applicationId],
  );

  const result = computeAssessment(criteria, answers);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === criteria.length;

  const dimensions = [...new Set(criteria.map((c) => c.dimension))].sort(
    (a, b) => a - b,
  );

  React.useEffect(() => {
    if (!editable) return;
    try {
      const rawDraft = window.localStorage.getItem(draftKey);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as {
        answers?: AssessmentAnswers;
        updatedAt?: number;
      };
      const draftAgeMs = Date.now() - (draft.updatedAt ?? 0);
      const draftCount = Object.keys(draft.answers ?? {}).length;
      const initialCount = Object.keys(initialAnswers).length;
      if (draft.answers && draftAgeMs < 24 * 60 * 60 * 1000 && draftCount > initialCount) {
        setAnswers(draft.answers);
      }
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey, editable, initialAnswers]);

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function persistDraft(next: AssessmentAnswers) {
    const updatedAt = Date.now();
    latestDraftAt.current = updatedAt;
    try {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ answers: next, updatedAt }),
      );
    } catch {
      // Local draft is best-effort; server save remains the source of truth.
    }
    return updatedAt;
  }

  async function saveNow(next: AssessmentAnswers, draftAt?: number) {
    setSaveState({ kind: "saving" });
    const response = await saveAssessment({ applicationId, answers: next });
    if (response.ok) {
      setSaveState({ kind: "saved", at: new Date(response.savedAt) });
      if (draftAt && latestDraftAt.current === draftAt) {
        window.localStorage.removeItem(draftKey);
        latestDraftAt.current = null;
      }
    } else {
      setSaveState({ kind: "error", message: response.error });
    }
    return response;
  }

  function setAnswer(code: string, value: ComplianceValue) {
    if (!editable) return;
    const next = { ...answers, [code]: value };
    setAnswers(next);
    const draftAt = persistDraft(next);
    // Debounced autosave (800 ms), literal status indicator.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveNow(next, draftAt);
    }, 800);
  }

  async function handleSaveClick() {
    if (!editable) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const draftAt = persistDraft(answers);
    await saveNow(answers, draftAt);
  }

  async function handleFinishClick() {
    if (!editable || !allAnswered) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setFinishing(true);
    const draftAt = persistDraft(answers);
    const response = await saveNow(answers, draftAt);
    if (response.ok) {
      window.localStorage.removeItem(draftKey);
      router.push(`/panel/expediente/${applicationId}/evidencias`);
      router.refresh();
      return;
    }
    setFinishing(false);
  }

  return (
    <div className="mt-6">
      {!editable && (
        <Alert variant="info" className="mb-4">
          <AlertTitle>Solo lectura</AlertTitle>
          <AlertDescription>
            El expediente pasó la etapa de Revisión Documental, así que la
            autoevaluación ya no se puede editar. Puedes seguir consultándola.
          </AlertDescription>
        </Alert>
      )}

      {/* Live summary */}
      <section
        aria-label="Resumen de puntaje estimado"
        className="sticky top-16 z-10 rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-ink">
              {answeredCount} de {criteria.length} criterios respondidos
            </p>
            <p className="text-2xl font-bold text-indigo">
              {result.total} / {result.maxTotal} puntos
            </p>
            <p className="text-sm font-bold text-ink">
              {result.level
                ? `Nivel estimado: ${LEVEL_LABELS[result.level]}`
                : result.floorFailures.length > 0
                  ? `Sin nivel estimado: ${result.floorFailures.length === 1 ? "una dimensión está" : "hay dimensiones"} bajo el piso del 40%`
                  : "Sin nivel estimado: el total está por debajo de 500 puntos"}
            </p>
          </div>
          <p
            role="status"
            aria-live="polite"
            className="text-sm font-bold text-muted-ink"
          >
            {saveState.kind === "saving" && "Guardando…"}
            {saveState.kind === "saved" && "Guardado ✓"}
            {saveState.kind === "error" && `No se guardó: ${saveState.message}`}
          </p>
        </div>
        <p className="mt-2 text-sm text-muted-ink">{ESTIMATE_LEGEND}</p>
      </section>

      <Accordion
        type="multiple"
        defaultValue={dimensions.map((d) => `dim-${d}`)}
        className="mt-6 space-y-4"
      >
        {dimensions.map((dimension) => {
          const dimensionCriteria = criteria.filter((c) => c.dimension === dimension);
          const score = result.dimensions.find((d) => d.dimension === dimension);
          const points = score?.points ?? 0;
          const maxPoints = score?.maxPoints ?? 0;
          const belowFloor = (score?.ratio ?? 0) < DIMENSION_FLOOR;
          return (
            <AccordionItem key={dimension} value={`dim-${dimension}`}>
              <AccordionTrigger>
                <span className="flex flex-1 flex-wrap items-center justify-between gap-2 pe-2">
                  <span>
                    Dimensión {dimension}: {dimensionNames[dimension]}
                  </span>
                  <span className="text-sm font-bold text-muted-ink">
                    {points} / {maxPoints} pts
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div>
                  <Progress
                    value={points}
                    max={maxPoints}
                    label={`Avance de la dimensión ${dimension}`}
                    barClassName={belowFloor ? "bg-status-warn" : "bg-indigo"}
                  />
                  <p
                    className={cn(
                      "mt-1.5 text-sm font-bold",
                      belowFloor ? "text-status-warn" : "text-muted-ink",
                    )}
                  >
                    {belowFloor
                      ? `⚠ Esta dimensión está bajo el piso del 40% (${Math.round((score?.ratio ?? 0) * 100)}%). Sin alcanzar el piso no se otorga nivel, aunque el total sume.`
                      : `Esta dimensión está en ${Math.round((score?.ratio ?? 0) * 100)}%, arriba del piso del 40%.`}
                  </p>
                </div>

                {dimensionCriteria.map((criterion) => (
                  <fieldset key={criterion.code} className="rounded-lg border border-border p-4">
                    <legend className="px-1 font-bold text-ink">
                      {criterion.code} · {criterion.title}
                      <span className="ms-2 text-xs font-bold text-muted-ink">
                        ({criterion.maxPoints} pts)
                      </span>
                    </legend>
                    {criterion.helpText && (
                      <p className="mb-3 text-sm text-muted-ink">{criterion.helpText}</p>
                    )}
                    <div className="grid gap-2 sm:grid-cols-3">
                      {OPTIONS.map((option) => {
                        const checked = answers[criterion.code] === option.value;
                        return (
                          <label
                            key={option.value}
                            className={cn(
                              "flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border p-3",
                              checked
                                ? "border-indigo bg-surface"
                                : "border-border bg-background",
                              !editable && "cursor-not-allowed opacity-70",
                            )}
                          >
                            <input
                              type="radio"
                              name={criterion.code}
                              value={option.value}
                              checked={checked}
                              disabled={!editable}
                              onChange={() => setAnswer(criterion.code, option.value)}
                              className="mt-1 size-5 accent-[var(--ceni-indigo)]"
                            />
                            <span>
                              <span className="font-bold text-ink">{option.label}</span>
                              <br />
                              <span className="text-sm text-muted-ink">{option.hint}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <section className="mt-6 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-prose">
            <p className="font-bold text-ink">
              {allAnswered
                ? "Autoevaluacion completa"
                : `Faltan ${criteria.length - answeredCount} criterios por responder`}
            </p>
            <p className="mt-1 text-sm text-muted-ink">
              Guarda antes de salir. Cuando este completa, continua a evidencias para
              seguir con el expediente.
            </p>
          </div>
          {editable && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveClick}
                disabled={saveState.kind === "saving" || finishing}
              >
                Guardar ahora
              </Button>
              <Button
                type="button"
                onClick={handleFinishClick}
                disabled={!allAnswered || saveState.kind === "saving" || finishing}
              >
                {finishing ? "Guardando..." : "Guardar y continuar a evidencias"}
              </Button>
            </div>
          )}
        </div>
      </section>

      <p className="mt-6 max-w-prose text-sm text-muted-ink">{ESTIMATE_LEGEND}</p>
    </div>
  );
}
