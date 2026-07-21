"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });
    setSubmitting(false);
    if (result?.error) {
      setError(
        "No pudimos iniciar sesión. Qué pasó: el correo o la contraseña no coinciden con una cuenta. Cómo corregirlo: revisa que ambos estén bien escritos e inténtalo de nuevo.",
      );
      return;
    }
    const from = searchParams.get("desde");
    router.push(from && from.startsWith("/") ? from : "/panel");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>No fue posible entrar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={error ? true : undefined}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={error ? true : undefined}
        />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-sm text-muted-ink">
        ¿Tu organización aún no tiene cuenta?{" "}
        <Link href="/registro" className="font-bold text-indigo underline underline-offset-4">
          Regístrala aquí
        </Link>
        .
      </p>
    </form>
  );
}
