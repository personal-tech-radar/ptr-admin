import { expect, test, type Locator, type Page } from '@playwright/test';

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

async function expectDialogCentered(page: Page, dialog: Locator) {
  const bounds = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport!.width / 2)).toBeLessThan(2);
  expect(Math.abs(bounds!.y + bounds!.height / 2 - viewport!.height / 2)).toBeLessThan(2);
}

test('dashboard loads, preserves its period, and links to an exact source window', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await signIn(page);
  await page.goto('/dashboard?period=7d');
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link'),
  ).toHaveText([
    'Dashboard',
    'Users',
    'Taxonomy',
    'Sources',
    'Articles',
    'Digests',
    'Jobs',
    'Info pages',
    'Administrators',
  ]);
  await expect(page.getByRole('heading', { name: 'Backend status' })).toBeVisible();
  await expect(page.getByText('Operations', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Period')).toHaveValue('7d');
  await expect(page.getByRole('heading', { name: 'Active users' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Users', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Content pipeline' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Delivery' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Source candidates' })).toBeVisible();
  const headings = await page.getByRole('heading', { level: 2 }).allTextContents();
  expect(headings.indexOf('Source candidates')).toBeLessThan(headings.indexOf('Source types'));
  await expect(page.getByRole('heading', { name: 'All-time article states' })).toHaveCount(0);
  await expect(page.locator('.source-type h3')).toHaveText([
    'Web',
    'Feeds (RSS + Atom)',
    'GitHub Releases',
  ]);
  const headingSizes = await page.evaluate(() => {
    const fontSize = (selector: string) => {
      const heading = document.querySelector(selector);
      return heading ? getComputedStyle(heading).fontSize : null;
    };
    return {
      digest: fontSize('#digests-heading'),
      accounts: fontSize('.row-title'),
      sourceType: fontSize('.source-type h3'),
      candidateLabel: fontSize('.metric-grid .metric span'),
      sourceTypeLabel: fontSize('.source-type .metric span'),
      sourceTypeValue: fontSize('.source-type .metric strong'),
      sourceTypeColumns: getComputedStyle(
        document.querySelector('.source-type-metrics')!,
      ).gridTemplateColumns.split(' ').length,
    };
  });
  expect(headingSizes.accounts).toBe(headingSizes.digest);
  expect(headingSizes.sourceType).toBe(headingSizes.digest);
  expect(headingSizes.sourceTypeLabel).toBe(headingSizes.candidateLabel);
  expect(headingSizes.sourceTypeValue).toBe('16px');
  expect(headingSizes.sourceTypeColumns).toBe(3);
  await expect(page.getByRole('link', { name: /Received articles/ })).toHaveAttribute(
    'title',
    /selected period/,
  );
  await page.getByRole('link', { name: /Sources added/ }).click();
  await expect(page).toHaveURL(/\/sources\?/);
  const url = new URL(page.url());
  expect(url.searchParams.get('createdFrom')).toBeTruthy();
  expect(url.searchParams.get('createdTo')).toBeTruthy();
  await page.goBack();
  await page.getByLabel('Period').selectOption('30d');
  await expect(page).toHaveURL(/period=30d/);
  await page.getByRole('link', { name: /Failed in period/ }).click();
  await expect(page).toHaveURL(/\/digests\?/);
  const failedDigestUrl = new URL(page.url());
  expect(failedDigestUrl.pathname).toBe('/digests');
  expect(failedDigestUrl.searchParams.get('updatedFrom')).toBeTruthy();
  expect(failedDigestUrl.searchParams.get('updatedTo')).toBeTruthy();
  await expect(page.getByLabel('Updated from (UTC)')).toHaveValue(
    failedDigestUrl.searchParams.get('updatedFrom') ?? '',
  );
  await page.goBack();
  await page
    .locator('.source-type')
    .first()
    .getByRole('link', { name: /Received/ })
    .click();
  await expect(page).toHaveURL(/\/articles\?/);
  expect(new URL(page.url()).searchParams.get('sourceGroup')).toBe('web');
  expect(browserErrors).toEqual([]);
});

