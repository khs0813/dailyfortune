import type { APIRoute } from 'astro';
import { siteConfig } from '../config';
import signs from '../data/signs.json';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const staticItems = [
  {
    title: '오늘의 띠별 운세와 별자리 운세 무료 보기',
    description: siteConfig.description,
    path: '/'
  },
  {
    title: '오늘의 운세',
    description: '저장한 띠 또는 별자리 프로필로 오늘 운세와 최근 7일 결과를 확인하세요.',
    path: '/today/'
  },
  {
    title: '이번 주 운세',
    description: '이번 주에 유지할 태도와 점검할 생활 영역을 확인하세요.',
    path: '/weekly/'
  },
  {
    title: '이번 달 운세',
    description: '한 달의 방향을 큰 흐름으로 보고 실천할 행동과 조심할 패턴을 정합니다.',
    path: '/monthly/'
  },
  {
    title: '띠와 별자리 차이',
    description: '띠별 운세와 별자리 운세가 어떤 기준으로 나뉘는지 설명합니다.',
    path: '/guide/zodiac-horoscope/'
  },
  {
    title: '운세 결과 생성 방식',
    description: '오늘운의 날짜와 프로필 기반 운세 결과 생성 방식을 안내합니다.',
    path: '/guide/how-results-work/'
  }
];

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(siteConfig.fallbackUrl);
  const lastBuildDate = new Date().toUTCString();
  const signItems = signs.map((sign) => ({
    title: `${sign.name} 오늘 운세`,
    description: sign.summary,
    path: sign.type === 'zodiac' ? `/zodiac/${sign.slug}/` : `/horoscope/${sign.slug}/`
  }));
  const items = [...staticItems, ...signItems]
    .map((item) => {
      const link = new URL(item.path, base).href;

      return `<item>
  <title>${escapeXml(item.title)}</title>
  <link>${escapeXml(link)}</link>
  <guid isPermaLink="true">${escapeXml(link)}</guid>
  <description>${escapeXml(item.description)}</description>
  <pubDate>${lastBuildDate}</pubDate>
</item>`;
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(siteConfig.name)}</title>
  <link>${escapeXml(base.href)}</link>
  <atom:link href="${escapeXml(new URL('rss.xml', base).href)}" rel="self" type="application/rss+xml" />
  <description>${escapeXml(siteConfig.description)}</description>
  <language>ko-KR</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
</channel>
</rss>
`,
    { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } }
  );
};
