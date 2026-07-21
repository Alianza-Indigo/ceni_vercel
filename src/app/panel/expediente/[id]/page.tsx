import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LINE_LABELS, NEXT_STEP_FOR_ORG, STAGE_LABELS } from "@/lib/domain";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { StageStepper } from "@/components/application/stage-stepper";
import { DeadlineChip } from "@/components/application/deadline-chip";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Expediente" };
export const dynamic = "force-dynamic";

const dateTimeFormat = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.orgId) redirect("/entrar?desde=/panel");

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      site: { select: { name: true, city: true, state: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { email: true } } } },
      assessment: { select: { updatedAt: true } },
      evidences: { select: { id: true } },
      certification: { select: { folio: true } },
    },
  });
  if (!application || application.orgId !== session.user.orgId) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Mi panel", href: "/panel" },
          { label: `Expediente ${LINE_LABELS[application.line]}` },
        ]}
      />
      <PageInfo>
        Este es el detalle de tu expediente {LINE_LABELS[application.line]}
        {application.isRenewal ? " (renovación)" : ""}. Aquí puedes: ver la etapa
        actual y su plazo, leer las notas del equipo revisor, y entrar a la
        autoevaluación o a las evidencias.
      </PageInfo>

      <h1 className="text-3xl font-bold text-indigo">
        Expediente {LINE_LABELS[application.line]}
        {application.isRenewal ? " · Renovación" : ""}
      </h1>
      <p className="mt-1 text-muted-ink">
        Alcance:{" "}
        {application.site
          ? `${application.site.name} (${application.site.city}, ${application.site.state})`
          : "toda la organización"}
      </p>

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
            Etapa actual: {STAGE_LABELS[application.stage]} · desde el{" "}
            {dateTimeFormat.format(application.stageEnteredAt)}
          </span>
        </div>
        {application.status === "EN_PROCESO" ? (
          <p className="max-w-prose rounded-lg bg-surface p-3 text-sm">
            <strong>Siguiente paso esperado:</strong>{" "}
            {NEXT_STEP_FOR_ORG[application.stage]}
          </p>
        ) : application.status === "CERTIFICADO" && application.certification ? (
          <p className="max-w-prose rounded-lg bg-status-ok/10 p-3 text-sm">
            El Comité emitió tu certificado con folio{" "}
            <Link
              href={`/panel/certificado/${application.certification.folio}`}
              className="font-bold text-indigo underline underline-offset-4"
            >
              {application.certification.folio}
            </Link>
            .
          </p>
        ) : application.status === "PLAN_DE_MEJORA" ? (
          <p className="max-w-prose rounded-lg bg-status-warn/10 p-3 text-sm">
            El resultado del dictamen fue Plan de Mejora. Revisa las notas del Comité
            más abajo: ahí están las dimensiones señaladas y los pasos a seguir.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href={`/panel/expediente/${application.id}/autoevaluacion`}>
              Autoevaluación
              {application.assessment
                ? ` (actualizada el ${dateTimeFormat.format(application.assessment.updatedAt)})`
                : ""}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/panel/expediente/${application.id}/evidencias`}>
              Evidencias ({application.evidences.length})
            </Link>
          </Button>
        </div>
      </div>

      <section aria-labelledby="notas" className="mt-8">
        <h2 id="notas" className="text-xl font-bold text-indigo">
          Notas del equipo
        </h2>
        {application.notes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-ink">
            Aún no hay notas. Cuando el equipo revisor o el Comité agregue una, la verás
            aquí.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {application.notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm leading-relaxed">{note.body}</p>
                <p className="mt-2 text-xs text-muted-ink">
                  {note.stage ? `${STAGE_LABELS[note.stage]} · ` : ""}
                  {dateTimeFormat.format(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
