import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseAnswers } from "@/lib/scoring";
import {
  LEVEL_LABELS,
  LINE_LABELS,
  ORG_SIZE_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
} from "@/lib/domain";
import { DIMENSION_NAMES } from "@/lib/criteria-data";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { StageStepper } from "@/components/application/stage-stepper";
import { DeadlineChip } from "@/components/application/deadline-chip";
import { Button } from "@/components/ui/button";
import { StageTransition } from "./stage-transition";
import { NoteForm } from "./note-form";
import { VerdictForm } from "./verdict-form";
import { IssueCertificate } from "./issue-certificate";

export const metadata: Metadata = { title: "Expediente (admin)" };
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function AdminApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      organization: true,
      site: { select: { name: true, city: true, state: true } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { email: true } } },
      },
      evidences: { orderBy: [{ dimension: "asc" }, { uploadedAt: "desc" }] },
      assessment: true,
      verdict: true,
      certification: { select: { folio: true } },
    },
  });
  if (!application) notFound();

  const criteria = await prisma.criterion.findMany({
    where: { line: application.line },
    orderBy: { sortOrder: "asc" },
  });

  const orgAnswers = parseAnswers(application.assessment?.answers);
  const verdictAnswers = parseAnswers(application.verdict?.answers);
  const currentIndex = STAGE_ORDER.indexOf(application.stage);
  const nextStage = STAGE_ORDER[currentIndex + 1];
  const canTransition =
    application.status === "EN_PROCESO" &&
    nextStage !== undefined &&
    nextStage !== "CIERRE";
  const canVerdict =
    application.status === "EN_PROCESO" && application.stage === "DICTAMEN";
  const canIssue =
    application.status === "EN_PROCESO" &&
    application.stage === "CIERRE" &&
    Boolean(application.verdict?.approved) &&
    !application.certification;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Administración", href: "/admin" },
          { label: "Expedientes", href: "/admin/expedientes" },
          { label: application.organization.tradeName },
        ]}
      />
      <PageInfo>
        Este es el expediente {LINE_LABELS[application.line]} de{" "}
        {application.organization.tradeName}. Aquí el Comité puede: transitar la etapa
        con nota obligatoria, revisar autoevaluación y evidencias, capturar el dictamen
        con cálculo automático de nivel y emitir el certificado con folio.
      </PageInfo>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-indigo">
            {application.organization.tradeName}
          </h1>
          <p className="mt-1 text-muted-ink">
            {LINE_LABELS[application.line]}
            {application.isRenewal ? " · Renovación" : ""} · Alcance:{" "}
            {application.site
              ? `${application.site.name} (${application.site.city}, ${application.site.state})`
              : "toda la organización"}{" "}
            · {ORG_SIZE_LABELS[application.organization.size]}
          </p>
          <p className="text-sm text-muted-ink">
            Contacto: {application.organization.contactName} ·{" "}
            {application.organization.contactEmail}
            {application.organization.referralCode
              ? ` · Código de embajador: ${application.organization.referralCode}`
              : ""}
          </p>
        </div>
        {application.certification && (
          <Button asChild variant="secondary">
            <Link href={`/admin/certificados/${application.certification.folio}`}>
              Ver certificado {application.certification.folio}
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
        <StageStepper current={application.stage} />
        <div className="flex flex-wrap items-center gap-3">
          {application.status === "EN_PROCESO" && (
            <DeadlineChip
              stage={application.stage}
              stageEnteredAt={application.stageEnteredAt}
            />
          )}
          <span className="text-sm text-muted-ink">
            En {STAGE_LABELS[application.stage]} desde el{" "}
            {dateFormat.format(application.stageEnteredAt)} · Estado:{" "}
            {application.status === "EN_PROCESO"
              ? "En proceso"
              : application.status === "CERTIFICADO"
                ? "Certificado"
                : application.status === "PLAN_DE_MEJORA"
                  ? "Plan de Mejora"
                  : "Rechazado"}
          </span>
        </div>
        {canTransition && (
          <StageTransition
            applicationId={application.id}
            currentLabel={STAGE_LABELS[application.stage]}
            nextLabel={STAGE_LABELS[nextStage]}
          />
        )}
        {canIssue && <IssueCertificate applicationId={application.id} />}
      </div>

      {/* Dictamen */}
      {canVerdict && (
        <section aria-labelledby="dictamen" className="mt-8">
          <h2 id="dictamen" className="text-2xl font-bold text-indigo">
            Dictamen del Comité
          </h2>
          <p className="mt-1 max-w-prose text-sm text-muted-ink">
            Los 30 criterios vienen precargados con la autoevaluación de la
            organización; el Comité puede ajustarlos. El nivel se calcula
            automáticamente con el piso del 40% por dimensión.
          </p>
          <VerdictForm
            applicationId={application.id}
            criteria={criteria.map((c) => ({
              code: c.code,
              dimension: c.dimension,
              title: c.title,
              helpText: c.helpText,
              maxPoints: c.maxPoints,
            }))}
            dimensionNames={DIMENSION_NAMES[application.line]}
            initialAnswers={
              Object.keys(verdictAnswers).length > 0 ? verdictAnswers : orgAnswers
            }
          />
        </section>
      )}

      {application.verdict && !canVerdict && (
        <section aria-labelledby="dictamen-resumen" className="mt-8">
          <h2 id="dictamen-resumen" className="text-2xl font-bold text-indigo">
            Dictamen registrado
          </h2>
          <p className="mt-2 max-w-prose rounded-lg bg-surface p-4 text-sm">
            {application.verdict.approved && application.verdict.level
              ? `Aprobado: nivel ${LEVEL_LABELS[application.verdict.level]} con ${application.verdict.total} puntos.`
              : `Plan de Mejora con ${application.verdict.total} puntos.`}{" "}
            Registrado el {dateFormat.format(application.verdict.createdAt)}.
          </p>
        </section>
      )}

      {/* Self-assessment summary */}
      <section aria-labelledby="autoeval" className="mt-8">
        <h2 id="autoeval" className="text-2xl font-bold text-indigo">
          Autoevaluación de la organización
        </h2>
        {application.assessment ? (
          <p className="mt-2 text-sm text-muted-ink">
            {Object.keys(orgAnswers).length} de {criteria.length} criterios respondidos
            · última actualización el{" "}
            {dateFormat.format(application.assessment.updatedAt)}.
            {canVerdict
              ? " Las respuestas están precargadas en el formulario de dictamen."
              : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-ink">
            La organización aún no inicia su autoevaluación.
          </p>
        )}
      </section>

      {/* Evidence */}
      <section aria-labelledby="evidencias" className="mt-8">
        <h2 id="evidencias" className="text-2xl font-bold text-indigo">
          Evidencias ({application.evidences.length})
        </h2>
        {application.evidences.length === 0 ? (
          <p className="mt-2 text-sm text-muted-ink">Sin evidencias subidas.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {application.evidences.map((evidence) => (
              <li
                key={evidence.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div>
                  <a
                    href={`/api/evidences/${evidence.id}`}
                    className="font-bold text-indigo underline underline-offset-4"
                  >
                    {evidence.fileName}
                  </a>
                  <p className="text-xs text-muted-ink">
                    Dimensión {evidence.dimension}:{" "}
                    {DIMENSION_NAMES[application.line][evidence.dimension]} ·{" "}
                    {formatSize(evidence.sizeBytes)} ·{" "}
                    {dateFormat.format(evidence.uploadedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Notes */}
      <section aria-labelledby="notas-admin" className="mt-8">
        <h2 id="notas-admin" className="text-2xl font-bold text-indigo">
          Notas del expediente
        </h2>
        <NoteForm applicationId={application.id} />
        {application.notes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-ink">Sin notas registradas.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {application.notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm leading-relaxed">{note.body}</p>
                <p className="mt-2 text-xs text-muted-ink">
                  {note.author.email} ·{" "}
                  {note.stage ? `${STAGE_LABELS[note.stage]} · ` : ""}
                  {dateFormat.format(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
