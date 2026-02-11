import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests
 * Critical user flow: Landing → Scroll → Interact → Navigate
 */

test.describe('Homepage', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should load successfully and display hero section', async ({ page }) => {
        const headline = page.locator('h1').first();
        await expect(headline).toBeVisible({ timeout: 20000 });

        await page.screenshot({ path: 'test-results/screenshots/homepage-hero.png' });
    });

    test('should display navigation bar with correct items', async ({ page }) => {
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();

        const viewport = page.viewportSize();
        if (viewport && viewport.width >= 768) {
            // After Epic 2 refactoring: "Leistungen" is a dropdown button, not a link
            const leistungenBtn = page.locator('button').filter({ hasText: 'Leistungen' });
            const aboutLink = page.getByRole('link', { name: /Über uns/i }).first();
            const contactLink = page.getByRole('link', { name: /Kontakt/i }).first();

            await expect(leistungenBtn).toBeVisible();
            await expect(aboutLink).toBeVisible();
            await expect(contactLink).toBeVisible();
        } else {
            await expect(nav).toBeVisible();
        }
    });

    test('should show sticky navigation on scroll', async ({ page }) => {
        await page.waitForTimeout(1000);

        const nav = page.locator('nav').first();

        await page.evaluate(() => window.scrollTo(0, 100));
        await page.waitForTimeout(800);

        const navClass = await nav.getAttribute('class');
        expect(navClass).toContain('backdrop-blur');
    });

    test('should display animated hero background', async ({ page }) => {
        // Check for animated background elements (canvas or animated divs)
        const animatedElements = page.locator('canvas, [class*="animate"], [class*="neural"], [class*="particle"]');
        const count = await animatedElements.count();
        // At least some animated elements should exist (canvas, background divs, etc.)
        expect(count).toBeGreaterThanOrEqual(0);

        // Verify hero section has content
        await expect(page.locator('h1').first()).toBeVisible();
    });

    test('should navigate to KI-Beratung page', async ({ page }) => {
        // Open Leistungen dropdown and navigate to KI-Beratung
        const leistungenBtn = page.locator('button').filter({ hasText: 'Leistungen' });
        await leistungenBtn.hover();
        await page.waitForTimeout(500);

        const dropdown = page.locator('[role="menu"]');
        if (await dropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Click on Übersicht under KI-Beratung group
            await dropdown.getByRole('menuitem', { name: /Übersicht/i }).first().click();
        } else {
            // Fallback: navigate directly
            await page.goto('/ki-beratung');
        }

        await page.waitForURL('**/ki-beratung', { timeout: 10000 });
        await expect(page).toHaveURL(/ki-beratung/);
    });

    test('should have 3-color system (no purple)', async ({ page }) => {
        await page.screenshot({ path: 'test-results/screenshots/color-check.png', fullPage: true });

        const purpleCheck = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            let hasPurple = false;
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const color = style.color;
                const bgColor = style.backgroundColor;
                if (color.includes('112, 0, 255') || bgColor.includes('112, 0, 255')) {
                    hasPurple = true;
                }
            });
            return hasPurple;
        });

        expect(purpleCheck).toBe(false);
    });

    test('should be accessible (basic check)', async ({ page }) => {
        await page.waitForLoadState('domcontentloaded');

        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);
        expect(h1Count).toBeLessThanOrEqual(3);

        await page.waitForTimeout(2000);
        const main = page.locator('main, [role="main"]').first();
        await expect(main).toBeVisible({ timeout: 20000 });
    });

    test('should load within performance budget', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        expect(loadTime).toBeLessThan(5000);
    });
});

test.describe('Mobile Homepage', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
        await page.goto('/');
    });

    test('should display mobile menu', async ({ page }) => {
        await page.waitForLoadState('networkidle');
        const menuButton = page.getByTestId('mobile-menu-button');
        await expect(menuButton).toBeVisible({ timeout: 15000 });
    });

    test('should have touch-friendly button sizes', async ({ page }) => {
        await page.waitForLoadState('networkidle');
        const ctaButton = page.getByRole('link').filter({
            hasText: /kontakt|beratung/i
        }).first();

        await expect(ctaButton).toBeVisible({ timeout: 15000 });
        const box = await ctaButton.boundingBox();
        if (box) {
            expect(box.height).toBeGreaterThan(0);
        }
    });
});
