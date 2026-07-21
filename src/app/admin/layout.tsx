import Link from "next/link";

/* Same subnav, same order, on every admin view. */
const ADMIN_NAV = [
  { href: "/admin", label: "Tablero" },
  { href: "/admin/expedientes", label: "Expedientes" },
  { href: "/admin/registro", label: "Registro Nacional" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/bitacora", label: "Bitácora" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav aria-label="Secciones de administración" className="no-print mb-6">
        <ul className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1.5">
          {ADMIN_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-bold text-indigo hover:bg-background"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
