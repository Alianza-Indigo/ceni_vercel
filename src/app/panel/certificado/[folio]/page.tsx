import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CertificateSheet } from "@/components/cert/certificate-sheet";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Certificado" };
export const dynamic = "force-dynamic";

export default async function OrgCertificatePage({
  params,
}: {
  params: Promise<{ folio: string }>;
}) {
  const { folio: rawFolio } = await params;
  const folio = decodeURIComponent(rawFolio).trim().toUpperCase();
  const session = await auth();
  if (!session?.user?.orgId) redirect("/entrar?desde=/panel");

  const certification = await prisma.certification.findUnique({
    where: { folio },
    include: { organization: true, site: true },
  });
  if (!certification || certification.orgId !== session.user.orgId) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="no-print">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: "Mi panel", href: "/panel" },
            { label: `Certificado ${folio}` },
          ]}
        />
        <PageInfo>
          Esta es la versión imprimible de tu certificado {folio}. Usa el botón
          «Imprimir certificado» o la función de imprimir de tu navegador; el formato
          está pensado para hoja A4 horizontal. El QR lleva a la verificación pública.
        </PageInfo>
        <div className="mb-4 flex justify-end">
          <PrintButton />
        </div>
      </div>
      <CertificateSheet certification={certification} />
    </div>
  );
}
