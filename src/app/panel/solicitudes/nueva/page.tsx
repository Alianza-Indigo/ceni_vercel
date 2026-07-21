import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NewApplicationForm } from "./new-application-form";

export const metadata: Metadata = { title: "Nueva solicitud" };
export const dynamic = "force-dynamic";

export default async function NewApplicationPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/entrar?desde=/panel");

  const sites = await prisma.site.findMany({
    where: { orgId: session.user.orgId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { id: true, name: true, city: true, state: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Mi panel", href: "/panel" },
          { label: "Nueva solicitud" },
        ]}
      />
      <PageInfo>
        En esta página inicias un expediente de certificación nuevo. Eliges la línea
        (Laboral o Espacios) y el alcance: un establecimiento concreto o, solo para
        CENI Laboral, toda la organización. El expediente inicia en etapa de Solicitud.
      </PageInfo>
      <h1 className="text-3xl font-bold text-indigo">Nueva solicitud</h1>
      <NewApplicationForm sites={sites} />
    </div>
  );
}
