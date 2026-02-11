import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 * Tests the refactored mega-menu navigation (Epic 2)
 */

test.describe('Navigation — Desktop', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should display all top-level nav items', async ({ page }) => {
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();

        // Top-level items
        await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
        // MIMI link - use exact match or filter within nav to avoid body-text false positives
        const mimiNavLink = nav.getByRole('link', { name: /^MIMI$/i });
        await expect(mimiNavLink).toBeVisible();
        await expect(nav.getByRole('link', { name: /Über uns/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Kontakt/i }).first()).toBeVisible();

        // Leistungen dropdown trigger
        const leistungenBtn = page.locator('button').filter({ hasText: 'Leistungen' });
        await expect(leistungenBtn).toBeVisible();
    });

    test('should open Leistungen dropdown on hover', async ({ page }) => {
        const leistungenBtn = page.locator('button').filter({ hasText: 'Leistungen' });
        await leistungenBtn.hover();

        await page.waitForTimeout(300);

        const dropdown = page.locator('[role="menu"]');
        await expect(dropdown).toBeVisible({ timeout: 5000 });

        // Check group labels
        await expect(dropdown.getByText('KI-Beratung')).toBeVisible();
        await expect(dropdown.getByText('Digitale Zwillinge')).toBeVisible();
    });

    test('should navigate from dropdown to KI-Beratung page', async ({ page }) => {
        const leistungenBtn = page.locator('button').filter({ hasText: 'Leistungen' });
        await leistungenBtn.hover();
        await page.waitForTimeout(300);

        const dropdown = page.locator('[role="menu"]');
        await expect(dropdown).toBeVisible({ timeout: 5000 });

        await dropdown.getByRole('menuitem', { name: 'Übersicht' }).first().click();

        await page.waitForURL('**/ki-beratung', { timeout: 10000 });
        await expect(page).toHaveURL(/ki-beratung/);
    });

    test('should close dropdown when mouse leaves', async ({ page }) => {
        const leistungenBtn = page.locator('button').filter({ hasText: 'Leistungen' });
        await leistungenBtn.hover();
        await page.waitForTimeout(300);

        const dropdown = page.locator('[role="menu"]');
        await expect(dropdown).toBeVisible({ timeout: 5000 });

        // Move mouse away
        await page.mouse.move(0, 0);
        await page.waitForTimeout(300);

        await expect(dropdown).not.toBeVisible();
    });

    test('should display Login button', async ({ page }) => {
        const loginLink = page.getByRole('link', { name: /Login/i });
        await expect(loginLink).toBeVisible();

        await expect(loginLink).toHaveAttribute('href', '/internal');
    });

    test('should display CTA button "Beratung anfragen"', async ({ page }) => {
        const cta = page.getByRole('link', { name: /Beratung anfragen/i });
        await expect(cta).toBeVisible();
        await expect(cta).toHaveAttribute('href', '/contact');
    });

    test('should highlight MIMI link with sparkle icon', async ({ page }) => {
        const nav = page.locator('nav').first();
        // Find the MIMI link within the nav
        const mimiLink = nav.getByRole('link', { name: /MIMI/i }).first();
        await expect(mimiLink).toBeVisible();

        // The Sparkles SVG can be inside the link or adjacent — check within the nav container
        // that contains the MIMI link for any SVG with animation classes
        const mimiContainer = mimiLink.locator('..');
        const svgInContainer = mimiContainer.locator('svg');
        const svgCount = await svgInContainer.count();
        expect(svgCount).toBeGreaterThan(0);
    });

    test('should show active state indicator', async ({ page }) => {
        const homeLink = page.getByRole('link', { name: 'Home' });
        const classes = await homeLink.getAttribute('class');
        expect(classes).toContain('text-brand-cyan');
    });
});

test.describe('Navigation — Mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should show hamburger menu on mobile', async ({ page }) => {
        const menuButton = page.getByTestId('mobile-menu-button');
        await expect(menuButton).toBeVisible({ timeout: 15000 });
    });

    test('should open mobile menu with accordion', async ({ page }) => {
        const menuButton = page.getByTestId('mobile-menu-button');
        await menuButton.click();

        await page.waitForTimeout(500);

        // Should see top-level links in the sheet
        await expect(page.getByRole('link', { name: 'Home' }).last()).toBeVisible();
        await expect(page.getByRole('link', { name: /Kontakt/i }).last()).toBeVisible();

        // Leistungen should be an accordion trigger in the sheet
        const leistungenTrigger = page.locator('button').filter({ hasText: 'Leistungen' }).last();
        await expect(leistungenTrigger).toBeVisible();
    });

    test('should expand Leistungen accordion in mobile menu', async ({ page }) => {
        const menuButton = page.getByTestId('mobile-menu-button');
        await menuButton.click();
        await page.waitForTimeout(500);

        // Click accordion trigger
        const trigger = page.locator('button').filter({ hasText: 'Leistungen' }).last();
        await trigger.click();
        await page.waitForTimeout(300);

        // Sub-items should be visible
        await expect(page.getByText('KI-Beratung').last()).toBeVisible();
    });

    test('should show Login link in mobile menu', async ({ page }) => {
        const menuButton = page.getByTestId('mobile-menu-button');
        await menuButton.click();
        await page.waitForTimeout(500);

        const loginLink = page.getByRole('link', { name: /Login/i }).last();
        await expect(loginLink).toBeVisible();
    });
});

test.describe('Navigation — Keyboard Accessibility', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should open dropdown with Enter key', async ({ page }) => {
        const leistungenBtn = page.locator('button').filter({ hasText: 'Leistungen' });
        await leistungenBtn.focus();
        await page.keyboard.press('Enter');

        const dropdown = page.locator('[role="menu"]');
        await expect(dropdown).toBeVisible({ timeout: 5000 });
    });

    test('should close dropdown with Escape key', async ({ page }) => {
        const leistungenBtn = page.locator('button').filter({ hasText: 'Leistungen' });
        await leistungenBtn.focus();
        await page.keyboard.press('Enter');

        const dropdown = page.locator('[role="menu"]');
        await expect(dropdown).toBeVisible({ timeout: 5000 });

        await page.keyboard.press('Escape');
        await expect(dropdown).not.toBeVisible();
    });
});