test('sources and candidates preserve filters and open full details', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await signIn(page);
  await page.goto('/sources?status=active&period=7d');
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('Content pipeline', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Period article count:', { exact: false })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Web method' })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: 'Last attempt' })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: 'Type / method' })).toBeVisible();
  await expect(page.getByRole('columnheader').first()).toHaveText('Status');
  await expect(page.getByRole('button', { name: 'Apply filters' })).toHaveClass(/primary/);
  await expect(page.getByLabel('Status').first()).toHaveValue('active');
  await expect(page.getByLabel('Period')).toHaveValue('7d');
  const sourceRow = page.locator('tbody tr').first();
  await sourceRow.locator('td').nth(1).click();
  await expect(page).toHaveURL(/\/sources\/[0-9a-f-]+/);
  await expect(page).toHaveURL(/period=7d/);
  await expect(page.getByRole('heading', { name: 'Lifecycle' })).toBeVisible();
  await expect(page.locator('.source-status')).toBeVisible();
  await expect(
    page.locator('.header-source-actions').getByRole('button', { name: /Disable|Activate/ }),
  ).toBeVisible();
  await expect(
    page.locator('.header-source-actions').getByRole('button', { name: 'Soft-delete source' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /View source articles/ })).toBeVisible();
  page.once('dialog', (dialog) => void dialog.dismiss());
  await page.getByRole('button', { name: 'Soft-delete source' }).click();
  await expect(page.getByRole('heading', { name: 'Lifecycle' })).toBeVisible();

  await page.goto('/sources?tab=candidates&status=pending');
  await expect(page.getByLabel('Status').first()).toHaveValue('pending');
  await expect(page.getByText('No candidates found')).toBeVisible();
  await expect(page.getByRole('link', { name: /Candidates/ })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('status')).toBe('pending');
  await page.goto('/sources?tab=candidates');
  const candidateRow = page.locator('tbody tr').first();
  if (await candidateRow.count()) {
    await expect(page.getByRole('columnheader').first()).toHaveText('Status');
    await candidateRow.locator('td').nth(1).click();
    await expect(page.locator('.source-status')).toBeVisible();
    const columns = await page
      .locator('.detail-grid')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(1);
    await expect(page.getByRole('button', { name: 'Retry onboarding' })).toBeVisible();
  }
  expect(browserErrors).toEqual([]);
});

test('articles preserve URL filters and expose full analysis without edit controls', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await signIn(page);
  await page.goto('/articles?status=analyzed');
  await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible();
  await expect(page.getByLabel('Status')).toHaveValue('analyzed');
  await expect(page.getByRole('table').or(page.getByText('No articles found.'))).toBeVisible();
  if (await page.getByRole('table').count()) {
    await expect(page.getByRole('columnheader')).toHaveText([
      'Status',
      'Title',
      'Source',
      'Primary stream',
      'Received',
      'Published',
      'Quality / final score',
    ]);
  }
  const articleRow = page.locator('tbody tr').first();
  if (await articleRow.count()) {
    await expect(page.getByRole('columnheader').first()).toHaveText('Status');
    await articleRow.locator('td').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Source data and processing' })).toBeVisible();
    await expect(page.getByText('Feed summary', { exact: true })).toHaveCount(0);
    await expect(page.locator('.article-sections > .panel:first-child dd dl')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Analysis' })).toBeVisible();
    await expect(page.getByText('Article detail', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Open original article/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Soft-delete article' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Analysis attributes' })).toBeVisible();
    await expect(page.getByText('No extraction configuration.', { exact: true })).toHaveCount(0);
    await expect(page.locator('pre')).toHaveCount(0);
    const extractedContentButton = page.getByRole('button', { name: 'View extracted content' });
    await expect(extractedContentButton).toBeVisible();
    const extractedContentSpacing = await page
      .locator('.extracted-content-control')
      .evaluate((element) => {
        const styles = getComputedStyle(element);
        return { marginTop: styles.marginTop, paddingTop: styles.paddingTop };
      });
    expect(extractedContentSpacing).toEqual({ marginTop: '18px', paddingTop: '16px' });
    const extractedContentDialog = page.getByRole('dialog', { name: 'Extracted content' });
    await expect(extractedContentDialog).toBeHidden();
    await extractedContentButton.click();
    await expect(extractedContentDialog).toBeVisible();
    await expectDialogCentered(page, extractedContentDialog);
    await expect(extractedContentDialog.locator('.raw-content')).not.toContainText(/<[^>]+>/);
    await extractedContentDialog.getByRole('button', { name: 'Close' }).click();
    await expect(extractedContentDialog).toBeHidden();
    await expect(extractedContentButton).toBeFocused();
    const sectionColumns = await page
      .locator('.article-sections')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(sectionColumns).toBe(1);
    await expect(page.locator('.article-sections > section > h2')).toHaveText([
      'Source data and processing',
      'Taxonomy and streams',
      'Analysis attributes',
      'Analysis',
    ]);
    await expect(page.getByRole('heading', { name: 'Taxonomy and streams' })).toBeVisible();
    page.once('dialog', (dialog) => void dialog.dismiss());
    await page.getByRole('button', { name: 'Soft-delete article' }).click();
    await expect(page.getByRole('heading', { name: 'Analysis' })).toBeVisible();
  }
  await page.goto('/articles');
  await page.getByLabel('Status').selectOption('failed');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL(/status=failed/);
  expect(browserErrors).toEqual([]);
});

