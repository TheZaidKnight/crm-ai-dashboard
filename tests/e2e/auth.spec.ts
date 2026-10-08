import { test, expect } from '@playwright/test';

test.describe('Authentication & Protected Route Gating', () => {
  test('redirects unauthenticated user accessing /dashboard to /login', async ({ page }) => {
    // Navigate directly to protected dashboard
    await page.goto('/dashboard');

    // Middleware must redirect unauthenticated traffic to /login
    await expect(page).toHaveURL(/\/login/);

    // Verify login interface elements are rendered
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('redirects unauthenticated user accessing /admin to /login', async ({ page }) => {
    // Navigate directly to protected admin panel
    await page.goto('/admin');

    // Middleware must redirect unauthenticated traffic to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('navigates cleanly between login and signup pages', async ({ page }) => {
    await page.goto('/login');

    // Click link to sign up
    const signUpLink = page.getByRole('link', { name: /create one/i });
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();

    // Verify signup page rendered
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});
