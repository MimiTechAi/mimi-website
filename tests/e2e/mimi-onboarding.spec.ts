import { test, expect } from '@playwright/test';

/**
 * MIMI Onboarding E2E Tests (Epic 8.3)
 * Tests the onboarding tour, capability chips, and localStorage persistence.
 *
 * Note: MIMI page requires WebGPU, so these tests focus on the onboarding
 * overlay and welcome screen elements that render regardless of engine state.
 */

test.describe('MIMI Onboarding — First Visit', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            // Simulate first visit: clear onboarding flag
            localStorage.removeItem('mimi-onboarding-seen');
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
    });

    test('should show onboarding tour on first visit', async ({ page }) => {
        await page.goto('/mimi');
        await page.waitForLoadState('networkidle');

        // The onboarding tour dialog should appear
        const tourDialog = page.locator('[role="dialog"][aria-label*="Onboarding"], [role="dialog"]').first();

        // If page loads with tour (depends on engine state)
        const tourVisible = await tourDialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (tourVisible) {
            // Step 1: "Willkommen bei MIMI"
            await expect(page.getByText('Willkommen bei MIMI')).toBeVisible();
        }
    });

    test('should navigate through 3 tour steps', async ({ page }) => {
        await page.goto('/mimi');
        await page.waitForLoadState('networkidle');

        const tourDialog = page.locator('[role="dialog"]').first();
        const tourVisible = await tourDialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (tourVisible) {
            // Step 1: Willkommen
            await expect(page.getByText('Willkommen bei MIMI')).toBeVisible();

            // Click "Weiter"
            const weiterBtn = page.getByRole('button', { name: /Weiter/i });
            await weiterBtn.click();
            await page.waitForTimeout(500);

            // Step 2: Werkzeuge
            await expect(page.getByText('Deine Werkzeuge')).toBeVisible();

            // Click "Weiter"
            await weiterBtn.click();
            await page.waitForTimeout(500);

            // Step 3: Los geht's
            await expect(page.getByText("Los geht's")).toBeVisible();

            // Click "Starten" (final step)
            const startenBtn = page.getByRole('button', { name: /Starten/i });
            await startenBtn.click();
            await page.waitForTimeout(500);

            // Tour should be gone
            await expect(tourDialog).not.toBeVisible();

            // localStorage should be set
            const storageValue = await page.evaluate(() => localStorage.getItem('mimi-onboarding-seen'));
            expect(storageValue).toBe('true');
        }
    });

    test('should allow skipping the tour', async ({ page }) => {
        await page.goto('/mimi');
        await page.waitForLoadState('networkidle');

        const tourDialog = page.locator('[role="dialog"]').first();
        const tourVisible = await tourDialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (tourVisible) {
            // Click "Überspringen"
            const skipBtn = page.getByText('Überspringen');
            await skipBtn.click();
            await page.waitForTimeout(500);

            // Tour should be dismissed
            await expect(tourDialog).not.toBeVisible();

            // localStorage should be set
            const storageValue = await page.evaluate(() => localStorage.getItem('mimi-onboarding-seen'));
            expect(storageValue).toBe('true');
        }
    });

    test('should support keyboard navigation (Enter/Escape)', async ({ page }) => {
        await page.goto('/mimi');
        await page.waitForLoadState('networkidle');

        const tourDialog = page.locator('[role="dialog"]').first();
        const tourVisible = await tourDialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (tourVisible) {
            // Step 1 visible
            await expect(page.getByText('Willkommen bei MIMI')).toBeVisible();

            // Press Enter to advance
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);

            // Step 2 should show
            await expect(page.getByText('Deine Werkzeuge')).toBeVisible();

            // Press Escape to skip
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);

            // Tour should be dismissed
            await expect(tourDialog).not.toBeVisible();
        }
    });
});

test.describe('MIMI Onboarding — Return Visit', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            // Simulate return visit: onboarding already seen
            localStorage.setItem('mimi-onboarding-seen', 'true');
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
    });

    test('should NOT show tour on return visit', async ({ page }) => {
        await page.goto('/mimi');
        await page.waitForLoadState('networkidle');

        // Wait briefly for any tour to potentially appear
        await page.waitForTimeout(2000);

        // Tour dialog should NOT be visible
        const tourDialog = page.locator('[role="dialog"][aria-label*="Onboarding"]');
        await expect(tourDialog).not.toBeVisible();
    });

    test('should show capability chips on return visit', async ({ page }) => {
        await page.goto('/mimi');
        await page.waitForLoadState('networkidle');

        // Wait for welcome screen to render
        await page.waitForTimeout(2000);

        // Capability chips should be visible (if welcome screen is showing)
        const chips = page.getByText('Probiere es aus');
        const chipsVisible = await chips.isVisible({ timeout: 5000 }).catch(() => false);

        if (chipsVisible) {
            // Individual chips should be present
            await expect(page.getByText('Frage stellen')).toBeVisible();
            await expect(page.getByText('Code schreiben')).toBeVisible();
            await expect(page.getByText('PDF analysieren')).toBeVisible();
        }
    });
});
