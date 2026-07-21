import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { effectiveCertStatus } from "@/lib/cert-status";
import {
  CERT_STATUS_EXPLANATIONS,
  CERT_STATUS_LABELS,
  isValidFolio,
  LEVEL_LABELS,
  LINE_LABELS,
} from "@/lib/domain";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LevelBadge } from "@/components/cert/level-badge";
import { StatusBadge } from "@/components/cert/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Resultado de verificación" };

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Public verification: shows status, level, line, organization, and validity.
 * Never exposes contact data.
 */
export default async function VerifyResultPage({
  params,
}: {
  params: Promise<{ folio: string }>;
}) {
  const { folio: rawFolio } = await params;
  const folio = decodeURIComponent(rawFolio).trim().toUpperCase();

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = checkRateLimit(`verify:${ip}`);

  const certification =
    allowed && isValidFolio(folio)
      ? await prisma.certification.findUnique({
          where: { folio },
          include: {
            organization: {
              select: { tradeName: true, city: true, state: true },
            },
            site: {
              select: { name: true, city: true, state: true, isPrimary: true },
            },
          },
        })
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Verificar", href: "/verificar" },
          { label: folio },
        ]}
      />
      <PageInfo>
        Esta página muestra el resultado de verificar el folio {folio}: si el
        certificado existe, verás su estado, nivel, línea, organización y vigencia.
        Puedes verificar otro folio con el enlace al final.
      </PageInfo>

      <h1 className="text-3xl font-bold text-indigo">Resultado de verificación</h1>

      {!allowed ? (
        <Alert variant="warning" className="mt-6">
          <AlertTitle>Demasiadas consultas</AlertTitle>
          <AlertDescription>
            Qué pasó: se recibieron demasiadas consultas seguidas desde tu conexión.
            Cómo corregirlo: espera un minuto y vuelve a intentar.
          </AlertDescription>
        </Alert>
      ) : !certification ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
          <Image
            src="/assets/empty-verify.svg"
            alt=""
            width={240}
            height={160}
            className="decorative-illustration mx-auto"
          />
          <h2 className="mt-4 text-xl font-bold text-ink">
            No encontramos un certificado con el folio {folio}
          </h2>
          <p className="mx-auto mt-2 max-w-prose text-sm text-muted-ink">
            Qué significa: ese folio no corresponde a ningún certificado emitido por el
            Comité de Certificación CENI. Cómo continuar: revisa que el folio esté bien
            escrito e inténtalo de nuevo.
          </p>
        </div>
      ) : (
        (() => {
          const status = effectiveCertStatus(
            certification.status,
            certification.expiresAt,
          );
          return (
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-ink">Folio {certification.folio}</p>
                  <h2 className="mt-1 text-2xl font-bold text-indigo">
                    {certification.site && !certification.site.isPrimary
                      ? `${certification.organization.tradeName} · ${certification.site.name}`
                      : certification.organization.tradeName}
                  </h2>
                  <p className="text-sm text-muted-ink">
                    {certification.site?.city ?? certification.organization.city},{" "}
                    {certification.site?.state ?? certification.organization.state}
                    {!certification.site && " · Alcance: toda la organización"}
                  </p>
                </div>
                <LevelBadge level={certification.level} size={88} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={status} />
                <span className="text-sm font-bold text-ink">
                  {LINE_LABELS[certification.line]} · Nivel{" "}
                  {LEVEL_LABELS[certification.level]}
                </span>
              </div>

              <p className="mt-4 max-w-prose text-sm leading-relaxed">
                {CERT_STATUS_EXPLANATIONS[status]}
                {status === "SUSPENDIDA" && certification.statusReason
                  ? ` Causal registrada: ${certification.statusReason}.`
                  : null}
                {status === "RETIRADA" && certification.statusReason
                  ? ` Causal registrada: ${certification.statusReason}.`
                  : null}
              </p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-surface p-4">
                  <dt className="text-sm font-bold text-muted-ink">Emitido</dt>
                  <dd className="text-ink">
                    {dateFormat.format(certification.issuedAt)}
                  </dd>
                </div>
                <div className="rounded-lg bg-surface p-4">
                  <dt className="text-sm font-bold text-muted-ink">
                    {status === "VENCIDA" ? "Venció" : "Vence"}
                  </dt>
                  <dd className="text-ink">
                    {dateFormat.format(certification.expiresAt)}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-sm text-muted-ink">
                Estado: {CERT_STATUS_LABELS[status]}. Esta verificación no muestra
                datos de contacto de la organización.
              </p>
            </div>
          );
        })()
      )}

      <p className="mt-8">
        <Link
          href="/verificar"
          className="font-bold text-indigo underline underline-offset-4"
        >
          Verificar otro folio
        </Link>
      </p>
    </div>
  );
}
