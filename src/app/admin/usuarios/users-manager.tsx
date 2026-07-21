"use client";

import * as React from "react";
import type { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
  createAdminUser,
  resetOrgPassword,
  type ActionResult,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserView {
  id: string;
  email: string;
  role: Role;
  orgName: string | null;
}

export function UsersManager({ users }: { users: UserView[] }) {
  const router = useRouter();
  const [createResult, setCreateResult] = React.useState<ActionResult | null>(null);
  const [resetTarget, setResetTarget] = React.useState<UserView | null>(null);
  const [resetResult, setResetResult] = React.useState<ActionResult | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    const form = new FormData(formElement);
    const response = await createAdminUser({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setCreateResult(response);
    setBusy(false);
    if (response.ok) {
      formElement.reset();
      router.refresh();
    }
  }

  async function onReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetTarget) return;
    setBusy(true);
    const response = await resetOrgPassword({
      userId: resetTarget.id,
      password: String(new FormData(event.currentTarget).get("password") ?? ""),
    });
    setResetResult(response);
    setBusy(false);
    if (response.ok) {
      setResetTarget(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-5"
      >
        <h2 className="text-lg font-bold text-indigo">Crear cuenta ADMIN</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-admin-email">Correo electrónico</Label>
            <Input id="new-admin-email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-admin-password">Contraseña (mínimo 10 caracteres)</Label>
            <Input id="new-admin-password" name="password" type="password" required minLength={10} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Creando…" : "Crear cuenta ADMIN"}
          </Button>
          {createResult && (
            <p role="status" className="text-sm font-bold text-muted-ink">
              {createResult.ok ? `✓ ${createResult.message}` : createResult.error}
            </p>
          )}
        </div>
      </form>

      <div>
        <h2 className="text-lg font-bold text-indigo">Cuentas registradas</h2>
        {resetResult?.ok && (
          <p role="status" className="mt-2 rounded-lg bg-status-ok/10 p-3 text-sm font-bold text-status-ok">
            ✓ {resetResult.message}
          </p>
        )}
        <div className="mt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Organización</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-bold">{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.orgName ?? "—"}</TableCell>
                  <TableCell>
                    {user.role === "ORG" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setResetResult(null);
                          setResetTarget(user);
                        }}
                      >
                        Restablecer contraseña
                        <span className="sr-only"> de {user.email}</span>
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          {resetTarget && (
            <>
              <DialogHeader>
                <DialogTitle>Restablecer contraseña</DialogTitle>
                <DialogDescription>
                  Se cambiará la contraseña de {resetTarget.email}. Comunica la nueva
                  contraseña por un canal seguro. La acción queda en bitácora (sin la
                  contraseña).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onReset} className="space-y-4">
                {resetResult && !resetResult.ok && (
                  <p role="alert" className="rounded-lg bg-status-bad/10 p-3 text-sm font-bold text-status-bad">
                    {resetResult.error}
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="reset-password">Nueva contraseña (mínimo 10 caracteres)</Label>
                  <Input id="reset-password" name="password" type="password" required minLength={10} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {busy ? "Guardando…" : "Restablecer"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
