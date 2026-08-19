"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { inviteEmployee } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function InviteEmployeeForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError(null);
    setOk(false);

    const data = new FormData(form);
    const result = await inviteEmployee({ email: String(data.get("email") ?? "") });

    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk(true);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1 space-y-1.5">
          <Label htmlFor="email">Correo del empleado</Label>
          <Input id="email" name="email" type="email" required placeholder="empleado@empresa.com" />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Enviando…" : "Invitar"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {ok && (
        <Alert variant="success">
          <AlertDescription>Invitación enviada. Aparecerá abajo en cuanto la acepte.</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
