"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createSite } from "@/app/panel/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MX_STATES } from "@/lib/domain";

const LocationPicker = dynamic(
  () => import("@/components/map/location-picker").then((m) => m.LocationPicker),
  { ssr: false },
);

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm font-bold text-status-bad">
      {message}
    </p>
  );
}

export function SiteForm() {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const result = await createSite({
      name: String(form.get("name") ?? ""),
      street: String(form.get("street") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      latitude: lat,
      longitude: lng,
    });
    setBusy(false);
    if (!result.ok) {
      setErrors(result.fieldErrors);
      window.scrollTo({ top: 0 });
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  const errorEntries = Object.entries(errors);

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
      {errorEntries.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>
            El formulario tiene {errorEntries.length} campo(s) por corregir
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc ps-5">
              {errorEntries.map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre del establecimiento</Label>
        <Input id="name" name="name" required placeholder="Sucursal Roma"
          aria-describedby="name-hint error-name" aria-invalid={errors.name ? true : undefined} />
        <p id="name-hint" className="text-sm text-muted-ink">
          Este nombre aparecerá junto al de tu organización en el directorio y en el
          certificado, por ejemplo «Café Luz Cívica · Sucursal Roma».
        </p>
        <FieldError id="error-name" message={errors.name} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="street">Calle y número</Label>
          <Input id="street" name="street" required
            aria-describedby="error-street" aria-invalid={errors.street ? true : undefined} />
          <FieldError id="error-street" message={errors.street} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Ciudad o municipio</Label>
          <Input id="city" name="city" required
            aria-describedby="error-city" aria-invalid={errors.city ? true : undefined} />
          <FieldError id="error-city" message={errors.city} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">Estado</Label>
          <Select id="state" name="state" required defaultValue=""
            aria-describedby="error-state" aria-invalid={errors.state ? true : undefined}>
            <option value="" disabled>
              Elige un estado
            </option>
            {MX_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <FieldError id="error-state" message={errors.state} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postalCode">Código postal</Label>
          <Input id="postalCode" name="postalCode" inputMode="numeric" required
            aria-describedby="error-postalCode" aria-invalid={errors.postalCode ? true : undefined} />
          <FieldError id="error-postalCode" message={errors.postalCode} />
        </div>
      </div>

      <LocationPicker latitude={lat} longitude={lng} onChange={(a, b) => { setLat(a); setLng(b); }} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="latitude">Latitud</Label>
          <Input id="latitude" name="latitude" inputMode="decimal"
            value={lat ?? ""}
            onChange={(e) => setLat(e.target.value === "" ? null : Number(e.target.value))}
            aria-describedby="error-latitude" aria-invalid={errors.latitude ? true : undefined} />
          <FieldError id="error-latitude" message={errors.latitude} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="longitude">Longitud</Label>
          <Input id="longitude" name="longitude" inputMode="decimal"
            value={lng ?? ""}
            onChange={(e) => setLng(e.target.value === "" ? null : Number(e.target.value))}
            aria-describedby="error-longitude" aria-invalid={errors.longitude ? true : undefined} />
          <FieldError id="error-longitude" message={errors.longitude} />
        </div>
      </div>

      <Button type="submit" disabled={busy}>
        {busy ? "Guardando…" : "Guardar establecimiento"}
      </Button>
    </form>
  );
}