test('taxonomy topics, streams, topic coverage, and confirmed source discovery', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await signIn(page);
  await page.goto('/taxonomy?kind=technology');
  await expect(page.getByRole('heading', { name: 'Taxonomy' })).toBeVisible();
  await expect(page.getByLabel('Kind').first()).toHaveValue('technology');
  await expect(page.getByText('Content model', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Manage topics and streams; inspect actual source coverage.'),
  ).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Coverage', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Add technology or interest' }).click();
  const createDialog = page.getByRole('dialog', { name: 'Add technology or interest' });
  await expect(createDialog).toBeVisible();
  await expectDialogCentered(page, createDialog);
  await expect(createDialog.getByLabel('Name')).toBeVisible();
  await expect(createDialog.getByLabel('Kind')).toBeVisible();
  await page.route('**/admin/technology-interests', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Topic already exists' }),
    });
  });
  await createDialog.getByLabel('Name').fill('Existing topic');
  await createDialog.getByRole('button', { name: 'Add technology or interest' }).click();
  await expect(createDialog.getByRole('alert')).toHaveText('Topic already exists');
  await createDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(createDialog).toBeHidden();
  await expect(page.getByLabel('Kind').first()).toHaveValue('technology');
  await expect(page.getByRole('table').or(page.getByText('No topics found.'))).toBeVisible();
  if (await page.getByRole('table').count()) {
    await expect(page.getByRole('columnheader', { name: 'Aliases' })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Updated' })).toHaveCount(0);
  }
  const topicRow = page.locator('tbody tr').first();
  if (await topicRow.count()) {
    await topicRow.locator('td').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Source coverage' })).toBeVisible();
    await expect(
      page.getByText('No source coverage is associated with a content stream.', { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByLabel('Overall source coverage').getByText('Active sources'),
    ).toBeVisible();
    await expect(page.getByLabel('Content stream coverage')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Topic details' })).toBeVisible();
    await expect(page.getByText('Updated', { exact: true })).toBeVisible();
    await expect(page.getByText('Aliases', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Discover sources' })).toBeVisible();
    await page.getByRole('button', { name: 'Discover sources' }).click();
    const discoverDialog = page.getByRole('dialog', { name: 'Confirm source discovery' });
    await expect(discoverDialog).toBeVisible();
    await expectDialogCentered(page, discoverDialog);
    await expect(discoverDialog.getByRole('button', { name: 'Confirm and discover' })).toHaveClass(
      /primary/,
    );
    await discoverDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(discoverDialog).toBeHidden();
    await page.goBack();
  }
  await page.getByRole('link', { name: 'Content streams' }).click();
  await expect(page).toHaveURL(/tab=streams/);
  await expect(page.getByRole('table')).toBeVisible();
  await page.locator('tbody tr:first-child').locator('td').nth(3).click();
  await expect(page.getByText(/Key:.*immutable/)).toBeVisible();
  await expect(page.locator('.edit-form').getByLabel('Enabled')).toBeVisible();
  await expect(page.locator('.edit-form label').first()).toContainText('Enabled');
  await expect(page.locator('.edit-form').getByLabel('Name')).toBeVisible();
  await page.goto('/coverage');
  await expect(page).toHaveURL(/\/taxonomy$/);
  expect(browserErrors).toEqual([]);
});

test('queues show real counts and URL-filterable jobs', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await signIn(page);
  await page.goto('/jobs?state=failed');
  await expect(page.getByRole('heading', { name: 'Queues' })).toBeVisible();
  await expect(page.getByText('Operations', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Current job snapshots from the five backend queues.', { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'State' })).toHaveValue('failed');
  await expect(page.getByRole('region', { name: 'Queue state counts' })).toBeVisible();
  await expect(page.getByRole('table').or(page.getByText('No jobs found.'))).toBeVisible();
  const jobRow = page.locator('tbody tr').first();
  if (await jobRow.count()) {
    await expect(page.getByRole('columnheader').first()).toHaveText('State');
    await jobRow.locator('td').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Job details' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel pending job' })).toHaveCount(0);
  }
  await page.goto('/jobs');
  await page.getByRole('combobox', { name: 'State' }).selectOption('waiting');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL(/state=waiting/);
  expect(browserErrors).toEqual([]);
});

test('digests preserve filters and show stored recipient and article details', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await signIn(page);
  await page.goto('/digests?deliveryMode=admin_preview');
  await expect(page.getByRole('heading', { name: 'Digests' })).toBeVisible();
  await expect(page.getByText('Delivery', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Review stored deliveries and create administrator previews.', { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Delivery mode' })).toHaveValue('admin_preview');
  await expect(page.getByRole('table').or(page.getByText('No digests found.'))).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Create administrator preview' })).toBeVisible();
  const digestRow = page.locator('tbody tr').first();
  if (await digestRow.count()) {
    await expect(page.getByRole('columnheader').first()).toHaveText('Status');
    await digestRow.locator('td').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Delivery and recipient' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Included articles' })).toBeVisible();
    await expect(
      page.getByText(/Administrator preview — delivered only to administrator/),
    ).toBeVisible();
  }
  await page.goto('/digests');
  await page.getByRole('combobox', { name: 'Status' }).selectOption('failed');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL(/status=failed/);
  expect(browserErrors).toEqual([]);
});

