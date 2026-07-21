"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { CertLevel, CertStatus, Line, OrgNetworkStatus } from "@prisma/client";
import {
  CERT_STATUS_LABELS,
  LEVEL_LABELS,
  LINE_LABELS,
  MX_STATES,
  ORG_NETWORK_STATUS_LABELS,
} from "@/lib/domain";
import { LevelBadge } from "@/components/cert/level-badge";
import { StatusBadge } from "@/components/cert/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DirectoryMap = dynamic(
  () => import("./directory-map").then((m) => m.DirectoryMap),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="flex h-[480px] items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted-ink"
      >
        Cargando el mapa...
      </div>
    ),
  },
);

export interface DirectoryEntry {
  id: string;
  category: "CERTIFICADA" | "AFILIADA";
  folio: string | null;
  line: Line | null;
  level: CertLevel | null;
  status: CertStatus | OrgNetworkStatus;
  expiresAt: string | null;
  orgId: string;
  name: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function DirectoryExplorer({ entries }: { entries: DirectoryEntry[] }) {
  const [view, setView] = React.useState<"lista" | "mapa">("lista");
  const [search, setSearch] = React.useState("");
  const [line, setLine] = React.useState<"" | Line>("");
  const [level, setLevel] = React.useState<"" | CertLevel>("");
  const [state, setState] = React.useState("");
  const [status, setStatus] = React.useState<
    "" | "AFILIADA" | "VIGENTE" | "SUSPENDIDA"
  >("");

  const filtered = entries.filter((entry) => {
    if (line && entry.line !== line) return false;
    if (level && entry.level !== level) return false;
    if (state && entry.state !== state) return false;
    if (
      status === "VIGENTE" &&
      !(entry.status === "VIGENTE" || entry.status === "POR_VENCER")
    ) {
      return false;
    }
    if (status === "SUSPENDIDA" && entry.status !== "SUSPENDIDA") return false;
    if (status === "AFILIADA" && entry.status !== "AFILIADA") return false;
    if (search && !entry.name.toLowerCase().includes(search.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  const statesPresent = [...new Set(entries.map((e) => e.state))];
  const stateOptions = MX_STATES.filter((s) => statesPresent.includes(s));

  return (
    <div>
      <fieldset className="rounded-xl border border-border bg-card p-4">
        <legend className="px-1 text-sm font-bold text-indigo">Filtros</legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="filtro-busqueda">Buscar por nombre</Label>
            <Input
              id="filtro-busqueda"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filtro-linea">Linea</Label>
            <Select
              id="filtro-linea"
              value={line}
              onChange={(e) => setLine(e.target.value as "" | Line)}
            >
              <option value="">Todas</option>
              <option value="LABORAL">{LINE_LABELS.LABORAL}</option>
              <option value="ESPACIOS">{LINE_LABELS.ESPACIOS}</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filtro-nivel">Nivel</Label>
            <Select
              id="filtro-nivel"
              value={level}
              onChange={(e) => setLevel(e.target.value as "" | CertLevel)}
            >
              <option value="">Todos</option>
              <option value="BRONCE">Bronce</option>
              <option value="PLATA">Plata</option>
              <option value="ORO">Oro</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filtro-estado">Estado de la republica</Label>
            <Select
              id="filtro-estado"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Todos</option>
              {stateOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filtro-estatus">Estatus</Label>
            <Select
              id="filtro-estatus"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "" | "AFILIADA" | "VIGENTE" | "SUSPENDIDA")
              }
            >
              <option value="">Todos</option>
              <option value="AFILIADA">Afiliada</option>
              <option value="VIGENTE">Vigente (incluye por vencer)</option>
              <option value="SUSPENDIDA">Suspendida</option>
            </Select>
          </div>
        </div>
      </fieldset>

      <div
        role="group"
        aria-label="Cambiar entre vista de lista y de mapa"
        className="mt-4 inline-flex rounded-lg bg-surface p-1"
      >
        {(["lista", "mapa"] as const).map((v) => (
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
            {v === "lista" ? "Lista" : "Mapa"}
          </button>
        ))}
      </div>

      <p role="status" className="mt-3 text-sm text-muted-ink">
        {filtered.length === 1
          ? "1 resultado con los filtros actuales."
          : `${filtered.length} resultados con los filtros actuales.`}
      </p>

      {view === "mapa" ? (
        <div className="mt-3">
          <DirectoryMap entries={filtered} />
        </div>
      ) : null}

      <ul className={cn("mt-4 grid gap-4", view === "lista" ? "md:grid-cols-2" : "")}>
        {filtered.map((entry) => (
          <li key={entry.id}>
            <article className="flex h-full gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              {entry.level ? (
                <LevelBadge level={entry.level} size={56} />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-indigo/30 bg-surface text-xs font-bold text-indigo">
                  Red
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-bold text-indigo">{entry.name}</h2>
                <p className="text-sm text-muted-ink">
                  {entry.city}, {entry.state}
                </p>
                <p className="mt-1 text-sm">
                  {entry.category === "AFILIADA"
                    ? "Red CENI - Organizacion afiliada"
                    : `${LINE_LABELS[entry.line!]} - Nivel ${LEVEL_LABELS[entry.level!]}`}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  {entry.category === "AFILIADA" ? (
                    <>
                      <span className="inline-flex min-h-7 items-center rounded-full bg-surface px-3 text-xs font-bold text-indigo">
                        {ORG_NETWORK_STATUS_LABELS[entry.status as OrgNetworkStatus]}
                      </span>
                      <span className="text-muted-ink">
                        Sin certificado emitido todavia
                      </span>
                    </>
                  ) : (
                    <>
                      <StatusBadge status={entry.status as CertStatus} />
                      <span className="text-muted-ink">
                        {entry.status === "SUSPENDIDA"
                          ? `Estatus: ${CERT_STATUS_LABELS.SUSPENDIDA}`
                          : `Vence el ${dateFormat.format(new Date(entry.expiresAt!))}`}
                      </span>
                    </>
                  )}
                </div>
                {entry.folio && (
                  <p className="mt-2 text-sm">
                    <Link
                      href={`/verificar/${entry.folio}`}
                      className="font-bold text-indigo underline underline-offset-4"
                    >
                      Verificar folio {entry.folio}
                    </Link>
                  </p>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-8 text-center">
          <Image
            src="/assets/empty-search.svg"
            alt=""
            width={240}
            height={160}
            className="decorative-illustration mx-auto"
          />
          <h2 className="mt-4 text-lg font-bold text-ink">
            No hay resultados con los filtros actuales
          </h2>
          <p className="mx-auto mt-2 max-w-prose text-sm text-muted-ink">
            Quita algun filtro o borra la busqueda para ver mas organizaciones.
          </p>
        </div>
      )}
    </div>
  );
}
