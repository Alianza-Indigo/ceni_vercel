import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { effectiveCertStatus } from "@/lib/cert-status";
import { scopeDisplayName, scopeLocation } from "@/lib/site-display";
import { deadlineSemaphore } from "@/lib/business-days";
import {
  LEVEL_LABELS,
  LINE_LABELS,
  STAGE_DEADLINES,
  STAGE_LABELS,
  STAGE_ORDER,
} from "@/lib/domain";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DirectoryExplorer } from "@/components/directory/directory-explorer";
import { MetricForm } from "./metric-form";

export const metadata: Metadata = { title: "Administración" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [applications, certifications, organizations, peopleTrained] = await Promise.all([
    prisma.application.findMany({
      where: { status: "EN_PROCESO" },
      select: { id: true, stage: true, stageEnteredAt: true },
    }),
    prisma.certification.findMany({
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
    prisma.siteMetric.findUnique({ where: { key: "people_trained" } }),
  ]);

  const byStage = STAGE_ORDER.map((stage) => ({
    stage,
    count: applications.filter((a) => a.stage === stage).length,
  }));
  const overdue = applications.filter(
    (a) =>
      deadlineSemaphore(a.stageEnteredAt, STAGE_DEADLINES[a.stage]).color === "red",
  ).length;

  const withEffective = certifications.map((c) => ({
    ...c,
    effective: effectiveCertStatus(c.status, c.expiresAt),
  }));
  const active = withEffective.filter(
    (c) => c.effective === "VIGENTE" || c.effective === "POR_VENCER",
  );
  const nearExpiry = withEffective.filter((c) => c.effective === "POR_VENCER").length;

  const byLevelLine: Record<string, number> = {};
  for (const cert of active) {
    const key = `${cert.line}-${cert.level}`;
    byLevelLine[key] = (byLevelLine[key] ?? 0) + 1;
  }

  const certificationMapEntries = withEffective
    .filter((c) => c.effective !== "VENCIDA" && c.effective !== "RETIRADA")
    .map((c) => {
      const org = {
        tradeName: c.organization.tradeName,
        city: c.organization.city,
        state: c.organization.state,
        latitude: c.organization.latitude ? Number(c.organization.latitude) : null,
        longitude: c.organization.longitude ? Number(c.organization.longitude) : null,
      };
      const site = c.site
        ? {
            name: c.site.name,
            city: c.site.city,
            state: c.site.state,
            isPrimary: c.site.isPrimary,
            latitude: c.site.latitude ? Number(c.site.latitude) : null,
            longitude: c.site.longitude ? Number(c.site.longitude) : null,
          }
        : null;
      const location = scopeLocation(org, site);
      return {
        id: `cert:${c.id}`,
        category: "CERTIFICADA" as const,
        folio: c.folio,
        line: c.line,
        level: c.level,
        status: c.effective,
        expiresAt: c.expiresAt.toISOString(),
        orgId: c.organization.id,
        name: scopeDisplayName(org, site),
        city: location.city,
        state: location.state,
        latitude: location.latitude,
        longitude: location.longitude,
      };
    });
  const certifiedOrgIds = new Set(certificationMapEntries.map((entry) => entry.orgId));
  const affiliateMapEntries = organizations
    .filter((org) => !certifiedOrgIds.has(org.id))
    .map((org) => ({
      id: `org:${org.id}`,
      category: "AFILIADA" as const,
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
  const mapEntries = [...certificationMapEntries, ...affiliateMapEntries].sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );

  return (
    <div>
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Administración" }]} />
      <PageInfo>
        Este es el tablero del Comité de Certificación. Muestra: expedientes activos por
        etapa, plazos vencidos, certificaciones por nivel y línea, próximas a vencer, un
        mapa de cobertura y el contador manual de personas capacitadas.
      </PageInfo>

      <h1 className="text-3xl font-bold text-indigo">Tablero</h1>

      <section aria-labelledby="kpi-expedientes" className="mt-6">
        <h2 id="kpi-expedientes" className="text-xl font-bold text-indigo">
          Expedientes activos por etapa
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {byStage.map(({ stage, count }) => (
            <div key={stage} className="rounded-xl border border-border bg-card p-4 text-center">
              <dt className="text-xs font-bold text-muted-ink">{STAGE_LABELS[stage]}</dt>
              <dd className="mt-1 text-3xl font-bold text-indigo">{count}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex flex-wrap gap-3">
          <p className="rounded-lg border border-status-bad/40 bg-status-bad/10 px-4 py-2 text-sm font-bold text-status-bad">
            ○ Plazos vencidos: {overdue}
          </p>
          <p className="rounded-lg border border-status-warn/40 bg-status-warn/10 px-4 py-2 text-sm font-bold text-status-warn">
            ⏱ Certificaciones por vencer (≤60 días): {nearExpiry}
          </p>
          <p className="rounded-lg border border-indigo/30 bg-surface px-4 py-2 text-sm font-bold text-indigo">
            Red CENI afiliada: {organizations.length}
          </p>
          <Link
            href="/admin/expedientes"
            className="inline-flex min-h-11 items-center rounded-lg bg-indigo px-4 py-2 text-sm font-bold text-white hover:bg-indigo-soft"
          >
            Ir a la bandeja de expedientes
          </Link>
        </div>
      </section>

      <section aria-labelledby="kpi-certs" className="mt-8">
        <h2 id="kpi-certs" className="text-xl font-bold text-indigo">
          Certificaciones activas por nivel y línea
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(["LABORAL", "ESPACIOS"] as const).flatMap((line) =>
            (["BRONCE", "PLATA", "ORO"] as const).map((level) => (
              <div
                key={`${line}-${level}`}
                className="rounded-xl border border-border bg-card p-4 text-center"
              >
                <dt className="text-xs font-bold text-muted-ink">
                  {LINE_LABELS[line]} · {LEVEL_LABELS[level]}
                </dt>
                <dd className="mt-1 text-3xl font-bold text-indigo">
                  {byLevelLine[`${line}-${level}`] ?? 0}
                </dd>
              </div>
            )),
          )}
        </dl>
      </section>

      <section aria-labelledby="metricas" className="mt-8">
        <h2 id="metricas" className="text-xl font-bold text-indigo">
          Contadores del sitio
        </h2>
        <MetricForm currentValue={peopleTrained?.value ?? 0} />
      </section>

      <section aria-labelledby="cobertura" className="mt-8">
        <h2 id="cobertura" className="text-xl font-bold text-indigo">
          Cobertura del Registro Nacional
        </h2>
        <div className="mt-3">
          <DirectoryExplorer entries={mapEntries} />
        </div>
      </section>
    </div>
  );
}
