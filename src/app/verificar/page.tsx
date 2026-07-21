import type { Metadata } from "next";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CERT_STATUS_EXPLANATIONS, CERT_STATUS_LABELS } from "@/lib/domain";
import { FolioForm } from "./folio-form";

export const metadata: Metadata = { title: "Verificar un certificado" };

const PUBLIC_STATUSES = ["VIGENTE", "POR_VENCER", "SUSPENDIDA", "VENCIDA", "RETIRADA"] as const;

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Verificar" }]} />
      <PageInfo>
        En esta página puedes verificar si un certificado CENI es auténtico y está
        vigente. Escribe el folio (por ejemplo CENI-L-2026-0001) o escanea el código QR
        del certificado. El resultado muestra estado, nivel, línea y vigencia.
      </PageInfo>

      <h1 className="text-3xl font-bold text-indigo">Verificar un certificado</h1>
      <p className="mt-2 max-w-prose text-muted-ink">
        El folio aparece impreso en el certificado con el formato
        CENI-L-AAAA-0000 (Laboral) o CENI-E-AAAA-0000 (Espacios).
      </p>

      <FolioForm />

      <h2 className="mt-10 text-xl font-bold text-indigo">Qué significa cada estado</h2>
      <dl className="mt-3 space-y-3">
        {PUBLIC_STATUSES.map((status) => (
          <div key={status} className="rounded-lg border border-border bg-card p-4">
            <dt className="font-bold text-ink">{CERT_STATUS_LABELS[status]}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-ink">
              {CERT_STATUS_EXPLANATIONS[status]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
