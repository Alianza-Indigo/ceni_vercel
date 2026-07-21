import { PrismaClient, type CertLevel, type CertStatus, type Line, type OrgSize } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";
import { CRITERIA, criteriaForLine } from "../src/lib/criteria-data";
import { computeAssessment, type AssessmentAnswers } from "../src/lib/scoring";
import { formatFolio, LEVEL_VALIDITY_YEARS } from "../src/lib/domain";

try {
  process.loadEnvFile();
} catch {
  // .env not present (e.g. variables injected by the environment).
}

const prisma = new PrismaClient();

const DAY_MS = 86_400_000;

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return value;
}

/** Uniform 50% compliance → 500 points (Bronce floor-safe). */
function answersBronce(line: Line): AssessmentAnswers {
  return Object.fromEntries(criteriaForLine(line).map((c) => [c.code, 50]));
}

/** Alternating 100/50 → 750 points (Plata, floor-safe). */
function answersPlata(line: Line): AssessmentAnswers {
  return Object.fromEntries(
    criteriaForLine(line).map((c, i) => [c.code, i % 2 === 0 ? 100 : 50]),
  );
}

/** Full compliance → 1000 points (Oro). */
function answersOro(line: Line): AssessmentAnswers {
  return Object.fromEntries(criteriaForLine(line).map((c) => [c.code, 100]));
}

const ANSWERS_BY_LEVEL: Record<CertLevel, (line: Line) => AssessmentAnswers> = {
  BRONCE: answersBronce,
  PLATA: answersPlata,
  ORO: answersOro,
};

interface DemoOrg {
  legalName: string;
  tradeName: string;
  sector: string;
  size: OrgSize;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  cert?: {
    line: Line;
    level: CertLevel;
    /** Days ago the certificate was issued. */
    issuedDaysAgo: number;
    status?: CertStatus;
    statusReason?: string;
  };
}

