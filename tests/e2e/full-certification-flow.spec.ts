import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end certification journey:
 * ORG registration → full self-assessment → ADMIN stage transitions →
 * committee verdict → certificate emission → folio visible in the public
 * directory → /verificar/{folio} answers VIGENTE.
 */

const runId = Date.now().toString(36);
const ORG_EMAIL = `e2e-${runId}@ceni.local`;
const ORG_PASSWORD = "E2e.Password.2026!";
const ORG_NAME = `Café Prueba ${runId}`;

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@ceni.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin.CENI.2026!";

async function login(page: Page, email: string, password: string) {
  await page.goto("/entrar");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(/\/(panel|admin)/);
}

async function logout(page: Page) {
  await page.goto("/panel").catch(() => {});
  const button = page.getByRole("button", { name: "Cerrar sesión" });
  if (await button.isVisible().catch(() => false)) {
    await button.click();
    await page.waitForURL("/");
  } else {
    await page.context().clearCookies();
  }
}

test.describe.serial("certification lifecycle", () => {
  test("organization registers and completes its self-assessment", async ({ page }) => {
    await page.goto("/registro");

    await page.getByLabel("Correo electrónico").fill(ORG_EMAIL);
    await page.getByLabel("Contraseña (mínimo 10 caracteres)").fill(ORG_PASSWORD);
    await page.getByLabel("Razón social").fill(`${ORG_NAME} S.A. de C.V.`);
    await page.getByLabel("Nombre comercial").fill(ORG_NAME);
    await page.getByLabel("Sector o giro").fill("Alimentos y bebidas");
    await page.getByLabel("Persona de contacto").fill("Persona de Prueba");
    await page.getByLabel("Calle y número").fill("Calle Falsa 123");
    await page.getByLabel("Ciudad o municipio").fill("Querétaro");
    await page.getByLabel("Estado", { exact: true }).selectOption("Querétaro");
    await page.getByLabel("Código postal").fill("76000");
    await page.getByRole("textbox", { name: "Latitud" }).fill("20.5888");
    await page.getByRole("textbox", { name: "Longitud" }).fill("-100.3899");
    await page.getByRole("checkbox", { name: /CENI Laboral/ }).check();

    await page.getByRole("button", { name: "Registrar organización" }).click();
    await page.waitForURL("/panel");
    await expect(page.getByRole("heading", { name: ORG_NAME })).toBeVisible();

    // Open the self-assessment and answer all 30 criteria at 100%.
    await page.getByRole("link", { name: "Iniciar autoevaluación" }).click();
    await page.waitForURL(/autoevaluacion/);

    const radios = page.locator('input[type="radio"][value="100"]');
    const count = await radios.count();
    expect(count).toBe(30);
    for (let i = 0; i < count; i++) {
      await radios.nth(i).check();
    }
    await expect(page.getByText("1000 / 1000 puntos")).toBeVisible();
    await expect(page.getByText("Nivel estimado: Oro")).toBeVisible();
    await expect(page.getByText(/Estimación orientativa/).first()).toBeVisible();
    await expect(page.getByText("Guardado ✓")).toBeVisible({ timeout: 10_000 });

    await logout(page);
  });

  test("committee advances stages, issues verdict and certificate", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto("/admin/expedientes");
    await page.getByRole("link", { name: `Abrir expediente de ${ORG_NAME}` }).click();
    await page.waitForURL(/\/admin\/expedientes\//);

    // SOLICITUD → REVISION_DOCUMENTAL → PROGRAMACION → AUDITORIA → DICTAMEN
    const transitions = [
      "Revisión Documental",
      "Programación de Auditoría",
      "Auditoría en Sitio",
      "Dictamen del Comité",
    ];
    for (const target of transitions) {
      await page
        .getByRole("button", { name: `Pasar a la siguiente etapa: ${target}` })
        .click();
      await page
        .getByLabel("Nota obligatoria (visible para la organización)")
        .fill(`Transición e2e hacia ${target}.`);
      await page.getByRole("button", { name: `Confirmar paso a ${target}` }).click();
      await expect(
        page.getByText(`En ${target} desde el`, { exact: false }),
      ).toBeVisible();
    }

    // Verdict: preloaded with the org's 100% answers.
    await expect(page.getByText("1000 / 1000 puntos")).toBeVisible();
    await expect(page.getByText("Resultado calculado: nivel Oro")).toBeVisible();
    await page.getByRole("button", { name: "Emitir dictamen" }).click();
    await expect(page.getByText(/Dictamen registrado: nivel ORO/)).toBeVisible();

    // Emission. After the refresh the certificate link replaces the button.
    await page.getByRole("button", { name: "Emitir certificado" }).click();
    await page.getByRole("button", { name: "Confirmar emisión" }).click();
    const certLink = page.getByRole("link", { name: /Ver certificado CENI-L-\d{4}-\d{4}/ });
    await expect(certLink).toBeVisible({ timeout: 15_000 });
    const folio = (await certLink.textContent())?.match(/CENI-L-\d{4}-\d{4}/)?.[0];
    expect(folio).toBeTruthy();

    await page.context().clearCookies();

    // Public directory shows the new organization.
    await page.goto("/directorio");
    await expect(page.getByRole("heading", { name: ORG_NAME })).toBeVisible();

    // Public verification answers VIGENTE.
    await page.goto(`/verificar/${folio}`);
    await expect(page.getByText("Estado: Vigente.")).toBeVisible();
    await expect(page.getByRole("heading", { name: ORG_NAME })).toBeVisible();
    await expect(page.getByText(/Nivel Oro/)).toBeVisible();
  });
});
