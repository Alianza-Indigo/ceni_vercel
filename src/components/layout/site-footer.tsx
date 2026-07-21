import Link from "next/link";
import Image from "next/image";
import { Globe, Mail, MessageCircle, Share2 } from "lucide-react";

const footerGroups = [
  {
    title: "Navegación",
    links: [
      { href: "/", label: "Inicio" },
      { href: "/#mapa", label: "Mapa" },
      { href: "/#empresas", label: "Empresas" },
      { href: "/#que-es-ceni", label: "¿Qué es CENI?" },
    ],
  },
  {
    title: "Beneficios",
    links: [
      { href: "/#beneficios", label: "Beneficios" },
      { href: "/proceso", label: "Niveles CENI" },
      { href: "/proceso", label: "Proceso de certificación" },
      { href: "/verificar", label: "Verificar certificado" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { href: "/principios", label: "Guías y herramientas" },
      { href: "/proceso", label: "Blog" },
      { href: "/directorio", label: "Alianzas" },
      { href: "/registro", label: "Eventos" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="no-print bg-[#030823] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1.25fr_2fr_1.3fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white p-1.5">
              <Image
                src="/assets/logo-alianza.png"
                alt=""
                width={58}
                height={58}
                className="h-full w-full object-contain"
              />
            </span>
            <div>
              <p className="text-4xl font-black leading-none">CENI</p>
              <p className="max-w-[11rem] text-[10px] font-black uppercase leading-tight text-white/75">
                Certificación de entornos neuroinclusivos
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            Certificación de Entornos Neuroinclusivos. Una red nacional para
            construir organizaciones donde todas las mentes pertenecen.
          </p>
        </div>

        <div className="grid gap-7 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-xs font-black uppercase tracking-wide text-[#cdb7ff]">
                {group.title}
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.href}-${link.label}`}>
                    <Link href={link.href} className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-wide text-[#cdb7ff]">
            Síguenos
          </h2>
          <div className="mt-3 flex gap-3">
            {[Globe, Mail, MessageCircle, Share2].map((Icon, index) => (
              <span
                key={index}
                className="grid h-10 w-10 place-items-center rounded-full bg-[#4b18a8] text-white"
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-white/70">Sé parte del movimiento #RedCENI</p>

          <form className="mt-6">
            <label htmlFor="footer-email" className="text-xs font-black uppercase tracking-wide text-white">
              Recibe noticias y actualizaciones
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="Tu correo electrónico"
              className="mt-3 min-h-11 w-full rounded-lg border border-white/10 bg-white px-4 text-sm text-[#070b2f]"
            />
            <button
              type="button"
              className="mt-3 min-h-11 w-full rounded-lg bg-[#5b28b7] text-sm font-black uppercase text-white hover:bg-[#4b18a8]"
            >
              Suscribirme
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CENI · Certificación de Entornos Neuroinclusivos.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacidad" className="hover:text-white">
              Aviso de privacidad
            </Link>
            <Link href="/privacidad" className="hover:text-white">
              Términos y condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
