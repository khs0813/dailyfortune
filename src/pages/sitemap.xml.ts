import type { APIRoute } from 'astro';
import { siteConfig } from '../config';
import signs from '../data/signs.json';

const staticPaths = [
  '/',
  '/about/',
  '/guide/how-results-work/',
  '/guide/zodiac-horoscope/',
  '/horoscope/',
  '/monthly/',
  '/privacy/',
  '/today/',
  '/weekly/',
  '/zodiac/'
];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(siteConfig.fallbackUrl);
  const signPaths = signs.map((sign) =>
    sign.type === 'zodiac' ? `/zodiac/${sign.slug}/` : `/horoscope/${sign.slug}/`
  );
  const urls = [...staticPaths, ...signPaths]
    .map((path) => `<url><loc>${new URL(path, base).href}</loc></url>`)
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>
`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
