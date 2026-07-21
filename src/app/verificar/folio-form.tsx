"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { isValidFolio } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function FolioForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = String(new FormData(event.currentTarget).get("folio") ?? "");
    const folio = raw.trim().toUpperCase();
    if (!isValidFolio(folio)) {
      setError(
        "Qué pasó: el folio no tiene el formato esperado. Cómo corregirlo: usa el formato CENI-L-AAAA-0000 o CENI-E-AAAA-0000, por ejemplo CENI-L-2026-0001.",
      );
      return;
    }
    setError(null);
    router.push(`/verificar/${folio}`);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 max-w-md space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Folio no válido</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="folio">Folio del certificado</Label>
        <Input
          id="folio"
          name="folio"
          inputMode="text"
          autoComplete="off"
          placeholder="CENI-L-2026-0001"
          aria-describedby="folio-hint"
          aria-invalid={error ? true : undefined}
          required
        />
        <p id="folio-hint" className="text-sm text-muted-ink">
          Letras y números, con guiones. La letra central es L (Laboral) o E (Espacios).
        </p>
      </div>
      <Button type="submit">Verificar folio</Button>
    </form>
  );
}
