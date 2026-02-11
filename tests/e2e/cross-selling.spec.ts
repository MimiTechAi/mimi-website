import { test, expect } from '@playwright/test';

/**
 * Cross-Selling (RelatedServices) E2E Tests (Epic 8.4)
 * Tests that related service cards appear correctly on each page.
 */

const SERVICE_PAGES = [
    { url: '/ki-beratung', slug: 'ki-beratung', title: 'KI-Beratung' },
    { url: '/digitale-zwillinge', slug: 'digitale-zwillinge', title: 'Digitale Zwillinge' },
    { url: '/about', slug: 'about', title: 'Über uns' },
    { url: '/contact', slug: 'contact', title: 'Kontakt' },
];

test.describe('Cross-Selling / RelatedServices', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            sessionStorage.setItem('introShown', 'true');
            localStorage.setItem('cookieConsent', 'accepted');
        });
    });

    for (const servicePage of SERVICE_PAGES) {
        test(`${servicePage.title}: should display related service section`, async ({ page }) => {
            await page.goto(servicePage.url);
            await page.waitForLoadState('networkidle');

            // Scroll to bottom where RelatedServices is typically rendered
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1000);

            // Look for the RelatedServices heading
            const relatedHeading = page.locator('text=/Das könnte Sie auch interessieren/i').first();
            await expect(relatedHeading).toBeVisible({ timeout: 10000 });
        });

        test(`${servicePage.title}: service cards should NOT link to current page`, async ({ page }) => {
            await page.goto(servicePage.url);
            await page.waitForLoadState('networkidle');

            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1000);

            const relatedHeading = page.locator('text=/Das könnte Sie auch interessieren/i').first();
            if (await relatedHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
                // Find the service card grid (the grid div containing the service cards)
                // Service cards are links inside a grid, NOT the "Alle Leistungen entdecken" CTA
                const section = relatedHeading.locator('xpath=ancestor::section');

                if (await section.isVisible().catch(() => false)) {
                    // Only check card links (those in the grid), not CTA buttons
                    // Card links have descriptive text about services
                    const gridCards = section.locator('.grid a[href]');
                    const count = await gridCards.count();

                    for (let i = 0; i < count; i++) {
                        const href = await gridCards.nth(i).getAttribute('href');
                        expect(href).not.toBe(servicePage.url);
                    }
                }
            }
        });
    }

    test('KI-Beratung: related service cards should be clickable and navigate', async ({ page }) => {
        await page.goto('/ki-beratung');
        await page.waitForLoadState('networkidle');

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        const relatedHeading = page.locator('text=/Das könnte Sie auch interessieren/i').first();

        if (await relatedHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
            const section = relatedHeading.locator('xpath=ancestor::section');

            if (await section.isVisible().catch(() => false)) {
                const firstCard = section.locator('.grid a[href]').first();
                const href = await firstCard.getAttribute('href');
                expect(href).toBeTruthy();

                if (href) {
                    await firstCard.click();
                    await page.waitForURL(`**${href}`, { timeout: 10000 });
                    expect(page.url()).not.toContain('/ki-beratung');
                }
            }
        }
    });
});
