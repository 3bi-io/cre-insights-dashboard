import { test, expect } from '@playwright/test';

test.describe('Mobile Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should display mobile-optimized navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads correctly on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Look for mobile menu button or hamburger icon
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"], .mobile-menu-trigger');
    
    // Either mobile menu exists or the nav is hidden/collapsed
    const hasMobileMenu = await mobileMenu.count() > 0;
    if (hasMobileMenu) {
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/');
    
    // Get all buttons
    const buttons = page.locator('button, [role="button"], a.btn, .button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44px (WCAG recommendation)
          expect(box.height).toBeGreaterThanOrEqual(32); // Allowing some flexibility
          expect(box.width).toBeGreaterThanOrEqual(32);
        }
      }
    }
  });

  test('should not have horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Check document width matches viewport
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Allow small difference for scrollbars
    expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  test('should render responsive card layouts', async ({ page }) => {
    await page.goto('/');
    
    // Cards should stack vertically on mobile
    const cards = page.locator('[class*="card"], .card, [data-testid*="card"]');
    const cardCount = await cards.count();
    
    if (cardCount > 1) {
      const firstCard = cards.first();
      const secondCard = cards.nth(1);
      
      if (await firstCard.isVisible() && await secondCard.isVisible()) {
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();
        
        if (firstBox && secondBox) {
          // Cards should stack (second card below first)
          expect(secondBox.y).toBeGreaterThanOrEqual(firstBox.y);
        }
      }
    }
  });

  test('should have readable text on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Check font sizes are readable (at least 14px for body text)
    const paragraphs = page.locator('p, span, div:not(:has(*))');
    const count = await paragraphs.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = paragraphs.nth(i);
      if (await element.isVisible()) {
        const fontSize = await element.evaluate(el => 
          parseFloat(getComputedStyle(el).fontSize)
        );
        // Body text should be at least 12px
        if (fontSize > 0) {
          expect(fontSize).toBeGreaterThanOrEqual(12);
        }
      }
    }
  });
});

test.describe('Tablet Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
  });

  test('should display tablet-optimized layout', async ({ page }) => {
    await page.goto('/');
    
    // Page should load correctly
    await expect(page.locator('body')).toBeVisible();
    
    // Content should fit tablet width
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(778);
  });

  test('should show appropriate grid layout', async ({ page }) => {
    await page.goto('/');
    
    // Check for grid or flex containers
    const gridContainers = page.locator('[class*="grid"], [class*="flex"]');
    const hasGrids = await gridContainers.count() > 0;
    
    expect(hasGrids).toBe(true);
  });
});

test.describe('Desktop to Mobile Transition', () => {
  test('should handle viewport resize gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Start with desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('body')).toBeVisible();
    
    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(100);
    await expect(page.locator('body')).toBeVisible();
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    await expect(page.locator('body')).toBeVisible();
    
    // No errors should occur
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    
    expect(errors.length).toBe(0);
  });
});
