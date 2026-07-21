import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { effectiveCertStatus } from "@/lib/cert-status";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RegistryTable, type RegistryRow } from "./registry-table";

export const metadata: Metadata = { title: "Registro Nacional" };
export const dynamic = "force-dynamic";

export default async function RegistryPage() {
  const certifications = await prisma.certification.findMany({
    orderBy: { issuedAt: "desc" },
    include: {
      organization: { select: { tradeName: true, city: true, state: true } },
      site: { select: { name: true, city: true, state: true, isPrimary: true } },
    },
  });

  const rows: RegistryRow[] = certifications.map((c) => ({
    id: c.id,
    folio: c.folio,
    org:
      c.site && !c.site.isPrimary
        ? `${c.organization.tradeName} · ${c.site.name}`
        : c.organization.tradeName,
    place: c.site
      ? `${c.site.city}, ${c.site.state}`
      : `${c.organization.city}, ${c.organization.state} (toda la organización)`,
    line: c.line,
    level: c.level,
    storedStatus: c.status,
    effectiveStatus: effectiveCertStatus(c.status, c.expiresAt),
    statusReason: c.statusReason,
    issuedAt: c.issuedAt.toISOString(),
    expiresAt: c.expiresAt.toISOString(),
  }));

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Administración", href: "/admin" },
          { label: "Registro Nacional" },
        ]}
      />
      <PageInfo>
        Este es el Registro Nacional de certificaciones. Aquí el Comité puede suspender,
        reactivar o retirar certificaciones con causal obligatoria del catálogo. Todo
        cambio queda en bitácora y se refleja de inmediato en el directorio y la
        verificación pública.
      </PageInfo>
      <h1 className="text-3xl font-bold text-indigo">Registro Nacional</h1>
      <div className="mt-6">
        <RegistryTable rows={rows} />
      </div>
    </div>
  );
}
