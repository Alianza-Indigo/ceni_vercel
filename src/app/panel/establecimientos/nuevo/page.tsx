import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SiteForm } from "./site-form";

export const metadata: Metadata = { title: "Nuevo establecimiento" };

export default async function NewSitePage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/entrar?desde=/panel");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Mi panel", href: "/panel" },
          { label: "Nuevo establecimiento" },
        ]}
      />
      <PageInfo>
        En esta página das de alta un establecimiento adicional de tu organización
        (una sucursal, planta o centro de trabajo). Cada establecimiento puede llevar
        sus propios expedientes y certificados. No hay límite de tiempo.
      </PageInfo>
      <h1 className="text-3xl font-bold text-indigo">Nuevo establecimiento</h1>
      <SiteForm />
    </div>
  );
}
