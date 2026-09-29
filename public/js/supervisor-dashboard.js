(function () {
  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function ensureNonEmptySeries(labels, data) {
    var safeLabels = safeArray(labels);
    var safeData = safeArray(data);

    if (safeLabels.length === 0 || safeData.length === 0) {
      return {
        labels: ['Belum ada data'],
        data: [0],
        empty: true
      };
    }

    return {
      labels: safeLabels,
      data: safeData,
      empty: false
    };
  }

  function getStatusColors(statuses) {
    var styles = window.getComputedStyle(document.documentElement);
    var tokenMap = {
      tersedia: '--app-status-available',
      diambil: '--app-status-in-progress',
      didelegasikan: '--app-status-delegated',
      selesai: '--app-status-completed',
      perlu_tindak_lanjut: '--app-status-follow-up',
      eskalasi: '--app-status-escalated',
      baru: '--app-status-neutral'
    };

    var fallbackMap = {
      tersedia: '#0d6efd',
      diambil: '#d97706',
      didelegasikan: '#0284c7',
      selesai: '#16a34a',
      perlu_tindak_lanjut: '#ea580c',
      eskalasi: '#dc2626',
      baru: '#6c757d'
    };

    return safeArray(statuses).map(function (status) {
      var key = String(status || '').toLowerCase();
      var cssVar = tokenMap[key];
      if (cssVar) {
        var val = (styles.getPropertyValue(cssVar) || '').trim();
        if (val) {
          return val;
        }
      }
      return fallbackMap[key] || '#6c757d';
    });
  }

  function initCharts() {
    if (!window.Chart) {
      return;
    }

    var dataRoot = window.SUPERVISOR_DASHBOARD_DATA || {};
    var charts = dataRoot.charts || {};
    var styles = window.getComputedStyle(document.documentElement);
    var primaryColor = (styles.getPropertyValue('--app-primary') || '').trim() || '#e11d2a';

    // 1. Status chart (doughnut)
    var statusCanvas = document.getElementById('statusChart');
    if (statusCanvas) {
      var statusSeries = ensureNonEmptySeries(
        (charts.status || {}).labels,
        (charts.status || {}).data
      );

      var statusColors = statusSeries.empty
        ? ['#adb5bd']
        : getStatusColors((charts.status || {}).statuses);

      // eslint-disable-next-line no-new
      new window.Chart(statusCanvas, {
        type: 'doughnut',
        data: {
          labels: statusSeries.labels,
          datasets: [
            {
              data: statusSeries.data,
              backgroundColor: statusColors,
              borderWidth: 1,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 12,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  if (statusSeries.empty) {
                    return ' Belum ada data tiket';
                  }
                  var label = context.label || '';
                  var val = context.parsed !== undefined ? context.parsed : 0;
                  return ' ' + label + ': ' + val + ' tiket';
                }
              }
            }
          }
        }
      });
    }

    // 2. Trend chart (line)
    var trendCanvas = document.getElementById('trendChart');
    if (trendCanvas) {
      var trendSeries = ensureNonEmptySeries(
        (charts.trend || {}).labels,
        (charts.trend || {}).data
      );

      // eslint-disable-next-line no-new
      new window.Chart(trendCanvas, {
        type: 'line',
        data: {
          labels: trendSeries.labels,
          datasets: [
            {
              label: 'Jumlah Laporan',
              data: trendSeries.data,
              borderColor: primaryColor,
              backgroundColor: primaryColor,
              pointBackgroundColor: primaryColor,
              pointBorderColor: '#ffffff',
              pointBorderWidth: 1,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 2,
              fill: false,
              tension: 0.25
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: { size: 11 },
                color: '#6c757d',
                maxRotation: 45
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                precision: 0,
                font: { size: 11 },
                color: '#6c757d'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  var val = context.parsed.y !== undefined ? context.parsed.y : 0;
                  return ' Jumlah: ' + val + ' laporan';
                }
              }
            }
          }
        }
      });
    }

    // 3. Region comparison (bar)
    var regionCanvas = document.getElementById('regionComparisonChart');
    if (regionCanvas) {
      var regionSeries = ensureNonEmptySeries(
        (charts.regionComparison || {}).labels,
        (charts.regionComparison || {}).data
      );

      var districtColorMap = {
        PDG: (styles.getPropertyValue('--app-status-available') || '').trim() || '#0d6efd',
        BKT: (styles.getPropertyValue('--app-status-delegated') || '').trim() || '#0284c7'
      };

      var barColors = regionSeries.empty
        ? '#adb5bd'
        : regionSeries.labels.map(function (label) {
            var code = String(label || '').trim().toUpperCase();
            return districtColorMap[code] || primaryColor;
          });

      // eslint-disable-next-line no-new
      new window.Chart(regionCanvas, {
        type: 'bar',
        data: {
          labels: regionSeries.labels,
          datasets: [
            {
              label: 'Jumlah Laporan',
              data: regionSeries.data,
              backgroundColor: barColors,
              borderRadius: 4,
              maxBarThickness: 48
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: { size: 12 },
                color: '#495057'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                precision: 0,
                font: { size: 11 },
                color: '#6c757d'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  var val = context.parsed.y !== undefined ? context.parsed.y : 0;
                  return ' Jumlah: ' + val + ' laporan';
                }
              }
            }
          }
        }
      });
    }
  }

  function initFilterFormUX() {
    var periodEl = document.getElementById('filterPeriod');
    var startEl = document.getElementById('filterStartDate');
    var endEl = document.getElementById('filterEndDate');

    if (!periodEl || !startEl || !endEl) {
      return;
    }

    function toggleCustomDates() {
      var isCustom = periodEl.value === 'custom';
      startEl.disabled = !isCustom;
      endEl.disabled = !isCustom;
    }

    periodEl.addEventListener('change', toggleCustomDates);
    toggleCustomDates();
  }

  function initSupervisorTabsUX() {
    function syncTabs() {
      var hash = window.location.hash || '#dashboard-ringkasan';
      var tabs = document.querySelectorAll('.supervisor-nav-tabs .nav-link');
      for (var i = 0; i < tabs.length; i += 1) {
        var tab = tabs[i];
        var href = tab.getAttribute('href');
        var isActive = href === hash || (hash === '' && href === '#dashboard-ringkasan');
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    }

    window.addEventListener('hashchange', syncTabs);
    syncTabs();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFilterFormUX();
    initSupervisorTabsUX();
    initCharts();
  });
})();
