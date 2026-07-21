"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { advanceStage, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Stage transition with mandatory note; the deadline clock restarts. */
export function StageTransition({
  applicationId,
  currentLabel,
  nextLabel,
}: {
  applicationId: string;
  currentLabel: string;
  nextLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ActionResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const note = String(new FormData(event.currentTarget).get("note") ?? "");
    const response = await advanceStage({ applicationId, note });
    setResult(response);
    setBusy(false);
    if (response.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Pasar a la siguiente etapa: {nextLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transitar etapa</DialogTitle>
          <DialogDescription>
            El expediente pasará de «{currentLabel}» a «{nextLabel}». La fecha de
            entrada a etapa se reinicia y la acción queda en bitácora. No se pueden
            saltar etapas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {result && !result.ok && (
            <p role="alert" className="rounded-lg bg-status-bad/10 p-3 text-sm font-bold text-status-bad">
              {result.error}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="note">Nota obligatoria (visible para la organización)</Label>
            <Textarea id="note" name="note" required minLength={5} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Guardando…" : `Confirmar paso a ${nextLabel}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
