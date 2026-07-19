export const siteConfig = {
  name: '오늘운',
  shortName: '오늘운',
  tagline: '매일 가볍게 보는 띠·별자리 운세',
  description: '한국 시간 기준으로 매일 바뀌는 띠별 운세와 별자리 운세를 무료로 확인하고, 지난 결과와 연속 방문 기록을 기기에 저장하는 일일 운세 사이트입니다.',
  themeColor: '#d34c46',
  fallbackUrl: 'https://daily-fortune-ko.onrender.com',
  mark: '運',
  nav: [
    ['오늘 운세', '/today/'],
    ['띠별 운세', '/zodiac/'],
    ['별자리 운세', '/horoscope/'],
    ['주간 운세', '/weekly/'],
    ['월간 운세', '/monthly/']
  ]
} as const;
