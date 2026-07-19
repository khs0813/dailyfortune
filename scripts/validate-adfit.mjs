import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const errors = [];

const read = async (path) => readFile(new URL(path, root), 'utf8');
const fail = (message) => errors.push(message);
const count = (text, pattern) => (text.match(new RegExp(pattern, 'g')) || []).length;

const requiredEnvKeys = [
  'PUBLIC_ADFIT_ENABLED',
  'PUBLIC_ADFIT_ALLOWED_HOSTS',
  'PUBLIC_ADFIT_PROFILE_THIRD_ENABLED',
  'PUBLIC_ADFIT_DESKTOP_SIDE_RAIL_ENABLED',
  'PUBLIC_ADFIT_HOME_AFTER_RESULT_M_320X100',
  'PUBLIC_ADFIT_HOME_AFTER_RESULT_D_728X90',
  'PUBLIC_ADFIT_HOME_AFTER_RESULT_D_300X250',
  'PUBLIC_ADFIT_HOME_BETWEEN_DIRECTORIES_M_300X250',
  'PUBLIC_ADFIT_HOME_BETWEEN_DIRECTORIES_D_728X90',
  'PUBLIC_ADFIT_HOME_BETWEEN_DIRECTORIES_D_300X250',
  'PUBLIC_ADFIT_TODAY_AFTER_RESULT_M_320X100',
  'PUBLIC_ADFIT_TODAY_AFTER_RESULT_D_728X90',
  'PUBLIC_ADFIT_WEEKLY_AFTER_RESULT_M_320X100',
  'PUBLIC_ADFIT_WEEKLY_AFTER_RESULT_D_728X90',
  'PUBLIC_ADFIT_MONTHLY_AFTER_RESULT_M_320X100',
  'PUBLIC_ADFIT_MONTHLY_AFTER_RESULT_D_728X90',
  'PUBLIC_ADFIT_PROFILE_AFTER_RESULT_M_320X100',
  'PUBLIC_ADFIT_PROFILE_AFTER_RESULT_D_728X90',
  'PUBLIC_ADFIT_PROFILE_AFTER_LIFE_M_300X250',
  'PUBLIC_ADFIT_PROFILE_AFTER_LIFE_D_300X250',
  'PUBLIC_ADFIT_PROFILE_MID_M_300X250',
  'PUBLIC_ADFIT_PROFILE_MID_D_300X250',
  'PUBLIC_ADFIT_PROFILE_SIDE_D_160X600',
  'PUBLIC_ADFIT_DIRECTORY_AFTER_GRID_M_320X100',
  'PUBLIC_ADFIT_DIRECTORY_AFTER_GRID_D_728X90',
  'PUBLIC_ADFIT_GUIDE_MID_M_300X250',
  'PUBLIC_ADFIT_GUIDE_MID_D_300X250'
];

const sourceChecks = [
  ['src/pages/index.astro', { 'home.afterResult': 1, 'home.betweenDirectories': 1 }],
  ['src/pages/today.astro', { 'today.afterResult': 1 }],
  ['src/pages/weekly.astro', { 'weekly.afterResult': 1 }],
  ['src/pages/monthly.astro', { 'monthly.afterResult': 1 }],
  ['src/pages/zodiac/index.astro', { 'directory.afterGrid': 1 }],
  ['src/pages/horoscope/index.astro', { 'directory.afterGrid': 1 }],
  ['src/pages/guide/how-results-work.astro', { 'guide.mid': 1 }],
  ['src/pages/guide/zodiac-horoscope.astro', { 'guide.mid': 1 }],
  ['src/pages/zodiac/[slug].astro', { 'profile.afterResult': 1, 'profile.afterLife': 1, 'profile.side': 1 }],
  ['src/pages/horoscope/[slug].astro', { 'profile.afterResult': 1, 'profile.afterLife': 1, 'profile.side': 1 }]
];

for (const [path, placements] of sourceChecks) {
  const text = await read(path);
  for (const [placement, expected] of Object.entries(placements)) {
    const actual = count(text, placement.replace('.', '\\.'));
    if (actual !== expected) fail(`${path} expected ${expected} ${placement} slot(s), got ${actual}`);
  }
}

