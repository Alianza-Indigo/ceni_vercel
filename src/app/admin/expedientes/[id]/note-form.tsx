"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { addNote, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NoteForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ActionResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    const note = String(new FormData(formElement).get("note") ?? "");
    const response = await addNote({ applicationId, note });
    setResult(response);
    setBusy(false);
    if (response.ok) {
      formElement.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 max-w-xl space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="new-note">Agregar nota (visible para la organización)</Label>
        <Textarea id="new-note" name="note" required minLength={5} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={busy}>
          {busy ? "Guardando…" : "Agregar nota"}
        </Button>
        {result && (
          <p role="status" className="text-sm font-bold text-muted-ink">
            {result.ok ? "Nota agregada ✓" : result.error}
          </p>
        )}
      </div>
    </form>
  );
}
