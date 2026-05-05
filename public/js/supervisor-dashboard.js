(function () {
  function getBootstrapColorToken(token) {
    if (!token) {
      return '';
    }

    var styles = window.getComputedStyle(document.documentElement);
    return (styles.getPropertyValue('--bs-' + token) || '').trim();
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function ensureNonEmptySeries(labels, data) {
    var safeLabels = safeArray(labels);
    var safeData = safeArray(data);

    if (safeLabels.length === 0 || safeData.length === 0) {
      return {
        labels: ['Tidak ada data'],
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
    var statusTokenMap = {
      baru: 'secondary',
      tersedia: 'primary',
      diambil: 'warning',
      didelegasikan: 'info',
      selesai: 'success',
      perlu_tindak_lanjut: 'warning',
      eskalasi: 'danger'
    };

    return safeArray(statuses).map(function (status) {
      var token = statusTokenMap[status] || 'secondary';
      return getBootstrapColorToken(token) || undefined;
    });
  }

  function initCharts() {
    if (!window.Chart) {
      return;
    }

    var dataRoot = window.SUPERVISOR_DASHBOARD_DATA || {};
    var charts = dataRoot.charts || {};

    // Status chart (doughnut)
    var statusCanvas = document.getElementById('statusChart');
    if (statusCanvas) {
      var statusSeries = ensureNonEmptySeries(
        (charts.status || {}).labels,
        (charts.status || {}).data
      );

      var statusColors = statusSeries.empty
        ? [getBootstrapColorToken('secondary') || undefined]
        : getStatusColors((charts.status || {}).statuses);

      // eslint-disable-next-line no-new
      new Chart(statusCanvas, {
        type: 'doughnut',
        data: {
          labels: statusSeries.labels,
          datasets: [
            {
              data: statusSeries.data,
              backgroundColor: statusColors
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }

    // Trend chart (line)
    var trendCanvas = document.getElementById('trendChart');
    if (trendCanvas) {
      var trendSeries = ensureNonEmptySeries(
        (charts.trend || {}).labels,
        (charts.trend || {}).data
      );

      var lineColor = getBootstrapColorToken('primary') || 'currentColor';

      // eslint-disable-next-line no-new
      new Chart(trendCanvas, {
        type: 'line',
        data: {
          labels: trendSeries.labels,
          datasets: [
            {
              label: 'Jumlah Laporan',
              data: trendSeries.data,
              borderColor: lineColor,
              backgroundColor: lineColor,
              fill: false,
              tension: 0.25
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }

    // Region comparison (bar)
    var regionCanvas = document.getElementById('regionComparisonChart');
    if (regionCanvas) {
      var regionSeries = ensureNonEmptySeries(
        (charts.regionComparison || {}).labels,
        (charts.regionComparison || {}).data
      );

      var barColor = getBootstrapColorToken('danger') || 'currentColor';

      // eslint-disable-next-line no-new
      new Chart(regionCanvas, {
        type: 'bar',
        data: {
          labels: regionSeries.labels,
          datasets: [
            {
              label: 'Jumlah Laporan',
              data: regionSeries.data,
              backgroundColor: regionSeries.empty
                ? getBootstrapColorToken('secondary') || undefined
                : barColor
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            legend: {
              display: false
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

  document.addEventListener('DOMContentLoaded', function () {
    initFilterFormUX();
    initCharts();
  });
})();
