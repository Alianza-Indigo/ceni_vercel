import type { Metadata } from "next";
import { Suspense } from "react";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Entrar" }]} />
      <PageInfo>
        Esta página tiene un formulario para entrar a tu cuenta con correo y
        contraseña. Si tu organización aún no tiene cuenta, hay un enlace para
        registrarla. No hay límite de tiempo para llenar el formulario.
      </PageInfo>
      <h1 className="text-3xl font-bold text-indigo">Entrar</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
