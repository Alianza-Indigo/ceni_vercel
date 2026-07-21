import Link from "next/link";
import Image from "next/image";
import { Crown, LogIn } from "lucide-react";
import { CalmModeToggle } from "@/components/layout/calm-mode-toggle";
import { MainNav } from "@/components/layout/main-nav";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { auth } from "@/lib/auth";

export async function SiteHeader() {
  const session = await auth();
  const role = session?.user?.role;
  const panelHref = role === "ADMIN" ? "/admin" : role === "ORG" ? "/panel" : null;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-[#eee9f7] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 lg:gap-3">
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center gap-2"
          aria-label="CENI, ir a la página de inicio"
        >
          <Image
            src="/assets/logo-alianza.png"
            alt=""
            width={50}
            height={50}
            priority
            className="h-11 w-11 rounded-xl object-contain lg:h-12 lg:w-12"
          />
          <span className="leading-none">
            <span className="block text-3xl font-black tracking-tight text-[#070b2f]">
              CENI
            </span>
            <span className="hidden max-w-[9rem] text-[8px] font-black uppercase leading-tight text-[#070b2f] sm:block">
              Certificación de entornos neuroinclusivos
            </span>
          </span>
        </Link>

        <div className="flex flex-none xl:min-w-0 xl:flex-1 xl:justify-center">
          <MainNav panelHref={panelHref} isLoggedIn={Boolean(session)} />
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-1.5">
          <div className="hidden 2xl:block">
            <CalmModeToggle />
          </div>
          {panelHref ? (
            <>
              <Link
                href={panelHref}
                className="inline-flex min-h-10 items-center rounded-lg bg-[#4b18a8] px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-[#4b18a8]/20 hover:bg-[#351176]"
              >
                Mi panel
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/entrar"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#5b28b7] bg-white px-2.5 py-1.5 text-[11px] font-black uppercase text-[#4b18a8] hover:bg-[#f5f1ff] lg:px-3"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden lg:inline">Dashboard</span>
                <span className="lg:hidden">Ingresar</span>
              </Link>
              <Link
                href="/registro"
                className="hidden min-h-10 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#3b0f89] to-[#5b28b7] px-3 py-1.5 text-[11px] font-black uppercase text-white shadow-xl shadow-[#4b18a8]/20 hover:from-[#2d0a6a] hover:to-[#4b18a8] xl:inline-flex"
              >
                <Crown className="h-3.5 w-3.5 text-[#dda632]" aria-hidden="true" />
                Membresía
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
