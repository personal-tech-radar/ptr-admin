import { expect, test, type Page } from '@playwright/test';

const email = process.env['ADMIN_EMAIL'];
const password = process.env['ADMIN_PASSWORD'];

async function signIn(page: Page) {
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required for E2E');
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

const cases = [
  {
    name: 'Sources',
    route: '/sources',
    endpoint: '/admin/sources',
    loading: 'Loading sources…',
    empty: 'No sources found',
  },
  {
    name: 'Candidates',
    route: '/sources?tab=candidates',
    endpoint: '/admin/source-candidates',
    loading: 'Loading candidates…',
    empty: 'No candidates found',
  },
  {
    name: 'Articles',
    route: '/articles',
    endpoint: '/admin/articles',
    loading: 'Loading articles…',
    empty: 'No articles found.',
  },
  {
    name: 'Taxonomy',
    route: '/taxonomy',
    endpoint: '/admin/technology-interests',
    loading: 'Loading topics…',
    empty: 'No topics found.',
  },
  {
    name: 'Jobs',
    route: '/jobs',
    endpoint: '/admin/jobs',
    loading: 'Loading jobs…',
    empty: 'No jobs found.',
  },
  {
    name: 'Digests',
    route: '/digests',
    endpoint: '/admin/digests',
    loading: 'Loading digests…',
    empty: 'No digests found.',
  },
  {
    name: 'Users',
    route: '/users',
    endpoint: '/admin/users',
    loading: 'Loading users…',
    empty: 'No users found.',
  },
  {
    name: 'Administrators',
    route: '/admins',
    endpoint: '/admin/admins',
    loading: 'Loading administrators…',
    empty: 'No administrators found.',
  },
  {
    name: 'Information pages',
    route: '/info-pages',
    endpoint: '/admin/info-pages',
    loading: 'Loading information pages…',
    empty: 'No information pages found.',
  },
] as const;

for (const scenario of cases) {
  test(`${scenario.name} list exposes loading, API error, and empty states`, async ({ page }) => {
    await signIn(page);
    let mode: 'error' | 'empty' = 'error';
    await page.route(
      (url) => url.pathname === scenario.endpoint,
      async (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (mode === 'error') {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'List unavailable' }),
          });
        } else {
          const empty =
            scenario.name === 'Administrators'
              ? { items: [], total: 0, page: 1, limit: 20 }
              : { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(empty),
          });
        }
      },
    );
    await page.goto(scenario.route);
    await expect(page.getByText(scenario.loading)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveText('List unavailable');
    mode = 'empty';
    await page.reload();
    await expect(page.getByText(scenario.empty)).toBeVisible();
  });
}
