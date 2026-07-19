import type { APIRoute } from 'astro';
import { siteConfig } from '../config';
import signs from '../data/signs.json';

type ChangeFreq = 'daily' | 'weekly' | 'monthly' | 'yearly';
type SitemapEntry = {
  path: string;
  changefreq: ChangeFreq;
  priority: string;
};

const formatKstDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
};

const staticEntries: SitemapEntry[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/today/', changefreq: 'daily', priority: '1.0' },
  { path: '/weekly/', changefreq: 'weekly', priority: '0.8' },
  { path: '/monthly/', changefreq: 'monthly', priority: '0.7' },
  { path: '/zodiac/', changefreq: 'weekly', priority: '0.8' },
  { path: '/horoscope/', changefreq: 'weekly', priority: '0.8' },
  { path: '/guide/how-results-work/', changefreq: 'monthly', priority: '0.5' },
  { path: '/guide/zodiac-horoscope/', changefreq: 'monthly', priority: '0.5' },
  { path: '/about/', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy/', changefreq: 'yearly', priority: '0.3' }
];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(siteConfig.fallbackUrl);
  const lastmod = formatKstDate();
  const signEntries: SitemapEntry[] = signs.map((sign) => ({
    path: sign.type === 'zodiac' ? `/zodiac/${sign.slug}/` : `/horoscope/${sign.slug}/`,
    changefreq: 'daily',
    priority: '0.9'
  }));
  const urls = [...staticEntries, ...signEntries]
    .map(
      (entry) => `  <url>
    <loc>${new URL(entry.path, base).href}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
