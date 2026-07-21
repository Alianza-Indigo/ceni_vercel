import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAnswers } from "@/lib/scoring";
import { LINE_LABELS, STAGE_ORDER } from "@/lib/domain";
import { DIMENSION_NAMES } from "@/lib/criteria-data";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AssessmentForm } from "./assessment-form";

export const metadata: Metadata = { title: "Autoevaluación" };
export const dynamic = "force-dynamic";

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.orgId) redirect("/entrar?desde=/panel");

  const application = await prisma.application.findUnique({
    where: { id },
    include: { assessment: true },
  });
  if (!application || application.orgId !== session.user.orgId) notFound();

  const criteria = await prisma.criterion.findMany({
    where: { line: application.line },
    orderBy: { sortOrder: "asc" },
  });

  const editable =
    STAGE_ORDER.indexOf(application.stage) <=
    STAGE_ORDER.indexOf("REVISION_DOCUMENTAL");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Mi panel", href: "/panel" },
          { label: "Expediente", href: `/panel/expediente/${application.id}` },
          { label: "Autoevaluación" },
        ]}
      />
      <PageInfo>
        Esta es la autoevaluación de la línea {LINE_LABELS[application.line]}: 30
        criterios agrupados en 6 dimensiones. En cada criterio eliges 0%, 50% o 100% de
        cumplimiento. Tus respuestas se guardan solas mientras contestas; no hay límite
        de tiempo. El puntaje que ves es una estimación orientativa.
      </PageInfo>

      <h1 className="text-3xl font-bold text-indigo">
        Autoevaluación · {LINE_LABELS[application.line]}
      </h1>

      <AssessmentForm
        applicationId={application.id}
        editable={editable}
        criteria={criteria.map((c) => ({
          code: c.code,
          dimension: c.dimension,
          title: c.title,
          helpText: c.helpText,
          maxPoints: c.maxPoints,
        }))}
        dimensionNames={DIMENSION_NAMES[application.line]}
        initialAnswers={parseAnswers(application.assessment?.answers)}
      />
    </div>
  );
}
