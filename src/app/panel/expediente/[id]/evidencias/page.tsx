import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LINE_LABELS, STAGE_ORDER } from "@/lib/domain";
import { DIMENSION_NAMES } from "@/lib/criteria-data";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EvidenceManager } from "./evidence-manager";

export const metadata: Metadata = { title: "Evidencias" };
export const dynamic = "force-dynamic";

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.orgId) redirect("/entrar?desde=/panel");

  const application = await prisma.application.findUnique({
    where: { id },
    include: { evidences: { orderBy: [{ dimension: "asc" }, { uploadedAt: "desc" }] } },
  });
  if (!application || application.orgId !== session.user.orgId) notFound();

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
          { label: "Evidencias" },
        ]}
      />
      <PageInfo>
        Aquí subes las evidencias de tu expediente {LINE_LABELS[application.line]},
        organizadas por dimensión. Se aceptan archivos PDF, PNG y JPG de hasta 10 MB.
        Puedes eliminar archivos mientras el expediente esté en Solicitud o en Revisión
        Documental.
      </PageInfo>

      <h1 className="text-3xl font-bold text-indigo">
        Evidencias · {LINE_LABELS[application.line]}
      </h1>

      <EvidenceManager
        applicationId={application.id}
        editable={editable}
        dimensionNames={DIMENSION_NAMES[application.line]}
        evidences={application.evidences.map((e) => ({
          id: e.id,
          dimension: e.dimension,
          fileName: e.fileName,
          sizeBytes: e.sizeBytes,
          uploadedAt: e.uploadedAt.toISOString(),
        }))}
      />
    </div>
  );
}
