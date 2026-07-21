import type { Metadata } from "next";
import { PageInfo } from "@/components/layout/page-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  ORG_SIZE_COSTS,
  ORG_SIZE_HEADCOUNT,
  ORG_SIZE_LABELS,
  RENEWAL_COST_NOTE,
  STAGE_DEADLINES,
  STAGE_DESCRIPTIONS,
  STAGE_LABELS,
  STAGE_ORDER,
  TOTAL_PROCESS_BUSINESS_DAYS,
} from "@/lib/domain";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Proceso y costos" };

const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Cuánto tarda el proceso completo?",
    a: "El máximo publicado es de 80 días hábiles desde la solicitud hasta la emisión del certificado o plan de mejora. Cada etapa tiene su propio plazo máximo, visible en esta página.",
  },
  {
    q: "¿La autoevaluación garantiza un nivel?",
    a: "No. La autoevaluación produce una estimación orientativa. El dictamen lo emite el Comité de Certificación después de la auditoría en sitio.",
  },
  {
    q: "¿Quién realiza la auditoría?",
    a: "Una persona auditora independiente. Por regla del programa, quien vende nunca audita y quien audita nunca vende.",
  },
  {
    q: "¿Qué pasa si una dimensión queda por debajo del 40%?",
    a: "No se otorga nivel, aunque el puntaje total alcance. El resultado es un Plan de Mejora que señala la dimensión o dimensiones a fortalecer.",
  },
  {
    q: "¿Cuánto dura la certificación?",
    a: "Bronce dura 1 año, Plata 2 años y Oro 3 años. La renovación se solicita como un expediente nuevo marcado como renovación.",
  },
  {
    q: "¿Cuánto cuesta renovar?",
    a: "El costo informativo de la renovación es el 70% del costo inicial correspondiente al tamaño de tu organización.",
  },
  {
    q: "¿La plataforma cobra?",
    a: "No. Los costos publicados son informativos. El pago se acuerda fuera de la plataforma; aquí solo se gestiona el expediente técnico.",
  },
  {
    q: "¿Puedo certificar las dos líneas a la vez?",
    a: "Sí. Cada línea (Laboral y Espacios) lleva su propio expediente, su propia auditoría y su propio certificado.",
  },
];

export default function ProcessPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Proceso y costos" }]} />
      <PageInfo>
        Esta página explica el proceso de certificación completo: las 6 etapas con sus
        plazos máximos en días hábiles, la tabla de costos informativos por tamaño de
        organización y respuestas a 8 preguntas frecuentes.
      </PageInfo>

      <h1 className="text-3xl font-bold text-indigo">Proceso de certificación</h1>
      <p className="mt-2 max-w-prose text-muted-ink">
        Seis etapas con plazos máximos publicados. Duración máxima total del proceso:{" "}
        <strong className="text-ink">{TOTAL_PROCESS_BUSINESS_DAYS} días hábiles</strong>{" "}
        (lunes a viernes).
      </p>

      <ol className="mt-8 space-y-0">
        {STAGE_ORDER.map((stage, index) => (
          <li key={stage} className="relative flex gap-4 pb-8">
            {index < STAGE_ORDER.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute left-5 top-11 h-full w-0.5 bg-border"
              />
            )}
            <span
              aria-hidden="true"
              className="z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo font-bold text-white"
            >
              {index + 1}
            </span>
            <div className="pt-1">
              <h2 className="font-bold text-indigo">
                {STAGE_LABELS[stage]}
                <span className="ms-2 rounded-md bg-surface px-2 py-0.5 text-xs font-bold text-muted-ink">
                  máx. {STAGE_DEADLINES[stage]} días hábiles
                </span>
              </h2>
              <p className="mt-1 max-w-prose text-sm text-muted-ink">
                {STAGE_DESCRIPTIONS[stage]}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-10 text-2xl font-bold text-indigo">Costos informativos</h2>
      <p className="mt-2 max-w-prose text-sm text-muted-ink">
        Los costos dependen del tamaño de la organización (por número de personas).
        Son informativos: la plataforma no cobra. {RENEWAL_COST_NOTE}
      </p>
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tamaño</TableHead>
              <TableHead>Personas</TableHead>
              <TableHead>Costo informativo (MXN)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Object.keys(ORG_SIZE_LABELS) as (keyof typeof ORG_SIZE_LABELS)[]).map(
              (size) => (
                <TableRow key={size}>
                  <TableCell className="font-bold">{ORG_SIZE_LABELS[size]}</TableCell>
                  <TableCell>{ORG_SIZE_HEADCOUNT[size]}</TableCell>
                  <TableCell>{ORG_SIZE_COSTS[size]}</TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>

      <h2 className="mt-10 text-2xl font-bold text-indigo">Preguntas frecuentes</h2>
      <dl className="mt-4 space-y-4">
        {FAQ.map((item) => (
          <div key={item.q} className="rounded-lg border border-border bg-card p-4">
            <dt className="font-bold text-indigo">{item.q}</dt>
            <dd className="mt-1 max-w-prose text-sm leading-relaxed text-ink">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
