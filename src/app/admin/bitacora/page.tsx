import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Bitácora" };
export const dynamic = "force-dynamic";

const dateTimeFormat = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const PAGE_SIZE = 50;

/** Read-only, append-only audit trail with actor/entity/date filters. */
export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; entity?: string; desde?: string; hasta?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.pagina) || 1);

  const where = {
    ...(params.entity ? { entity: params.entity } : {}),
    ...(params.desde || params.hasta
      ? {
          createdAt: {
            ...(params.desde ? { gte: new Date(`${params.desde}T00:00:00Z`) } : {}),
            ...(params.hasta ? { lte: new Date(`${params.hasta}T23:59:59Z`) } : {}),
          },
        }
      : {}),
  };

  const [entriesRaw, total, actors] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE * 4, // filter by actor email after join below
    }),
    prisma.auditLog.count({ where }),
    prisma.user.findMany({ select: { id: true, email: true } }),
  ]);
  const actorEmail = new Map(actors.map((a) => [a.id, a.email]));

  const filteredByActor = params.actor
    ? entriesRaw.filter((e) =>
        (actorEmail.get(e.actorId) ?? "").includes(params.actor!.toLowerCase()),
      )
    : entriesRaw;
  const entries = filteredByActor.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const entities = ["Application", "Certification", "User", "SiteMetric"];

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/" },
          { label: "Administración", href: "/admin" },
          { label: "Bitácora" },
        ]}
      />
      <PageInfo>
        Esta es la bitácora inmutable del Comité: cada acción administrativa queda
        registrada y no puede editarse ni borrarse. Puedes filtrar por persona, entidad
        y rango de fechas. La vista es de solo lectura.
      </PageInfo>
      <h1 className="text-3xl font-bold text-indigo">Bitácora</h1>

      <form method="get" className="mt-6 rounded-xl border border-border bg-card p-4">
        <fieldset>
          <legend className="text-sm font-bold text-indigo">Filtros</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="actor">Correo de la persona</Label>
              <Input id="actor" name="actor" defaultValue={params.actor ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="entity">Entidad</Label>
              <Select id="entity" name="entity" defaultValue={params.entity ?? ""}>
                <option value="">Todas</option>
                {entities.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desde">Desde (fecha)</Label>
              <Input id="desde" name="desde" type="date" defaultValue={params.desde ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hasta">Hasta (fecha)</Label>
              <Input id="hasta" name="hasta" type="date" defaultValue={params.hasta ?? ""} />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="secondary">
                Aplicar filtros
              </Button>
            </div>
          </div>
        </fieldset>
      </form>

      <p role="status" className="mt-3 text-sm text-muted-ink">
        {total} registro(s) en total. Página {page}.
      </p>

      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y hora</TableHead>
              <TableHead>Persona</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap text-xs">
                  {dateTimeFormat.format(entry.createdAt)}
                </TableCell>
                <TableCell className="text-xs">
                  {actorEmail.get(entry.actorId) ?? entry.actorId}
                </TableCell>
                <TableCell className="font-bold">{entry.action}</TableCell>
                <TableCell className="text-xs">
                  {entry.entity}
                  <br />
                  <span className="text-muted-ink">{entry.entityId}</span>
                </TableCell>
                <TableCell>
                  <code className="block max-w-md overflow-x-auto whitespace-pre-wrap break-all text-xs">
                    {JSON.stringify(entry.payload)}
                  </code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
