import Image from "next/image";
import QRCode from "qrcode";
import type { Certification, Organization, Site } from "@prisma/client";
import { LEVEL_LABELS, LINE_LABELS } from "@/lib/domain";
import { LevelBadge } from "@/components/cert/level-badge";

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Printable A4-landscape certificate sheet (print styles in globals.css).
 * The QR encodes the public verification URL with the qrToken.
 */
export async function CertificateSheet({
  certification,
}: {
  certification: Certification & { organization: Organization; site: Site | null };
}) {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const verifyUrl = `${siteUrl}/verificar/${certification.folio}?t=${certification.qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 200,
    color: { dark: "#1b1f5a", light: "#ffffff" },
  });

  return (
    <div className="print-page relative mx-auto aspect-[1122/794] w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <Image
        src="/assets/certificate-frame.svg"
        alt=""
        fill
        className="pointer-events-none object-cover"
      />
      <div className="absolute inset-0 flex flex-col items-center px-[9%] py-[7%] text-center">
        <Image src="/assets/logo-ceni-stacked.svg" alt="CENI" width={150} height={131} />
        <p className="mt-2 text-sm font-bold uppercase tracking-widest text-gold-text">
          Certificación de Entornos Neuroinclusivos
        </p>
        <h1 className="mt-3 text-xl font-bold text-indigo sm:text-3xl">
          {certification.site && !certification.site.isPrimary
            ? `${certification.organization.tradeName} · ${certification.site.name}`
            : certification.organization.tradeName}
        </h1>
        <p className="mt-1 text-sm text-muted-ink">
          {certification.organization.legalName} ·{" "}
          {certification.site
            ? `${certification.site.street}, ${certification.site.city}, ${certification.site.state}`
            : `${certification.organization.city}, ${certification.organization.state} · Alcance: toda la organización`}
        </p>
        <div className="mt-3 flex items-center gap-5">
          <LevelBadge level={certification.level} size={110} />
          <div className="text-start">
            <p className="text-lg font-bold text-indigo sm:text-2xl">
              Nivel {LEVEL_LABELS[certification.level]}
            </p>
            <p className="text-sm text-ink">{LINE_LABELS[certification.line]}</p>
            <p className="text-sm text-muted-ink">
              {certification.score} de 1,000 puntos
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink">
          El Comité de Certificación CENI hace constar que este entorno cumplió el
          proceso de evaluación de los Lineamientos CENI. «No necesitas PARECER para
          SER.»
        </p>
        <div className="mt-auto flex w-full items-end justify-between">
          <div className="text-start text-xs text-muted-ink">
            <p className="font-bold text-ink">Folio {certification.folio}</p>
            <p>Emitido el {dateFormat.format(certification.issuedAt)}</p>
            <p>Vigente hasta el {dateFormat.format(certification.expiresAt)}</p>
          </div>
          <div className="text-center">
            <p className="border-t border-ink px-6 pt-1 text-sm font-bold text-ink">
              Comité de Certificación CENI
            </p>
            <p className="text-xs text-muted-ink">Alianza Índigo Neurodivergente A.C.</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL QR */}
          <img
            src={qrDataUrl}
            alt={`Código QR para verificar el folio ${certification.folio}`}
            width={96}
            height={96}
          />
        </div>
      </div>
    </div>
  );
}
