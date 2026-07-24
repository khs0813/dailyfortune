(() => {
  const doc = document.documentElement;
  const enabled = doc.dataset.adfitEnabled === 'true';
  const allowedHosts = (doc.dataset.adfitAllowedHosts || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  const sdkSrc = doc.dataset.adfitScriptSrc || '';
  const hostname = window.location.hostname;
  const warned = new Set();
  const mountedPlacements = new Set();
  let bootstrapped = false;
  let noAdCallbackCount = 0;

  const viewportWidthGroup = () => {
    const width = window.innerWidth;
    if (width <= 360) return '320_360';
    if (width <= 480) return '361_480';
    if (width <= 768) return '481_768';
    if (width <= 1024) return '769_1024';
    return '1025_plus';
  };

  const track = (name, params = {}) => {
    const payload = {
      route: location.pathname,
      viewport_width_group: viewportWidthGroup(),
      ...params
    };
    if (typeof window.trackFortuneEvent === 'function') {
      window.trackFortuneEvent(name, payload);
      return;
    }
    if (typeof window.gtag === 'function') window.gtag('event', name, payload);
  };

  const warnOnce = (key, message) => {
    if (warned.has(key)) return;
    warned.add(key);
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      console.warn(message);
    }
  };

  const isBlockedHost = () => {
    if (!enabled) return true;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
    if (hostname.endsWith('.onrender.com')) return true;
    return !allowedHosts.includes(hostname);
  };

  const pageLimit = () => {
    const path = window.location.pathname;
    if (path === '/about/' || path === '/privacy/') return 0;
    if (path === '/') return 2;
    if (path === '/today/' || path === '/weekly/' || path === '/monthly/') return 1;
    if (path === '/zodiac/' || path === '/horoscope/') return 1;
    if (/^\/(zodiac|horoscope)\/[^/]+\/$/.test(path)) return 2;
    return 0;
  };

  const cleanup = () => {
    document.querySelectorAll('[data-adfit-slot]').forEach((slot) => slot.remove());
    document.querySelectorAll('[data-adfit-missing]').forEach((slot) => slot.remove());
  };

  const chooseVariant = (slot) => {
    const desktop = window.matchMedia('(min-width: 760px)').matches;
    if (!desktop) {
      const unit = slot.dataset.adfitMobileUnit;
      if (!unit) return null;
      return {
        device: 'mobile',
        unit,
        width: Number(slot.dataset.adfitMobileWidth),
        height: Number(slot.dataset.adfitMobileHeight)
      };
    }

    const unit = slot.dataset.adfitDesktopUnit;
    if (!unit) return null;
    return {
      device: 'desktop',
      unit,
      width: Number(slot.dataset.adfitDesktopWidth),
      height: Number(slot.dataset.adfitDesktopHeight)
    };
  };

  const createNoAdCallback = (slot, placement) => {
    noAdCallbackCount += 1;
    const name = `__dailyFortuneAdFitNoAd_${placement.replace(/[^A-Za-z0-9]/g, '_')}_${noAdCallbackCount}`;
    window[name] = (ins) => {
      const targetSlot = ins?.closest?.('[data-adfit-slot]') || slot;
      targetSlot.dataset.adfitNoAd = 'true';
      targetSlot.querySelector('[data-adfit-fallback]')?.removeAttribute('aria-hidden');
    };
    return name;
  };

  const observeViewport = (slot, placement, device) => {
    if (!('IntersectionObserver' in window)) return;
    let entered = false;
    let halfTracked = false;
    let halfTimer = 0;
    let lastRatio = 0;
    const params = { placement, device };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        lastRatio = entry.intersectionRatio;
        if (entry.isIntersecting && !entered) {
          entered = true;
          track('ad_slot_viewport_entered', params);
        }
        if (entry.intersectionRatio >= 0.5 && !halfTracked && !halfTimer) {
          halfTimer = window.setTimeout(() => {
            halfTimer = 0;
            if (lastRatio >= 0.5 && !halfTracked) {
              halfTracked = true;
              track('ad_slot_viewport_50_1s', params);
            }
            if (entered && halfTracked) observer.unobserve(slot);
          }, 1000);
        }
        if (entry.intersectionRatio < 0.5 && halfTimer) {
          window.clearTimeout(halfTimer);
          halfTimer = 0;
        }
      }
    }, { threshold: [0, 0.5, 1] });
    observer.observe(slot);
  };

  const prepareSlot = (slot) => {
    const placement = slot.dataset.adfitPlacement;
    if (!placement || slot.dataset.adfitMounted === 'true') return false;
    if (mountedPlacements.has(placement)) {
      slot.remove();
      return false;
    }

    const variant = chooseVariant(slot);
    if (!variant?.unit || !variant.width || !variant.height) {
      warnOnce(placement, `[AdFit] Missing configured unit for ${placement}`);
      slot.remove();
      return false;
    }

    const frame = slot.querySelector('[data-adfit-frame]');
    if (!frame) return false;

    frame.querySelectorAll('ins.kakao_ad_area').forEach((node) => node.remove());
    slot.style.setProperty('--adfit-width', `${variant.width}px`);
    slot.style.setProperty('--adfit-height', `${variant.height}px`);
    slot.dataset.adfitDevice = variant.device;
    slot.dataset.adfitMounted = 'true';

    const ins = document.createElement('ins');
    ins.className = 'kakao_ad_area';
    ins.style.cssText = 'display:none;width:100%;';
    ins.setAttribute('data-ad-unit', variant.unit);
    ins.setAttribute('data-ad-width', String(variant.width));
    ins.setAttribute('data-ad-height', String(variant.height));
    ins.setAttribute('data-ad-onfail', createNoAdCallback(slot, placement));
    frame.prepend(ins);

    mountedPlacements.add(placement);
    track('ad_slot_mounted', { placement, device: variant.device });
    observeViewport(slot, placement, variant.device);
    return true;
  };

  const requestSdkOnce = () => {
    if (!sdkSrc) {
      warnOnce('sdk-src', '[AdFit] Missing SDK URL');
      return;
    }
    if (document.querySelector('script[data-adfit-sdk="true"]')) return;
    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.src = sdkSrc;
    script.dataset.adfitSdk = 'true';
    document.body.append(script);
  };

  const bootstrap = () => {
    if (bootstrapped) return;
    bootstrapped = true;

    const limit = pageLimit();
    if (limit <= 0) {
      cleanup();
      return;
    }

    const slots = [...document.querySelectorAll('[data-adfit-slot]')];
    let prepared = 0;
    for (const slot of slots) {
      if (prepared >= limit) {
        slot.remove();
        continue;
      }
      if (prepareSlot(slot)) prepared += 1;
    }

    if (prepared > 0) requestSdkOnce();
  };

  if (isBlockedHost()) {
    cleanup();
    return;
  }

  document.querySelectorAll('[data-adfit-missing]').forEach((item) => {
    warnOnce(item.dataset.adfitMissing || 'missing', `[AdFit] Missing env for ${item.dataset.adfitMissing}: ${item.dataset.adfitMissingKeys || ''}`);
  });

  const showResultContent = (root) => {
    root.querySelectorAll('[data-result-ready-content][hidden]').forEach((node) => {
      node.hidden = false;
    });
  };
  const showResultAds = (root) => {
    root.querySelectorAll('[data-result-ready-ad][hidden]').forEach((node) => {
      const slot = node.querySelector('[data-adfit-slot]');
      if (slot && chooseVariant(slot)?.unit) node.hidden = false;
    });
  };

  const hasResultDependentSlot = () =>
    Boolean(document.querySelector('[data-adfit-slot][data-adfit-requires-result="true"]'));

  const bootstrapReadyResultPage = () => {
    const apps = [...document.querySelectorAll('[data-fortune-app]')];
    if (!apps.length || apps.some((app) => app.dataset.resultReady !== 'true')) return;
    apps.forEach(showResultContent);
    apps.forEach(showResultAds);
    bootstrap();
  };

  document.addEventListener('fortune:result-rendered', (event) => {
    const root = event.target;
    if (root instanceof Element) {
      showResultContent(root);
      showResultAds(root);
    }
    if (hasResultDependentSlot()) bootstrapReadyResultPage();
  });

  const startStaticPage = () => {
    if (hasResultDependentSlot()) {
      bootstrapReadyResultPage();
      return;
    }
    bootstrap();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startStaticPage);
  } else {
    startStaticPage();
  }
})();
