import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ApplicationsBoard, type ApplicationRow } from "./applications-board";

export const metadata: Metadata = { title: "Bandeja de expedientes" };
export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const applications = await prisma.application.findMany({
    orderBy: { stageEnteredAt: "asc" },
    include: {
      organization: { select: { tradeName: true, city: true, state: true } },
      site: { select: { name: true, city: true, state: true } },
      assessment: { select: { id: true } },
      certification: { select: { folio: true } },
    },
  });

  const rows: ApplicationRow[] = applications.map((a) => ({
    id: a.id,
    org: a.organization.tradeName,
    scope: a.site?.name ?? "Toda la organización",
    place: a.site
      ? `${a.site.city}, ${a.site.state}`
      : `${a.organization.city}, ${a.organization.state}`,
    line: a.line,
    stage: a.stage,
    status: a.status,
    isRenewal: a.isRenewal,
    stageEnteredAt: a.stageEnteredAt.toISOString(),
    hasAssessment: Boolean(a.assessment),
    folio: a.certification?.folio ?? null,
  }));

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Administración", href: "/admin" },
          { label: "Expedientes" },
        ]}
      />
      <PageInfo>
        Esta es la bandeja de expedientes del Comité. Puedes verla como tabla o como
        tablero kanban por etapa, filtrar por línea, etapa y estado, y entrar a cada
        expediente para revisarlo, transitarlo de etapa o dictaminarlo.
      </PageInfo>
      <h1 className="text-3xl font-bold text-indigo">Bandeja de expedientes</h1>
      <div className="mt-6">
        <ApplicationsBoard rows={rows} />
      </div>
    </div>
  );
}
