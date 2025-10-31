import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the hero section', async ({ page }) => {
    // Check for hero heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    
    // Check for CTA buttons
    const ctaButton = page.getByRole('button', { name: /get started|sign up/i });
    await expect(ctaButton).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click login/sign in button
    await page.click('text=/Sign In|Login/i');
    
    // Wait for navigation
    await page.waitForURL('**/login');
    
    // Verify we're on the login page
    expect(page.url()).toContain('/login');
  });

  test('should display feature sections', async ({ page }) => {
    // Scroll down to features section
    await page.evaluate(() => window.scrollBy(0, 500));
    
    // Check for feature cards or sections
    const features = page.locator('[data-testid*="feature"], .feature-card');
    const count = await features.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should have working navigation', async ({ page }) => {
    // Check if navigation menu exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for logo or home link
    const logo = page.locator('[data-testid="logo"], .logo, a[href="/"]').first();
    await expect(logo).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(heading).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(heading).toBeVisible();
  });

  test('should load hero image', async ({ page }) => {
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    
    // Check if images are present
    const images = page.locator('img');
    const count = await images.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Check if at least one image is visible
    const firstImage = images.first();
    await expect(firstImage).toBeVisible();
  });
});
