"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerOrganization } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MX_STATES, ORG_SIZE_HEADCOUNT, ORG_SIZE_LABELS } from "@/lib/domain";

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

export function RegistrationForm() {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);

  const errorEntries = Object.entries(errors);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    const input = {
      email: String(form.get("email") ?? ""),
      password,
      legalName: String(form.get("legalName") ?? ""),
      tradeName: String(form.get("tradeName") ?? ""),
      rfc: String(form.get("rfc") ?? ""),
      sector: String(form.get("sector") ?? ""),
      size: String(form.get("size") ?? "PEQUENA"),
      street: String(form.get("street") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      latitude: lat,
      longitude: lng,
      contactName: String(form.get("contactName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      website: String(form.get("website") ?? ""),
      referralCode: String(form.get("referralCode") ?? ""),
      lines: form.getAll("lines").map(String),
    };

    const result = await registerOrganization(input);
    if (!result.ok) {
      setErrors(result.fieldErrors);
      setFormError(result.formError ?? null);
      setSubmitting(false);
      window.scrollTo({ top: 0 });
      return;
    }
    // Sign in with the fresh credentials and land on the dashboard.
    await signIn("credentials", {
      email: input.email,
      password,
      redirect: false,
    });
    router.push("/panel");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-8">
      {formError && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo enviar el registro</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      {errorEntries.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>El formulario tiene {errorEntries.length} campo(s) por corregir</AlertTitle>
          <AlertDescription>
            <ul className="list-disc ps-5">
              {errorEntries.map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <fieldset className="space-y-5 rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-lg font-bold text-indigo">1. Tu cuenta</legend>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required
            aria-describedby="error-email" aria-invalid={errors.email ? true : undefined} />
          <FieldError id="error-email" message={errors.email} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña (mínimo 10 caracteres)</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required
            aria-describedby="error-password" aria-invalid={errors.password ? true : undefined} />
          <FieldError id="error-password" message={errors.password} />
        </div>
      </fieldset>

      <fieldset className="space-y-5 rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-lg font-bold text-indigo">2. Tu organización</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="legalName">Razón social</Label>
            <Input id="legalName" name="legalName" required
              aria-describedby="error-legalName" aria-invalid={errors.legalName ? true : undefined} />
            <FieldError id="error-legalName" message={errors.legalName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tradeName">Nombre comercial</Label>
            <Input id="tradeName" name="tradeName" required
              aria-describedby="error-tradeName" aria-invalid={errors.tradeName ? true : undefined} />
            <FieldError id="error-tradeName" message={errors.tradeName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rfc">RFC (opcional)</Label>
            <Input id="rfc" name="rfc" aria-describedby="error-rfc"
              aria-invalid={errors.rfc ? true : undefined} />
            <FieldError id="error-rfc" message={errors.rfc} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sector">Sector o giro</Label>
            <Input id="sector" name="sector" required
              aria-describedby="error-sector" aria-invalid={errors.sector ? true : undefined} />
            <FieldError id="error-sector" message={errors.sector} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="size">Tamaño (por número de personas)</Label>
            <Select id="size" name="size" required>
              {(Object.keys(ORG_SIZE_LABELS) as (keyof typeof ORG_SIZE_LABELS)[]).map(
                (size) => (
                  <option key={size} value={size}>
                    {ORG_SIZE_LABELS[size]} — {ORG_SIZE_HEADCOUNT[size]}
                  </option>
                ),
              )}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactName">Persona de contacto</Label>
            <Input id="contactName" name="contactName" required
              aria-describedby="error-contactName" aria-invalid={errors.contactName ? true : undefined} />
            <FieldError id="error-contactName" message={errors.contactName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input id="phone" name="phone" type="tel" aria-describedby="error-phone"
              aria-invalid={errors.phone ? true : undefined} />
            <FieldError id="error-phone" message={errors.phone} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="website">Página web (opcional)</Label>
            <Input id="website" name="website" type="url" placeholder="https://"
              aria-describedby="error-website" aria-invalid={errors.website ? true : undefined} />
            <FieldError id="error-website" message={errors.website} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5 rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-lg font-bold text-indigo">3. Ubicación</legend>
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
            <Input
              id="latitude"
              name="latitude"
              inputMode="decimal"
              value={lat ?? ""}
              onChange={(e) => setLat(e.target.value === "" ? null : Number(e.target.value))}
              aria-describedby="error-latitude"
              aria-invalid={errors.latitude ? true : undefined}
            />
            <FieldError id="error-latitude" message={errors.latitude} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="longitude">Longitud</Label>
            <Input
              id="longitude"
              name="longitude"
              inputMode="decimal"
              value={lng ?? ""}
              onChange={(e) => setLng(e.target.value === "" ? null : Number(e.target.value))}
              aria-describedby="error-longitude"
              aria-invalid={errors.longitude ? true : undefined}
            />
            <FieldError id="error-longitude" message={errors.longitude} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-lg font-bold text-indigo">
          4. Línea(s) de certificación
        </legend>
        <FieldError id="error-lines" message={errors.lines} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-[:checked]:border-indigo has-[:checked]:bg-surface">
            <input type="checkbox" name="lines" value="LABORAL" className="mt-1 size-5 accent-[var(--ceni-indigo)]" />
            <span>
              <span className="font-bold text-indigo">CENI Laboral</span>
              <br />
              <span className="text-sm text-muted-ink">Prácticas de empleo neuroinclusivas</span>
            </span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-[:checked]:border-indigo has-[:checked]:bg-surface">
            <input type="checkbox" name="lines" value="ESPACIOS" className="mt-1 size-5 accent-[var(--ceni-indigo)]" />
            <span>
              <span className="font-bold text-indigo">CENI Espacios</span>
              <br />
              <span className="text-sm text-muted-ink">Espacios físicos y de servicio</span>
            </span>
          </label>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="referralCode">Código de embajador (opcional)</Label>
          <Input id="referralCode" name="referralCode"
            aria-describedby="referral-hint error-referralCode" />
          <p id="referral-hint" className="text-sm text-muted-ink">
            Si una persona embajadora de la red CENI te acompañó, escribe aquí su
            código. No afecta la evaluación: quien vende nunca audita.
          </p>
        </div>
      </fieldset>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Creando tu expediente…" : "Registrar organización"}
      </Button>
      <p className="text-sm text-muted-ink">
        Este formulario no tiene límite de tiempo. Al registrarte se crea un expediente
        por cada línea elegida, en etapa de Solicitud.
      </p>
    </form>
  );
}
