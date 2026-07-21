import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { effectiveCertStatus } from "@/lib/cert-status";
import { scopeDisplayName, scopeLocation } from "@/lib/site-display";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DirectoryExplorer, type DirectoryEntry } from "@/components/directory/directory-explorer";

export const metadata: Metadata = { title: "Directorio de la red CENI" };
export const dynamic = "force-dynamic";

async function getEntries(): Promise<DirectoryEntry[]> {
  const [certifications, organizations] = await Promise.all([
    prisma.certification.findMany({
      where: { status: { in: ["VIGENTE", "POR_VENCER", "SUSPENDIDA"] } },
      include: {
        organization: {
          select: {
            id: true,
            tradeName: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
          },
        },
        site: {
          select: {
            name: true,
            city: true,
            state: true,
            isPrimary: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { organization: { tradeName: "asc" } },
    }),
    prisma.organization.findMany({
      where: { networkStatus: "AFILIADA" },
      select: {
        id: true,
        tradeName: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        networkStatus: true,
      },
      orderBy: { tradeName: "asc" },
    }),
  ]);

  const certificationEntries = certifications
    .map((cert): DirectoryEntry => {
      const org = {
        tradeName: cert.organization.tradeName,
        city: cert.organization.city,
        state: cert.organization.state,
        latitude: cert.organization.latitude
          ? Number(cert.organization.latitude)
          : null,
        longitude: cert.organization.longitude
          ? Number(cert.organization.longitude)
          : null,
      };
      const site = cert.site
        ? {
            name: cert.site.name,
            city: cert.site.city,
            state: cert.site.state,
            isPrimary: cert.site.isPrimary,
            latitude: cert.site.latitude ? Number(cert.site.latitude) : null,
            longitude: cert.site.longitude ? Number(cert.site.longitude) : null,
          }
        : null;
      const location = scopeLocation(org, site);
      return {
        id: `cert:${cert.id}`,
        category: "CERTIFICADA",
        folio: cert.folio,
        line: cert.line,
        level: cert.level,
        status: effectiveCertStatus(cert.status, cert.expiresAt),
        expiresAt: cert.expiresAt.toISOString(),
        orgId: cert.organization.id,
        name: scopeDisplayName(org, site),
        city: location.city,
        state: location.state,
        latitude: location.latitude,
        longitude: location.longitude,
      };
    })
    .filter((entry) => entry.status !== "VENCIDA");

  const certifiedOrgIds = new Set(certificationEntries.map((entry) => entry.orgId));
  const affiliateEntries = organizations
    .filter((org) => !certifiedOrgIds.has(org.id))
    .map((org): DirectoryEntry => ({
      id: `org:${org.id}`,
      category: "AFILIADA",
      folio: null,
      line: null,
      level: null,
      status: org.networkStatus,
      expiresAt: null,
      orgId: org.id,
      name: org.tradeName,
      city: org.city,
      state: org.state,
      latitude: org.latitude ? Number(org.latitude) : null,
      longitude: org.longitude ? Number(org.longitude) : null,
    }));

  return [...certificationEntries, ...affiliateEntries].sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );
}

export default async function DirectoryPage() {
  const entries = await getEntries();
  const affiliates = entries.filter((entry) => entry.category === "AFILIADA").length;
  const certified = entries.filter((entry) => entry.category === "CERTIFICADA").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Directorio" }]} />
      <PageInfo>
        Este es el directorio publico de la red CENI. Puedes ver organizaciones
        afiliadas y entornos certificados en lista o mapa, filtrarlos por linea, nivel,
        estado y estatus, y buscar por nombre.
      </PageInfo>
      <h1 className="text-3xl font-bold text-indigo">Directorio de la red CENI</h1>
      <p className="mt-2 max-w-prose text-muted-ink">
        {affiliates} afiliadas y {certified} certificaciones publicadas.
      </p>
      <div className="mt-6">
        <DirectoryExplorer entries={entries} />
      </div>
    </div>
  );
}
