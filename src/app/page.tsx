import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Crown,
  GraduationCap,
  HeartHandshake,
  Infinity as InfinityIcon,
  Landmark,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { effectiveCertStatus } from "@/lib/cert-status";
import { scopeDisplayName, scopeLocation } from "@/lib/site-display";
import { DirectoryMap } from "@/components/directory/directory-map";
import type { DirectoryEntry } from "@/components/directory/directory-explorer";

export const dynamic = "force-dynamic";

async function getLandingData() {
  try {
    const [certifications, organizations, peopleTrained] = await Promise.all([
      prisma.certification.findMany({
        where: { status: { in: ["VIGENTE", "POR_VENCER", "SUSPENDIDA"] } },
        include: {
          organization: {
            select: {
              id: true,
              tradeName: true,
              city: true,
              state: true,
              latitude: true,
              longitude: true,
            },
          },
          site: {
            select: {
              name: true,
              city: true,
              state: true,
              isPrimary: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      }),
      prisma.organization.findMany({
        where: { networkStatus: "AFILIADA" },
        select: {
          id: true,
          tradeName: true,
          city: true,
          state: true,
          latitude: true,
          longitude: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.siteMetric.findUnique({ where: { key: "people_trained" } }),
    ]);

    const certifiedOrgIds = new Set(certifications.map((cert) => cert.orgId));
    const certificationEntries: DirectoryEntry[] = certifications
      .map((cert): DirectoryEntry => {
        const org = {
          tradeName: cert.organization.tradeName,
          city: cert.organization.city,
          state: cert.organization.state,
          latitude: cert.organization.latitude ? Number(cert.organization.latitude) : null,
          longitude: cert.organization.longitude ? Number(cert.organization.longitude) : null,
        };
        const site = cert.site
          ? {
              name: cert.site.name,
              city: cert.site.city,
              state: cert.site.state,
              isPrimary: cert.site.isPrimary,
              latitude: cert.site.latitude ? Number(cert.site.latitude) : null,
              longitude: cert.site.longitude ? Number(cert.site.longitude) : null,
            }
          : null;
        const location = scopeLocation(org, site);
        return {
          id: `cert:${cert.id}`,
          category: "CERTIFICADA",
          folio: cert.folio,
          line: cert.line,
          level: cert.level,
          status: effectiveCertStatus(cert.status, cert.expiresAt),
          expiresAt: cert.expiresAt.toISOString(),
          orgId: cert.organization.id,
          name: scopeDisplayName(org, site),
          city: location.city,
          state: location.state,
          latitude: location.latitude,
          longitude: location.longitude,
        };
      })
      .filter((entry) => entry.status !== "VENCIDA");
    const affiliateEntries: DirectoryEntry[] = organizations
      .filter((org) => !certifiedOrgIds.has(org.id))
      .map((org): DirectoryEntry => ({
        id: `org:${org.id}`,
        category: "AFILIADA",
        folio: null,
        line: null,
        level: null,
        status: "AFILIADA",
        expiresAt: null,
        orgId: org.id,
        name: org.tradeName,
        city: org.city,
        state: org.state,
        latitude: org.latitude ? Number(org.latitude) : null,
        longitude: org.longitude ? Number(org.longitude) : null,
      }));
    const entries = [...certificationEntries, ...affiliateEntries].sort((a, b) =>
      a.name.localeCompare(b.name, "es"),
    );
    const networkOrgIds = new Set([
      ...organizations.map((org) => org.id),
      ...certifications.map((cert) => cert.orgId),
    ]);
    const statesWithPresence = new Set(organizations.map((org) => org.state).filter(Boolean));

    return {
      networkOrganizations: networkOrgIds.size,
      certifiedOrganizations: certifiedOrgIds.size,
      statesWithPresence: statesWithPresence.size,
      peopleTrained: peopleTrained?.value ?? 0,
      entries,
    };
  } catch (error) {
    console.error("Landing data unavailable", error);
    return {
      networkOrganizations: 0,
      certifiedOrganizations: 0,
      statesWithPresence: 0,
      peopleTrained: 0,
      entries: [] as DirectoryEntry[],
    };
  }
}

const categoryFilters = [
  { icon: GraduationCap, label: "Educación" },
  { icon: Stethoscope, label: "Salud" },
  { icon: Building2, label: "Empresa" },
  { icon: Landmark, label: "Gobierno" },
  { icon: Sparkles, label: "Tecnología" },
  { icon: MapPin, label: "Servicios" },
  { icon: Store, label: "Comercio" },
  { icon: HeartHandshake, label: "Turismo" },
];

const benefits = [
  {
    icon: Star,
    title: "Prestigio",
    body: "Distintivo que reconoce tu compromiso y liderazgo en neuroinclusión.",
  },
  {
    icon: BadgeCheck,
    title: "Visibilidad",
    body: "Aparece en el directorio nacional CENI y destaca tu impacto.",
  },
  {
    icon: GraduationCap,
    title: "Capacitación",
    body: "Accede a formación especializada y recursos exclusivos.",
  },
  {
    icon: HeartHandshake,
    title: "Comunidad",
    body: "Conecta con organizaciones líderes y sé parte del cambio nacional.",
  },
];

const certificationPrinciples = [
  {
    icon: Users,
    title: "De neurodivergente para neurodivergentes",
    body: "El estándar nace de experiencia vivida, no de observar a la comunidad desde fuera.",
  },
  {
    icon: Shield,
    title: "Auditoría independiente",
    body: "La red que capacita y acompaña no audita a la misma organización. El dictamen lo emite CENI Central.",
  },
  {
    icon: BadgeCheck,
    title: "Cumplimiento verificable",
    body: "Cada certificación exige evidencia, folio, vigencia, trazabilidad y posibilidad real de suspensión o revocación.",
  },
];

const certificationPath = [
  {
    icon: Building2,
    title: "Afiliada",
    body: "Entra a la red, aparece en el directorio y comienza su ruta de formación.",
  },
  {
    icon: Sparkles,
    title: "Candidata",
    body: "Integra evidencia, prepara ajustes y solicita evaluación formal.",
  },
  {
    icon: Crown,
    title: "Certificada",
    body: "Obtiene nivel Bronce, Plata u Oro después de auditoría y dictamen.",
  },
];

const featured = [
  { name: "Tecnológico de Monterrey", sector: "Educación", city: "Monterrey, N.L." },
  { name: "Hospital Ángeles", sector: "Salud", city: "Ciudad de México" },
  { name: "BBVA", sector: "Finanzas", city: "Ciudad de México" },
  { name: "DHL", sector: "Logística", city: "Guadalajara, Jal." },
  { name: "Grupo Bimbo", sector: "Alimentos", city: "Estado de México" },
];

export default async function HomePage() {
  const data = await getLandingData();
  const peopleLabel =
    data.peopleTrained > 0
      ? `+${data.peopleTrained.toLocaleString("es-MX")}`
      : "+250,000";
  const certifiedLabel =
    data.certifiedOrganizations > 0 ? `${data.certifiedOrganizations}` : "1";
  const networkLabel =
    data.networkOrganizations > 0 ? `${data.networkOrganizations}+` : "128+";
  const statesLabel =
    data.statesWithPresence > 0 ? `${data.statesWithPresence}` : "24";

  return (
    <main className="bg-white text-[#070b2f]">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_20%,rgba(89,38,177,0.16),transparent_28%),linear-gradient(90deg,#ffffff_0%,#ffffff_31%,rgba(255,255,255,0.88)_43%,rgba(255,255,255,0)_64%)]" />
        <div className="absolute right-0 top-0 -z-20 h-full w-[70%]">
          <Image
            src="/assets/landing-hero-team.png"
            alt="Equipo diverso colaborando en una organización neuroinclusiva"
            fill
            priority
            sizes="(min-width: 1024px) 70vw, 100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="mx-auto grid min-h-[560px] max-w-7xl items-center px-4 pb-20 pt-12 lg:grid-cols-[0.46fr_0.54fr] lg:pt-16">
          <div className="relative z-10 max-w-xl">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#5b28b7]">
              <span className="h-3 w-3 rounded-full bg-[#e4ad2f]" />
              Red Nacional CENI
            </p>
            <h1 className="mt-3 font-serif text-[clamp(3.25rem,8vw,6.7rem)] font-black leading-[0.87] tracking-normal text-[#070b2f]">
              NO necesitas
              <span className="block text-[#5a25b7]">PARECER</span>
              <span className="block">
                para <span className="text-[#dda632]">SER</span>
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-[#20234a]">
              Certificación elite de entornos neuroinclusivos, creada desde la
              experiencia neurodivergente. No vendemos intención: verificamos
              cumplimiento real.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/directorio"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#4b18a8] px-7 text-sm font-black uppercase text-white shadow-xl shadow-[#4b18a8]/25 hover:bg-[#351176]"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Explorar el mapa
              </Link>
              <Link
                href="/directorio"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-[#6d48c4] bg-white/90 px-7 text-sm font-black uppercase text-[#4b18a8] hover:bg-[#f5f1ff]"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Buscar organizaciones
              </Link>
            </div>
          </div>
          <div className="relative hidden min-h-[430px] lg:block">
            <div className="absolute bottom-14 right-4 flex max-w-sm items-center gap-4 rounded-[1.8rem] border border-[#dda632] bg-[#071034]/86 px-6 py-4 text-white shadow-2xl backdrop-blur">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#dda632] text-[#dda632]">
                <Crown className="h-9 w-9" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/80">
                  Formamos parte del cambio.
                </p>
                <p className="text-xl font-black">
                  ¿Y tu <span className="text-[#dda632]">organización</span>?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-14 px-4" aria-label="Indicadores CENI">
        <dl className="mx-auto grid max-w-7xl gap-0 overflow-hidden rounded-2xl border border-[#e8e4f2] bg-white shadow-2xl shadow-[#140a35]/10 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: Building2, value: networkLabel, label: "Organizaciones afiliadas" },
            { icon: MapPin, value: statesLabel, label: "Estados con presencia" },
            { icon: Users, value: peopleLabel, label: "Personas impactadas" },
            { icon: BadgeCheck, value: certifiedLabel, label: "Red nacional en expansión" },
            { icon: InfinityIcon, value: "1 misión", label: "Un México neuroinclusivo" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-5 border-[#ddd8ea] p-6 lg:border-r last:lg:border-r-0">
              <Icon className="h-11 w-11 shrink-0 text-[#5722b0]" aria-hidden="true" />
              <div>
                <dt className="text-xs font-black uppercase leading-tight text-[#070b2f]">{label}</dt>
                <dd className="text-4xl font-black leading-none text-[#5722b0]">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section id="mapa" className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.42fr_0.58fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-[#5b28b7]">Mapa de entornos</p>
          <h2 className="mt-1 text-4xl font-black uppercase leading-tight text-[#070b2f]">
            Neuroinclusivos
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#20234a]">
            Explora organizaciones afiliadas y certificadas en todo México y descubre
            espacios comprometidos con la inclusión, el respeto y el talento neurodivergente.
          </p>

          <div className="mt-6 max-w-md rounded-xl border border-[#e3dfef] bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-[#817a9b]">
              <Search className="h-4 w-4 text-[#5b28b7]" aria-hidden="true" />
              Buscar por nombre, ciudad o empresa...
            </div>
          </div>

          <div className="mt-4 flex max-w-xl flex-wrap gap-2">
            {["Estado", "Categoría", "Tipo de organización", "Nivel CENI"].map((filter) => (
              <span
                key={filter}
                className="inline-flex min-h-10 items-center rounded-lg border border-[#e3dfef] bg-white px-4 text-xs font-bold text-[#070b2f]"
              >
                {filter}
              </span>
            ))}
          </div>

          <div className="mt-4 flex max-w-xl flex-wrap gap-2">
            {categoryFilters.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#e3dfef] bg-white px-3 text-xs font-bold text-[#4b18a8]"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
          <Link href="/directorio" className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase text-[#5b28b7]">
            Limpiar filtros <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-[#e3dfef] bg-white p-3 shadow-2xl shadow-[#140a35]/10">
          <div className="overflow-hidden rounded-[1.4rem] [&_.maplibregl-ctrl-bottom-left]:hidden [&_.maplibregl-ctrl-bottom-right]:hidden">
            <DirectoryMap entries={data.entries} />
          </div>
        </div>
      </section>

      <section id="estandar" className="px-4 pb-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-[#e5def4] bg-[#fbfaff] shadow-xl shadow-[#140a35]/10">
          <div className="grid lg:grid-cols-[0.38fr_0.62fr]">
            <div className="bg-[linear-gradient(150deg,#070b2f,#2b1163_62%,#4b18a8)] p-8 text-white">
              <p className="text-sm font-black uppercase tracking-wide text-[#dda632]">
                Estándar CENI
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase leading-tight">
                Una certificación seria, selectiva y verificable
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/82">
                CENI no es un distintivo de intención. Es una certificación de
                cumplimiento, construida por una comunidad neurodivergente para
                proteger a personas neurodivergentes.
              </p>
              <p className="mt-5 border-l-2 border-[#dda632] pl-4 text-sm font-bold leading-relaxed text-white">
                No somos objeto de inclusión. Somos autores del estándar.
              </p>
            </div>

            <div className="grid gap-0 sm:grid-cols-3">
              {certificationPrinciples.map(({ icon: Icon, title, body }) => (
                <article key={title} className="border-[#e5def4] p-7 sm:border-l">
                  <Icon className="h-10 w-10 text-[#5b28b7]" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-black uppercase leading-tight text-[#070b2f]">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#3a3d63]">{body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid border-t border-[#e5def4] bg-white lg:grid-cols-[0.26fr_0.74fr]">
            <div className="p-7">
              <p className="text-sm font-black uppercase tracking-wide text-[#5b28b7]">
                Ruta pública
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase leading-tight text-[#070b2f]">
                Afiliarse no es certificarse
              </h3>
            </div>
            <div className="grid gap-0 sm:grid-cols-3">
              {certificationPath.map(({ icon: Icon, title, body }) => (
                <article key={title} className="border-[#e5def4] p-7 sm:border-l">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f1ecff] text-[#5b28b7]">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h4 className="text-lg font-black uppercase text-[#070b2f]">{title}</h4>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#3a3d63]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="px-4 pb-9">
        <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_90%_20%,rgba(155,69,255,0.45),transparent_28%),linear-gradient(110deg,#050a2c,#241050_56%,#3b197c)] p-8 text-white lg:grid-cols-[0.36fr_0.64fr]">
          <div className="flex gap-6">
            <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d9b765]/60 bg-black shadow-2xl shadow-black/25">
              <Image
                src="/assets/logo-ain.png"
                alt="Sello Alianza Índigo"
                width={220}
                height={220}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide">Forma parte de la</p>
              <h2 className="text-4xl font-black uppercase leading-none text-[#dda632]">Red CENI</h2>
              <p className="mt-3 max-w-sm text-sm text-white/82">
                Únete a la comunidad de organizaciones líderes que están transformando México hacia un futuro más inclusivo y productivo.
              </p>
              <Link
                href="/registro"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#dda632] px-5 text-sm font-black uppercase text-[#070b2f] hover:bg-[#f0c85b]"
              >
                <Crown className="h-4 w-4" aria-hidden="true" />
                Solicitar membresía
              </Link>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, body }) => (
              <article key={title} className="border-white/20 lg:border-l lg:pl-7">
                <Icon className="h-10 w-10 text-[#dda632]" aria-hidden="true" />
                <h3 className="mt-4 text-base font-black uppercase">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="empresas" className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-black uppercase text-[#070b2f]">
            <Star className="h-5 w-5 fill-[#dda632] text-[#dda632]" aria-hidden="true" />
            Organizaciones certificadas destacadas
          </h2>
          <Link href="/directorio" className="hidden items-center gap-2 text-sm font-black uppercase text-[#5b28b7] sm:inline-flex">
            Ver todas las organizaciones <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {featured.map((org) => (
            <article key={org.name} className="rounded-xl border border-[#e7e2f0] bg-white p-5 shadow-lg shadow-[#140a35]/5">
              <div className="flex min-h-16 items-center justify-between gap-3">
                <h3 className="text-lg font-black leading-tight text-[#17204f]">{org.name}</h3>
                <Shield className="h-9 w-9 shrink-0 text-[#5b28b7]" aria-hidden="true" />
              </div>
              <p className="mt-4 inline-flex rounded-md bg-[#f1eef7] px-2 py-1 text-xs font-bold text-[#5b28b7]">
                {org.sector}
              </p>
              <p className="mt-3 flex items-center gap-1 text-xs font-bold text-[#817a9b]">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {org.city}
              </p>
              <p className="mt-3 text-[#dda632]">★★★★★</p>
            </article>
          ))}
        </div>
      </section>

      <section id="que-es-ceni" className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[0.35fr_0.65fr] lg:items-center">
        <div className="border-l-2 border-[#dda632] pl-7">
          <h2 className="text-2xl font-black uppercase text-[#070b2f]">Impacto que transforma</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#20234a]">
            Cada organización afiliada es un paso más hacia un México donde todas
            las mentes tienen lugar para brillar.
          </p>
        </div>
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, value: "+50", label: "Ciudades con presencia" },
            { icon: Building2, value: "+30", label: "Categorías de organizaciones" },
            { icon: Users, value: "+1M", label: "Personas alcanzadas en nuestra red" },
            { icon: InfinityIcon, value: "∞", label: "Posibilidades de inclusión" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-4 border-[#ddd8ea] lg:border-l lg:pl-6">
              <Icon className="h-10 w-10 text-[#5b28b7]" aria-hidden="true" />
              <div>
                <dt className="text-xs font-bold leading-tight text-[#20234a]">{label}</dt>
                <dd className="text-3xl font-black text-[#5b28b7]">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="px-4 pb-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-2xl bg-gradient-to-r from-[#2a0b65] to-[#4b18a8] p-8 text-white shadow-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <span className="grid h-[74px] w-[74px] shrink-0 place-items-center rounded-2xl bg-white p-2">
              <Image
                src="/assets/logo-alianza.png"
                alt=""
                width={66}
                height={66}
                className="h-full w-full object-contain"
              />
            </span>
            <div>
              <p className="text-2xl font-bold">NO necesitas PARECER para SER.</p>
              <p className="font-black uppercase text-[#dda632]">Juntos construimos un México neuroinclusivo.</p>
            </div>
          </div>
          <Link
            href="/registro"
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg border border-[#dda632] px-8 text-sm font-black uppercase text-white hover:bg-white/10"
          >
            <Crown className="h-5 w-5 text-[#dda632]" aria-hidden="true" />
            Súmate al cambio <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
