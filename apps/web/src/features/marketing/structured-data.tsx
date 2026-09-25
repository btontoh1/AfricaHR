const SITE_URL = 'https://parothr.com';

// Organization + SoftwareApplication JSON-LD, scoped to areaServed Ghana/
// Nigeria/Kenya - the strongest signal we can give Google that this is a
// regional B2B software product rather than a generic global listing.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'ParotHR',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      email: 'support@parothr.com',
      areaServed: [
        { '@type': 'Country', name: 'Ghana' },
        { '@type': 'Country', name: 'Nigeria' },
        { '@type': 'Country', name: 'Kenya' },
      ],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'ParotHR',
      url: SITE_URL,
      image: `${SITE_URL}/logo.png`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'HR, payroll and accounting software for Ghana, Nigeria and Kenya - payroll, leave, recruitment, performance, and full double-entry accounting in one platform.',
      areaServed: [
        { '@type': 'Country', name: 'Ghana' },
        { '@type': 'Country', name: 'Nigeria' },
        { '@type': 'Country', name: 'Kenya' },
      ],
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
      },
    },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
    />
  );
}
