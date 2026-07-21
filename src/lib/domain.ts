import type {
  CertLevel,
  CertStatus,
  Line,
  OrgNetworkStatus,
  OrgSize,
  Stage,
} from "@prisma/client";

/* ---------- Lines ---------- */

export const LINE_LABELS: Record<Line, string> = {
  LABORAL: "CENI Laboral",
  ESPACIOS: "CENI Espacios",
};

export const LINE_CODE: Record<Line, "L" | "E"> = {
  LABORAL: "L",
  ESPACIOS: "E",
};

/* ---------- Levels (Lineamientos CENI v3.1 — normative, do not alter) ---------- */

export const TOTAL_POINTS = 1000;

export const LEVEL_THRESHOLDS: Record<CertLevel, { min: number; max: number }> = {
  BRONCE: { min: 500, max: 649 },
  PLATA: { min: 650, max: 799 },
  ORO: { min: 800, max: 1000 },
};

export const LEVEL_LABELS: Record<CertLevel, string> = {
  BRONCE: "Bronce",
  PLATA: "Plata",
  ORO: "Oro",
};

export const LEVEL_VALIDITY_YEARS: Record<CertLevel, number> = {
  BRONCE: 1,
  PLATA: 2,
  ORO: 3,
};

/** Minimum share of each dimension's maximum required to obtain any level. */
export const DIMENSION_FLOOR = 0.4;

/** A certification counts as "por vencer" with this many days or fewer left. */
export const POR_VENCER_DAYS = 60;

/* ---------- Stages and deadlines (business days, Mon–Fri) ---------- */

export const STAGE_ORDER: Stage[] = [
  "SOLICITUD",
  "REVISION_DOCUMENTAL",
  "PROGRAMACION",
  "AUDITORIA",
  "DICTAMEN",
  "CIERRE",
];

export const STAGE_LABELS: Record<Stage, string> = {
  SOLICITUD: "Solicitud y Autoevaluación",
  REVISION_DOCUMENTAL: "Revisión Documental",
  PROGRAMACION: "Programación de Auditoría",
  AUDITORIA: "Auditoría en Sitio",
  DICTAMEN: "Dictamen del Comité",
  CIERRE: "Certificación o Plan de Mejora",
};

/** Maximum business days per stage. Total process: 80 business days. */
export const STAGE_DEADLINES: Record<Stage, number> = {
  SOLICITUD: 5,
  REVISION_DOCUMENTAL: 15,
  PROGRAMACION: 20,
  AUDITORIA: 10,
  DICTAMEN: 15,
  CIERRE: 5,
};

export const TOTAL_PROCESS_BUSINESS_DAYS = 80;

export const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  SOLICITUD:
    "La organización envía su solicitud y completa la autoevaluación. Acuse de recibo en un máximo de 5 días hábiles.",
  REVISION_DOCUMENTAL:
    "El equipo revisa la documentación. Resultado en un máximo de 15 días hábiles (subsanación: 15 días, con prórroga única de 10).",
  PROGRAMACION:
    "Se agenda la auditoría en sitio en un máximo de 20 días hábiles.",
  AUDITORIA:
    "Se realiza la auditoría en sitio. El informe se entrega en un máximo de 10 días hábiles.",
  DICTAMEN:
    "El Comité de Certificación evalúa el expediente y emite su dictamen en un máximo de 15 días hábiles.",
  CIERRE:
    "Se emite el certificado o el plan de mejora en un máximo de 5 días hábiles.",
};

export const NEXT_STEP_FOR_ORG: Record<Stage, string> = {
  SOLICITUD:
    "Completa la autoevaluación y sube tus evidencias. Cuando termines, el equipo revisará tu expediente.",
  REVISION_DOCUMENTAL:
    "El equipo está revisando tus documentos. Si falta algo, recibirás una nota con lo que hay que corregir.",
  PROGRAMACION:
    "Se está agendando la auditoría en sitio. Recibirás la fecha propuesta.",
  AUDITORIA:
    "La auditoría en sitio está en curso. Al terminar, la persona auditora entregará su informe.",
  DICTAMEN:
    "El Comité de Certificación está evaluando tu expediente. No necesitas hacer nada por ahora.",
  CIERRE:
    "El Comité emitió su decisión. Revisa el resultado en esta página.",
};

