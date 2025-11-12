/**
 * E2E Tests for Landing Page
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/ATS.me/);
    
    // Check hero section
    await expect(page.getByRole('heading', { name: /Transform Your/i })).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test Features link
    await page.getByRole('link', { name: /Features/i }).first().click();
    await expect(page).toHaveURL(/\/features/);
    
    // Go back and test Pricing
    await page.goto('/');
    await page.getByRole('link', { name: /Pricing/i }).first().click();
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('should have CTA buttons', async ({ page }) => {
    await page.goto('/');
    
    const getStartedButton = page.getByRole('button', { name: /Get Started/i }).first();
    await expect(getStartedButton).toBeVisible();
    
    await getStartedButton.click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should display stats section', async ({ page }) => {
    await page.goto('/');
    
    // Check for stats section
    await expect(page.getByText(/50\+/)).toBeVisible();
    await expect(page.getByText(/companies/i)).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile menu functionality
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
});
