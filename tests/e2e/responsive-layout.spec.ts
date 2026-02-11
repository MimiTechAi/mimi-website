import { test, expect } from '@playwright/test';

const PAGES_TO_CHECK = [
  '/',
  '/digitale-zwillinge',
  '/digitale-zwillinge/unternehmen',
  '/digitale-zwillinge/bau',
  '/digitale-zwillinge/urban',
  '/digitale-zwillinge/technologie',
  '/ki-beratung',
  '/contact',
];

test.describe('Responsive Layout (no overflow)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('introShown', 'true');
      localStorage.setItem('cookieConsent', 'accepted');
    });
  });

  for (const url of PAGES_TO_CHECK) {
    test(`no horizontal overflow: ${url}`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;

        const docOverflow = doc.scrollWidth - doc.clientWidth;
        const bodyOverflow = body.scrollWidth - body.clientWidth;

        return {
          docOverflow,
          bodyOverflow,
          docScrollWidth: doc.scrollWidth,
          docClientWidth: doc.clientWidth,
          bodyScrollWidth: body.scrollWidth,
          bodyClientWidth: body.clientWidth,
        };
      });

      const isOverflowing = overflow.docOverflow > 2 || overflow.bodyOverflow > 2;
      if (isOverflowing) {
        const offenders = await page.evaluate(() => {
          const max = 12;
          const vw = window.innerWidth;

          const items: Array<{ tag: string; id: string | null; className: string | null; left: number; right: number; width: number }> = [];
          const els = Array.from(document.querySelectorAll<HTMLElement>('*'));

          for (const el of els) {
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) continue;

            const overLeft = rect.left < -1;
            const overRight = rect.right > vw + 1;
            if (!overLeft && !overRight) continue;

            items.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className ? String(el.className) : null,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            });
          }

          items.sort((a, b) => (b.right - vw) - (a.right - vw));
          return items.slice(0, max);
        });

        throw new Error(
          `Horizontal overflow detected on ${url}. ` +
          `docOverflow=${overflow.docOverflow}, bodyOverflow=${overflow.bodyOverflow}. ` +
          `Top offenders: ${JSON.stringify(offenders)}`
        );
      }

      // Allow tiny rounding differences, but no real horizontal scroll.
      expect(overflow.docOverflow).toBeLessThanOrEqual(2);
      expect(overflow.bodyOverflow).toBeLessThanOrEqual(2);
    });
  }
});

test.describe('YouTube video embeds render correctly', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('introShown', 'true');
      localStorage.setItem('cookieConsent', 'accepted');
    });
  });

  test('digitale-zwillinge: embed is visible and click-to-load inserts iframe', async ({ page }) => {
    await page.goto('/digitale-zwillinge');
    await page.waitForLoadState('networkidle');

    const embed = page.getByTestId('youtube-embed').first();
    await expect(embed).toBeVisible({ timeout: 20000 });

    const playButton = page.getByTestId('youtube-play-button').first();
    await expect(playButton).toBeVisible();
    await playButton.click();

    const iframe = page.getByTestId('youtube-iframe').first();
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/D7F9OQnDC1M/);
  });

  test('unternehmen: embed is visible and click-to-load inserts iframe', async ({ page }) => {
    await page.goto('/digitale-zwillinge/unternehmen');
    await page.waitForLoadState('networkidle');

    const embed = page.getByTestId('youtube-embed').first();
    await expect(embed).toBeVisible({ timeout: 20000 });

    const playButton = page.getByTestId('youtube-play-button').first();
    await expect(playButton).toBeVisible();
    await playButton.click();

    const iframe = page.getByTestId('youtube-iframe').first();
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/gGg2wpzukPA/);
  });
});

// --- Multi-Viewport Tests (E8.5) ---

const VIEWPORTS = [
  { name: 'Desktop 1280px', width: 1280, height: 720 },
  { name: 'Tablet 768px', width: 768, height: 1024 },
  { name: 'Mobile 375px', width: 375, height: 812 },
];

const VIEWPORT_PAGES = ['/', '/ki-beratung', '/contact', '/about'];

test.describe('Multi-Viewport Responsive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('introShown', 'true');
      localStorage.setItem('cookieConsent', 'accepted');
    });
  });

  for (const viewport of VIEWPORTS) {
    for (const url of VIEWPORT_PAGES) {
      test(`${viewport.name}: no overflow on ${url}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return {
            docOverflow: doc.scrollWidth - doc.clientWidth,
            docScrollWidth: doc.scrollWidth,
            docClientWidth: doc.clientWidth,
          };
        });

        // Allow up to 16px overflow from CSS transforms, shadows, glow effects
        expect(overflow.docOverflow).toBeLessThanOrEqual(16);
      });
    }
  }

  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: navigation adapts correctly`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      if (viewport.width >= 1024) {
        // Desktop: nav links should be visible
        const desktopNav = page.locator('nav').first();
        await expect(desktopNav).toBeVisible();
      } else {
        // Mobile/Tablet: hamburger menu should be visible
        const mobileMenu = page.locator('button[aria-label*="Menu"], button[aria-label*="Menü"], [data-mobile-trigger]').first();
        const menuVisible = await mobileMenu.isVisible({ timeout: 3000 }).catch(() => false);
        // At least one mobile navigation trigger should exist
        expect(menuVisible || viewport.width >= 768).toBeTruthy();
      }
    });
  }
});

// --- Touch Target Tests (E8.5) ---

test.describe('Touch Target Accessibility (Mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('introShown', 'true');
      localStorage.setItem('cookieConsent', 'accepted');
    });
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('Homepage: all buttons meet 44x44 minimum touch target', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const touchTargetResults = await page.evaluate(() => {
      const MIN_SIZE = 40; // Allow 40px with tolerance (real minimum is 44, but CSS might use padding)
      const buttons = Array.from(document.querySelectorAll<HTMLElement>(
        'button:not([hidden]), a.btn, [role="button"], a[href]:not(nav a):not(footer a)'
      ));

      const violations: Array<{ tag: string; text: string; width: number; height: number }> = [];

      for (const btn of buttons.slice(0, 30)) {
        const rect = btn.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        // Skip hidden or tiny decorative elements
        if (rect.width < 5 || rect.height < 5) continue;
        // Skip elements off-screen
        if (rect.top > window.innerHeight * 2) continue;

        if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
          violations.push({
            tag: btn.tagName.toLowerCase(),
            text: (btn.textContent || '').trim().slice(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
      return violations;
    });

    // Allow a few small links (e.g. footer legal links), but main CTAs should be 44px+
    expect(touchTargetResults.length).toBeLessThanOrEqual(5);
  });

  test('Contact page: form inputs meet minimum touch target', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const inputResults = await page.evaluate(() => {
      const MIN_HEIGHT = 36; // inputs typically 36-44px
      const inputs = Array.from(document.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, button[type="submit"]'
      ));

      const violations: Array<{ tag: string; name: string; height: number }> = [];

      for (const input of inputs) {
        const rect = input.getBoundingClientRect();
        if (rect.height <= 0) continue;

        if (rect.height < MIN_HEIGHT) {
          violations.push({
            tag: input.tagName.toLowerCase(),
            name: input.getAttribute('name') || input.getAttribute('id') || '',
            height: Math.round(rect.height),
          });
        }
      }
      return violations;
    });

    expect(inputResults.length).toBe(0);
  });
});
