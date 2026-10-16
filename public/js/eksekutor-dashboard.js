(function () {
  'use strict';

  function initEksekutorChart() {
    if (!window.Chart) {
      return;
    }

    var canvas = document.getElementById('eksekutorStatusChart');
    if (!canvas) {
      return;
    }

    var dataEl = document.getElementById('eksekutor-dashboard-data');
    var rawData = {};
    if (dataEl) {
      try {
        rawData = JSON.parse(dataEl.textContent || '{}');
      } catch (e) {
        console.error('Gagal membaca data dashboard eksekutor:', e);
      }
    }

    var summary = rawData.summary || {};
    var inProgress = Number(summary.total_my_in_progress) || 0;
    var completed = Number(summary.total_completed) || 0;
    var followUp = Number(summary.total_follow_up) || 0;
    var escalated = Number(summary.total_escalated) || 0;
    var total = inProgress + completed + followUp + escalated;

    if (total === 0) {
      canvas.style.display = 'none';
      return;
    }

    var labels = ['Sedang Dikerjakan', 'Selesai', 'Perlu Tindak Lanjut', 'Eskalasi'];
    var values = [inProgress, completed, followUp, escalated];
    var colors = [
      '#0d6efd', // In Progress (Blue)
      '#198754', // Completed (Green)
      '#ffc107', // Follow Up (Warning Yellow)
      '#dc3545'  // Escalated (Danger Red)
    ];

    // Center text plugin to display total count inside doughnut
    var centerTextPlugin = {
      id: 'eksekutorCenterText',
      beforeDraw: function (chart) {
        var chartArea = chart.chartArea;
        if (!chartArea) {
          return;
        }

        var ctx = chart.ctx;
        var centerX = (chartArea.left + chartArea.right) / 2;
        var centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Total count
        ctx.font = '700 1.35rem Inter, system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#212529';
        ctx.fillText(total, centerX, centerY - 8);

        // Subtitle "Tiket"
        ctx.font = '500 0.72rem Inter, system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#6c757d';
        ctx.fillText('Tiket', centerX, centerY + 12);

        ctx.restore();
      }
    };

    var isNarrow = window.innerWidth < 576;

    // eslint-disable-next-line no-new
    new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        layout: {
          padding: 6
        },
        plugins: {
          legend: {
            position: isNarrow ? 'bottom' : 'right',
            align: 'center',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 10,
              font: {
                size: 11,
                family: 'Inter, system-ui, -apple-system, sans-serif'
              },
              generateLabels: function (chart) {
                var data = chart.data;
                if (!data.labels.length || !data.datasets.length) {
                  return [];
                }
                var dataset = data.datasets[0];
                return data.labels.map(function (label, i) {
                  var val = dataset.data[i] || 0;
                  return {
                    text: label + ' (' + val + ')',
                    fillStyle: dataset.backgroundColor[i],
                    strokeStyle: dataset.backgroundColor[i],
                    lineWidth: 0,
                    hidden: isNaN(dataset.data[i]) || (chart.getDatasetMeta(0).data[i] && chart.getDatasetMeta(0).data[i].hidden),
                    index: i
                  };
                });
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(33, 37, 41, 0.9)',
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 8,
            cornerRadius: 6,
            callbacks: {
              label: function (context) {
                var val = context.raw || 0;
                var pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ' ' + context.label + ': ' + val + ' tiket (' + pct + '%)';
              }
            }
          }
        }
      },
      plugins: [centerTextPlugin]
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEksekutorChart);
  } else {
    initEksekutorChart();
  }
})();
