import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { fetchEmployeeProgress } from "@/lib/curso-client";
import { InviteEmployeeForm } from "./invite-employee-form";
import { EmployeesTable } from "./employees-table";

export const metadata: Metadata = { title: "Empleados" };
export const dynamic = "force-dynamic";

export default async function EmpleadosPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/entrar?desde=/panel/empleados");

  // Si curso_ceni no responde, la página sigue permitiendo invitar — el fetch
  // a curso_ceni vive únicamente aquí, nunca en /panel, para que un fallo de
  // este servicio no afecte al resto del dashboard.
  const progreso = await fetchEmployeeProgress(session.user.orgId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Mi panel", href: "/panel" },
          { label: "Empleados" },
        ]}
      />
      <PageInfo>
        Aquí puedes invitar a tus empleados a tomar el Curso CENI de capacitación y ver su
        progreso: módulos completados, si aprobaron el examen y si ya obtuvieron su
        certificación.
      </PageInfo>

      <h1 className="text-3xl font-bold text-indigo">Empleados</h1>
      <InviteEmployeeForm />

      {progreso.ok ? (
        <EmployeesTable progreso={progreso.data} />
      ) : (
        <Alert variant="warning" className="mt-6">
          <AlertTitle>No pudimos cargar el progreso de tus empleados</AlertTitle>
          <AlertDescription>
            Puedes seguir invitando; el progreso se mostrará aquí cuando el servicio de
            capacitación esté disponible de nuevo.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
