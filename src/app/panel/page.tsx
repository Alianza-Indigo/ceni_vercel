import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveCertStatus } from "@/lib/cert-status";
import {
  CERT_STATUS_LABELS,
  LEVEL_LABELS,
  LINE_LABELS,
  NEXT_STEP_FOR_ORG,
  RENEWAL_COST_NOTE,
} from "@/lib/domain";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { StageStepper } from "@/components/application/stage-stepper";
import { DeadlineChip } from "@/components/application/deadline-chip";
import { LevelBadge } from "@/components/cert/level-badge";
import { StatusBadge } from "@/components/cert/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SignOutButton } from "./sign-out-button";
import { startRenewal } from "./actions";

export const metadata: Metadata = { title: "Panel de organización" };
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function OrgDashboardPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/entrar?desde=/panel");

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.orgId },
    include: {
      sites: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          assessment: { select: { id: true } },
          site: { select: { name: true, isPrimary: true } },
        },
      },
      certifications: {
        orderBy: { issuedAt: "desc" },
        include: { site: { select: { name: true, isPrimary: true } } },
      },
    },
  });
  if (!organization) redirect("/entrar");

  // Scope key: line + site (or org-wide) — renewals only offered when that
  // exact scope has no open file.
  const openScopes = new Set(
    organization.applications
      .filter((a) => a.status === "EN_PROCESO")
      .map((a) => `${a.line}:${a.siteId ?? "ORG"}`),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Mi panel" }]} />
      <PageInfo>
        Este es el panel de {organization.tradeName}. Aquí puedes: ver el avance de cada
        expediente por etapas, entrar a la autoevaluación, subir evidencias, consultar
        tus certificados e iniciar renovaciones. Tu sesión se puede cerrar con el botón
        al final de la página.
      </PageInfo>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-indigo">{organization.tradeName}</h1>
          <p className="mt-1 text-muted-ink">
            {organization.city}, {organization.state}
          </p>
        </div>
        <SignOutButton />
      </div>

      {/* Sites */}
      <section aria-labelledby="establecimientos" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="establecimientos" className="text-2xl font-bold text-indigo">
            Establecimientos
          </h2>
          <Button asChild variant="outline">
            <Link href="/panel/establecimientos/nuevo">Agregar establecimiento</Link>
          </Button>
        </div>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {organization.sites.map((site) => (
            <li key={site.id} className="rounded-xl border border-border bg-card p-4">
              <p className="font-bold text-indigo">
                {site.name}
                {site.isPrimary && (
                  <span className="ms-2 rounded-md bg-surface px-2 py-0.5 text-xs font-bold text-muted-ink">
                    Principal
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-ink">
                {site.street}, {site.city}, {site.state}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-prose text-sm text-muted-ink">
          Cada establecimiento puede llevar sus propios expedientes y certificados.
          CENI Espacios siempre evalúa un establecimiento concreto; CENI Laboral puede
          evaluar un centro de trabajo o toda la organización.
        </p>
      </section>

      {/* Applications */}
      <section aria-labelledby="expedientes" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="expedientes" className="text-2xl font-bold text-indigo">
            Expedientes
          </h2>
          <Button asChild variant="secondary">
            <Link href="/panel/solicitudes/nueva">Nueva solicitud</Link>
          </Button>
        </div>
        {organization.applications.length === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-8 text-center">
            <Image
              src="/assets/empty-expedientes.svg"
              alt=""
              width={240}
              height={160}
              className="decorative-illustration mx-auto"
            />
            <p className="mt-4 font-bold text-ink">Aún no tienes expedientes.</p>
            <p className="mx-auto mt-1 max-w-prose text-sm text-muted-ink">
              Cómo continuar: escríbenos o inicia una renovación desde un certificado.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {organization.applications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>
                      {LINE_LABELS[application.line]}
                      {application.isRenewal ? " · Renovación" : ""}
                      <span className="ms-2 align-middle rounded-md bg-surface px-2 py-0.5 text-xs font-bold text-muted-ink">
                        {application.site?.name ?? "Toda la organización"}
                      </span>
                    </CardTitle>
                    {application.status === "EN_PROCESO" ? (
                      <DeadlineChip
                        stage={application.stage}
                        stageEnteredAt={application.stageEnteredAt}
                      />
                    ) : (
                      <span className="rounded-md bg-surface px-2.5 py-1 text-xs font-bold text-muted-ink">
                        {application.status === "CERTIFICADO"
                          ? "Expediente cerrado: certificado emitido"
                          : application.status === "PLAN_DE_MEJORA"
                            ? "Resultado: Plan de Mejora"
                            : "Expediente cerrado"}
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    Creado el {dateFormat.format(application.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StageStepper current={application.stage} />
                  {application.status === "EN_PROCESO" && (
                    <p className="max-w-prose rounded-lg bg-surface p-3 text-sm">
                      <strong>Siguiente paso esperado:</strong>{" "}
                      {NEXT_STEP_FOR_ORG[application.stage]}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="secondary">
                      <Link href={`/panel/expediente/${application.id}`}>
                        Ver expediente
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/panel/expediente/${application.id}/autoevaluacion`}>
                        {application.assessment ? "Autoevaluación" : "Iniciar autoevaluación"}
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/panel/expediente/${application.id}/evidencias`}>
                        Evidencias
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Certifications */}
      <section aria-labelledby="certificados" className="mt-10">
        <h2 id="certificados" className="text-2xl font-bold text-indigo">
          Certificados
        </h2>
        {organization.certifications.length === 0 ? (
          <p className="mt-3 max-w-prose text-sm text-muted-ink">
            Aún no hay certificados emitidos para tu organización. Cuando el Comité de
            Certificación emita uno, aparecerá aquí con su folio y QR.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {organization.certifications.map((certification) => {
              const status = effectiveCertStatus(
                certification.status,
                certification.expiresAt,
              );
              const canRenew =
                (status === "POR_VENCER" || status === "VENCIDA") &&
                !openScopes.has(
                  `${certification.line}:${certification.siteId ?? "ORG"}`,
                );
              return (
                <Card key={certification.id}>
                  <CardContent className="flex gap-4 p-6">
                    <LevelBadge level={certification.level} size={72} />
                    <div className="min-w-0 space-y-2">
                      <p className="font-bold text-indigo">
                        {LINE_LABELS[certification.line]} · Nivel{" "}
                        {LEVEL_LABELS[certification.level]}
                      </p>
                      <p className="text-sm text-muted-ink">
                        Alcance: {certification.site?.name ?? "Toda la organización"}
                      </p>
                      <p className="text-sm text-muted-ink">
                        Folio {certification.folio} ·{" "}
                        {status === "VENCIDA" ? "Venció" : "Vence"} el{" "}
                        {dateFormat.format(certification.expiresAt)}
                      </p>
                      <StatusBadge status={status} />
                      <p className="text-sm text-muted-ink">
                        Estatus actual: {CERT_STATUS_LABELS[status]}.
                      </p>
                      <div className="flex flex-wrap gap-3 pt-1">
                        <Button asChild variant="secondary" size="sm">
                          <Link href={`/panel/certificado/${certification.folio}`}>
                            Ver certificado imprimible
                          </Link>
                        </Button>
                        {canRenew && (
                          <form
                            action={startRenewal.bind(null, certification.id)}
                          >
                            <Button type="submit" variant="outline" size="sm">
                              Iniciar renovación
                            </Button>
                          </form>
                        )}
                      </div>
                      {canRenew && (
                        <p className="text-xs text-muted-ink">{RENEWAL_COST_NOTE}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
