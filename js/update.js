/* update.js — keeps the installed app up to date. Loaded on the hub and on every game page.
 *  - registers the offline worker and asks the server "is there a new version?" on launch, when you come back to the app,
 *    when you go online again, and every 5 minutes
 *  - when a new version has been installed: the hub refreshes itself; inside a game it shows a small "Update" button
 *    (so nobody loses a game in progress)
 */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  const here = document.currentScript && document.currentScript.src;
  const swUrl = new URL('../sw.js', here || location.href).href;            // js/update.js -> /sw.js
  const onHub = !/\/games\//.test(location.pathname);
  const hadController = !!navigator.serviceWorker.controller;               // false on the very first visit (nothing to update yet)
  let reloading = false;

  function banner() {
    if (document.getElementById('xd-update')) return;
    const b = document.createElement('button');
    b.id = 'xd-update'; b.type = 'button'; b.textContent = '✨ New version ready · Tap to update';
    b.style.cssText = 'position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:100001;background:#FF3D6E;color:#fff;border:none;border-radius:999px;padding:12px 20px;font:700 14px Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5);cursor:pointer;max-width:92vw';
    b.addEventListener('click', () => { reloading = true; location.reload(); });
    (document.body || document.documentElement).appendChild(b);
  }
  function applyUpdate() {
    if (reloading) return;
    if (onHub) { reloading = true; location.reload(); } else banner();      // the hub has nothing to lose, a game might
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) applyUpdate(); });

  navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' }).then((reg) => {
    const check = () => { try { reg.update().catch(() => {}); } catch (e) { /* ignore */ } };
    check();
    setInterval(check, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    window.addEventListener('focus', check);
    window.addEventListener('online', check);
    window.addEventListener('pageshow', (e) => { if (e.persisted) check(); });
    if (reg.waiting && hadController) applyUpdate();                          // an update finished installing earlier, but this page never switched to it
  }).catch((err) => console.warn('Service worker registration failed:', err));
})();
