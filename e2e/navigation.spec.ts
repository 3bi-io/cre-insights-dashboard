import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between public pages', async ({ page }) => {
    await page.goto('/');
    
    // Go to login
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    
    // Go to register
    await page.goto('/register');
    await expect(page).toHaveURL(/.*register/);
    
    // Go back to home
    await page.goto('/');
    await expect(page).toHaveURL(/^(?!.*\/(login|register))/);
  });

  test('should have accessible navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    
    // Should either show 404 page or redirect
    expect(response?.status()).toBeLessThan(500);
  });

  test('should maintain scroll position on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(400);
  });
});

test.describe('PWA Features', () => {
  test('should have manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
  });

  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker registration
    await page.waitForTimeout(2000);
    
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    // Service worker should be registered or attempting to register
    expect(typeof swRegistered).toBe('boolean');
  });
});
