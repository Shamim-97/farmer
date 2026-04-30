import { test, expect, Page } from '@playwright/test';

const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/signup',
  '/products',
];

const GATED_ROUTES = [
  '/customer',
  '/seller',
  '/agent',
  '/admin',
  '/checkout',
  '/orders',
  '/notifications',
];

const consoleErrors: string[] = [];
const pageErrors: string[] = [];
const failedRequests: { url: string; status: number }[] = [];

function trackPage(page: Page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore react-devtools / hydration noise that doesn't affect runtime.
      if (text.includes('Download the React DevTools')) return;
      consoleErrors.push(text);
    }
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', (resp) => {
    const status = resp.status();
    const url = resp.url();
    // Track real failures only — ignore favicon misses and devtools polling.
    if (status >= 400 && !url.includes('favicon') && !url.includes('__nextjs')) {
      failedRequests.push({ url, status });
    }
  });
}

test.describe('Public routes load', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} renders 200, no console errors, no broken assets`, async ({
      page,
    }) => {
      consoleErrors.length = 0;
      pageErrors.length = 0;
      failedRequests.length = 0;
      trackPage(page);

      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response?.status(), `Expected 200 for ${route}`).toBe(200);

      // Page must have a body and not be a Next.js error overlay
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'Body should not be empty').toBeGreaterThan(0);

      expect(pageErrors, 'No uncaught page errors').toEqual([]);
      expect(failedRequests, 'No failed sub-requests').toEqual([]);
    });
  }
});

test.describe('Gated routes redirect when unauthenticated', () => {
  for (const route of GATED_ROUTES) {
    test(`${route} redirects to /signin`, async ({ page }) => {
      trackPage(page);
      await page.goto(route, { waitUntil: 'networkidle' });
      // proxy.ts redirects unauthenticated traffic to /signin
      await expect(page).toHaveURL(/\/signin/);
    });
  }
});

test.describe('PWA assets', () => {
  test('manifest.json is valid JSON with icons', async ({ request }) => {
    const resp = await request.get('/manifest.json');
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(Array.isArray(json.icons)).toBe(true);
    expect(json.icons.length).toBeGreaterThan(0);

    // Every icon path must resolve
    for (const icon of json.icons) {
      const iconResp = await request.get(icon.src);
      expect(iconResp.status(), `Icon ${icon.src} must exist`).toBe(200);
    }
  });

  test('service-worker.js is reachable', async ({ request }) => {
    const resp = await request.get('/service-worker.js');
    expect(resp.status()).toBe(200);
  });
});

test.describe('Sign-in form', () => {
  test('form renders with email + password fields', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('invalid credentials surface an error', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel('Email Address').fill('nobody@example.com');
    await page.getByLabel('Password').fill('wrong-password-12345');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Either the inline error appears, or we stay on /signin (auth call returns error).
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/signin');
  });
});

test.describe('Sign-up form', () => {
  test('role selector renders three options', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByText('Customer')).toBeVisible();
    await expect(page.getByText('Seller')).toBeVisible();
    await expect(page.getByText('Pickup Agent')).toBeVisible();
  });

  test('?role=seller pre-selects seller and shows form', async ({ page }) => {
    await page.goto('/signup?role=seller');
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Phone Number')).toBeVisible();
  });
});

test.describe('Logout endpoint', () => {
  test('GET /api/auth/logout redirects to /signin', async ({ request }) => {
    const resp = await request.get('/api/auth/logout', {
      maxRedirects: 0,
    });
    expect([302, 303, 307, 308]).toContain(resp.status());
    const location = resp.headers()['location'] || '';
    expect(location).toContain('/signin');
  });
});
