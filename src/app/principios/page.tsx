import type { Metadata } from "next";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Principios y Derechos Índigo" };

const RIGHTS: { title: string; body: string }[] = [
  {
    title: "1. Derecho al stimming sin sanción",
    body: "Moverse, balancearse, aletear o repetir sonidos son formas válidas de autorregulación. Ningún entorno certificado puede sancionarlas ni pedir que se detengan.",
  },
  {
    title: "2. Autoidentificación sin diagnóstico",
    body: "Nadie está obligado a mostrar un diagnóstico médico para ser reconocida o reconocido como persona neurodivergente ni para recibir ajustes.",
  },
  {
    title: "3. Prohibición de terapias normalizadoras",
    body: "Los entornos certificados no promueven ni exigen terapias cuyo objetivo sea que la persona parezca neurotípica.",
  },
  {
    title: "4. Derecho al masking libre",
    body: "Enmascarar o no enmascarar es decisión de cada persona. Ningún entorno puede exigir masking ni prohibirlo.",
  },
  {
    title: "5. Protección frente a discriminación algorítmica",
    body: "Los sistemas automatizados de selección, evaluación o vigilancia no pueden penalizar rasgos neurodivergentes.",
  },
  {
    title: "6. Derecho a la existencia neurodivergente plena",
    body: "Las personas neurodivergentes tienen derecho a habitar el trabajo, el comercio y la vida pública tal como son, sin condiciones.",
  },
];

export default function PrinciplesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Principios" }]} />
      <PageInfo>
        Esta página presenta los seis Derechos Índigo que fundamentan la certificación,
        el manifiesto de Alianza Índigo Neurodivergente y el principio de independencia
        entre venta y auditoría. Es una página informativa; no hay formularios.
      </PageInfo>

      <h1 className="text-3xl font-bold text-indigo">Principios</h1>

      <section aria-labelledby="manifiesto" className="mt-6">
        <h2 id="manifiesto" className="text-2xl font-bold text-indigo">
          Manifiesto
        </h2>
        <div className="mt-4 rounded-xl bg-indigo p-8 text-white">
          <p className="text-2xl font-bold leading-relaxed">
            Amamos sin condiciones.
            <br />
            Nadie vuelve a estar solo.
            <br />
            El amor se vuelve estructura.
          </p>
          <p className="mt-4 text-white/85">«No necesitas PARECER para SER.»</p>
        </div>
      </section>

      <section aria-labelledby="derechos" className="mt-10">
        <h2 id="derechos" className="text-2xl font-bold text-indigo">
          Los seis Derechos Índigo
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {RIGHTS.map((right) => (
            <Card key={right.title}>
              <CardHeader>
                <CardTitle className="text-base">{right.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed">{right.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="independencia" className="mt-10">
        <h2 id="independencia" className="text-2xl font-bold text-indigo">
          Venta y auditoría: siempre separadas
        </h2>
        <p className="mt-3 max-w-prose leading-relaxed">
          <strong>Quien vende nunca audita. Quien audita nunca vende.</strong> La red
          comercial que acompaña a las organizaciones no participa en las auditorías ni
          en los dictámenes. El Comité de Certificación decide con independencia y cada
          una de sus acciones queda registrada en una bitácora inmutable.
        </p>
      </section>
    </div>
  );
}
