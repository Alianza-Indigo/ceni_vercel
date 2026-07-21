"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createApplication } from "@/app/panel/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ORG_SCOPE_LABEL } from "@/lib/site-display";

interface SiteOption {
  id: string;
  name: string;
  city: string;
  state: string;
}

export function NewApplicationForm({ sites }: { sites: SiteOption[] }) {
  const router = useRouter();
  const [line, setLine] = React.useState<"LABORAL" | "ESPACIOS">("LABORAL");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await createApplication({
      line,
      scope: String(form.get("scope") ?? ""),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/panel/expediente/${result.applicationId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 max-w-xl space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo crear la solicitud</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-ink">Línea de certificación</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["LABORAL", "CENI Laboral", "Prácticas de empleo neuroinclusivas"],
              ["ESPACIOS", "CENI Espacios", "Espacios físicos y de servicio"],
            ] as const
          ).map(([value, title, detail]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-[:checked]:border-indigo has-[:checked]:bg-surface"
            >
              <input
                type="radio"
                name="line"
                value={value}
                checked={line === value}
                onChange={() => setLine(value)}
                className="mt-1 size-5 accent-[var(--ceni-indigo)]"
              />
              <span>
                <span className="font-bold text-indigo">{title}</span>
                <br />
                <span className="text-sm text-muted-ink">{detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="scope">Alcance del expediente</Label>
        <Select id="scope" name="scope" required defaultValue={sites[0]?.id ?? ""}
          aria-describedby="scope-hint">
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name} — {site.city}, {site.state}
            </option>
          ))}
          {line === "LABORAL" && <option value="ORG">{ORG_SCOPE_LABEL}</option>}
        </Select>
        <p id="scope-hint" className="text-sm text-muted-ink">
          {line === "ESPACIOS"
            ? "CENI Espacios evalúa las condiciones físicas de un lugar concreto, así que el expediente apunta a un establecimiento."
            : "CENI Laboral puede evaluar un centro de trabajo específico o las prácticas de toda la organización."}
        </p>
      </div>

      <Button type="submit" disabled={busy}>
        {busy ? "Creando expediente…" : "Crear expediente"}
      </Button>
      <p className="max-w-prose text-sm text-muted-ink">
        Solo puede existir un expediente en proceso por línea y alcance. Los costos
        son informativos y están publicados en Proceso y costos.
      </p>
    </form>
  );
}
