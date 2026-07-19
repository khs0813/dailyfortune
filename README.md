# 오늘운 (daily-fortune)

DB와 서버 없이 동작하는 모바일 우선 띠별·별자리 일일 운세 사이트입니다. Astro가 12띠와 12별자리의 독립 SEO 페이지를 정적 HTML로 생성하고, 브라우저 JavaScript가 한국 날짜 기준 결과를 계산합니다.

## 주요 기능

- 12개 띠 페이지와 12개 별자리 페이지
- 일일·주간·월간 운세
- 관계, 일·공부, 재물, 컨디션, 행동, 주의 흐름
- 날짜와 프로필 기반 결정적 결과: 같은 조건에는 같은 결과
- 최근 7일 운세 다시 보기
- 띠와 별자리 프로필 저장
- 현재 및 연속 방문 기록
- Web Share API와 클립보드 공유
- PWA 설치 및 오프라인 재접속
- canonical, Open Graph, sitemap, robots.txt, JSON-LD
- iPhone safe-area, 16px 폼 글꼴, 모바일 하단 메뉴

## 실행

```bash
npm ci
npm run dev
```

프로덕션 빌드:

```bash
npm run build
```

## Render

```text
Build Command: npm ci && npm run build
Publish Directory: ./dist
```

커스텀 도메인 연결 후 다음 환경변수를 추가하고 재배포합니다.

```env
SITE_URL=https://www.example.com
```

## 콘텐츠 수정

- 띠·별자리 데이터: `src/data/signs.json`
- 운세 문장 데이터: `src/data/fortune-content.json`
- 브라우저용 JSON은 `scripts/prepare-data.mjs`가 생성합니다.
- `npm run validate`로 24개 프로필과 문장 뱅크를 검사합니다.

## 주의

운세는 오락·문화 콘텐츠입니다. 의료, 금융, 법률, 관계의 중요한 결정을 대신하지 않습니다.
