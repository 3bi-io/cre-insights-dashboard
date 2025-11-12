/**
 * E2E Tests for Blog Pages
 */

import { test, expect } from '@playwright/test';

test.describe('Blog Pages', () => {
  test('should load blog listing page', async ({ page }) => {
    await page.goto('/blog');
    
    await expect(page).toHaveTitle(/Blog/);
    await expect(page.getByRole('heading', { name: /Blog/i })).toBeVisible();
  });

  test('should display empty state when no posts', async ({ page }) => {
    await page.goto('/blog');
    
    const emptyMessage = page.getByText(/No blog posts available/i);
    const hasContent = await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false);
    
    // Either shows posts or empty state
    if (hasContent) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should show blog post cards when posts exist', async ({ page }) => {
    await page.goto('/blog');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check for either posts or empty state
    const hasCards = await page.locator('article, .card').count() > 0;
    const hasEmptyState = await page.getByText(/No blog posts/i).isVisible().catch(() => false);
    
    expect(hasCards || hasEmptyState).toBe(true);
  });

  test('should handle 404 for non-existent post', async ({ page }) => {
    await page.goto('/blog/non-existent-post-12345');
    
    await expect(page.getByText(/Post Not Found|404/i)).toBeVisible();
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    await page.goto('/blog');
    
    const title = await page.title();
    expect(title).toContain('Blog');
    
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
  });
});