/* ---------- Organization sizes and informational costs ---------- */

export const ORG_SIZE_LABELS: Record<OrgSize, string> = {
  PEQUENA: "Pequeña",
  MEDIANA: "Mediana",
  GRANDE: "Grande",
  CORPORATIVO: "Corporativo",
};

export const ORG_SIZE_HEADCOUNT: Record<OrgSize, string> = {
  PEQUENA: "Hasta 50 personas",
  MEDIANA: "De 51 a 250 personas",
  GRANDE: "De 251 a 1,000 personas",
  CORPORATIVO: "Más de 1,000 personas",
};

/** Informational only: the platform never charges. MXN. */
export const ORG_SIZE_COSTS: Record<OrgSize, string> = {
  PEQUENA: "$15,000 – $35,000 MXN",
  MEDIANA: "$35,000 – $80,000 MXN",
  GRANDE: "$80,000 – $150,000 MXN",
  CORPORATIVO: "$150,000 – $300,000 MXN",
};

export const RENEWAL_COST_NOTE =
  "La renovación tiene un costo informativo del 70% del costo inicial.";

/* ---------- CENI network ---------- */

export const ORG_NETWORK_STATUS_LABELS: Record<OrgNetworkStatus, string> = {
  AFILIADA: "Afiliada",
};

export const ORG_NETWORK_STATUS_EXPLANATIONS: Record<OrgNetworkStatus, string> = {
  AFILIADA:
    "La organizaciÃ³n forma parte de la red CENI. Puede estar en acercamiento, capacitaciÃ³n o proceso, pero aÃºn no tiene un certificado vigente.",
};

/* ---------- Certification status ---------- */

export const CERT_STATUS_LABELS: Record<CertStatus, string> = {
  VIGENTE: "Vigente",
  POR_VENCER: "Por vencer",
  VENCIDA: "Vencida",
  SUSPENDIDA: "Suspendida",
  RETIRADA: "Retirada",
};

export const CERT_STATUS_EXPLANATIONS: Record<CertStatus, string> = {
  VIGENTE:
    "La certificación es válida hoy. La organización cumplió el proceso completo de evaluación.",
  POR_VENCER:
    "La certificación es válida hoy, pero vence en 60 días o menos. La organización puede iniciar su renovación.",
  VENCIDA:
    "La certificación llegó a su fecha de término y no se ha renovado. Ya no es válida.",
  SUSPENDIDA:
    "La certificación está pausada temporalmente por decisión del Comité de Certificación. No es válida mientras dure la suspensión.",
  RETIRADA:
    "El Comité de Certificación retiró la certificación de forma definitiva. No es válida.",
};

/** Mandatory cause catalog for suspension/withdrawal. */
export const STATUS_CHANGE_CAUSES = [
  "Incumplimiento verificado",
  "Violación de Derechos Índigo",
  "Falsedad de evidencia",
  "No renovación",
] as const;

/* ---------- Folio ---------- */

export const FOLIO_REGEX = /^CENI-(L|E)-(\d{4})-(\d{4})$/;

export function formatFolio(line: Line, year: number, consecutive: number): string {
  return `CENI-${LINE_CODE[line]}-${year}-${String(consecutive).padStart(4, "0")}`;
}

export function isValidFolio(folio: string): boolean {
  return FOLIO_REGEX.test(folio.trim().toUpperCase());
}

/* ---------- Mandatory legend (copy rule, section 1) ---------- */

export const ESTIMATE_LEGEND =
  "Estimación orientativa. El dictamen lo emite el Comité de Certificación.";

/* ---------- Mexican states (for filters and forms) ---------- */

export const MX_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
  "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
  "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
  "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
  "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
] as const;