for (const policyPath of ['src/pages/about.astro', 'src/pages/privacy.astro', 'src/pages/404.astro']) {
  const text = await read(policyPath);
  if (text.includes('AdFitSlot')) fail(`${policyPath} must not import or render AdFitSlot`);
  if (text.includes('adFitPage={true}')) fail(`${policyPath} must not enable the AdFit bootstrap`);
}

const adfitConfig = await read('src/adfit.ts');
const adfitClient = await read('public/js/adfit-slots.js');
const fortuneWidget = await read('public/js/fortune-widget.js');
const envExample = await read('.env.example');
const renderYaml = await read('render.yaml');
const docs = await read('docs/adfit-monetization.md');

if (!adfitConfig.includes('https://t1.kakaocdn.net/kas/static/ba.min.js')) fail('src/adfit.ts must use the current AdFit SDK URL');
if (!adfitClient.includes('kakao_ad_area')) fail('public/js/adfit-slots.js must create official kakao_ad_area markup');
for (const attr of ['data-ad-unit', 'data-ad-width', 'data-ad-height']) {
  if (!adfitClient.includes(attr)) fail(`public/js/adfit-slots.js missing ${attr}`);
}
if (adfitClient.includes('daumcdn')) fail('Do not use legacy daumcdn AdFit scripts');
if (!adfitClient.includes('window.adfit.render')) fail('Dynamic slots should render with the verified SDK render API when available');
for (const guard of ['localhost', '127.0.0.1', '.onrender.com', 'allowedHosts.includes(hostname)']) {
  if (!adfitClient.includes(guard)) fail(`public/js/adfit-slots.js missing host guard: ${guard}`);
}
if (!adfitClient.includes('mountedPlacements')) fail('AdFit client must guard duplicate placement mounts');
if (!adfitClient.includes('Math.min(pageLimit(), 3)')) fail('AdFit client must cap route ad count below 4');
if (!adfitClient.includes('fortune:result-rendered')) fail('AdFit client must wait for result-rendered events');
if (!fortuneWidget.includes('fortune:result-rendered')) fail('Fortune results must dispatch fortune:result-rendered');
if (!fortuneWidget.includes('fortune_result_rendered')) fail('Fortune result analytics event is missing');

for (const key of requiredEnvKeys) {
  if (!envExample.includes(`${key}=`)) fail(`.env.example missing ${key}`);
  if (!renderYaml.includes(`key: ${key}`)) fail(`render.yaml missing ${key}`);
  if (!docs.includes(key)) fail(`docs/adfit-monetization.md missing ${key}`);
}

const sourceFiles = [
  'src/adfit.ts',
  'src/components/AdFitSlot.astro',
  'src/components/FortuneApp.astro',
  'src/components/NextFortuneLinks.astro',
  'src/pages/index.astro',
  'src/pages/today.astro',
  'src/pages/weekly.astro',
  'src/pages/monthly.astro',
  'src/pages/zodiac/index.astro',
  'src/pages/horoscope/index.astro',
  'src/pages/zodiac/[slug].astro',
  'src/pages/horoscope/[slug].astro',
  'src/pages/guide/how-results-work.astro',
  'src/pages/guide/zodiac-horoscope.astro',
  'public/js/adfit-slots.js',
  'render.yaml',
  '.env.example',
  'docs/adfit-monetization.md'
];

for (const path of sourceFiles) {
  const matches = (await read(path)).match(/DAN-[A-Za-z0-9_-]+/g) || [];
  const unsafe = matches.filter((item) => item !== 'DAN-REPLACE-ME');
  if (unsafe.length) fail(`${path} contains possible real AdFit unit IDs: ${unsafe.join(', ')}`);
}

if (existsSync(new URL('dist', root))) {
  const distFiles = [];
  const walk = async (dir) => {
    for (const entry of await readdir(new URL(dir, root), { withFileTypes: true })) {
      const relative = join(dir, entry.name);
      if (entry.isDirectory()) await walk(relative);
      else if (/\.(html|xml|txt)$/.test(entry.name)) distFiles.push(relative);
    }
  };
  await walk('dist');
  const distText = (await Promise.all(distFiles.map((file) => read(file)))).join('\n');
  if (distText.includes('kakao_ad_area')) fail('Default disabled build must not contain AdFit ad DOM');
  if (distText.includes('https://t1.kakaocdn.net/kas/static/ba.min.js')) fail('Default disabled build must not contain the external AdFit SDK URL');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Validated AdFit placement, config, env, docs, and disabled-build guards');
