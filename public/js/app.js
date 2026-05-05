(function () {
  'use strict';

  function getDelayMs(element) {
    var raw = element.getAttribute('data-auto-dismiss-delay');
    var delay = parseInt(raw, 10);
    if (!isNaN(delay) && isFinite(delay) && delay >= 0) return delay;
    return 4000;
  }

  function closeAlert(element) {
    try {
      if (window.bootstrap && window.bootstrap.Alert) {
        var instance = window.bootstrap.Alert.getOrCreateInstance(element);
        instance.close();
        return;
      }
    } catch (e) {
      // fall back below
    }

    element.classList.remove('show');
    window.setTimeout(function () {
      if (typeof element.remove === 'function') {
        element.remove();
        return;
      }
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 150);
  }

  function setupAutoDismissAlerts() {
    var alerts = document.querySelectorAll('[data-auto-dismiss]');
    for (var i = 0; i < alerts.length; i += 1) {
      var alertEl = alerts[i];
      var flag = (alertEl.getAttribute('data-auto-dismiss') || '').trim().toLowerCase();

      flag = flag.replace(/^['"]|['"]$/g, '');
      if (!(flag === 'true' || flag === '1' || flag === 'yes' || flag === 'on')) continue;

      if (alertEl.dataset.autoDismissBound === '1') continue;
      alertEl.dataset.autoDismissBound = '1';

      var delayMs = getDelayMs(alertEl);
      window.setTimeout((function (element) {
        return function () {
          if (!document.body.contains(element)) return;
          closeAlert(element);
        };
      })(alertEl), delayMs);
    }
  }

  function initAppUi() {
    try { setupAutoDismissAlerts(); } catch (e) {}
    try { updateSidebarHashActive(); } catch (e2) {}
  }

  function normalizePathname(pathname) {
    // ensure no trailing slash (except root)
    if (pathname.length > 1 && pathname.endsWith('/')) {
      return pathname.slice(0, -1);
    }
    return pathname;
  }

  function updateSidebarHashActive() {
    var sidebar = document.querySelector('.app-sidebar');
    if (!sidebar) return;

    var hashLinks = Array.prototype.slice.call(sidebar.querySelectorAll('a.nav-link[href*="#"]'));
    if (hashLinks.length === 0) return;

    var currentPath = normalizePathname(window.location.pathname);
    var currentHash = window.location.hash || '#dashboard-ringkasan';

    // Only manage active state for links that point to the current page
    var relevant = hashLinks.filter(function (a) {
      try {
        var url = new URL(a.getAttribute('href'), window.location.origin);
        return normalizePathname(url.pathname) === currentPath;
      } catch (e) {
        return false;
      }
    });

    if (relevant.length === 0) return;

    for (var j = 0; j < relevant.length; j += 1) {
      var a = relevant[j];
      try {
        var url2 = new URL(a.getAttribute('href'), window.location.origin);
        var isActive = url2.hash === currentHash;
        if (isActive) a.classList.add('active');
        else a.classList.remove('active');
        if (isActive) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      } catch (e2) {
        // ignore individual link errors
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppUi);
  } else {
    initAppUi();
  }

  window.addEventListener('load', function () {
    try { setupAutoDismissAlerts(); } catch (e) {}
  });

  window.addEventListener('hashchange', function () {
    try { updateSidebarHashActive(); } catch (e) {}
  });
})();
