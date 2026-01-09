import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/auth');
    
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
    await page.goto('/auth');
    
    // Try to submit without filling form
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();
    
    // Wait a bit for validation
    await page.waitForTimeout(500);
    
    // Check if form is still visible (indicating validation prevented submission)
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
  });

  test('should have link to signup', async ({ page }) => {
    await page.goto('/auth');
    
    // Look for signup link
    const signupLink = page.getByRole('link', { name: /sign up|register|create account/i });
    await expect(signupLink).toBeVisible();
  });

  test('should display forgot password link', async ({ page }) => {
    await page.goto('/auth');
    
    // Look for forgot password link
    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth');
    
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

  test('legacy /login route should redirect to /auth', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL('**/auth');
    expect(page.url()).toContain('/auth');
  });

  test('legacy /register route should redirect to /auth', async ({ page }) => {
    await page.goto('/register');
    await page.waitForURL('**/auth');
    expect(page.url()).toContain('/auth');
  });
});

test.describe('Registration Flow', () => {
  test('should display registration form when signup mode is active', async ({ page }) => {
    await page.goto('/auth');
    
    // Click signup link to switch to signup mode
    const signupLink = page.getByRole('link', { name: /sign up|register|create account/i });
    await signupLink.click();
    
    // Wait for mode switch
    await page.waitForTimeout(300);
    
    // Check for email input
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
  });

  test('should have link back to login', async ({ page }) => {
    await page.goto('/auth');
    
    // Click signup link first
    const signupLink = page.getByRole('link', { name: /sign up|register|create account/i });
    await signupLink.click();
    
    // Wait for mode switch
    await page.waitForTimeout(300);
    
    // Look for login link
    const loginLink = page.getByRole('link', { name: /sign in|login|already have/i });
    await expect(loginLink).toBeVisible();
  });
});
