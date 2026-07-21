import type { Metadata } from "next";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RegistrationForm } from "./registration-form";

export const metadata: Metadata = { title: "Registro de organización" };

export default function RegistrationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Registro" }]} />
      <PageInfo>
        En esta página registras a tu organización en el programa CENI. El formulario
        tiene 4 secciones: cuenta, datos de la organización, ubicación y línea(s) de
        certificación. Al terminar entrarás a tu panel con tu expediente creado. No hay
        límite de tiempo.
      </PageInfo>
      <h1 className="text-3xl font-bold text-indigo">Registra tu organización</h1>
      <p className="mt-2 max-w-prose text-muted-ink">
        El registro es el primer paso del proceso de certificación. Los costos son
        informativos y están publicados en Proceso y costos; la plataforma no cobra.
      </p>
      <RegistrationForm />
    </div>
  );
}
