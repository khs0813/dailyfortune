(() => {
  const toast = document.querySelector('[data-toast]');
  let toastTimer;
  window.showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }

  let deferredPrompt = null;
  const installButtons = [...document.querySelectorAll('[data-install]')];
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButtons.forEach((button) => { button.hidden = false; });
  });
  installButtons.forEach((button) => button.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installButtons.forEach((item) => { item.hidden = true; });
  }));
  window.addEventListener('appinstalled', () => installButtons.forEach((button) => { button.hidden = true; }));

  document.querySelectorAll('[data-share-page]').forEach((button) => button.addEventListener('click', async () => {
    const data = { title: document.title, text: document.querySelector('meta[name="description"]')?.content || '', url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); window.showToast?.('주소를 복사했습니다.'); }
    } catch (error) { if (error?.name !== 'AbortError') window.showToast?.('공유하지 못했습니다.'); }
  }));
})();
