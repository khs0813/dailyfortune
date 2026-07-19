import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || 'https://daily-fortune-ko.onrender.com';

export default defineConfig({
  site,
  output: 'static',
  integrations: [sitemap({
    filter: (page) => !page.endsWith('/404/') && !page.includes('/bookmarks/')
  })],
  build: { format: 'directory' },
  vite: { build: { cssMinify: 'esbuild' } }
});
