(() => {
  const doc = document.documentElement;
  const enabled = doc.dataset.adfitEnabled === 'true';
  const allowedHosts = (doc.dataset.adfitAllowedHosts || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  const sdkSrc = doc.dataset.adfitScriptSrc || 'https://t1.kakaocdn.net/kas/static/ba.min.js';
  const hostname = window.location.hostname;
  const mountedPlacements = new Set();
  const warned = new Set();
  let mountedCount = 0;
  let sdkScriptRequested = false;

  const track = (name, params) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, params);
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
    if (path.startsWith('/guide/')) return 1;
    if (/^\/(zodiac|horoscope)\/[^/]+\/$/.test(path)) {
      return doc.dataset.adfitProfileThirdEnabled === 'true' ? 3 : 2;
    }
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

    const width = Number(slot.dataset.adfitDesktopWidth);
    const frame = slot.querySelector('[data-adfit-frame]');
    const availableWidth = Math.floor(frame?.getBoundingClientRect().width || window.innerWidth);
    if (slot.dataset.adfitDesktopUnit && width && availableWidth >= width) {
      return {
        device: 'desktop',
        unit: slot.dataset.adfitDesktopUnit,
        width,
        height: Number(slot.dataset.adfitDesktopHeight)
      };
    }
    if (slot.dataset.adfitDesktopFallbackUnit) {
      return {
        device: 'desktop',
        unit: slot.dataset.adfitDesktopFallbackUnit,
        width: Number(slot.dataset.adfitDesktopFallbackWidth),
        height: Number(slot.dataset.adfitDesktopFallbackHeight)
      };
    }
    if (slot.dataset.adfitDesktopUnit) {
      return {
        device: 'desktop',
        unit: slot.dataset.adfitDesktopUnit,
        width,
        height: Number(slot.dataset.adfitDesktopHeight)
      };
    }
    return null;
  };

  const prepareProfileSideRail = () => {
    const side = document.querySelector('[data-adfit-placement="profile.side"]');
    if (!side) return;
    const inline = document.querySelector('[data-adfit-placement="profile.afterLife"]');
    const hasAsideColumn = side.closest('.profile-life-layout');
    const wideEnough = window.matchMedia('(min-width: 1280px)').matches;
    if (doc.dataset.adfitDesktopSideRailEnabled === 'true' && wideEnough && hasAsideColumn) {
      inline?.remove();
      return;
    }
    side.remove();
  };

  const requestSdkRender = (ins) => {
    if (window.adfit && typeof window.adfit.render === 'function') {
      window.adfit.render(ins);
      return;
    }
    if (sdkScriptRequested) return;
    sdkScriptRequested = true;
    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.src = sdkSrc;
    script.dataset.adfitSdk = 'true';
    document.body.append(script);
  };

  const mount = (slot) => {
    const placement = slot.dataset.adfitPlacement;
    if (!placement || slot.dataset.adfitMounted === 'true') return;
    if (mountedPlacements.has(placement)) return;
    if (mountedCount >= Math.min(pageLimit(), 3)) return;

    const variant = chooseVariant(slot);
    if (!variant?.unit || !variant.width || !variant.height) {
      warnOnce(placement, `[AdFit] Missing configured unit for ${placement}`);
      slot.remove();
      return;
    }

    const frame = slot.querySelector('[data-adfit-frame]');
    if (!frame) return;
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
    frame.replaceChildren(ins);

    mountedPlacements.add(placement);
    mountedCount += 1;
    track('ad_slot_eligible', { route: location.pathname, placement, device: variant.device });
    track('ad_slot_mounted', { route: location.pathname, placement, device: variant.device });
    requestSdkRender(ins);
  };

  const mountReadySlots = (scope = document) => {
    scope.querySelectorAll('[data-adfit-slot][data-adfit-requires-result="false"]').forEach(mount);
  };

  if (isBlockedHost()) {
    cleanup();
    return;
  }

  prepareProfileSideRail();

  document.querySelectorAll('[data-adfit-missing]').forEach((item) => {
    warnOnce(item.dataset.adfitMissing || 'missing', `[AdFit] Missing env for ${item.dataset.adfitMissing}: ${item.dataset.adfitMissingKeys || ''}`);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountReadySlots());
  } else {
    mountReadySlots();
  }

  document.addEventListener('fortune:result-rendered', (event) => {
    const root = event.target;
    if (!(root instanceof Element)) return;
    root.querySelectorAll('[data-result-ready-content][hidden]').forEach((node) => {
      node.hidden = false;
    });
    root.querySelectorAll('[data-adfit-slot][data-adfit-requires-result="true"]').forEach(mount);
  });
})();