/* Fictional organizations; coordinates are approximate city centers. */
const DEMO_ORGS: DemoOrg[] = [
  {
    legalName: "Talleres del Desierto S.A. de C.V.", tradeName: "Talleres del Desierto",
    sector: "Manufactura", size: "MEDIANA",
    street: "Av. Tecnológico 4101", city: "Chihuahua", state: "Chihuahua", postalCode: "31110",
    latitude: 28.632, longitude: -106.069,
    cert: { line: "LABORAL", level: "ORO", issuedDaysAgo: 120 },
  },
  {
    legalName: "Ensambles Frontera Norte S. de R.L.", tradeName: "Ensambles Frontera",
    sector: "Manufactura", size: "GRANDE",
    street: "Blvd. Independencia 2200", city: "Ciudad Juárez", state: "Chihuahua", postalCode: "32330",
    latitude: 31.69, longitude: -106.424,
    cert: { line: "LABORAL", level: "PLATA", issuedDaysAgo: 90 },
  },
  {
    legalName: "Café Luz Cívica S.A.S.", tradeName: "Café Luz Cívica",
    sector: "Alimentos y bebidas", size: "PEQUENA",
    street: "Calle Regina 58", city: "Ciudad de México", state: "Ciudad de México", postalCode: "06080",
    latitude: 19.432, longitude: -99.133,
    cert: { line: "ESPACIOS", level: "ORO", issuedDaysAgo: 60 },
  },
  {
    legalName: "Grupo Acero Regio S.A. de C.V.", tradeName: "Acero Regio",
    sector: "Industria pesada", size: "CORPORATIVO",
    street: "Av. Constitución 1500", city: "Monterrey", state: "Nuevo León", postalCode: "64000",
    latitude: 25.686, longitude: -100.316,
    cert: {
      line: "LABORAL", level: "BRONCE", issuedDaysAgo: 100,
      status: "SUSPENDIDA", statusReason: "Incumplimiento verificado",
    },
  },
  {
    legalName: "Centro Cultural Ajolote A.C.", tradeName: "Centro Cultural Ajolote",
    sector: "Cultura", size: "PEQUENA",
    street: "Av. Chapultepec 320", city: "Guadalajara", state: "Jalisco", postalCode: "44140",
    latitude: 20.676, longitude: -103.347,
    cert: { line: "ESPACIOS", level: "PLATA", issuedDaysAgo: 150 },
  },
  {
    legalName: "Biblioteca Viva de Puebla A.C.", tradeName: "Biblioteca Viva",
    sector: "Educación", size: "PEQUENA",
    street: "4 Sur 104", city: "Puebla", state: "Puebla", postalCode: "72000",
    latitude: 19.041, longitude: -98.206,
    // Bronce validity is 1 year; issued 325 days ago → expires in ~40 days →
    // effective status POR_VENCER (stored VIGENTE, computed on the fly).
    cert: { line: "ESPACIOS", level: "BRONCE", issuedDaysAgo: 325 },
  },
  {
    legalName: "Software Bajío Labs S.A.P.I.", tradeName: "Bajío Labs",
    sector: "Tecnología", size: "MEDIANA",
    street: "Blvd. Bernardo Quintana 555", city: "Querétaro", state: "Querétaro", postalCode: "76090",
    latitude: 20.588, longitude: -100.39,
    cert: { line: "LABORAL", level: "PLATA", issuedDaysAgo: 45 },
  },
  {
    legalName: "Clínica Amable del Pacífico S.C.", tradeName: "Clínica Amable",
    sector: "Salud", size: "MEDIANA",
    street: "Paseo de los Héroes 9800", city: "Tijuana", state: "Baja California", postalCode: "22010",
    latitude: 32.514, longitude: -117.038,
    cert: { line: "ESPACIOS", level: "ORO", issuedDaysAgo: 200 },
  },
  {
    legalName: "Hotel Ceiba Blanca S.A. de C.V.", tradeName: "Hotel Ceiba Blanca",
    sector: "Turismo", size: "MEDIANA",
    street: "Calle 60 No. 452", city: "Mérida", state: "Yucatán", postalCode: "97000",
    latitude: 20.967, longitude: -89.624,
    cert: { line: "ESPACIOS", level: "PLATA", issuedDaysAgo: 30 },
  },
  {
    // Linked to the demo ORG user: file at DICTAMEN stage, no certification yet.
    legalName: "Calzado Ergo de León S.A. de C.V.", tradeName: "Calzado Ergo",
    sector: "Manufactura de calzado", size: "MEDIANA",
    street: "Blvd. Adolfo López Mateos 1801", city: "León", state: "Guanajuato", postalCode: "37000",
    latitude: 21.122, longitude: -101.682,
  },
];

