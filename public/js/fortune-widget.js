import { loadFortuneData, generateFortune, formatKstDate, kstDate, msToNextKstMidnight } from './fortune-engine.js';

const profileKey = 'daily-fortune:profile:v1';
const visitsKey = 'daily-fortune:visits:v1';

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const track = (name, params = {}) => window.trackFortuneEvent?.(name, params);

const calculateStreak = (dates) => {
  const unique = [...new Set(dates)].sort().reverse();
  let cursor = new Date(`${kstDate()}T00:00:00+09:00`);
  if (unique[0] && unique[0] !== kstDate()) cursor = new Date(cursor.getTime() - 86400000);
  let streak = 0;
  for (const date of unique) {
    const expected = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(cursor);
    if (date !== expected) break;
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
};

const recordVisit = () => {
  const dates = read(visitsKey, []);
  const today = kstDate();
  if (!dates.includes(today)) {
    dates.push(today);
    write(visitsKey, dates.slice(-400));
  }
  return dates;
};

const periodNames = { daily: '오늘', weekly: '이번 주', monthly: '이번 달' };
const requiredCategoryKeys = ['relationship', 'work', 'money', 'condition'];
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const isCompleteFortuneResult = (result) => {
  if (!result || !result.sign || !hasText(result.sign.name) || !hasText(result.sign.emoji)) return false;
  if (!hasText(result.overall) || !hasText(result.keyword)) return false;
  if (!Number.isFinite(Number(result.overallScore))) return false;
  if (!hasText(result.color) || !Number.isFinite(Number(result.number))) return false;
  if (!hasText(result.time) || !hasText(result.direction)) return false;
  if (!hasText(result.action) || !hasText(result.caution)) return false;

  return requiredCategoryKeys.every((key) => {
    const item = result.categories?.[key];
    return item && Number.isFinite(Number(item.score)) && hasText(item.message) && hasText(item.insight);
  });
};
const showResultReadyContent = (root) => {
  root.querySelectorAll('[data-result-ready-content][hidden]').forEach((node) => {
    node.hidden = false;
  });
};
const setScoreProgress = (meter, score) => {
  if (!meter) return;
  const max = Number(meter.dataset.scoreMax) || 5;
  const value = Math.max(0, Math.min(max, Number(score) || 0));
  meter.style.setProperty('--score-progress', `${(value / max) * 100}%`);
  meter.setAttribute('aria-valuenow', String(value));
  meter.setAttribute('aria-valuetext', `${value}점 / ${max}점`);
  const current = meter.querySelector('[data-score-current]');
  if (current) current.textContent = String(value);
};

for (const root of document.querySelectorAll('[data-fortune-app]')) {
  const period = root.dataset.period || 'daily';
  const fixedType = root.dataset.fixedType;
  const fixedSlug = root.dataset.fixedSlug;
  const select = root.querySelector('[data-sign-select]');
  const tabs = [...root.querySelectorAll('[data-type-tab]')];
  const history = root.querySelector('[data-history]');
  let activeOffset = 0;
  let activeType = fixedType || 'zodiac';
  let activeSlug = fixedSlug || 'rat';
  let allSigns = [];

  const profile = read(profileKey, { zodiac: 'rat', horoscope: 'aries', preferred: 'zodiac' });
  if (!fixedSlug) {
    activeType = profile.preferred || 'zodiac';
    activeSlug = profile[activeType] || (activeType === 'zodiac' ? 'rat' : 'aries');
  }

  const visits = period === 'daily' ? recordVisit() : read(visitsKey, []);
  root.querySelector('[data-streak]').textContent = String(calculateStreak(visits));

  const detailHref = (sign) => sign.type === 'zodiac' ? `/zodiac/${sign.slug}/` : `/horoscope/${sign.slug}/`;
  const syncPicker = () => {
    if (!select) return;
    select.value = `${activeType}:${activeSlug}`;
    tabs.forEach((btn) => btn.setAttribute('aria-selected', String(btn.dataset.typeTab === activeType)));
    const option = [...select.options].find((item) => item.value.startsWith(`${activeType}:`));
    if (!select.value && option) {
      select.value = option.value;
      activeSlug = option.value.split(':')[1];
    }
  };

  const updateFollowupLinks = (sign) => {
    const href = detailHref(sign);
    root.querySelectorAll('[data-next-profile-link]').forEach((link) => {
      link.setAttribute('href', href);
      link.dataset.profileType = sign.type;
      link.dataset.profileSlug = sign.slug;
    });
    root.querySelectorAll('[data-next-profile-label]').forEach((node) => {
      node.textContent = `${sign.name} 상세 운세`;
    });
  };

  const renderSaved = () => {
    const box = root.querySelector('[data-saved-profiles]');
    if (!box) return;
    box.replaceChildren();
    for (const type of ['zodiac', 'horoscope']) {
      const slug = profile[type];
      const sign = allSigns.find((item) => item.type === type && item.slug === slug);
      if (!sign) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `profile-chip ${activeType === type && activeSlug === slug ? 'active' : ''}`;
      button.textContent = `${sign.emoji} ${sign.name}`;
      button.addEventListener('click', () => {
        activeType = type;
        activeSlug = slug;
        activeOffset = 0;
        syncPicker();
        renderSaved();
        render().catch(showResultError);
      });
      box.append(button);
    }
  };

  const renderHistory = () => {
    if (!history || period !== 'daily') return;
    history.hidden = false;
    history.replaceChildren();
    for (let offset = 0; offset >= -6; offset -= 1) {
      const date = kstDate(offset);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `history-day ${activeOffset === offset ? 'active' : ''}`;
      const d = new Date(`${date}T00:00:00+09:00`);
      const label = offset === 0 ? '오늘' : new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        weekday: 'short'
      }).format(d);
      button.innerHTML = `<strong>${label}</strong><span>${date.slice(5).replace('-', '.')}</span>`;
      button.addEventListener('click', () => {
        activeOffset = offset;
        renderHistory();
        render().catch(showResultError);
      });
      history.append(button);
    }
  };

  const showResultError = () => {
    root.dataset.resultReady = 'false';
    root.querySelector('[data-result-title]').textContent = '운세를 불러오지 못했습니다';
    root.querySelector('[data-result-overall]').textContent = '운세 데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.';
    root.querySelector('[data-result-keyword]').textContent = '오류';
  };

  const render = async () => {
    const result = await generateFortune(activeType, activeSlug, period, activeOffset);
    if (!isCompleteFortuneResult(result)) {
      showResultError();
      return;
    }

    const sign = result.sign;
    root.querySelector('[data-result-icon]').textContent = sign.emoji;
    root.querySelector('[data-result-date]').textContent = formatKstDate(result.date, period);
    root.querySelector('[data-result-title]').textContent = `${sign.name} ${periodNames[period]} 운세`;
    root.querySelector('[data-result-overall]').textContent = result.overall;
    root.querySelector('[data-result-keyword]').textContent = result.keyword;
    setScoreProgress(root.querySelector('[data-result-score-meter]'), result.overallScore);

    for (const [key, data] of Object.entries(result.categories)) {
      const summary = root.querySelector(`[data-summary-metric="${key}"]`);
      if (summary) {
        summary.querySelector('[data-summary-score]').textContent = `${data.score}/5`;
        summary.style.setProperty('--summary-score', `${data.score * 20}%`);
      }

      const card = root.querySelector(`[data-metric="${key}"]`);
      if (!card) continue;
      card.querySelector('[data-score]').textContent = `${data.score}/5`;
      card.querySelector('[data-message]').textContent = data.message;
      card.querySelector('[data-insight]').textContent = `${sign.name} 힌트 · ${data.insight}`;
      card.style.setProperty('--metric-score', `${data.score * 20}%`);
    }

    root.querySelector('[data-color]').textContent = result.color;
    root.querySelector('[data-number]').textContent = String(result.number);
    root.querySelector('[data-time]').textContent = result.time;
    root.querySelector('[data-direction]').textContent = result.direction;
    root.querySelector('[data-action]').textContent = result.action;
    root.querySelector('[data-caution]').textContent = result.caution;

    const detail = root.querySelector('[data-detail-link]');
    if (detail) detail.href = detailHref(sign);
    updateFollowupLinks(sign);
    root.dataset.shareText = `${formatKstDate(result.date, period)} ${sign.name} ${periodNames[period]} 운세
키워드: ${result.keyword}
종합 흐름: ${result.overallScore}/5
${result.overall}
${location.origin}${detailHref(sign)}`;

    const eventDetail = {
      route: location.pathname,
      period,
      profile_type: sign.type,
      profile_slug: sign.slug
    };
    root.dataset.resultReady = 'true';
    showResultReadyContent(root);
    track('fortune_result_rendered', eventDetail);
    root.dispatchEvent(new CustomEvent('fortune:result-rendered', { bubbles: true, detail: eventDetail }));
  };

  tabs.forEach((btn) => btn.addEventListener('click', () => {
    activeType = btn.dataset.typeTab;
    activeSlug = profile[activeType] || (activeType === 'zodiac' ? 'rat' : 'aries');
    activeOffset = 0;
    syncPicker();
    renderSaved();
    renderHistory();
    render().catch(showResultError);
  }));

  select?.addEventListener('change', () => {
    [activeType, activeSlug] = select.value.split(':');
    activeOffset = 0;
    syncPicker();
    renderSaved();
    renderHistory();
    render().catch(showResultError);
  });

  root.querySelector('[data-save-profile]')?.addEventListener('click', () => {
    profile[activeType] = activeSlug;
    profile.preferred = activeType;
    write(profileKey, profile);
    renderSaved();
    window.showToast?.(`${allSigns.find((item) => item.type === activeType && item.slug === activeSlug)?.name || '프로필'}을 저장했습니다.`);
  });

  root.querySelector('[data-share-result]')?.addEventListener('click', async () => {
    const text = root.dataset.shareText || document.title;
    try {
      if (navigator.share) await navigator.share({ title: document.title, text, url: location.href });
      else {
        await navigator.clipboard.writeText(text);
        window.showToast?.('운세 결과를 복사했습니다.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') window.showToast?.('공유하지 못했습니다.');
    }
  });

  root.querySelector('[data-detail-link]')?.addEventListener('click', () => {
    track('fortune_profile_detail_click', {
      route: location.pathname,
      period,
      profile_type: activeType,
      profile_slug: activeSlug
    });
  });

  const tick = () => {
    const total = Math.floor(msToNextKstMidnight() / 1000);
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    root.querySelector('[data-countdown]').textContent = `${h}:${m}:${s}`;
  };
  if (period === 'daily') {
    tick();
    setInterval(tick, 1000);
  } else {
    root.querySelector('[data-countdown-label]').textContent = period === 'weekly' ? '다음 주까지' : '다음 달까지';
    root.querySelector('[data-countdown]').textContent = '날짜가 바뀌면 자동 갱신';
  }

  try {
    allSigns = (await loadFortuneData()).signs;
    syncPicker();
    renderSaved();
    renderHistory();
    await render();
  } catch {
    showResultError();
  }
}
