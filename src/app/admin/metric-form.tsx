"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateSiteMetric, type ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MetricForm({ currentValue }: { currentValue: number }) {
  const router = useRouter();
  const [result, setResult] = React.useState<ActionResult | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const value = Number(new FormData(event.currentTarget).get("value"));
    const response = await updateSiteMetric({ key: "people_trained", value });
    setResult(response);
    setBusy(false);
    if (response.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex max-w-md flex-wrap items-end gap-3">
      <div className="grow space-y-1.5">
        <Label htmlFor="value">Personas capacitadas (dato manual, se muestra en el inicio)</Label>
        <Input
          id="value"
          name="value"
          type="number"
          min={0}
          step={1}
          defaultValue={currentValue}
          required
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Guardando…" : "Guardar"}
      </Button>
      {result && (
        <p role="status" className="w-full text-sm font-bold text-muted-ink">
          {result.ok ? (result.message ?? "Guardado ✓") : result.error}
        </p>
      )}
    </form>
  );
}
