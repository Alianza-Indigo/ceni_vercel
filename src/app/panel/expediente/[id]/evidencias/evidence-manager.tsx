"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteEvidence } from "@/app/panel/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EvidenceView {
  id: string;
  dimension: number;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
}

const dateFormat = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function EvidenceManager({
  applicationId,
  evidences,
  dimensionNames,
  editable,
}: {
  applicationId: string;
  evidences: EvidenceView[];
  dimensionNames: Record<number, string>;
  editable: boolean;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError(
        "Qué pasó: no se eligió ningún archivo. Cómo corregirlo: usa el botón «Elegir archivo» y selecciona un PDF, PNG o JPG.",
      );
      return;
    }
    setBusy(true);
    const response = await fetch(`/api/applications/${applicationId}/evidences`, {
      method: "POST",
      body: form,
    });
    setBusy(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(
        body?.error ??
          "Qué pasó: el archivo no se pudo subir. Cómo corregirlo: revisa tu conexión e inténtalo de nuevo.",
      );
      return;
    }
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function onDelete(id: string) {
    setError(null);
    setBusy(true);
    try {
      await deleteEvidence(id);
      router.refresh();
    } catch {
      setError(
        "Qué pasó: la evidencia no se pudo eliminar. Cómo corregirlo: recarga la página e inténtalo de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  const dimensions = Object.keys(dimensionNames).map(Number).sort((a, b) => a - b);

  return (
    <div className="mt-6 space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Hubo un problema</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {editable ? (
        <form
          onSubmit={onUpload}
          className="space-y-4 rounded-xl border border-border bg-card p-5"
        >
          <h2 className="text-lg font-bold text-indigo">Subir una evidencia</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dimension">Dimensión</Label>
              <Select id="dimension" name="dimension" required>
                {dimensions.map((d) => (
                  <option key={d} value={d}>
                    Dimensión {d}: {dimensionNames[d]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="file">Archivo (PDF, PNG o JPG, máximo 10 MB)</Label>
              <input
                ref={fileRef}
                id="file"
                name="file"
                type="file"
                required
                accept="application/pdf,image/png,image/jpeg"
                className="flex min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm file:me-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-1.5 file:font-bold file:text-indigo"
              />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Subiendo…" : "Subir evidencia"}
          </Button>
        </form>
      ) : (
        <Alert variant="info">
          <AlertTitle>Solo lectura</AlertTitle>
          <AlertDescription>
            El expediente pasó la etapa de Revisión Documental: ya no se pueden subir ni
            eliminar evidencias.
          </AlertDescription>
        </Alert>
      )}

      {dimensions.map((dimension) => {
        const files = evidences.filter((e) => e.dimension === dimension);
        return (
          <section key={dimension} aria-labelledby={`dim-title-${dimension}`}>
            <h2 id={`dim-title-${dimension}`} className="font-bold text-indigo">
              Dimensión {dimension}: {dimensionNames[dimension]}
            </h2>
            {files.length === 0 ? (
              <p className="mt-1 text-sm text-muted-ink">
                Sin evidencias en esta dimensión.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {files.map((evidence) => (
                  <li
                    key={evidence.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <a
                        href={`/api/evidences/${evidence.id}`}
                        className="font-bold text-indigo underline underline-offset-4"
                      >
                        {evidence.fileName}
                      </a>
                      <p className="text-xs text-muted-ink">
                        {formatSize(evidence.sizeBytes)} · subido el{" "}
                        {dateFormat.format(new Date(evidence.uploadedAt))}
                      </p>
                    </div>
                    {editable && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => onDelete(evidence.id)}
                      >
                        Eliminar {evidence.fileName}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
