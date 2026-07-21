import { expect, test } from "@playwright/test";

/**
 * Multi-establishment support: a chain can certify several sites with
 * different levels. The seed gives Café Luz Cívica an Oro primary site and a
 * Plata branch (Sucursal Roma); both must be listed separately and verify
 * independently.
 */

test("directory lists each certified site separately", async ({ page }) => {
  await page.goto("/directorio");
  await expect(
    page.getByRole("heading", { name: "Café Luz Cívica", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Café Luz Cívica · Sucursal Roma" }),
  ).toBeVisible();
});

test("branch certification verifies with its own level and site name", async ({
  page,
}) => {
  await page.goto("/verificar/CENI-E-2026-0004");
  await expect(
    page.getByRole("heading", { name: "Café Luz Cívica · Sucursal Roma" }),
  ).toBeVisible();
  await expect(page.getByText(/Nivel Plata/)).toBeVisible();
  await expect(page.getByText("Estado: Vigente.")).toBeVisible();
});

test("primary-site certification keeps the plain organization name", async ({
  page,
}) => {
  await page.goto("/verificar/CENI-E-2026-0001");
  await expect(
    page.getByRole("heading", { name: "Café Luz Cívica", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Nivel Oro/)).toBeVisible();
});
