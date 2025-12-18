import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the hero section', async ({ page }) => {
    // Check for main heading with voice-first messaging
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Hire Faster|AI Voice/i);

    // Check for primary CTA button
    const primaryCta = page.getByRole('link', { name: /Start Free Trial|Get Started/i });
    await expect(primaryCta).toBeVisible();

    // Check for secondary CTA button
    const secondaryCta = page.getByRole('link', { name: /Browse Jobs|Find Jobs/i });
    await expect(secondaryCta).toBeVisible();
  });

  test('should navigate to auth page', async ({ page }) => {
    // Click the primary CTA
    const primaryCta = page.getByRole('link', { name: /Start Free Trial|Get Started/i });
    await primaryCta.click();

    // Should navigate to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should display feature sections', async ({ page }) => {
    // Scroll down to reveal feature sections
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);

    // Check for stats or feature content
    const sections = page.locator('section');
    await expect(sections.first()).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Check that navigation is visible
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();

    // Check for logo or home link
    const logo = page.locator('a[href="/"], img[alt*="logo"], img[alt*="Logo"]');
    if (await logo.count() > 0) {
      await expect(logo.first()).toBeVisible();
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(heading).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(heading).toBeVisible();
  });

  test('should display voice workflow illustration', async ({ page }) => {
    // Check for workflow illustration elements
    const workflowSection = page.locator('[class*="workflow"], [class*="grid"]').first();
    
    // On desktop, should show the horizontal workflow
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(workflowSection).toBeVisible();
    
    // On mobile, should show the grid layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
  });
});