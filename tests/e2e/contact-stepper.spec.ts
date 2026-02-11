import { test, expect } from '@playwright/test';

/**
 * Contact-Stepper E2E Tests (Epic 8.2)
 * Tests the 3-step contact form with FormStepper component.
 */

test.describe('Contact Stepper', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
        await page.goto('/contact');
        await page.waitForLoadState('networkidle');

        // Dismiss cookie banner if visible
        const cookieBanner = page.getByRole('button', { name: /Alle akzeptieren/i });
        if (await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
            await cookieBanner.click();
            await page.waitForTimeout(500);
        }
    });

    test('should display Step 1 initially with personal fields', async ({ page }) => {
        // Step indicators should show the 3 steps with their labels
        // Use exact matching to avoid "Persönliche Beratung" conflicts
        await expect(page.locator('span').filter({ hasText: /^Persönlich$/ }).first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator('span').filter({ hasText: /^Anliegen$/ }).first()).toBeVisible();
        await expect(page.locator('span').filter({ hasText: /^Nachricht$/ }).first()).toBeVisible();

        // Personal fields should be visible
        await expect(page.locator('#name')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
    });

    test('should show validation errors on empty Step 1 submission', async ({ page }) => {
        // Try to proceed without filling required fields
        const nextButton = page.getByRole('button', { name: /Weiter/i });
        await nextButton.click();
        await page.waitForTimeout(500);

        // Validation errors should appear
        const errorMessages = page.locator('text=/Bitte geben Sie/i');
        await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
    });

    test('should proceed from Step 1 to Step 2 after filling required fields', async ({ page }) => {
        // Fill Step 1 required fields
        await page.locator('#name').fill('Max Mustermann');
        await page.locator('#email').fill('max@example.com');

        // Click next
        const nextButton = page.getByRole('button', { name: /Weiter/i });
        await nextButton.click();
        await page.waitForTimeout(800);

        // Step 2 "Anliegen" content should now be visible
        const step2Content = page.locator('text=/Beratung|Service|Anliegen|KI|Interesse/i');
        await expect(step2Content.first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate back from Step 2 to Step 1 preserving data', async ({ page }) => {
        // Fill and advance to step 2
        await page.locator('#name').fill('Max Mustermann');
        await page.locator('#email').fill('max@example.com');
        await page.getByRole('button', { name: /Weiter/i }).click();
        await page.waitForTimeout(800);

        // Go back
        const backButton = page.getByRole('button', { name: /Zurück/i });
        await backButton.click();
        await page.waitForTimeout(800);

        // Data should still be there
        await expect(page.locator('#name')).toHaveValue('Max Mustermann');
        await expect(page.locator('#email')).toHaveValue('max@example.com');
    });

    test('should display 3-step FormStepper with step circles', async ({ page }) => {
        // The form card header — use .nth(1) or locator to disambiguate from nav button
        await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Beratung anfragen' })).toBeVisible();
        await expect(page.getByText('In 3 einfachen Schritten')).toBeVisible();

        // Weiter button should be visible
        await expect(page.getByRole('button', { name: /Weiter/i })).toBeVisible();
        // Zurück should be disabled on step 1
        const backBtn = page.getByRole('button', { name: /Zurück/i });
        await expect(backBtn).toBeDisabled();
    });
});
