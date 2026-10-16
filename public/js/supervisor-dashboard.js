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

    // 3. Region comparison (modern horizontal bar with toggle)
    var regionCanvas = document.getElementById('regionComparisonChart');
    if (regionCanvas) {
      var rawRegionSummary = safeArray(dataRoot.regionSummary);
      var regionSummary = rawRegionSummary.slice().sort(function (a, b) {
        return (Number(b.total_reports) || 0) - (Number(a.total_reports) || 0);
      });
      var regionLabels = [];
      var totalData = [];
      var availableData = [];
      var inProgressData = [];
      var completedData = [];
      var followUpData = [];
      var escalatedData = [];

      if (regionSummary.length > 0) {
        regionLabels = regionSummary.map(function (r) {
          var code = String(r.region_code || '').trim();
          var name = String(r.region_name || '').trim();
          return name ? name + ' (' + code + ')' : code;
        });
        totalData = regionSummary.map(function (r) { return Number(r.total_reports) || 0; });
        availableData = regionSummary.map(function (r) { return Number(r.total_available) || 0; });
        inProgressData = regionSummary.map(function (r) { return Number(r.total_in_progress) || 0; });
        completedData = regionSummary.map(function (r) { return Number(r.total_completed) || 0; });
        followUpData = regionSummary.map(function (r) { return Number(r.total_follow_up) || 0; });
        escalatedData = regionSummary.map(function (r) { return Number(r.total_escalated) || 0; });
      } else {
        var fallbackSeries = ensureNonEmptySeries(
          (charts.regionComparison || {}).labels,
          (charts.regionComparison || {}).data
        );
        regionLabels = fallbackSeries.labels;
        totalData = fallbackSeries.data;
      }

      function createHorizontalGradient(ctx, chartArea, colorStart, colorEnd) {
        if (!chartArea) return colorStart;
        var gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
      }

      var currentRegionMode = 'total';

      var totalDataset = {
        label: 'Total Laporan',
        data: totalData,
        backgroundColor: function (context) {
          var chart = context.chart;
          var ctx = chart.ctx;
          var chartArea = chart.chartArea;
          var idx = context.dataIndex;
          if (idx === 0) {
            return createHorizontalGradient(ctx, chartArea, '#2563eb', '#60a5fa');
          } else if (idx === 1) {
            return createHorizontalGradient(ctx, chartArea, '#0284c7', '#38bdf8');
          } else {
            return createHorizontalGradient(ctx, chartArea, '#6366f1', '#a5b4fc');
          }
        },
        borderRadius: { topRight: 8, bottomRight: 8, topLeft: 0, bottomLeft: 0 },
        borderSkipped: false,
        barThickness: 28,
        maxBarThickness: 32
      };

      var statusDatasets = [
        {
          label: 'Tersedia',
          data: availableData,
          backgroundColor: '#0284c7',
          borderRadius: 0,
          barThickness: 28,
          maxBarThickness: 32
        },
        {
          label: 'Sedang Ditangani',
          data: inProgressData,
          backgroundColor: '#d97706',
          borderRadius: 0,
          barThickness: 28,
          maxBarThickness: 32
        },
        {
          label: 'Selesai',
          data: completedData,
          backgroundColor: '#059669',
          borderRadius: 0,
          barThickness: 28,
          maxBarThickness: 32
        },
        {
          label: 'Tindak Lanjut',
          data: followUpData,
          backgroundColor: '#ea580c',
          borderRadius: 0,
          barThickness: 28,
          maxBarThickness: 32
        },
        {
          label: 'Eskalasi',
          data: escalatedData,
          backgroundColor: '#e11d48',
          borderRadius: { topRight: 6, bottomRight: 6, topLeft: 0, bottomLeft: 0 },
          barThickness: 28,
          maxBarThickness: 32
        }
      ];

      var regionBarLabelsPlugin = {
        id: 'regionBarLabels',
        afterDatasetsDraw: function (chart) {
          if (currentRegionMode !== 'total') return;
          var ctx = chart.ctx;
          var meta = chart.getDatasetMeta(0);
          if (!meta || !meta.data) return;
          var dataset = chart.data.datasets[0];
          if (!dataset || !Array.isArray(dataset.data)) return;
          var totalSum = dataset.data.reduce(function (a, b) { return a + (Number(b) || 0); }, 0) || 1;

          meta.data.forEach(function (bar, index) {
            var val = Number(dataset.data[index]) || 0;
            if (val <= 0) return;
            var pct = ((val / totalSum) * 100).toFixed(1) + '%';
            var text = val + ' tiket (' + pct + ')';

            ctx.save();
            ctx.font = '600 11px system-ui, -apple-system, sans-serif';
            var textWidth = ctx.measureText(text).width;
            var rightEdge = chart.chartArea ? chart.chartArea.right : chart.width;

            if (bar.x + textWidth + 16 > rightEdge) {
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'right';
              ctx.textBaseline = 'middle';
              ctx.fillText(text, bar.x - 8, bar.y);
            } else {
              ctx.fillStyle = '#334155';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(text, bar.x + 8, bar.y);
            }
            ctx.restore();
          });
        }
      };

      // eslint-disable-next-line no-new
      var regionChart = new window.Chart(regionCanvas, {
        type: 'bar',
        data: {
          labels: regionLabels,
          datasets: [totalDataset]
        },
        plugins: [regionBarLabelsPlugin],
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { right: 28, top: 4, bottom: 4 }
          },
          scales: {
            x: {
              stacked: false,
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.04)',
                borderDash: [3, 3]
              },
              ticks: {
                precision: 0,
                font: { size: 11 },
                color: '#64748b'
              }
            },
            y: {
              stacked: false,
              grid: {
                display: false
              },
              ticks: {
                font: { size: 12, weight: '600' },
                color: '#1e293b'
              }
            }
          },
          plugins: {
            legend: {
              display: false,
              position: 'bottom',
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 12,
                font: { size: 11 }
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleFont: { size: 12, weight: '600' },
              bodyFont: { size: 11 },
              padding: 8,
              cornerRadius: 6,
              callbacks: {
                label: function (context) {
                  var val = context.parsed.x !== undefined ? context.parsed.x : 0;
                  if (currentRegionMode === 'total') {
                    var totalSum = totalData.reduce(function (a, b) { return a + b; }, 0) || 1;
                    var pct = ((val / totalSum) * 100).toFixed(1);
                    return ' Total: ' + val + ' laporan (' + pct + '% dari total)';
                  }
                  var dsLabel = context.dataset.label || '';
                  return ' ' + dsLabel + ': ' + val + ' tiket';
                }
              }
            }
          }
        }
      });

      var btnTotal = document.getElementById('btnRegionTotal');
      var btnStatus = document.getElementById('btnRegionStatus');
      if (btnTotal && btnStatus) {
        btnTotal.addEventListener('click', function () {
          if (currentRegionMode === 'total') return;
          currentRegionMode = 'total';
          btnTotal.classList.add('active');
          btnStatus.classList.remove('active');
          regionChart.data.datasets = [totalDataset];
          regionChart.options.scales.x.stacked = false;
          regionChart.options.scales.y.stacked = false;
          regionChart.options.plugins.legend.display = false;
          regionChart.update();
        });

        btnStatus.addEventListener('click', function () {
          if (currentRegionMode === 'status') return;
          currentRegionMode = 'status';
          btnStatus.classList.add('active');
          btnTotal.classList.remove('active');
          regionChart.data.datasets = statusDatasets;
          regionChart.options.scales.x.stacked = true;
          regionChart.options.scales.y.stacked = true;
          regionChart.options.plugins.legend.display = true;
          regionChart.update();
        });
      }
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
