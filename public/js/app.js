(function () {
  'use strict';

  var activeSupervisorSectionHash = null;
  var ACTIVE_QUEUE_CHECK_INTERVAL_MS = 10000;
  var INACTIVE_QUEUE_CHECK_INTERVAL_MS = 60000;

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

  var quickActionScrollKey = 'f027:ticket-action-scroll';
  var quickActionFlashKey = 'f027:ticket-action-flash';

  function getStorageItem(key) {
    try {
      return window.sessionStorage ? window.sessionStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  }

  function setStorageItem(key, value) {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (e) {}
  }

  function removeStorageItem(key) {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {}
  }

  function getCurrentPagePath() {
    return window.location.pathname + window.location.search;
  }

  function saveQuickActionScroll() {
    setStorageItem(quickActionScrollKey, JSON.stringify({
      page: getCurrentPagePath(),
      y: window.scrollY || window.pageYOffset || 0,
      savedAt: Date.now()
    }));
  }

  function restoreQuickActionScroll() {
    var raw = getStorageItem(quickActionScrollKey);
    if (!raw) return;

    try {
      var payload = JSON.parse(raw);
      var isFresh = payload && payload.savedAt && (Date.now() - Number(payload.savedAt)) < 60000;

      if (payload && payload.page === getCurrentPagePath() && isFresh) {
        var y = Number(payload.y);
        if (isFinite(y) && y >= 0) {
          window.scrollTo(0, y);
          window.setTimeout(function () {
            window.scrollTo(0, y);
          }, 50);
        }
      }
    } catch (e) {
      // Ignore invalid session storage payloads.
    }

    window.setTimeout(function () {
      removeStorageItem(quickActionScrollKey);
    }, 250);
  }

  function createFlashAlert(type, message) {
    var alertEl = document.createElement('div');
    var closeButton = document.createElement('button');
    var textNode = document.createTextNode(message || '');

    alertEl.className = 'alert alert-' + type + ' alert-dismissible fade show app-flash';
    alertEl.setAttribute('role', 'alert');

    if (type === 'success') {
      alertEl.setAttribute('data-auto-dismiss', 'true');
      alertEl.setAttribute('data-auto-dismiss-delay', '4000');
    }

    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');

    alertEl.appendChild(textNode);
    alertEl.appendChild(closeButton);
    return alertEl;
  }

  function getQuickActionFeedbackContainer() {
    var container = document.getElementById('quickActionFeedback');

    if (container) return container;
    if (!document.body) return null;

    container = document.createElement('div');
    container.id = 'quickActionFeedback';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1080';
    container.style.maxWidth = '420px';
    container.style.width = '100%';
    document.body.appendChild(container);

    return container;
  }

  function showQuickActionFlash(type, message) {
    var container = getQuickActionFeedbackContainer();
    var alertType = type === 'danger' ? 'danger' : 'success';
    var alertEl = createFlashAlert(alertType, message);

    if (!container) return;

    container.appendChild(alertEl);
    setupAutoDismissAlerts();
  }

  function saveQuickActionFlash(type, message) {
    setStorageItem(quickActionFlashKey, JSON.stringify({
      page: getCurrentPagePath(),
      type: type,
      message: message,
      savedAt: Date.now()
    }));
  }

  function restoreQuickActionFlash() {
    var raw = getStorageItem(quickActionFlashKey);
    if (!raw) return;

    removeStorageItem(quickActionFlashKey);

    try {
      var payload = JSON.parse(raw);
      var isFresh = payload && payload.savedAt && (Date.now() - Number(payload.savedAt)) < 60000;

      if (payload && payload.page === getCurrentPagePath() && isFresh && payload.message) {
        showQuickActionFlash(payload.type === 'danger' ? 'danger' : 'success', payload.message);
      }
    } catch (e) {
      // Ignore invalid session storage payloads.
    }
  }

  function ensureQuickActionReturnTo(form) {
    var field = form.querySelector('input[name="return_to"]');

    if (!field) {
      field = document.createElement('input');
      field.type = 'hidden';
      field.name = 'return_to';
      form.appendChild(field);
    }

    field.value = getCurrentPagePath();
  }

  function getQuickActionSubmitButton(form, event) {
    if (event && event.submitter) {
      return event.submitter;
    }

    return form.querySelector('button[type="submit"], input[type="submit"]');
  }

  function setQuickActionLoading(form, button, isLoading) {
    if (!button) return;

    if (isLoading) {
      form.dataset.quickActionBusy = '1';
      button.dataset.originalLabel = button.textContent;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = 'Proses...';
      return;
    }

    form.dataset.quickActionBusy = '0';
    button.disabled = false;
    button.removeAttribute('aria-busy');

    if (button.dataset.originalLabel) {
      button.textContent = button.dataset.originalLabel;
      delete button.dataset.originalLabel;
    }
  }

  function buildQuickActionBody(form) {
    var body = new URLSearchParams(new FormData(form));
    body.set('return_to', getCurrentPagePath());
    return body;
  }

  function bindQuickTicketAction(form) {
    if (!form || form.dataset.quickActionBound === '1') return;

    form.dataset.quickActionBound = '1';

    form.addEventListener('submit', function (event) {
      if (event.defaultPrevented) return;

      saveQuickActionScroll();
      ensureQuickActionReturnTo(form);

      if (!window.fetch || !window.FormData || !window.URLSearchParams) {
        return;
      }

      event.preventDefault();

      if (form.dataset.quickActionBusy === '1') return;

      var button = getQuickActionSubmitButton(form, event);
      var actionUrl = form.getAttribute('action');
      var method = String(form.getAttribute('method') || 'POST').toUpperCase();

      setQuickActionLoading(form, button, true);

      window.fetch(actionUrl, {
        method: method,
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: buildQuickActionBody(form)
      })
        .then(function (response) {
          var contentType = response.headers.get('content-type') || '';

          if (contentType.indexOf('application/json') === -1) {
            throw new Error('Sesi login tidak valid atau respons server tidak dapat diproses.');
          }

          return response.json().then(function (payload) {
            if (!response.ok || !payload || payload.success === false) {
              throw new Error(payload && payload.message ? payload.message : 'Aksi laporan gagal diproses.');
            }

            return payload;
          });
        })
        .then(function (payload) {
          var message = payload && payload.message ? payload.message : 'Aksi laporan berhasil diproses.';
          saveQuickActionScroll();
          saveQuickActionFlash('success', message);
          showQuickActionFlash('success', message);

          window.setTimeout(function () {
            window.location.reload();
          }, 250);
        })
        .catch(function (error) {
          removeStorageItem(quickActionScrollKey);
          setQuickActionLoading(form, button, false);
          showQuickActionFlash('danger', error && error.message ? error.message : 'Aksi laporan gagal diproses.');
        });
    });
  }

  function bindQuickTicketActionForms() {
    var forms = document.querySelectorAll('[data-ticket-quick-action]');
    for (var i = 0; i < forms.length; i += 1) {
      bindQuickTicketAction(forms[i]);
    }
  }

  function setupQuickTicketActions() {
    restoreQuickActionScroll();
    restoreQuickActionFlash();
    bindQuickTicketActionForms();
  }

  function setupQueueAutoRefreshPolling() {
    var refreshRoot = document.querySelector('[data-report-queue-auto-refresh]');

    if (!refreshRoot || refreshRoot.dataset.pollingBound === '1' || !window.fetch) return;

    var tabsTarget = refreshRoot.querySelector('[data-report-tabs-target]');
    var listTarget = refreshRoot.querySelector('[data-report-list-target]');
    var checkUrl = refreshRoot.getAttribute('data-check-url') || '/reports/check-new';
    var fragmentUrl = refreshRoot.getAttribute('data-fragment-url') || '/reports/queue-fragment';
    var sinceId = parseInt(refreshRoot.getAttribute('data-latest-report-id'), 10);
    var cursor = readCursor(
      refreshRoot.getAttribute('data-received-at'),
      refreshRoot.getAttribute('data-ticket-id')
    );
    var pendingCursor = null;
    var activePollInterval = parseInt(
      refreshRoot.getAttribute('data-active-poll-interval'),
      10
    );
    var inactivePollInterval = parseInt(
      refreshRoot.getAttribute('data-inactive-poll-interval'),
      10
    );
    var pendingLatestReportId = sinceId;
    var pendingUpdate = false;
    var isChecking = false;
    var isRefreshing = false;
    var pollingTimerId = null;

    if (!tabsTarget || !listTarget) return;
    if (!isFinite(sinceId) || sinceId < 0) sinceId = 0;
    if (!isFinite(activePollInterval) || activePollInterval < 5000) {
      activePollInterval = ACTIVE_QUEUE_CHECK_INTERVAL_MS;
    }
    if (!isFinite(inactivePollInterval) || inactivePollInterval < activePollInterval) {
      inactivePollInterval = INACTIVE_QUEUE_CHECK_INTERVAL_MS;
    }
    pendingLatestReportId = sinceId;

    refreshRoot.dataset.pollingBound = '1';

    function readCursor(receivedAt, ticketId) {
      if (typeof receivedAt !== 'string' || !receivedAt.trim()) return null;
      var timestamp = receivedAt.trim();
      if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp)) return null;
      var date = new Date(timestamp);
      var calendarDate = new Date(timestamp.slice(0, 10) + 'T00:00:00.000Z');
      if (!isFinite(date.getTime()) || !isFinite(calendarDate.getTime())
        || calendarDate.toISOString().slice(0, 10) !== timestamp.slice(0, 10)) return null;
      if (ticketId === null || ticketId === undefined) ticketId = '';
      if (typeof ticketId !== 'string' || ticketId.length > 100) return null;
      return { receivedAt: date.toISOString(), ticketId: ticketId };
    }

    function newerCursor(current, candidate) {
      if (!candidate) return current;
      if (!current || candidate.receivedAt > current.receivedAt
        || (candidate.receivedAt === current.receivedAt && candidate.ticketId > current.ticketId)) {
        return candidate;
      }
      return current;
    }

    function buildCheckUrl() {
      var endpoint = new URL(checkUrl, window.location.origin);
      var currentQuery = new URLSearchParams(window.location.search);
      var filterNames = ['work_status', 'region', 'search', 'keyword'];

      if (cursor) {
        endpoint.searchParams.delete('since_id');
        endpoint.searchParams.set('since_received_at', cursor.receivedAt);
        endpoint.searchParams.set('since_ticket_id', cursor.ticketId);
      } else {
        endpoint.searchParams.delete('since_received_at');
        endpoint.searchParams.delete('since_ticket_id');
        endpoint.searchParams.set('since_id', String(sinceId));
      }

      for (var i = 0; i < filterNames.length; i += 1) {
        var filterName = filterNames[i];
        var filterValue = currentQuery.get(filterName);

        if (filterValue) {
          endpoint.searchParams.set(filterName, filterValue);
        }
      }

      return endpoint.toString();
    }

    function buildFragmentUrl() {
      var endpoint = new URL(fragmentUrl, window.location.origin);
      var currentQuery = new URLSearchParams(window.location.search);
      var filterNames = ['work_status', 'region', 'search', 'keyword', 'page', 'per_page'];

      for (var i = 0; i < filterNames.length; i += 1) {
        var filterName = filterNames[i];
        var filterValue = currentQuery.get(filterName);

        if (filterValue) {
          endpoint.searchParams.set(filterName, filterValue);
        }
      }

      return endpoint.toString();
    }

    function isQueueUpdateBlocked() {
      var openModal = document.querySelector('.modal.show');
      var activeElement = document.activeElement;
      var activeForm = activeElement && activeElement.closest
        ? activeElement.closest('form')
        : null;
      var busyQuickAction = refreshRoot.querySelector(
        '[data-ticket-quick-action][data-quick-action-busy="1"]'
      );

      return Boolean(openModal || activeForm || busyQuickAction);
    }

    function parseQueueFragment(html) {
      var template = document.createElement('template');
      template.innerHTML = String(html || '').trim();

      return {
        tabs: template.content.querySelector('[data-report-tabs-fragment]'),
        list: template.content.querySelector('[data-report-list-fragment]')
      };
    }

    function restoreQueueScroll(scrollY) {
      window.scrollTo(0, scrollY);
      window.setTimeout(function () {
        window.scrollTo(0, scrollY);
      }, 0);
    }

    function refreshQueueFragment() {
      if (!pendingUpdate || isRefreshing || isQueueUpdateBlocked()) return;

      isRefreshing = true;
      var savedScrollY = window.scrollY || window.pageYOffset || 0;

      window.fetch(buildFragmentUrl(), {
        credentials: 'same-origin',
        headers: {
          Accept: 'text/html',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Gagal memuat fragment antrean.');
          }

          return response.text();
        })
        .then(function (html) {
          if (isQueueUpdateBlocked()) {
            throw new Error('Pembaruan antrean ditunda karena pengguna sedang berinteraksi.');
          }

          var fragment = parseQueueFragment(html);

          if (!fragment.tabs || !fragment.list) {
            throw new Error('Fragment antrean tidak valid.');
          }

          tabsTarget.innerHTML = fragment.tabs.innerHTML;
          listTarget.innerHTML = fragment.list.innerHTML;
          // Commit only after rendering succeeds; keep the timestamp and ticket together.
          var fragmentCursor = readCursor(
            fragment.list.getAttribute('data-received-at'),
            fragment.list.getAttribute('data-ticket-id')
          );
          cursor = newerCursor(newerCursor(cursor, pendingCursor), fragmentCursor);
          pendingCursor = null;
          if (cursor) {
            refreshRoot.setAttribute('data-received-at', cursor.receivedAt);
            refreshRoot.setAttribute('data-ticket-id', cursor.ticketId);
          }
          sinceId = Math.max(sinceId, pendingLatestReportId);
          pendingUpdate = false;
          refreshRoot.setAttribute('data-latest-report-id', String(sinceId));

          restoreQueueScroll(savedScrollY);
          bindQuickTicketActionForms();
          showQuickActionFlash('success', 'Daftar tiket diperbarui otomatis.');
        })
        .catch(function () {
          // Pertahankan pending update dan coba lagi pada interval berikutnya.
        })
        .then(function () {
          isRefreshing = false;
        });
    }

    function queueFragmentRefresh(payload) {
      var normalizedLatestReportId = Number(payload.latestReportId);
      pendingCursor = newerCursor(pendingCursor, readCursor(payload.latest_received_at, payload.latest_ticket_id));

      if (isFinite(normalizedLatestReportId) && normalizedLatestReportId >= 0) {
        pendingLatestReportId = Math.max(pendingLatestReportId, normalizedLatestReportId);
      }

      pendingUpdate = true;
      refreshQueueFragment();
    }

    function checkForNewReports() {
      if (isChecking || isRefreshing) return;
      if (pendingUpdate) {
        refreshQueueFragment();
        return;
      }
      isChecking = true;

      window.fetch(buildCheckUrl(), {
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json'
        }
      })
        .then(function (response) {
          var contentType = response.headers.get('content-type') || '';

          if (!response.ok || contentType.indexOf('application/json') === -1) {
            throw new Error('Respons pengecekan laporan baru tidak valid.');
          }

          return response.json();
        })
        .then(function (payload) {
          if (!payload || payload.success === false) return;

          var newCount = Number(payload.newCount);
          if (payload.hasNewReports && isFinite(newCount) && newCount > 0) {
            queueFragmentRefresh(payload);
          }
        })
        .catch(function () {
          // Polling gagal secara senyap agar tidak mengganggu pekerjaan pengguna.
        })
        .then(function () {
          isChecking = false;
        });
    }

    var detailModal = document.getElementById('reportDetailModal');
    if (detailModal) {
      detailModal.addEventListener('hidden.bs.modal', function () {
        refreshQueueFragment();
      });
    }

    document.addEventListener('focusout', function () {
      if (!pendingUpdate) return;
      window.setTimeout(refreshQueueFragment, 0);
    });

    function getPollingInterval() {
      return document.visibilityState === 'hidden'
        ? inactivePollInterval
        : activePollInterval;
    }

    function schedulePolling() {
      if (pollingTimerId !== null) {
        window.clearInterval(pollingTimerId);
      }

      pollingTimerId = window.setInterval(checkForNewReports, getPollingInterval());
    }

    document.addEventListener('visibilitychange', function () {
      schedulePolling();

      if (document.visibilityState === 'visible') {
        refreshQueueFragment();
        checkForNewReports();
      }
    });

    schedulePolling();
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function displayValue(value) {
    if (value === null || value === undefined) return '-';
    var text = String(value).trim();
    return text ? text : '-';
  }

  function titleCase(value) {
    var text = displayValue(value);
    if (text === '-') return text;

    return text
      .replace(/_/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join(' ');
  }

  function formatDateTime(value) {
    if (!value) return '-';

    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return displayValue(value);

    try {
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return displayValue(value);
    }
  }

  function formatFileSize(value) {
    var size = Number(value);
    if (!isFinite(size) || size <= 0) return '-';
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function safeFileUrl(value) {
    var url = displayValue(value);
    if (url === '-') return '';
    if (/^(\/|https?:\/\/)/i.test(url)) return url;
    return '';
  }

  function ticketStatusBadge(value) {
    var key = displayValue(value).toLowerCase();
    var map = {
      tersedia: { cls: 'text-bg-primary', label: 'Tersedia' },
      diambil: { cls: 'text-bg-warning', label: 'Diambil' },
      didelegasikan: { cls: 'text-bg-info', label: 'Didelegasikan' },
      selesai: { cls: 'text-bg-success', label: 'Selesai' },
      perlu_tindak_lanjut: { cls: 'badge-status-follow-up', label: 'Perlu Tindak Lanjut' },
      eskalasi: { cls: 'text-bg-danger', label: 'Eskalasi' }
    };
    var meta = map[key] || { cls: 'text-bg-secondary', label: titleCase(key) };

    return '<span class="badge ' + meta.cls + '">' + escapeHtml(meta.label) + '</span>';
  }

  function formatRegion(code, name) {
    var regionCode = displayValue(code);
    var regionName = displayValue(name);

    if (regionCode === '-' && regionName === '-') return '-';
    if (regionCode === '-') return regionName;
    if (regionName === '-') return regionCode;
    return regionCode + ' - ' + regionName;
  }

  function optionalText(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function formatTelegramUsername(value) {
    var username = optionalText(value);
    if (!username) return '';
    return username.charAt(0) === '@' ? username : '@' + username;
  }

  function formatTelegramSenderName(report) {
    var firstName = optionalText(report.telegram_sender_first_name);
    var lastName = optionalText(report.telegram_sender_last_name);
    return [firstName, lastName].filter(Boolean).join(' ');
  }

  function renderTelegramSenderFields(report) {
    var username = formatTelegramUsername(report.telegram_sender_username);
    var senderName = formatTelegramSenderName(report);
    var senderId = optionalText(report.telegram_sender_id);

    if (!username && !senderName && !senderId) {
      return [
        '<div class="col-12">',
        renderEmptyState('Data pengirim belum tersedia.'),
        '</div>'
      ];
    }

    return [
      renderDetailField('Username Telegram', username || '-'),
      renderDetailField('Nama Telegram', senderName || '-'),
      renderDetailField('Telegram ID', senderId || '-')
    ];
  }

  function renderDetailField(label, value, options) {
    var config = options || {};
    var colClass = config.col || 'col-12 col-md-6 col-xl-3';
    var valueClass = config.strong ? 'fw-semibold' : '';
    var body = config.html ? value : escapeHtml(displayValue(value));

    if (config.prewrap) {
      valueClass += (valueClass ? ' ' : '') + 'app-modal-prewrap';
    }

    return [
      '<div class="' + colClass + '">',
      '<div class="text-muted small">' + escapeHtml(label) + '</div>',
      '<div class="' + valueClass + '">' + body + '</div>',
      '</div>'
    ].join('');
  }

  function renderDetailSection(title, fieldsHtml) {
    return [
      '<section class="report-detail-section">',
      '<h2 class="report-detail-section-title">' + escapeHtml(title) + '</h2>',
      '<div class="row g-3">',
      fieldsHtml.join(''),
      '</div>',
      '</section>'
    ].join('');
  }

  function renderMediaItem(item, defaultName) {
    var fileUrl = safeFileUrl(item.file_path);
    var fileName = displayValue(item.file_name);
    var mimeType = displayValue(item.mime_type);
    var fileType = displayValue(item.file_type);
    var caption = displayValue(item.caption);
    var isImage = fileUrl && mimeType.toLowerCase().indexOf('image/') === 0;
    var title = fileName === '-' ? defaultName : fileName;
    var openButton = fileUrl
      ? '<a href="' + escapeHtml(fileUrl) + '" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary">Buka</a>'
      : '';
    var titleHtml = fileUrl
      ? '<a href="' + escapeHtml(fileUrl) + '" target="_blank" rel="noopener" class="text-decoration-none">' + escapeHtml(title) + '</a>'
      : escapeHtml(title);

    return [
      '<div class="report-detail-media-item">',
      '<div class="d-flex align-items-start justify-content-between gap-3">',
      '<div class="min-w-0">',
      '<div class="fw-semibold">' + titleHtml + '</div>',
      '<div class="small text-muted">',
      'Waktu: ' + escapeHtml(formatDateTime(item.created_at)),
      item.uploaded_by_name ? ' | Oleh: ' + escapeHtml(displayValue(item.uploaded_by_name)) : '',
      '</div>',
      '</div>',
      openButton,
      '</div>',
      isImage ? '<a href="' + escapeHtml(fileUrl) + '" target="_blank" rel="noopener"><img src="' + escapeHtml(fileUrl) + '" alt="' + escapeHtml(title) + '" class="report-detail-media-preview"></a>' : '',
      '<div class="row g-2 mt-2 small text-muted">',
      '<div class="col-12 col-md-4">Tipe: ' + escapeHtml(fileType) + '</div>',
      '<div class="col-12 col-md-4">MIME: ' + escapeHtml(mimeType) + '</div>',
      '<div class="col-12 col-md-4">Ukuran: ' + escapeHtml(formatFileSize(item.file_size)) + '</div>',
      '</div>',
      caption !== '-' ? '<div class="small mt-2"><strong>Caption:</strong> ' + escapeHtml(caption) + '</div>' : '',
      '</div>'
    ].join('');
  }

  function renderEmptyState(message) {
    return '<div class="report-detail-empty-state text-muted">' + escapeHtml(message) + '</div>';
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function isTelegramMediaItem(item) {
    if (item && item.type_attachment_code === 'bukti_pelapor') {
      return true;
    }
    if (item && item.type_attachment_code === 'bukti_penanganan') {
      return false;
    }
    var source = String(item && item.source ? item.source : '').trim().toLowerCase();
    return source === 'telegram' || source === 'bot_telegram';
  }


  function getCompletionAttachments(payload) {
    return asArray(payload.attachments).filter(function (item) {
      return !isTelegramMediaItem(item);
    });
  }

  function getTelegramMediaItems(payload) {
    return asArray(payload.telegramMedia).concat(asArray(payload.telegramLogMedia));
  }

  function getActivityLogs(payload) {
    if (Array.isArray(payload.reportLogs)) return payload.reportLogs;
    if (Array.isArray(payload.logs)) return payload.logs;
    if (Array.isArray(payload.activityLogs)) return payload.activityLogs;
    return [];
  }

  function renderMediaList(items, emptyText, defaultName) {
    var safeItems = asArray(items);

    if (safeItems.length === 0) {
      return renderEmptyState(emptyText);
    }

    return safeItems.map(function (item) {
      return renderMediaItem(item, defaultName);
    }).join('');
  }

  function renderActivityLogItem(log) {
    var item = typeof log === 'string' ? { description: log } : (log || {});
    var action = displayValue(item.action || item.event || item.type || 'Aktivitas');
    var actor = displayValue(item.actor_name || item.user_name || item.full_name || item.created_by_name);
    var description = displayValue(item.description || item.message || item.notes);
    var createdAt = item.created_at || item.timestamp || item.time;
    var actorHtml = actor !== '-' ? '<div class="small text-muted">Pelaku: ' + escapeHtml(actor) + '</div>' : '';
    var descriptionHtml = description !== '-'
      ? '<div class="app-modal-prewrap mt-1">' + escapeHtml(description) + '</div>'
      : '<div class="text-muted mt-1">Tidak ada catatan aktivitas.</div>';

    return [
      '<div class="report-detail-log-item">',
      '<div class="small text-muted">' + escapeHtml(formatDateTime(createdAt)) + '</div>',
      actorHtml,
      descriptionHtml,
      '</div>'
    ].join('');
  }

  function renderActivityLogList(logs) {
    var safeLogs = asArray(logs);

    if (safeLogs.length === 0) {
      return renderEmptyState('Belum ada riwayat aktivitas yang tersedia untuk detail modal ini.');
    }

    return [
      '<div class="report-detail-log-list">',
      safeLogs.map(renderActivityLogItem).join(''),
      '</div>'
    ].join('');
  }

  function renderReportDetail(payload) {
    var report = payload.report || {};
    var proofAttachments = getCompletionAttachments(payload);
    var telegramMedia = getTelegramMediaItems(payload);
    var activityLogs = getActivityLogs(payload);

    var overview = [
      '<div class="d-flex flex-wrap align-items-start justify-content-between gap-3 report-detail-overview">',
      '<div>',
      '<div class="text-muted small">Status Internal</div>',
      '<div class="mt-1">',
      ticketStatusBadge(report.status_internal),
      displayValue(report.status_internal) === 'didelegasikan' ? '<span class="badge text-bg-info ms-1">Delegasi Aktif</span>' : '',
      '</div>',
      '</div>',
      '<div class="text-md-end">',
      '<div class="text-muted small">Wilayah Aktif</div>',
      '<div class="fw-semibold">' + escapeHtml(formatRegion(report.current_region_code, report.current_region_name)) + '</div>',
      '</div>',
      '</div>'
    ].join('');

    var mainFields = [
      renderDetailField('Ticket ID', report.ticket_id, { strong: true }),
      renderDetailField('Order ID', report.order_id),
      renderDetailField('WO Number', report.wo_number),
      renderDetailField('Source Channel', titleCase(report.source_channel)),
      renderDetailField('Jenis Layanan', report.service_type),
      renderDetailField('Segment', report.segment),
      renderDetailField('Provider', report.provider),
      renderDetailField('Telkom Area', report.telkom_area),
      renderDetailField('Service ID', report.service_id)
    ];

    var regionFields = [
      renderDetailField('Wilayah Awal', formatRegion(report.reported_region_code, report.reported_region_name), { col: 'col-12 col-md-6' }),
      renderDetailField('Wilayah Aktif', formatRegion(report.current_region_code, report.current_region_name), { col: 'col-12 col-md-6' }),
      renderDetailField('Branch', report.branch_name),
      renderDetailField('Cluster', report.cluster_name),
      renderDetailField('STO', report.sto)
    ];

    var statusFields = [
      renderDetailField('Assigned To', report.assigned_user_name, { strong: true }),
      renderDetailField('Status Internal', ticketStatusBadge(report.status_internal), { html: true }),
      renderDetailField('Status WFM', report.status_wfm),
      renderDetailField('Status Andalas', report.status_andalas),
      renderDetailField('Status Akhir', report.completion_status ? ticketStatusBadge(report.completion_status) : '-', { html: true })
    ];

    if (displayValue(report.diit_code) !== '-') {
      statusFields.push(renderDetailField('Kode DIIT', report.diit_code, { strong: true }));
    }

    statusFields.push(renderDetailField('Catatan Penyelesaian', report.completion_notes, { col: 'col-12', prewrap: true }));

    var timeFields = [
      renderDetailField('Received At', formatDateTime(report.received_at)),
      renderDetailField('Taken At', formatDateTime(report.taken_at)),
      renderDetailField('Resolved At', formatDateTime(report.resolved_at)),
      renderDetailField('Closed At', formatDateTime(report.closed_at)),
      renderDetailField('Created At', formatDateTime(report.created_at)),
      renderDetailField('Updated At', formatDateTime(report.updated_at))
    ];

    var infoHtml = [
      overview,
      renderDetailSection('Informasi Utama', mainFields),
      renderDetailSection('Pengirim Telegram', renderTelegramSenderFields(report)),
      renderDetailSection('Wilayah dan Lokasi', regionFields),
      renderDetailSection('Status dan Penugasan', statusFields),
      renderDetailSection('Waktu', timeFields),
      renderDetailSection('Ringkasan', [
        renderDetailField('Summary', report.summary, { col: 'col-12', prewrap: true })
      ])
    ].join('');

    return {
      info: infoHtml,
      proof: renderDetailSection('Bukti Penanganan (Sistem)', [
        '<div class="col-12">' + renderMediaList(proofAttachments, 'Belum ada file bukti penyelesaian.', 'Bukti Penanganan (Sistem)') + '</div>'
      ]),
      telegram: renderDetailSection('Bukti Pelapor (Telegram)', [
        '<div class="col-12">' + renderMediaList(telegramMedia, 'Belum ada media tambahan Telegram yang terhubung ke tiket ini.', 'Bukti Pelapor (Telegram)') + '</div>'
      ]),
      activity: renderDetailSection('Riwayat Aktivitas', [
        '<div class="col-12">' + renderActivityLogList(activityLogs) + '</div>'
      ])
    };
  }

  function setupReportDetailModal() {
    var modalEl = document.getElementById('reportDetailModal');
    if (!modalEl || modalEl.dataset.reportDetailBound === '1') return;

    var loadingEl = modalEl.querySelector('[data-report-detail-loading]');
    var errorEl = modalEl.querySelector('[data-report-detail-error]');
    var contentEl = modalEl.querySelector('[data-report-detail-content]');
    var subtitleEl = modalEl.querySelector('[data-report-detail-subtitle]');
    var fallbackEl = modalEl.querySelector('[data-report-detail-fallback]');
    var infoTabEl = modalEl.querySelector('[data-report-detail-info-tab]');
    var infoPaneEl = modalEl.querySelector('[data-report-detail-info-pane]');
    var proofPaneEl = modalEl.querySelector('[data-report-detail-proof-pane]');
    var telegramPaneEl = modalEl.querySelector('[data-report-detail-telegram-pane]');
    var activityPaneEl = modalEl.querySelector('[data-report-detail-activity-pane]');

    if (!loadingEl || !errorEl || !contentEl || !subtitleEl || !fallbackEl || !infoTabEl || !infoPaneEl || !proofPaneEl || !telegramPaneEl || !activityPaneEl) return;

    modalEl.dataset.reportDetailBound = '1';
    var activeDetailRequestId = 0;

    function clearDetailPanes() {
      infoPaneEl.innerHTML = '';
      proofPaneEl.innerHTML = '';
      telegramPaneEl.innerHTML = '';
      activityPaneEl.innerHTML = '';
    }

    function resetActiveTab() {
      if (!window.bootstrap || !window.bootstrap.Tab) return;
      window.bootstrap.Tab.getOrCreateInstance(infoTabEl).show();
    }

    function resetModal(fallbackUrl) {
      loadingEl.classList.remove('d-none');
      errorEl.classList.add('d-none');
      contentEl.classList.add('d-none');
      clearDetailPanes();
      resetActiveTab();
      subtitleEl.textContent = 'Memuat data laporan...';
      fallbackEl.href = fallbackUrl || '#';
      fallbackEl.classList.toggle('d-none', !fallbackUrl);
    }

    function showError(message) {
      loadingEl.classList.add('d-none');
      contentEl.classList.add('d-none');
      errorEl.textContent = message || 'Gagal memuat detail laporan.';
      errorEl.classList.remove('d-none');
    }

    function showContent(payload) {
      var report = payload.report || {};
      var detailHtml = renderReportDetail(payload);
      loadingEl.classList.add('d-none');
      errorEl.classList.add('d-none');
      infoPaneEl.innerHTML = detailHtml.info;
      proofPaneEl.innerHTML = detailHtml.proof;
      telegramPaneEl.innerHTML = detailHtml.telegram;
      activityPaneEl.innerHTML = detailHtml.activity;
      resetActiveTab();
      contentEl.classList.remove('d-none');
      subtitleEl.textContent = 'Ticket ID: ' + displayValue(report.ticket_id);

      if (payload.fallbackUrl) {
        fallbackEl.href = payload.fallbackUrl;
        fallbackEl.classList.remove('d-none');
      }
    }

    modalEl.addEventListener('hidden.bs.modal', function () {
      activeDetailRequestId += 1;
      resetModal('');
    });

    document.addEventListener('click', function (event) {
      var eventTarget = event.target;
      var button = eventTarget && eventTarget.closest
        ? eventTarget.closest('[data-report-detail-url]')
        : null;

      if (!button) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!window.bootstrap || !window.bootstrap.Modal || !window.fetch) return;

      var detailUrl = button.getAttribute('data-report-detail-url');
      var fallbackUrl = button.getAttribute('href') || '';

      if (!detailUrl) return;

      event.preventDefault();
      activeDetailRequestId += 1;
      var requestId = activeDetailRequestId;
      resetModal(fallbackUrl);

      window.bootstrap.Modal.getOrCreateInstance(modalEl).show();

      window.fetch(detailUrl, {
        headers: {
          Accept: 'application/json'
        }
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error(response.status === 404
              ? 'Laporan tidak ditemukan atau tidak dapat diakses.'
              : 'Gagal memuat detail laporan.');
          }
          if ((response.headers.get('content-type') || '').indexOf('application/json') === -1) {
            throw new Error('Sesi login tidak valid atau akses ditolak.');
          }
          return response.json();
        })
        .then(function (payload) {
          if (requestId !== activeDetailRequestId) return;
          if (!payload || payload.success === false) {
            throw new Error(payload && payload.message ? payload.message : 'Gagal memuat detail laporan.');
          }
          showContent(payload);
        })
        .catch(function (error) {
          if (requestId !== activeDetailRequestId) return;
          showError(error && error.message ? error.message : 'Gagal memuat detail laporan.');
        });
    });
  }

  function getScreenshotFileName(mimeType) {
    var type = String(mimeType || '').toLowerCase();
    if (type === 'image/jpeg') return 'screenshot-evidence.jpg';
    if (type === 'image/webp') return 'screenshot-evidence.webp';
    return 'screenshot-evidence.png';
  }

  function isAllowedEvidenceImage(file) {
    var type = String(file && file.type ? file.type : '').toLowerCase();
    return ['image/jpeg', 'image/png', 'image/webp'].indexOf(type) >= 0;
  }

  function isAllowedEvidenceUploadFile(file) {
    var type = String(file && file.type ? file.type : '').toLowerCase();
    var name = String(file && file.name ? file.name : '').toLowerCase();

    if (['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].indexOf(type) >= 0) {
      return true;
    }

    return /\.(jpe?g|png|webp|pdf)$/.test(name);
  }

  function setEvidenceStatus(statusEl, message, tone) {
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.classList.remove('text-muted', 'text-success', 'text-danger');

    if (tone === 'success') {
      statusEl.classList.add('text-success');
    } else if (tone === 'danger') {
      statusEl.classList.add('text-danger');
    } else {
      statusEl.classList.add('text-muted');
    }
  }

  function buildClipboardImageFile(item) {
    var blob = item && typeof item.getAsFile === 'function' ? item.getAsFile() : null;
    if (!blob) return null;

    var mimeType = blob.type || item.type || 'image/png';
    var fileName = getScreenshotFileName(mimeType);

    try {
      return new File([blob], fileName, {
        type: mimeType,
        lastModified: Date.now()
      });
    } catch (e) {
      return null;
    }
  }

  function getClipboardImageFile(clipboardData) {
    var items = clipboardData && clipboardData.items ? clipboardData.items : [];

    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      var type = String(item && item.type ? item.type : '').toLowerCase();

      if (type.indexOf('image/') === 0) {
        return buildClipboardImageFile(item);
      }
    }

    return null;
  }

  function setSingleFileInput(fileInput, file) {
    if (!window.DataTransfer) return false;

    try {
      var dataTransfer = new window.DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      return fileInput.files && fileInput.files.length === 1;
    } catch (e) {
      return false;
    }
  }

  function bindCompletionEvidencePasteUpload(form) {
    if (!form || form.dataset.evidencePasteBound === '1') return;

    var fileInput = form.querySelector('[data-proof-file-input]');
    var pasteArea = form.querySelector('[data-evidence-paste-area]');
    var previewEl = form.querySelector('[data-evidence-preview]');
    var previewImageEl = form.querySelector('[data-evidence-preview-image]');
    var fileNameEl = form.querySelector('[data-evidence-file-name]');
    var fileSizeEl = form.querySelector('[data-evidence-file-size]');
    var fileNoteEl = form.querySelector('[data-evidence-file-note]');
    var statusEl = form.querySelector('[data-evidence-paste-status]');
    var clearButton = form.querySelector('[data-evidence-clear]');
    var previewUrl = '';
    var maxFileSize = 5 * 1024 * 1024;
    var maxFileCount = 5;

    if (!fileInput || !pasteArea) return;

    form.dataset.evidencePasteBound = '1';

    function clearPreview() {
      if (previewUrl && window.URL && typeof window.URL.revokeObjectURL === 'function') {
        window.URL.revokeObjectURL(previewUrl);
      }

      previewUrl = '';

      if (previewImageEl) {
        previewImageEl.removeAttribute('src');
        previewImageEl.classList.add('d-none');
      }

      if (previewEl) previewEl.classList.add('d-none');
      if (fileNameEl) fileNameEl.textContent = '';
      if (fileSizeEl) fileSizeEl.textContent = '';
      if (fileNoteEl) fileNoteEl.textContent = '';
    }

    function showPreview(file, source, totalCount) {
      clearPreview();

      if (!file || !previewEl) return;

      var selectedCount = totalCount || 1;
      previewEl.classList.remove('d-none');
      if (fileNameEl) {
        fileNameEl.textContent = selectedCount > 1
          ? (file.name || 'Bukti penyelesaian') + ' +' + (selectedCount - 1) + ' file lain'
          : (file.name || 'Bukti penyelesaian');
      }
      if (fileSizeEl) {
        fileSizeEl.textContent = selectedCount > 1
          ? selectedCount + ' file dipilih. File pertama: ' + formatFileSize(file.size)
          : 'Ukuran: ' + formatFileSize(file.size);
      }

      if (file.type && file.type.indexOf('image/') === 0 && previewImageEl && window.URL && typeof window.URL.createObjectURL === 'function') {
        previewUrl = window.URL.createObjectURL(file);
        previewImageEl.src = previewUrl;
        previewImageEl.classList.remove('d-none');
        if (fileNoteEl) {
          fileNoteEl.textContent = source === 'paste'
            ? 'Screenshot siap dikirim sebagai bukti penyelesaian.'
            : 'File gambar siap dikirim sebagai bukti penyelesaian.';
        }
        return;
      }

      if (fileNoteEl) {
        fileNoteEl.textContent = 'Preview gambar tidak tersedia untuk file ini, tetapi file tetap akan dikirim sebagai bukti.';
      }
    }

    function syncManualFilePreview() {
      var files = [];

      if (fileInput.files && fileInput.files.length > 0) {
        for (var i = 0; i < fileInput.files.length; i += 1) {
          files.push(fileInput.files[i]);
        }
      }

      var file = files.length > 0 ? files[0] : null;

      if (!file) {
        clearPreview();
        setEvidenceStatus(statusEl, 'Belum ada screenshot yang ditempel.', 'muted');
        return;
      }

      showPreview(file, 'manual', files.length);

      if (files.length > maxFileCount) {
        setEvidenceStatus(statusEl, 'Jumlah file terlalu banyak. Maksimal 5 file bukti per upload.', 'danger');
        return;
      }

      for (var j = 0; j < files.length; j += 1) {
        if (!isAllowedEvidenceUploadFile(files[j])) {
          setEvidenceStatus(statusEl, 'Format file tidak didukung. Gunakan JPG, JPEG, PNG, WEBP, atau PDF.', 'danger');
          return;
        }

        if (files[j].size > maxFileSize) {
          setEvidenceStatus(statusEl, 'Ada file lebih dari 5 MB dan akan ditolak oleh sistem.', 'danger');
          return;
        }
      }

      setEvidenceStatus(statusEl, files.length > 1
        ? files.length + ' file bukti siap diunggah.'
        : 'File bukti siap diunggah.', 'success');
    }

    pasteArea.addEventListener('click', function (event) {
      if (event.target && event.target.closest && event.target.closest('[data-evidence-clear]')) return;
      pasteArea.focus();
    });

    pasteArea.addEventListener('paste', function (event) {
      var clipboardData = event.clipboardData || window.clipboardData;
      var file = getClipboardImageFile(clipboardData);

      if (!file) {
        setEvidenceStatus(statusEl, 'Clipboard tidak berisi gambar. Upload manual tetap dapat digunakan.', 'muted');
        return;
      }

      event.preventDefault();

      if (!isAllowedEvidenceImage(file)) {
        setEvidenceStatus(statusEl, 'Format screenshot tidak didukung. Gunakan JPG, PNG, atau WEBP.', 'danger');
        return;
      }

      if (file.size > maxFileSize) {
        setEvidenceStatus(statusEl, 'Screenshot lebih dari 5 MB dan tidak dapat ditempel sebagai bukti.', 'danger');
        return;
      }

      if (!setSingleFileInput(fileInput, file)) {
        setEvidenceStatus(statusEl, 'Browser tidak mendukung paste file otomatis. Gunakan upload manual.', 'danger');
        return;
      }

      showPreview(file, 'paste');
      setEvidenceStatus(statusEl, 'Screenshot berhasil ditambahkan sebagai bukti penyelesaian.', 'success');
    });

    fileInput.addEventListener('change', syncManualFilePreview);

    if (clearButton) {
      clearButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        fileInput.value = '';
        clearPreview();
        setEvidenceStatus(statusEl, 'Bukti upload dikosongkan.', 'muted');
        fileInput.focus();
      });
    }
  }

  function setupCompletionEvidencePasteUpload() {
    var forms = document.querySelectorAll('[data-completion-form]');
    for (var i = 0; i < forms.length; i += 1) {
      bindCompletionEvidencePasteUpload(forms[i]);
    }
  }

  function initAppUi() {
    try { setupAutoDismissAlerts(); } catch (e) {}
    try { setupSupervisorSectionSwitcher(); } catch (e1) {}
    try { updateSidebarHashActive(); } catch (e2) {}
    try { setupReportDetailModal(); } catch (e3) {}
    try { setupCompletionEvidencePasteUpload(); } catch (e4) {}
    try { setupQuickTicketActions(); } catch (e5) {}
    try { setupQueueAutoRefreshPolling(); } catch (e6) {}
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
