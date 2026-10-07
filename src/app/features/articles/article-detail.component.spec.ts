import { plainTextFromHtml, structuredDataEntries } from './article-detail.component';

describe('article detail display formatting', () => {
  it('renders extracted HTML as readable plain text', () => {
    expect(plainTextFromHtml('<h1>Update</h1><p>A &amp; B</p><script>ignore()</script>')).toBe(
      'Update\n\nA & B',
    );
    expect(plainTextFromHtml(null)).toBe('No extracted content.');
  });

  it('converts structured API data to labeled values instead of JSON', () => {
    expect(
      structuredDataEntries({
        method: 'readability',
        hasImages: false,
        release: { version: '2.0' },
      }),
    ).toEqual([
      { label: 'Method', value: 'readability' },
      { label: 'Has Images', value: 'No' },
      { label: 'Release / Version', value: '2.0' },
    ]);
    expect(structuredDataEntries(null)).toEqual([]);
  });
});
