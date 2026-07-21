import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Axe scans of the 8 main views: no critical (or serious) violations allowed.
 * Authenticated views run with the seeded demo accounts.
 */

const ORG_EMAIL = process.env.SEED_ORG_EMAIL ?? "org@ceni.local";
const ORG_PASSWORD = process.env.SEED_ORG_PASSWORD ?? "Org.CENI.2026!";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@ceni.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin.CENI.2026!";

async function expectNoCriticalViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(
    blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodo(s)`),
  ).toEqual([]);
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/entrar");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/(panel|admin)/);
}

const PUBLIC_VIEWS = [
  ["home", "/"],
  ["directorio", "/directorio"],
  ["verificar", "/verificar"],
  ["proceso", "/proceso"],
  ["principios", "/principios"],
  ["registro", "/registro"],
] as const;

for (const [name, path] of PUBLIC_VIEWS) {
  test(`axe: ${name}`, async ({ page }) => {
    await page.goto(path);
    await expectNoCriticalViolations(page);
  });
}

test("axe: panel de organización", async ({ page }) => {
  await login(page, ORG_EMAIL, ORG_PASSWORD);
  await page.goto("/panel");
  await expectNoCriticalViolations(page);
});

test("axe: panel de administración", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/admin");
  await expectNoCriticalViolations(page);
});

test("calm mode persists and applies", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Modo calma" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-calm", "true");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-calm", "true");
  await page.getByRole("button", { name: "Modo calma: activado" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-calm", "true");
});

test("reduced motion is respected (no long transitions)", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const duration = await page.evaluate(() => {
    const el = document.querySelector("a, button");
    return el ? getComputedStyle(el).transitionDuration : "0s";
  });
  // prefers-reduced-motion collapses every transition to ~0.
  expect(parseFloat(duration)).toBeLessThanOrEqual(0.01);
  await context.close();
});
