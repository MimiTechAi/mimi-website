import { test, expect } from '@playwright/test';

/**
 * Service Pages E2E Tests
 * Tests KI-Beratung and Digitale Zwillinge pages
 * (URLs updated after Epic 2: /services/* → /ki-beratung, /digitale-zwillinge)
 */

test.describe('KI-Beratung Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
    });

    test('should load and display key content', async ({ page }) => {
        await page.goto('/ki-beratung');
        await page.waitForLoadState('networkidle');

        const mainHeading = page.locator('h1').first();
        await expect(mainHeading).toBeVisible({ timeout: 20000 });

        await page.screenshot({ path: 'test-results/screenshots/ki-beratung.png' });
    });

    test('should have working CTA button', async ({ page }) => {
        await page.goto('/ki-beratung');
        await page.waitForLoadState('networkidle');

        // Find CTA linking to contact or beratung
        const ctaButton = page.getByRole('link').filter({ hasText: /Beratung|Kontakt|Jetzt/i }).first();
        await expect(ctaButton).toBeVisible({ timeout: 10000 });

        await ctaButton.click({ force: true });
        await page.waitForURL('**/contact', { timeout: 10000 });
    });

    test('should display service offerings', async ({ page }) => {
        await page.goto('/ki-beratung');
        await page.waitForLoadState('networkidle');

        // Check for content sections with cards or service descriptions
        const contentElements = await page.locator('h2, h3').count();
        expect(contentElements).toBeGreaterThan(2);
    });
});

test.describe('Digitale Zwillinge Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
    });

    test('should load with headline', async ({ page }) => {
        await page.goto('/digitale-zwillinge');
        await page.waitForLoadState('networkidle');

        const headline = page.locator('h1').first();
        await expect(headline).toBeVisible({ timeout: 20000 });

        await page.screenshot({ path: 'test-results/screenshots/digitale-zwillinge.png' });
    });

    test('should have phase or process indicators', async ({ page }) => {
        await page.goto('/digitale-zwillinge');
        await page.waitForLoadState('networkidle');

        // Check for content sections that describe the process
        const contentSections = await page.locator('h2, h3').count();
        expect(contentSections).toBeGreaterThan(2);
    });

    test('should display process flow', async ({ page }) => {
        await page.goto('/digitale-zwillinge');
        await page.waitForLoadState('networkidle');

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);

        const contentElements = await page.locator('h1, h2, h3, p').count();
        expect(contentElements).toBeGreaterThan(5);
    });
});
