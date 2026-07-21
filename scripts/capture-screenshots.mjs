/**
 * Captures documentation screenshots of the main views into docs/screenshots.
 * Usage: BASE_URL=http://localhost:3200 node scripts/capture-screenshots.mjs
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3200";
const OUT = "docs/screenshots";
const ORG_EMAIL = process.env.SEED_ORG_EMAIL ?? "org@ceni.local";
const ORG_PASSWORD = process.env.SEED_ORG_PASSWORD ?? "Org.CENI.2026!";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@ceni.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin.CENI.2026!";

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM_PATH || undefined,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

async function shot(path, name, opts = {}) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.fullPage ?? true });
  console.log(`✓ ${name}`);
}

async function login(email, password) {
  await page.goto(`${BASE}/entrar`);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/(panel|admin)/);
}

async function logoutAll() {
  await page.context().clearCookies();
}

// Public
await shot("/", "01-home");
await shot("/directorio", "02-directorio-lista");
await page.getByRole("button", { name: "Mapa" }).click();
await page.waitForTimeout(4000); // tiles
await page.screenshot({ path: `${OUT}/03-directorio-mapa.png` });
console.log("✓ 03-directorio-mapa");
await shot("/verificar", "04-verificar");
await shot("/verificar/CENI-L-2026-0001", "05-verificar-resultado");
await shot("/proceso", "06-proceso");
await shot("/principios", "07-principios");
await shot("/registro", "08-registro");

// Calm mode example
await page.goto(`${BASE}/`);
await page.getByRole("button", { name: "Modo calma" }).click();
await page.screenshot({ path: `${OUT}/09-home-modo-calma.png`, fullPage: true });
await page.getByRole("button", { name: "Modo calma: activado" }).click();
console.log("✓ 09-home-modo-calma");

// Org panel
await login(ORG_EMAIL, ORG_PASSWORD);
await shot("/panel", "10-panel-org");
const assessmentLink = page.getByRole("link", { name: /Autoevaluación/ }).first();
await assessmentLink.click();
await page.waitForURL(/autoevaluacion/);
await page.screenshot({ path: `${OUT}/11-autoevaluacion.png`, fullPage: false });
console.log("✓ 11-autoevaluacion");
await logoutAll();

// Admin panel
await login(ADMIN_EMAIL, ADMIN_PASSWORD);
await shot("/admin", "12-admin-tablero");
await shot("/admin/expedientes", "13-admin-expedientes");
await page.getByRole("button", { name: "Kanban" }).click();
await page.screenshot({ path: `${OUT}/14-admin-kanban.png` });
console.log("✓ 14-admin-kanban");
await shot("/admin/registro", "15-admin-registro-nacional");
await shot("/admin/bitacora", "16-admin-bitacora");

// Printable certificate (admin view of a seeded folio)
await shot("/admin/certificados/CENI-L-2026-0001", "17-certificado-imprimible");

await browser.close();
console.log("Listo: capturas en docs/screenshots/");
