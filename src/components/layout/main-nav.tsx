"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/#mapa", label: "Mapa" },
  { href: "/#empresas", label: "Empresas" },
  { href: "/#que-es-ceni", label: "¿Qué es CENI?" },
  { href: "/#beneficios", label: "Beneficios" },
  { href: "/proceso", label: "Recursos" },
  { href: "/privacidad", label: "Contacto" },
];

export function MainNav({
  panelHref,
  isLoggedIn,
}: {
  panelHref: string | null;
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const items = [...NAV_ITEMS];
  if (isLoggedIn && panelHref) {
    items.push({ href: panelHref, label: "Mi panel" });
  }

  return (
    <nav aria-label="Navegación principal" className="flex items-center">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[#e7e2f0] px-3 text-[#070b2f] hover:bg-[#f5f1ff] xl:hidden"
        aria-expanded={open}
        aria-controls="menu-principal"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
        {open ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      <ul
        id="menu-principal"
        className={cn(
          "absolute left-0 right-0 top-full flex-col border-b border-[#e7e2f0] bg-white px-4 pb-4 shadow-sm xl:static xl:flex xl:flex-row xl:items-center xl:gap-1 xl:border-0 xl:p-0 xl:shadow-none",
          open ? "flex" : "hidden",
        )}
      >
        {items.map((item) => {
          const hrefPath = item.href.split("#")[0] || "/";
          const active =
            hrefPath === "/"
              ? pathname === "/" && item.href === "/"
              : pathname.startsWith(hrefPath);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 w-full items-center rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide xl:w-auto xl:px-2 2xl:px-3",
                  active
                    ? "text-[#070b2f] underline decoration-[#5b28b7] decoration-2 underline-offset-8"
                    : "text-[#070b2f] hover:bg-[#f5f1ff]",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
