import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CertificateSheet } from "@/components/cert/certificate-sheet";
import { PrintButton } from "@/app/panel/certificado/[folio]/print-button";

export const metadata: Metadata = { title: "Certificado (admin)" };
export const dynamic = "force-dynamic";

export default async function AdminCertificatePage({
  params,
}: {
  params: Promise<{ folio: string }>;
}) {
  const { folio: rawFolio } = await params;
  const folio = decodeURIComponent(rawFolio).trim().toUpperCase();
  const certification = await prisma.certification.findUnique({
    where: { folio },
    include: { organization: true, site: true },
  });
  if (!certification) notFound();

  return (
    <div>
      <div className="no-print">
        <Breadcrumbs
          items={[
            { label: "Inicio", href: "/" },
            { label: "Administración", href: "/admin" },
            { label: "Registro Nacional", href: "/admin/registro" },
            { label: folio },
          ]}
        />
        <PageInfo>
          Esta es la versión imprimible del certificado {folio}, tal como la ve la
          organización. Puedes imprimirla en hoja A4 horizontal.
        </PageInfo>
        <div className="mb-4 flex justify-end">
          <PrintButton />
        </div>
      </div>
      <CertificateSheet certification={certification} />
    </div>
  );
}
