import type { APIRoute } from 'astro';
export const GET:APIRoute=({site})=>{const base=site??new URL('https://fortunedaily.co.kr');return new Response(`User-agent: *
Allow: /
Sitemap: ${new URL('sitemap.xml',base).href}
`,{headers:{'Content-Type':'text/plain; charset=utf-8'}})};
