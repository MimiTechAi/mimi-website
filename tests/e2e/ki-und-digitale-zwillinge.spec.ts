import { test, expect } from '@playwright/test';

test.describe('KI-Beratung Seiten', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('introShown', 'true');
      localStorage.setItem('cookieConsent', 'accepted');
    });
  });

  test('Übersichtsseite /ki-beratung lädt und zeigt Kerninhalte', async ({ page }) => {
    await page.goto('/ki-beratung');
    await page.waitForLoadState('networkidle');

    // Use h1 to be specific — avoid matching nav dropdown items
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 20000 });

    const cta = page.getByRole('link').filter({ hasText: /Beratung|Kontakt|Jetzt/i }).first();
    await expect(cta).toBeVisible({ timeout: 20000 });
  });

  test('Unternehmen-Seite hat Zurück-Link zur Übersicht', async ({ page }) => {
    await page.goto('/ki-beratung/unternehmen');
    await page.waitForLoadState('networkidle');

    const backLink = page.getByRole('link', { name: /Zurück zur Übersicht KI-Beratung/i });
    await expect(backLink).toBeVisible({ timeout: 20000 });

    await backLink.click();
    await page.waitForURL('**/ki-beratung', { timeout: 10000 });
  });

  test('Selbständige-Seite hat Zurück-Link zur Übersicht', async ({ page }) => {
    await page.goto('/ki-beratung/selbstaendige');
    await page.waitForLoadState('networkidle');

    const backLink = page.getByRole('link', { name: /Zurück zur Übersicht KI-Beratung/i });
    await expect(backLink).toBeVisible({ timeout: 20000 });

    await backLink.click();
    await page.waitForURL('**/ki-beratung', { timeout: 10000 });
  });
});

test.describe('Digitale Zwillinge Seiten', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('introShown', 'true');
      localStorage.setItem('cookieConsent', 'accepted');
    });
  });

  test('Übersichtsseite /digitale-zwillinge lädt und zeigt Kerninhalte', async ({ page }) => {
    await page.goto('/digitale-zwillinge');
    await page.waitForLoadState('networkidle');

    // Use h1 to be specific
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 20000 });

    const cta = page.getByRole('link').filter({ hasText: /Demo|Beratung|Kontakt|Jetzt/i }).first();
    await expect(cta).toBeVisible({ timeout: 20000 });
  });

  test('Urban-Seite hat Zurück-Link zur Übersicht', async ({ page }) => {
    await page.goto('/digitale-zwillinge/urban');
    await page.waitForLoadState('networkidle');

    const backLink = page.getByRole('link', { name: /Zurück zur Übersicht Digitale Zwillinge/i });
    await expect(backLink).toBeVisible({ timeout: 20000 });

    await backLink.click();
    await page.waitForURL('**/digitale-zwillinge', { timeout: 10000 });
  });

  test('Bau-Seite hat Zurück-Link zur Übersicht', async ({ page }) => {
    await page.goto('/digitale-zwillinge/bau');
    await page.waitForLoadState('networkidle');

    const backLink = page.getByRole('link', { name: /Zurück zur Übersicht Digitale Zwillinge/i });
    await expect(backLink).toBeVisible({ timeout: 20000 });

    await backLink.click();
    await page.waitForURL('**/digitale-zwillinge', { timeout: 10000 });
  });

  test('Unternehmens-Seite hat Zurück-Link zur Übersicht', async ({ page }) => {
    await page.goto('/digitale-zwillinge/unternehmen');
    await page.waitForLoadState('networkidle');

    const backLink = page.getByRole('link', { name: /Zurück zur Übersicht Digitale Zwillinge/i });
    await expect(backLink).toBeVisible({ timeout: 20000 });

    await backLink.click();
    await page.waitForURL('**/digitale-zwillinge', { timeout: 10000 });
  });
});
