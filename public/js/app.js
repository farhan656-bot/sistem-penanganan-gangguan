(function () {
  'use strict';

  var activeSupervisorSectionHash = null;

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
    try { setupSupervisorSectionSwitcher(); } catch (e1) {}
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
    var currentHash = activeSupervisorSectionHash || window.location.hash || '#dashboard-ringkasan';

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

  function resizeChartsInSection(section) {
    if (!section || !window.Chart || typeof window.Chart.getChart !== 'function') return;

    window.setTimeout(function () {
      var canvases = section.querySelectorAll('canvas');
      for (var i = 0; i < canvases.length; i += 1) {
        var chart = window.Chart.getChart(canvases[i]);
        if (chart && typeof chart.resize === 'function') {
          chart.resize();
        }
      }
    }, 0);
  }

  function setupSupervisorSectionSwitcher() {
    var sections = Array.prototype.slice.call(document.querySelectorAll('.supervisor-section[id]'));
    if (sections.length === 0) {
      activeSupervisorSectionHash = null;
      return;
    }

    var sectionIds = sections.map(function (section) {
      return section.id;
    });
    var defaultId = sectionIds.indexOf('dashboard-ringkasan') >= 0
      ? 'dashboard-ringkasan'
      : sectionIds[0];
    var hashId = (window.location.hash || '').replace(/^#/, '');
    var targetId = sectionIds.indexOf(hashId) >= 0 ? hashId : defaultId;

    for (var i = 0; i < sections.length; i += 1) {
      var section = sections[i];
      var isActive = section.id === targetId;
      section.classList.toggle('d-none', !isActive);
      section.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    }

    activeSupervisorSectionHash = '#' + targetId;
    resizeChartsInSection(document.getElementById(targetId));
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
    try { setupSupervisorSectionSwitcher(); } catch (e0) {}
    try { updateSidebarHashActive(); } catch (e) {}
  });
})();
