"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { issueCertificate, type ActionResult } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function IssueCertificate({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ActionResult | null>(null);

  async function onIssue() {
    setBusy(true);
    const response = await issueCertificate(applicationId);
    setResult(response);
    setBusy(false);
    if (response.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="gold">Emitir certificado</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir certificado</DialogTitle>
            <DialogDescription>
              Se generará el folio consecutivo, el código QR y la vigencia según el
              nivel del dictamen. La certificación se publicará de inmediato en el
              directorio. Esta acción queda en bitácora.
            </DialogDescription>
          </DialogHeader>
          {result && !result.ok && (
            <p role="alert" className="rounded-lg bg-status-bad/10 p-3 text-sm font-bold text-status-bad">
              {result.error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={busy} onClick={onIssue}>
              {busy ? "Emitiendo…" : "Confirmar emisión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {result?.ok && (
        <p role="status" className="mt-2 text-sm font-bold text-status-ok">
          ✓ {result.message}
        </p>
      )}
    </div>
  );
}
