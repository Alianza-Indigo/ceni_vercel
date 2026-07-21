"use client";

import * as React from "react";
import Link from "next/link";
import type { CertLevel, CertStatus, Line } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
  changeCertificationStatus,
  type ActionResult,
} from "@/app/admin/actions";
import { LEVEL_LABELS, LINE_LABELS, STATUS_CHANGE_CAUSES } from "@/lib/domain";
import { StatusBadge } from "@/components/cert/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface RegistryRow {
  id: string;
  folio: string;
  org: string;
  place: string;
  line: Line;
  level: CertLevel;
  storedStatus: CertStatus;
  effectiveStatus: CertStatus;
  statusReason: string | null;
  issuedAt: string;
  expiresAt: string;
}

type PendingAction = {
  row: RegistryRow;
  action: "SUSPENDER" | "REACTIVAR" | "RETIRAR";
};

const ACTION_LABELS = {
  SUSPENDER: "Suspender",
  REACTIVAR: "Reactivar",
  RETIRAR: "Retirar",
} as const;

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function RegistryTable({ rows }: { rows: RegistryRow[] }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<PendingAction | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ActionResult | null>(null);

  async function onConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) return;
    setBusy(true);
    const cause = String(new FormData(event.currentTarget).get("cause") ?? "");
    const response = await changeCertificationStatus({
      certificationId: pending.row.id,
      action: pending.action,
      cause: cause || undefined,
    });
    setResult(response);
    setBusy(false);
    if (response.ok) {
      setPending(null);
      router.refresh();
    }
  }

  return (
    <div>
      {result?.ok && (
        <p role="status" className="mb-3 rounded-lg bg-status-ok/10 p-3 text-sm font-bold text-status-ok">
          ✓ {result.message}
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Organización</TableHead>
            <TableHead>Línea / Nivel</TableHead>
            <TableHead>Vigencia</TableHead>
            <TableHead>Estatus</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link
                  href={`/admin/certificados/${row.folio}`}
                  className="font-bold text-indigo underline underline-offset-4"
                >
                  {row.folio}
                </Link>
              </TableCell>
              <TableCell>
                <span className="font-bold">{row.org}</span>
                <br />
                <span className="text-xs text-muted-ink">{row.place}</span>
              </TableCell>
              <TableCell>
                {LINE_LABELS[row.line]}
                <br />
                <span className="text-xs">Nivel {LEVEL_LABELS[row.level]}</span>
              </TableCell>
              <TableCell className="text-xs">
                {dateFormat.format(new Date(row.issuedAt))} –{" "}
                {dateFormat.format(new Date(row.expiresAt))}
              </TableCell>
              <TableCell>
                <StatusBadge status={row.effectiveStatus} />
                {row.statusReason && (
                  <p className="mt-1 text-xs text-muted-ink">{row.statusReason}</p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {row.storedStatus !== "RETIRADA" && row.storedStatus !== "SUSPENDIDA" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setResult(null); setPending({ row, action: "SUSPENDER" }); }}
                    >
                      Suspender<span className="sr-only"> {row.folio}</span>
                    </Button>
                  )}
                  {row.storedStatus === "SUSPENDIDA" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setResult(null); setPending({ row, action: "REACTIVAR" }); }}
                    >
                      Reactivar<span className="sr-only"> {row.folio}</span>
                    </Button>
                  )}
                  {row.storedStatus !== "RETIRADA" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => { setResult(null); setPending({ row, action: "RETIRAR" }); }}
                    >
                      Retirar<span className="sr-only"> {row.folio}</span>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {ACTION_LABELS[pending.action]} {pending.row.folio}
                </DialogTitle>
                <DialogDescription>
                  {pending.action === "REACTIVAR"
                    ? "La certificación volverá a estado Vigente. La acción queda en bitácora."
                    : "La causal es obligatoria. El cambio queda en bitácora y se refleja de inmediato en el directorio y en la verificación pública."}
                  {pending.action === "RETIRAR"
                    ? " El retiro es definitivo: no se puede deshacer."
                    : ""}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onConfirm} className="space-y-4">
                {result && !result.ok && (
                  <p role="alert" className="rounded-lg bg-status-bad/10 p-3 text-sm font-bold text-status-bad">
                    {result.error}
                  </p>
                )}
                {pending.action !== "REACTIVAR" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cause">Causal (catálogo)</Label>
                    <Select id="cause" name="cause" required defaultValue="">
                      <option value="" disabled>
                        Elige una causal
                      </option>
                      {STATUS_CHANGE_CAUSES.map((cause) => (
                        <option key={cause} value={cause}>
                          {cause}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPending(null)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant={pending.action === "RETIRAR" ? "destructive" : "default"}
                    disabled={busy}
                  >
                    {busy ? "Guardando…" : `Confirmar: ${ACTION_LABELS[pending.action].toLowerCase()}`}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