test('digest detail renders an administrator preview and stored article description', async ({
  page,
}) => {
  await signIn(page);
  const id = '00000000-0000-4000-8000-000000000001';
  await page.route(`**/admin/digests/${id}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id,
        userId: '00000000-0000-4000-8000-000000000002',
        userEmail: 'reader@example.org',
        actualRecipientEmail: 'administrator@example.org',
        type: 'daily',
        deliveryMode: 'admin_preview',
        status: 'sent',
        articleCount: 1,
        periodStart: '2026-10-01T00:00:00.000Z',
        periodEnd: '2026-10-02T00:00:00.000Z',
        subject: 'Administrator preview digest',
        createdAt: '2026-10-02T01:00:00.000Z',
        sentAt: '2026-10-02T01:01:00.000Z',
        streamPages: [
          {
            id: 'stream-page',
            streamId: 'stream',
            streamKey: 'backend',
            streamName: 'Backend',
            url: 'https://example.org/stream',
          },
        ],
        triggeringAdministratorId: 'administrator',
        periodKey: 'admin-preview',
        intro: 'Preview intro',
        htmlBody: '<p>Stored body</p>',
        textBody: 'Stored body',
        statisticsSnapshot: null,
        buildDebug: null,
        items: [
          {
            id: 'digest-item',
            articleId: '00000000-0000-4000-8000-000000000003',
            article: {
              title: 'Stored article',
              url: 'https://example.org/article',
              status: 'analyzed',
            },
            position: 1,
            shortDescription: 'An LLM-written stored description.',
            descriptionSource: 'stored_body',
            scoreBreakdown: {
              complexityMatch: 1,
              interestMatch: 2,
              qualityScore: 3,
              recencyScore: 4,
              sourcePreferenceAdjustment: 5,
              technologyMatch: 6,
            },
          },
        ],
      }),
    }),
  );
  await page.goto(`/digests/${id}`);
  await expect(
    page.getByText('Administrator preview — delivered only to administrator'),
  ).toBeVisible();
  await expect(page.getByText('An LLM-written stored description.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stored article' })).toBeVisible();
  await expect(page.locator('.digest-article')).toContainText('Quality');
  await expect(page.getByText('Build snapshot', { exact: true })).toHaveCount(0);
  const summaryHasReadableLineHeight = await page
    .locator('.article-summary')
    .evaluate((element) => {
      const styles = getComputedStyle(element);
      return Number.parseFloat(styles.lineHeight) > Number.parseFloat(styles.fontSize);
    });
  expect(summaryHasReadableLineHeight).toBe(true);
  await expect(page.getByRole('heading', { name: 'Stream pages' })).toBeVisible();
  page.once('dialog', (dialog) => void dialog.dismiss());
  await page.getByRole('button', { name: 'Resend stored digest' }).click();
  await expect(page.getByRole('heading', { name: 'Delivery and recipient' })).toBeVisible();
});

test('users preserve filters and expose clickable rows, selections, and activity', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await signIn(page);
  await page.goto('/users?verified=true&activityPeriod=7d');
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  await expect(page.getByText('Product', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Inspect users, selections and retained activity.')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Analytics' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Verified' })).toHaveValue('true');
  await expect(page.getByRole('combobox', { name: 'Activity period' })).toHaveValue('7d');
  await expect(page.getByRole('table').or(page.getByText('No users found.'))).toBeVisible();
  const userRow = page.locator('tbody tr:first-child');
  if (await userRow.count()) {
    await expect(
      page.getByRole('columnheader', { name: 'Selected technologies / interests' }),
    ).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Selected streams' })).toBeVisible();
    const activityText = await userRow.locator('td').nth(4).innerText();
    if (activityText === 'Inactive') {
      expect(activityText).toBe('Inactive');
    } else {
      expect(activityText).not.toMatch(/Active|events/);
    }
    await userRow.locator('td').nth(1).click();
    await expect(page).toHaveURL(/\/users\/[0-9a-f-]+/);
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Selections' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Source preferences' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View user digests' })).toBeVisible();
    const preferenceSection = page
      .getByRole('heading', { name: 'Source preferences' })
      .locator('..');
    const preference = preferenceSection.locator('li').first();
    if (await preference.count()) await expect(preference.locator('span')).toHaveCount(5);
    page.once('dialog', (dialog) => void dialog.dismiss());
    await page.getByRole('button', { name: 'Soft-delete user' }).click();
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await page.goto('/users?verified=true&activityPeriod=7d');
    await userRow.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/users\/[0-9a-f-]+/);
  }
  await page.goto('/users?tab=analytics&period=7d');
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  await expect(page.getByRole('table').or(page.getByText('No users found.'))).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test('administrators retain list, creation form, and logout', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await signIn(page);
  await page.goto('/admins');
  await expect(page.getByRole('heading', { name: 'Administrators' })).toBeVisible();
  await expect(page.getByText('Access', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Manage administrator accounts.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Apply filter' })).toHaveCount(0);
  await expect(page.getByLabel('Email')).toHaveCount(0);
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: 'Add administrator' }).click();
  const adminDialog = page.getByRole('dialog', { name: 'Add administrator' });
  await expect(adminDialog).toBeVisible();
  await expectDialogCentered(page, adminDialog);
  const createDialog = page.getByRole('dialog');
  await expect(createDialog).toBeVisible();
  await expect(createDialog.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('dialog').getByLabel('Password')).toBeVisible();
  const dialogCenter = await createDialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  const viewport = page.viewportSize();
  expect(dialogCenter.x).toBeCloseTo((viewport?.width ?? 0) / 2, 0);
  expect(dialogCenter.y).toBeCloseTo((viewport?.height ?? 0) / 2, 0);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: /Log out|Logout|Sign out/ }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(browserErrors).toEqual([]);
});

test('info pages reflect URL filters and edit Editor.js JSON blocks', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ptr-admin-token', 'e2e-admin-token'));
  const id = '00000000-0000-4000-8000-000000000017';
  const item = {
    id,
    title: 'Privacy policy',
    isActive: false,
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-02T12:00:00.000Z',
    fullText: {
      time: 1790942400000,
      version: '2.31.7',
      blocks: [
        { id: 'heading-one', type: 'header', data: { text: 'Your privacy', level: 2 } },
        { id: 'paragraph-one', type: 'paragraph', data: { text: 'Existing privacy text.' } },
      ],
    },
  };
  await page.route(
    (url) => url.pathname === '/admin/info-pages' && url.searchParams.get('isActive') === 'false',
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id,
              title: item.title,
              isActive: item.isActive,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            },
          ],
          meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
        }),
      }),
  );
  let saved: { fullText?: { blocks?: { type: string; data: { text: string } }[] } } | undefined;
  await page.route(
    (url) => url.pathname === `/admin/info-pages/${id}`,
    async (route) => {
      if (route.request().method() === 'PATCH') {
        saved = route.request().postDataJSON() as {
          fullText?: { blocks?: { type: string; data: { text: string } }[] };
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...item, ...saved }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(item),
      });
    },
  );

  await page.goto('/info-pages?isActive=false');
  await expect(page.getByLabel('Status')).toHaveValue('false');
  const row = page.locator('tbody tr').first();
  await row.locator('td').nth(2).click();
  await expect(page).toHaveURL(new RegExp(`/info-pages/${id}\\?isActive=false`));
  await expect(page.getByLabel('Page title')).toHaveValue('Privacy policy');
  await expect(page.locator('.codex-editor')).toBeVisible();
  const paragraph = page.locator('[contenteditable="true"]').last();
  await paragraph.fill('Updated privacy text.');
  await page.getByRole('button', { name: 'Save page' }).click();
  await expect(page).toHaveURL(/\/info-pages\?isActive=false/);
  expect(saved?.fullText?.blocks?.some((block) => block.type === 'header')).toBe(true);
  expect(
    saved?.fullText?.blocks?.some((block) => block.data.text.includes('Updated privacy text.')),
  ).toBe(true);
  await expect(page.getByRole('status')).toContainText('Information page updated.');
});

test('admin create dialogs are centered on desktop and mobile', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ptr-admin-token', 'e2e-admin-token'));
  await page.route(
    (url) =>
      ['/admin/sources', '/admin/technology-interests'].includes(url.pathname) ||
      url.pathname === '/admin/content-streams' ||
      url.pathname === '/admin/admins',
    (route) => {
      const isAdmins = route.request().url().includes('/admin/admins');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          isAdmins
            ? { items: [], total: 0, page: 1, limit: 20 }
            : { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
        ),
      });
    },
  );
  await page.route('**/admin/content-streams**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );

  await page.goto('/taxonomy');
  await page.getByRole('button', { name: 'Add technology or interest' }).click();
  const taxonomyDialog = page.getByRole('dialog', { name: 'Add technology or interest' });
  await expect(taxonomyDialog).toBeVisible();
  await expectDialogCentered(page, taxonomyDialog);
  await taxonomyDialog.getByRole('button', { name: 'Cancel' }).click();

  await page.goto('/sources');
  await page.getByRole('button', { name: 'Add source' }).click();
  const sourceDialog = page.getByRole('dialog', { name: 'Add source' });
  await expect(sourceDialog).toBeVisible();
  await expectDialogCentered(page, sourceDialog);
  await sourceDialog.getByRole('button', { name: 'Cancel' }).click();

  await page.goto('/admins');
  await page.getByRole('button', { name: 'Add administrator' }).click();
  const administratorDialog = page.getByRole('dialog', { name: 'Add administrator' });
  await expect(administratorDialog).toBeVisible();
  await expectDialogCentered(page, administratorDialog);
});

test('source creation preserves fields and server error after a rejected submission', async ({
  page,
}) => {
  await signIn(page);
  await page.route('**/admin/sources', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Source URL already exists' }),
    });
  });
  await page.goto('/sources');
  await expect(page.getByRole('button', { name: 'Apply filters' })).toHaveClass(/primary/);
  await page.getByRole('button', { name: 'Add source' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add source' });
  await expectDialogCentered(page, dialog);
  const bounds = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport!.width / 2)).toBeLessThan(2);
  expect(Math.abs(bounds!.y + bounds!.height / 2 - viewport!.height / 2)).toBeLessThan(2);
  await dialog.getByLabel('Name').fill('Rejected web source');
  await dialog.getByLabel('URL').fill('https://example.org/updates');
  await dialog.getByLabel('Type', { exact: true }).selectOption('web');
  await dialog.getByRole('button', { name: 'Create source' }).click();
  await expect(dialog.getByRole('button', { name: 'Creating…' })).toBeDisabled();
  await expect(dialog.getByRole('alert')).toHaveText('Source URL already exists');
  await expect(dialog.getByLabel('Name')).toHaveValue('Rejected web source');
  await expect(dialog.getByLabel('URL')).toHaveValue('https://example.org/updates');
  await expect(dialog.getByLabel('Type', { exact: true })).toHaveValue('web');
});

test('article list distinguishes API error and empty results', async ({ page }) => {
  await signIn(page);
  await page.route('**/admin/articles?*', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Article API unavailable' }),
    }),
  );
  await page.goto('/articles');
  await expect(page.getByRole('alert')).toHaveText('Article API unavailable');
  await page.unrouteAll();
  await page.route('**/admin/articles?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
    }),
  );
  await page.reload();
  await expect(page.getByText('No articles found.')).toBeVisible();
});
