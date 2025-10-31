import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email input
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
    
    // Check for submit button
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await expect(submitButton).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without filling form
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();
    
    // Wait a bit for validation
    await page.waitForTimeout(500);
    
    // Check if form is still visible (indicating validation prevented submission)
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
  });

  test('should have link to signup page', async ({ page }) => {
    await page.goto('/login');
    
    // Look for signup link
    const signupLink = page.getByRole('link', { name: /sign up|register|create account/i });
    await expect(signupLink).toBeVisible();
    
    // Click and verify navigation
    await signupLink.click();
    await page.waitForURL('**/register');
    expect(page.url()).toContain('/register');
  });

  test('should display forgot password link', async ({ page }) => {
    await page.goto('/login');
    
    // Look for forgot password link
    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');
    
    // Enter invalid email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('invalid-email');
    
    // Enter password
    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.fill('password123');
    
    // Try to submit
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();
    
    // Wait for potential validation message
    await page.waitForTimeout(500);
    
    // Form should still be visible
    await expect(emailInput).toBeVisible();
  });
});

test.describe('Registration Flow', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Check for email input
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
  });

  test('should have link back to login', async ({ page }) => {
    await page.goto('/register');
    
    // Look for login link
    const loginLink = page.getByRole('link', { name: /sign in|login|already have/i });
    await expect(loginLink).toBeVisible();
    
    // Click and verify navigation
    await loginLink.click();
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
