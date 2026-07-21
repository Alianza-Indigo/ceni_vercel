"use client";

import * as React from "react";
import Link from "next/link";
import type { FileStatus, Line, Stage } from "@prisma/client";
import { LINE_LABELS, STAGE_LABELS, STAGE_ORDER } from "@/lib/domain";
import { DeadlineChip } from "@/components/application/deadline-chip";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface ApplicationRow {
  id: string;
  org: string;
  scope: string;
  place: string;
  line: Line;
  stage: Stage;
  status: FileStatus;
  isRenewal: boolean;
  stageEnteredAt: string;
  hasAssessment: boolean;
  folio: string | null;
}

const STATUS_LABELS: Record<FileStatus, string> = {
  EN_PROCESO: "En proceso",
  PLAN_DE_MEJORA: "Plan de Mejora",
  CERTIFICADO: "Certificado",
  RECHAZADO: "Rechazado",
};

export function ApplicationsBoard({ rows }: { rows: ApplicationRow[] }) {
  const [view, setView] = React.useState<"tabla" | "kanban">("tabla");
  const [line, setLine] = React.useState<"" | Line>("");
  const [stage, setStage] = React.useState<"" | Stage>("");
  const [status, setStatus] = React.useState<"" | FileStatus>("EN_PROCESO");

  const filtered = rows.filter(
    (row) =>
      (!line || row.line === line) &&
      (!stage || row.stage === stage) &&
      (!status || row.status === status),
  );

  return (
    <div>
      <fieldset className="rounded-xl border border-border bg-card p-4">
        <legend className="px-1 text-sm font-bold text-indigo">Filtros</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="f-linea">Línea</Label>
            <Select id="f-linea" value={line} onChange={(e) => setLine(e.target.value as "" | Line)}>
              <option value="">Todas</option>
              <option value="LABORAL">{LINE_LABELS.LABORAL}</option>
              <option value="ESPACIOS">{LINE_LABELS.ESPACIOS}</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-etapa">Etapa</Label>
            <Select id="f-etapa" value={stage} onChange={(e) => setStage(e.target.value as "" | Stage)}>
              <option value="">Todas</option>
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-status">Estado del expediente</Label>
            <Select
              id="f-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "" | FileStatus)}
            >
              <option value="">Todos</option>
              {(Object.keys(STATUS_LABELS) as FileStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </fieldset>

      <div
        role="group"
        aria-label="Cambiar entre vista de tabla y kanban"
        className="mt-4 inline-flex rounded-lg bg-surface p-1"
      >
        {(["tabla", "kanban"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-5 py-2 text-sm font-bold",
              view === v ? "bg-background text-indigo shadow-sm" : "text-muted-ink",
            )}
          >
            {v === "tabla" ? "Tabla" : "Kanban"}
          </button>
        ))}
      </div>

      <p role="status" className="mt-3 text-sm text-muted-ink">
        {filtered.length} expediente(s) con los filtros actuales.
      </p>

      {view === "tabla" ? (
        <div className="mt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organización</TableHead>
                <TableHead>Línea</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Plazo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="font-bold text-ink">{row.org}</span>
                    <br />
                    <span className="text-xs text-muted-ink">
                      {row.scope} · {row.place}
                    </span>
                  </TableCell>
                  <TableCell>
                    {LINE_LABELS[row.line]}
                    {row.isRenewal ? " · Renovación" : ""}
                  </TableCell>
                  <TableCell>{STAGE_LABELS[row.stage]}</TableCell>
                  <TableCell>
                    {row.status === "EN_PROCESO" ? (
                      <DeadlineChip
                        stage={row.stage}
                        stageEnteredAt={new Date(row.stageEnteredAt)}
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{STATUS_LABELS[row.status]}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/expedientes/${row.id}`}
                      className="font-bold text-indigo underline underline-offset-4"
                    >
                      Abrir<span className="sr-only"> expediente de {row.org}</span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {STAGE_ORDER.map((s) => {
            const items = filtered.filter((row) => row.stage === s);
            return (
              <section
                key={s}
                aria-label={`${STAGE_LABELS[s]} (${items.length})`}
                className="rounded-xl border border-border bg-surface p-3"
              >
                <h3 className="text-sm font-bold text-indigo">
                  {STAGE_LABELS[s]} ({items.length})
                </h3>
                <ul className="mt-2 space-y-2">
                  {items.map((row) => (
                    <li key={row.id} className="rounded-lg border border-border bg-card p-3">
                      <Link
                        href={`/admin/expedientes/${row.id}`}
                        className="font-bold text-indigo underline underline-offset-4"
                      >
                        {row.org}
                      </Link>
                      <p className="mt-1 text-xs text-muted-ink">
                        {LINE_LABELS[row.line]}
                        {row.isRenewal ? " · Renovación" : ""} · {row.scope}
                      </p>
                      {row.status === "EN_PROCESO" && (
                        <p className="mt-2">
                          <DeadlineChip
                            stage={row.stage}
                            stageEnteredAt={new Date(row.stageEnteredAt)}
                          />
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
