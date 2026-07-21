import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { UsersManager } from "./users-manager";

export const metadata: Metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    include: { organization: { select: { tradeName: true } } },
  });

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Administración", href: "/admin" },
          { label: "Usuarios" },
        ]}
      />
      <PageInfo>
        Aquí se administran las cuentas de la plataforma: puedes crear cuentas ADMIN
        adicionales y restablecer la contraseña de cuentas de organización. Ambas
        acciones quedan en bitácora.
      </PageInfo>
      <h1 className="text-3xl font-bold text-indigo">Usuarios</h1>
      <div className="mt-6">
        <UsersManager
          users={users.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            orgName: u.organization?.tradeName ?? null,
          }))}
        />
      </div>
    </div>
  );
}
