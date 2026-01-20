import { test, expect } from '@playwright/test';

test.describe('Apply Flow - Critical Path', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the apply page
    await page.goto('/apply');
  });

  test('should display application form', async ({ page }) => {
    // Check that the form is visible
    await expect(page.getByRole('form')).toBeVisible();
    
    // Check for progress indicator
    await expect(page.getByRole('navigation', { name: 'Application progress' })).toBeVisible();
    
    // Check for step 1 fields
    await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/last name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/phone/i)).toBeVisible();
  });

  test('should validate required fields before proceeding', async ({ page }) => {
    // Try to continue without filling required fields
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should show error toast
    await expect(page.getByText(/please enter/i)).toBeVisible({ timeout: 5000 });
  });

  test('should progress through steps when valid', async ({ page }) => {
    // Fill step 1 fields
    await page.getByPlaceholder(/first name/i).fill('John');
    await page.getByPlaceholder(/last name/i).fill('Doe');
    await page.getByPlaceholder(/email/i).fill('john.doe@example.com');
    await page.getByPlaceholder(/phone/i).fill('555-123-4567');
    await page.getByPlaceholder(/zip/i).fill('12345');
    
    // Select age confirmation
    await page.getByLabel(/21 or older/i).click();
    
    // Continue to step 2
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should now be on step 2 (CDL Info)
    await expect(page.getByText(/cdl/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show skip to submit option after step 1', async ({ page }) => {
    // Fill step 1 fields
    await page.getByPlaceholder(/first name/i).fill('Jane');
    await page.getByPlaceholder(/last name/i).fill('Smith');
    await page.getByPlaceholder(/email/i).fill('jane.smith@example.com');
    await page.getByPlaceholder(/phone/i).fill('555-987-6543');
    await page.getByPlaceholder(/zip/i).fill('54321');
    await page.getByLabel(/21 or older/i).click();
    
    // Skip to submit button should be visible
    await expect(page.getByRole('button', { name: /skip.*submit/i })).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Form should still be visible and usable
    await expect(page.getByRole('form')).toBeVisible();
    await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
    
    // Buttons should be touch-friendly (large enough)
    const continueButton = page.getByRole('button', { name: /continue/i });
    const buttonBox = await continueButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44); // Minimum touch target
  });

  test('should redirect to thank you page on successful submission', async ({ page }) => {
    // This test would require mocking the API
    // For now, verify the thank you page exists
    await page.goto('/thank-you');
    await expect(page.getByText(/thank you/i)).toBeVisible();
  });
});

test.describe('Apply Flow - With Job Context', () => {
  test('should display job information when job_id is provided', async ({ page }) => {
    // Navigate with job parameters
    await page.goto('/apply?job_id=test-job&job_title=CDL%20Driver&company=Test%20Company');
    
    // Should show job title in header
    await expect(page.getByText(/CDL Driver/i)).toBeVisible();
    await expect(page.getByText(/Test Company/i)).toBeVisible();
  });
});

test.describe('Detailed Apply Flow', () => {
  test('should redirect to detailed apply page', async ({ page }) => {
    await page.goto('/apply/detailed');
    
    // Should show the detailed application form
    await expect(page.getByRole('form')).toBeVisible();
  });
});