async function main() {
  console.log("Seeding CENI database...");

  // --- Criteria catalog (upsert: idempotent) ---
  for (const criterion of CRITERIA) {
    await prisma.criterion.upsert({
      where: { code: criterion.code },
      update: {
        title: criterion.title,
        helpText: criterion.helpText,
        maxPoints: criterion.maxPoints,
        sortOrder: criterion.sortOrder,
        line: criterion.line,
        dimension: criterion.dimension,
      },
      create: criterion,
    });
  }
  console.log(`Criteria: ${CRITERIA.length}`);

  // --- Site metrics (manually curated counters) ---
  await prisma.siteMetric.upsert({
    where: { key: "people_trained" },
    update: {},
    create: { key: "people_trained", label: "Personas capacitadas", value: 1280 },
  });

  // --- Users ---
  const adminPassword = await hash(requireEnv("SEED_ADMIN_PASSWORD"));
  const admin = await prisma.user.upsert({
    where: { email: requireEnv("SEED_ADMIN_EMAIL") },
    update: {},
    create: {
      email: requireEnv("SEED_ADMIN_EMAIL"),
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  // Fictional demo data is opt-in: production seeds only the criteria
  // catalog, site metrics, and the bootstrap admin account.
  if (process.env.SEED_DEMO_DATA !== "true") {
    console.log("SEED_DEMO_DATA is not 'true': skipping demo organizations.");
    console.log("Seed complete (production mode).");
    return;
  }

  // --- Organizations, applications, certifications ---
  // Preload folio counters so re-running the seed never duplicates folios.
  const folioCounters = new Map<string, number>();
  for (const counter of await prisma.folioCounter.findMany()) {
    folioCounters.set(`${counter.line}-${counter.year}`, counter.lastNumber);
  }

  for (const demo of DEMO_ORGS) {
    const existing = await prisma.organization.findFirst({
      where: { legalName: demo.legalName },
    });
    if (existing) continue;

    const org = await prisma.organization.create({
      data: {
        legalName: demo.legalName,
        tradeName: demo.tradeName,
        sector: demo.sector,
        size: demo.size,
        street: demo.street,
        city: demo.city,
        state: demo.state,
        postalCode: demo.postalCode,
        latitude: demo.latitude,
        longitude: demo.longitude,
        contactName: "Contacto de demostración",
        contactEmail: `contacto@${demo.tradeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.example.mx`,
      },
    });
    const primarySite = await prisma.site.create({
      data: {
        orgId: org.id,
        name: "Sede principal",
        street: demo.street,
        city: demo.city,
        state: demo.state,
        postalCode: demo.postalCode,
        latitude: demo.latitude,
        longitude: demo.longitude,
        isPrimary: true,
      },
    });

    if (!demo.cert) {
      // Demo ORG user's organization: file at DICTAMEN with full assessment.
      const orgUser = await prisma.user.upsert({
        where: { email: requireEnv("SEED_ORG_EMAIL") },
        update: { orgId: org.id },
        create: {
          email: requireEnv("SEED_ORG_EMAIL"),
          passwordHash: await hash(requireEnv("SEED_ORG_PASSWORD")),
          role: "ORG",
          orgId: org.id,
        },
      });

      const application = await prisma.application.create({
        data: {
          orgId: org.id,
          siteId: primarySite.id,
          line: "LABORAL",
          stage: "DICTAMEN",
          status: "EN_PROCESO",
          stageEnteredAt: daysFromNow(-3),
          createdAt: daysFromNow(-45),
        },
      });
      await prisma.selfAssessment.create({
        data: {
          applicationId: application.id,
          answers: answersPlata("LABORAL"),
        },
      });
      await prisma.adminNote.create({
        data: {
          applicationId: application.id,
          authorId: admin.id,
          stage: "DICTAMEN",
          body: "Expediente completo. Informe de auditoría recibido; listo para dictamen del Comité.",
        },
      });
      console.log(`Org (in process): ${org.tradeName} · user ${orgUser.email}`);
      continue;
    }

    const { line, level, issuedDaysAgo } = demo.cert;
    const issuedAt = daysFromNow(-issuedDaysAgo);
    const expiresAt = new Date(issuedAt.getTime());
    expiresAt.setFullYear(expiresAt.getFullYear() + LEVEL_VALIDITY_YEARS[level]);

    const answers = ANSWERS_BY_LEVEL[level](line);
    const result = computeAssessment(criteriaForLine(line), answers);
    if (result.level !== level) {
      throw new Error(`Seed answers for ${org.tradeName} produce ${result.level}, expected ${level}`);
    }

    const application = await prisma.application.create({
      data: {
        orgId: org.id,
        siteId: primarySite.id,
        line,
        stage: "CIERRE",
        status: "CERTIFICADO",
        stageEnteredAt: issuedAt,
        createdAt: new Date(issuedAt.getTime() - 60 * DAY_MS),
        decidedAt: issuedAt,
      },
    });
    await prisma.selfAssessment.create({
      data: { applicationId: application.id, answers },
    });

    const year = issuedAt.getUTCFullYear();
    const counterKey = `${line}-${year}`;
    const consecutive = (folioCounters.get(counterKey) ?? 0) + 1;
    folioCounters.set(counterKey, consecutive);

    const certification = await prisma.certification.create({
      data: {
        orgId: org.id,
        siteId: primarySite.id,
        applicationId: application.id,
        line,
        level,
        score: result.total,
        dimensionScores: Object.fromEntries(
          result.dimensions.map((d) => [String(d.dimension), d.points]),
        ),
        folio: formatFolio(line, year, consecutive),
        issuedAt,
        expiresAt,
        status: demo.cert.status ?? "VIGENTE",
        statusReason: demo.cert.statusReason,
        qrToken: randomBytes(24).toString("base64url"),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "CERT_ISSUED",
        entity: "Certification",
        entityId: certification.id,
        payload: { folio: certification.folio, level, line, score: result.total },
        createdAt: issuedAt,
      },
    });
    if (demo.cert.status === "SUSPENDIDA") {
      await prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "CERT_SUSPENDED",
          entity: "Certification",
          entityId: certification.id,
          payload: { folio: certification.folio, reason: demo.cert.statusReason },
          createdAt: daysFromNow(-10),
        },
      });
    }
    console.log(`Org: ${org.tradeName} · ${certification.folio} (${level})`);
  }

  // --- Multi-site demo: a branch of Café Luz Cívica certified at a
  // different level than its primary site (Oro vs Plata) ---
  const cafeOrg = await prisma.organization.findFirst({
    where: { legalName: "Café Luz Cívica S.A.S." },
    include: { sites: true },
  });
  if (cafeOrg && cafeOrg.sites.length === 1) {
    const branch = await prisma.site.create({
      data: {
        orgId: cafeOrg.id,
        name: "Sucursal Roma",
        street: "Av. Álvaro Obregón 120",
        city: "Ciudad de México",
        state: "Ciudad de México",
        postalCode: "06700",
        latitude: 19.417,
        longitude: -99.16,
      },
    });
    const issuedAt = daysFromNow(-20);
    const expiresAt = new Date(issuedAt.getTime());
    expiresAt.setFullYear(expiresAt.getFullYear() + LEVEL_VALIDITY_YEARS.PLATA);
    const answers = answersPlata("ESPACIOS");
    const result = computeAssessment(criteriaForLine("ESPACIOS"), answers);

    const application = await prisma.application.create({
      data: {
        orgId: cafeOrg.id,
        siteId: branch.id,
        line: "ESPACIOS",
        stage: "CIERRE",
        status: "CERTIFICADO",
        stageEnteredAt: issuedAt,
        createdAt: new Date(issuedAt.getTime() - 60 * DAY_MS),
        decidedAt: issuedAt,
      },
    });
    await prisma.selfAssessment.create({
      data: { applicationId: application.id, answers },
    });

    const year = issuedAt.getUTCFullYear();
    const counterKey = `ESPACIOS-${year}`;
    const consecutive = (folioCounters.get(counterKey) ?? 0) + 1;
    folioCounters.set(counterKey, consecutive);

    const certification = await prisma.certification.create({
      data: {
        orgId: cafeOrg.id,
        siteId: branch.id,
        applicationId: application.id,
        line: "ESPACIOS",
        level: "PLATA",
        score: result.total,
        dimensionScores: Object.fromEntries(
          result.dimensions.map((d) => [String(d.dimension), d.points]),
        ),
        folio: formatFolio("ESPACIOS", year, consecutive),
        issuedAt,
        expiresAt,
        status: "VIGENTE",
        qrToken: randomBytes(24).toString("base64url"),
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "CERT_ISSUED",
        entity: "Certification",
        entityId: certification.id,
        payload: {
          folio: certification.folio,
          level: "PLATA",
          line: "ESPACIOS",
          score: result.total,
          site: branch.name,
        },
        createdAt: issuedAt,
      },
    });
    console.log(`Branch: ${cafeOrg.tradeName} · ${branch.name} · ${certification.folio} (PLATA)`);
  }

  // --- Folio counters consistent with issued folios ---
  for (const [key, lastNumber] of folioCounters) {
    const [line, yearStr] = key.split("-");
    await prisma.folioCounter.upsert({
      where: { line_year: { line: line as Line, year: Number(yearStr) } },
      update: { lastNumber },
      create: { line: line as Line, year: Number(yearStr), lastNumber },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
