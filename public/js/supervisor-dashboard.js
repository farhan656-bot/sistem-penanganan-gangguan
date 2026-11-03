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

  function initEksekutorSearchUX() {
    var searchInput = document.getElementById('searchEksekutorInput');
    var clearBtn = document.getElementById('clearSearchEksekutorBtn');
    var countBadge = document.getElementById('eksekutorCountBadge');
    var table = document.getElementById('eksekutorPerformanceTable');
    if (!searchInput || !table) return;

    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr.eksekutor-row'));
    var noMatchRow = document.getElementById('noMatchEksekutorRow');
    var noMatchQuery = document.getElementById('noMatchQuery');
    var totalCount = rows.length;

    function filterRows() {
      var query = (searchInput.value || '').trim().toLowerCase();
      var visibleCount = 0;

      if (clearBtn) {
        clearBtn.classList.toggle('d-none', !query);
      }

      rows.forEach(function (row) {
        var name = (row.getAttribute('data-name') || '').toLowerCase();
        var region = (row.getAttribute('data-region') || '').toLowerCase();
        var textContent = (row.textContent || '').toLowerCase();
        var matches = !query || name.indexOf(query) !== -1 || region.indexOf(query) !== -1 || textContent.indexOf(query) !== -1;

        if (matches) {
          row.style.display = '';
          visibleCount += 1;
          var numCell = row.querySelector('.app-col-num');
          if (numCell) {
            numCell.textContent = visibleCount;
          }
        } else {
          row.style.display = 'none';
        }
      });

      if (noMatchRow) {
        if (visibleCount === 0 && totalCount > 0 && query) {
          noMatchRow.classList.remove('d-none');
          if (noMatchQuery) {
            noMatchQuery.textContent = searchInput.value.trim();
          }
        } else {
          noMatchRow.classList.add('d-none');
        }
      }

      if (countBadge) {
        if (query) {
          countBadge.textContent = visibleCount + ' dari ' + totalCount + ' Pegawai';
        } else {
          countBadge.textContent = totalCount + ' Pegawai';
        }
      }
    }

    searchInput.addEventListener('input', filterRows);
    searchInput.addEventListener('search', filterRows);

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        searchInput.focus();
        filterRows();
      });
    }

    var urlParams = new URLSearchParams(window.location.search);
    var searchParam = urlParams.get('search_eksekutor');
    if (searchParam) {
      searchInput.value = searchParam;
      filterRows();
    }
  }

  function initRegionSwitchTableUX() {
    var searchInput = document.getElementById('searchRegionSwitchInput');
    var clearBtn = document.getElementById('clearSearchRegionSwitchBtn');
    var countBadge = document.getElementById('regionSwitchCountBadge');
    var table = document.getElementById('regionSwitchTable');
    var paginationFooter = document.getElementById('regionSwitchPaginationFooter');
    var paginationInfo = document.getElementById('regionSwitchPaginationInfo');
    var paginationList = document.getElementById('regionSwitchPaginationList');
    var noMatchRow = document.getElementById('noMatchRegionSwitchRow');
    var emptyRow = document.getElementById('emptyRegionSwitchRow');
    var regionButtons = Array.prototype.slice.call(document.querySelectorAll('[data-region-switch-filter]'));

    if (!table) return;

    var allRows = Array.prototype.slice.call(table.querySelectorAll('tbody tr.region-switch-row'));
    var totalRows = allRows.length;
    var pageSize = 10;
    var currentPage = 1;
    var currentRegion = 'all';
    var currentSearch = '';

    function getFilteredRows() {
      var query = currentSearch.trim().toLowerCase();
      return allRows.filter(function (row) {
        var name = (row.getAttribute('data-name') || '').toLowerCase();
        var target = (row.getAttribute('data-target') || '').toUpperCase();
        var home = (row.getAttribute('data-home') || '').toUpperCase();

        var matchesRegion = (currentRegion === 'all') || (target === currentRegion);
        var matchesQuery = !query || name.indexOf(query) !== -1 || home.toLowerCase().indexOf(query) !== -1 || target.toLowerCase().indexOf(query) !== -1;

        return matchesRegion && matchesQuery;
      });
    }

    function renderPaginationButtons(totalPages) {
      if (!paginationList) return;
      paginationList.innerHTML = '';

      if (totalPages <= 1) return;

      // Tombol Previous
      var prevLi = document.createElement('li');
      prevLi.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
      if (currentPage === 1) {
        prevLi.innerHTML = '<span class="page-link" aria-disabled="true">Previous</span>';
      } else {
        var prevA = document.createElement('a');
        prevA.className = 'page-link';
        prevA.href = '#';
        prevA.textContent = 'Previous';
        prevA.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentPage > 1) {
            currentPage -= 1;
            render();
          }
        });
        prevLi.appendChild(prevA);
      }
      paginationList.appendChild(prevLi);

      // Nomor Halaman
      for (var p = 1; p <= totalPages; p += 1) {
        var pageLi = document.createElement('li');
        pageLi.className = 'page-item' + (p === currentPage ? ' active' : '');
        if (p === currentPage) {
          pageLi.innerHTML = '<span class="page-link" aria-current="page">' + p + '</span>';
        } else {
          var pageA = document.createElement('a');
          pageA.className = 'page-link';
          pageA.href = '#';
          pageA.textContent = p;
          (function (pageNumber) {
            pageA.addEventListener('click', function (e) {
              e.preventDefault();
              currentPage = pageNumber;
              render();
            });
          })(p);
          pageLi.appendChild(pageA);
        }
        paginationList.appendChild(pageLi);
      }

      // Tombol Next
      var nextLi = document.createElement('li');
      nextLi.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
      if (currentPage === totalPages) {
        nextLi.innerHTML = '<span class="page-link" aria-disabled="true">Next</span>';
      } else {
        var nextA = document.createElement('a');
        nextA.className = 'page-link';
        nextA.href = '#';
        nextA.textContent = 'Next';
        nextA.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentPage < totalPages) {
            currentPage += 1;
            render();
          }
        });
        nextLi.appendChild(nextA);
      }
      paginationList.appendChild(nextLi);
    }

    function render() {
      var filtered = getFilteredRows();
      var totalFiltered = filtered.length;
      var totalPages = Math.ceil(totalFiltered / pageSize) || 1;

      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      if (currentPage < 1) {
        currentPage = 1;
      }

      var startIndex = (currentPage - 1) * pageSize;
      var endIndex = Math.min(startIndex + pageSize, totalFiltered);

      // Sembunyikan semua baris terlebih dahulu
      allRows.forEach(function (row) {
        row.style.display = 'none';
      });

      // Tampilkan baris untuk halaman saat ini (maksimal 10 baris)
      for (var i = startIndex; i < endIndex; i += 1) {
        var row = filtered[i];
        row.style.display = '';
        var numCell = row.querySelector('.app-col-num');
        if (numCell) {
          numCell.textContent = i + 1;
        }
      }

      // Baris status kosong / tidak cocok
      if (emptyRow) {
        emptyRow.style.display = totalRows === 0 ? '' : 'none';
      }
      if (noMatchRow) {
        if (totalFiltered === 0 && totalRows > 0) {
          noMatchRow.classList.remove('d-none');
        } else {
          noMatchRow.classList.add('d-none');
        }
      }

      // Update badge hitungan
      if (countBadge) {
        if (currentSearch || currentRegion !== 'all') {
          countBadge.textContent = totalFiltered + ' dari ' + totalRows + ' Riwayat';
        } else {
          countBadge.textContent = 'Total: ' + totalRows + ' Riwayat';
        }
      }

      // Tombol reset pencarian
      if (clearBtn) {
        clearBtn.classList.toggle('d-none', !currentSearch);
      }

      // Footer pagination
      if (paginationFooter) {
        if (totalFiltered === 0) {
          paginationFooter.style.display = 'none';
        } else {
          paginationFooter.style.display = '';
          if (paginationInfo) {
            paginationInfo.innerHTML = 'Menampilkan <strong>' + (startIndex + 1) + '&ndash;' + endIndex + '</strong> dari <strong>' + totalFiltered + '</strong> riwayat';
          }
          renderPaginationButtons(totalPages);
        }
      }
    }

    // Event listeners pencarian
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        currentSearch = searchInput.value || '';
        currentPage = 1;
        render();
      });
      searchInput.addEventListener('search', function () {
        currentSearch = searchInput.value || '';
        currentPage = 1;
        render();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        currentSearch = '';
        currentPage = 1;
        render();
      });
    }

    // Event listeners button region (Semua, PDG, BKT)
    regionButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var region = btn.getAttribute('data-region-switch-filter');
        if (currentRegion === region) return;
        currentRegion = region;
        regionButtons.forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        currentPage = 1;
        render();
      });
    });

    // Inisialisasi awal
    render();
  }

  function initAttentionTicketsTableUX() {
    var countBadge = document.getElementById('attentionTicketsCountBadge');
    var table = document.getElementById('attentionTicketsTable');
    var paginationFooter = document.getElementById('attentionPaginationFooter');
    var paginationInfo = document.getElementById('attentionPaginationInfo');
    var paginationList = document.getElementById('attentionPaginationList');
    var noMatchRow = document.getElementById('noMatchAttentionRow');
    var emptyRow = document.getElementById('emptyAttentionRow');
    var regionButtons = Array.prototype.slice.call(document.querySelectorAll('[data-attention-region-filter]'));

    if (!table) return;

    var allRows = Array.prototype.slice.call(table.querySelectorAll('tbody tr.attention-ticket-row'));
    var totalRows = allRows.length;
    var pageSize = 10;
    var currentPage = 1;
    var currentRegion = 'all';

    function getFilteredRows() {
      return allRows.filter(function (row) {
        var region = (row.getAttribute('data-region') || '').toUpperCase();
        return (currentRegion === 'all') || (region === currentRegion);
      });
    }

    function renderPaginationButtons(totalPages) {
      if (!paginationList) return;
      paginationList.innerHTML = '';

      if (totalPages <= 1) return;

      // Tombol Previous
      var prevLi = document.createElement('li');
      prevLi.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
      if (currentPage === 1) {
        prevLi.innerHTML = '<span class="page-link" aria-disabled="true">Previous</span>';
      } else {
        var prevA = document.createElement('a');
        prevA.className = 'page-link';
        prevA.href = '#';
        prevA.textContent = 'Previous';
        prevA.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentPage > 1) {
            currentPage -= 1;
            render();
          }
        });
        prevLi.appendChild(prevA);
      }
      paginationList.appendChild(prevLi);

      // Nomor Halaman
      for (var p = 1; p <= totalPages; p += 1) {
        var pageLi = document.createElement('li');
        pageLi.className = 'page-item' + (p === currentPage ? ' active' : '');
        if (p === currentPage) {
          pageLi.innerHTML = '<span class="page-link" aria-current="page">' + p + '</span>';
        } else {
          var pageA = document.createElement('a');
          pageA.className = 'page-link';
          pageA.href = '#';
          pageA.textContent = p;
          (function (pageNumber) {
            pageA.addEventListener('click', function (e) {
              e.preventDefault();
              currentPage = pageNumber;
              render();
            });
          })(p);
          pageLi.appendChild(pageA);
        }
        paginationList.appendChild(pageLi);
      }

      // Tombol Next
      var nextLi = document.createElement('li');
      nextLi.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
      if (currentPage === totalPages) {
        nextLi.innerHTML = '<span class="page-link" aria-disabled="true">Next</span>';
      } else {
        var nextA = document.createElement('a');
        nextA.className = 'page-link';
        nextA.href = '#';
        nextA.textContent = 'Next';
        nextA.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentPage < totalPages) {
            currentPage += 1;
            render();
          }
        });
        nextLi.appendChild(nextA);
      }
      paginationList.appendChild(nextLi);
    }

    function render() {
      var filtered = getFilteredRows();
      var totalFiltered = filtered.length;
      var totalPages = Math.ceil(totalFiltered / pageSize) || 1;

      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
      if (currentPage < 1) {
        currentPage = 1;
      }

      var startIndex = (currentPage - 1) * pageSize;
      var endIndex = Math.min(startIndex + pageSize, totalFiltered);

      // Sembunyikan semua baris terlebih dahulu
      allRows.forEach(function (row) {
        row.style.display = 'none';
      });

      // Tampilkan baris untuk halaman saat ini (maksimal 10 baris)
      for (var i = startIndex; i < endIndex; i += 1) {
        var row = filtered[i];
        row.style.display = '';
        var numCell = row.querySelector('.app-col-num');
        if (numCell) {
          numCell.textContent = i + 1;
        }
      }

      // Baris status kosong / tidak cocok
      if (emptyRow) {
        emptyRow.style.display = totalRows === 0 ? '' : 'none';
      }
      if (noMatchRow) {
        if (totalFiltered === 0 && totalRows > 0) {
          noMatchRow.classList.remove('d-none');
        } else {
          noMatchRow.classList.add('d-none');
        }
      }

      // Update badge hitungan
      if (countBadge) {
        if (currentRegion !== 'all') {
          countBadge.textContent = totalFiltered + ' dari ' + totalRows + ' Tiket';
        } else {
          countBadge.textContent = 'Total: ' + totalRows + ' Tiket';
        }
      }

      // Footer pagination
      if (paginationFooter) {
        if (totalFiltered === 0) {
          paginationFooter.style.display = 'none';
        } else {
          paginationFooter.style.display = '';
          if (paginationInfo) {
            paginationInfo.innerHTML = 'Menampilkan <strong>' + (startIndex + 1) + '&ndash;' + endIndex + '</strong> dari <strong>' + totalFiltered + '</strong> tiket';
          }
          renderPaginationButtons(totalPages);
        }
      }
    }

    // Event listeners button region (Semua, PDG, BKT)
    regionButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var region = btn.getAttribute('data-attention-region-filter');
        if (currentRegion === region) return;
        currentRegion = region;
        regionButtons.forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        currentPage = 1;
        render();
      });
    });

    // Inisialisasi awal
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFilterFormUX();
    initSupervisorTabsUX();
    initEksekutorSearchUX();
    initAttentionTicketsTableUX();
    initRegionSwitchTableUX();
    initCharts();
  });
})();
