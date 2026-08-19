import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ProgresoOrganizacion } from "@/lib/curso-client";

const dateFormat = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" });

export function EmployeesTable({ progreso }: { progreso: ProgresoOrganizacion }) {
  const { empleados, invitacionesPendientes } = progreso;

  if (empleados.length === 0 && invitacionesPendientes.length === 0) {
    return (
      <p className="mt-4 max-w-prose text-sm text-muted-ink">
        Aún no has invitado empleados. Usa el formulario de arriba para enviar tu primera invitación.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {empleados.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Progreso del curso</TableHead>
              <TableHead>Examen</TableHead>
              <TableHead>Certificación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empleados.map((empleado) => (
              <TableRow key={empleado.userId}>
                <TableCell>
                  <p className="font-bold text-ink">{empleado.nombre ?? empleado.email ?? "Sin nombre"}</p>
                  {empleado.email && <p className="text-sm text-muted-ink">{empleado.email}</p>}
                </TableCell>
                <TableCell className="min-w-48">
                  <Progress
                    value={empleado.modulosCompletados}
                    max={empleado.modulosTotal}
                    label={`${empleado.porcentajeModulos}% de módulos completados`}
                  />
                  <p className="mt-1 text-xs text-muted-ink">
                    {empleado.modulosCompletados} de {empleado.modulosTotal} módulos ({empleado.porcentajeModulos}%)
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={empleado.examenAprobado ? "ok" : "neutral"}>
                    {empleado.examenAprobado ? "Aprobado" : "Pendiente"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {empleado.certificado ? (
                    <Badge variant="ok">Certificado{empleado.folio ? ` · ${empleado.folio}` : ""}</Badge>
                  ) : (
                    <Badge variant="neutral">Sin certificar</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {invitacionesPendientes.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-indigo">Invitaciones pendientes</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-ink">
            {invitacionesPendientes.map((invitacion) => (
              <li key={invitacion.email}>
                {invitacion.email} — expira el {dateFormat.format(new Date(invitacion.expiraEn))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
