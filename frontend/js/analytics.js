import { requireAdminPage } from './auth.js';
import { getAdminAnalytics } from './api.js';

export async function initAnalyticsPage() {
  const authed = await requireAdminPage();
  if (!authed) return;

  const refreshBtn = document.getElementById('btn-refresh-analytics');
  const loadingEl = document.getElementById('loading-analytics');
  const contentEl = document.getElementById('analytics-content');

  if (refreshBtn) refreshBtn.addEventListener('click', fetchAndRender);

  fetchAndRender();

  async function fetchAndRender() {
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (contentEl) contentEl.classList.add('hidden');

    try {
      const data = await getAdminAnalytics();
      if (loadingEl) loadingEl.classList.add('hidden');
      if (contentEl) contentEl.classList.remove('hidden');

      renderCharts(data);
      renderDepartmentTable(data.department_performance || []);
    } catch (err) {
      console.error("Error loading analytics:", err);
      if (loadingEl) loadingEl.classList.add('hidden');
    }
  }

  function renderCharts(data) {
    if (!window.Chart) {
      console.warn("Chart.js library not loaded yet.");
      return;
    }

    // 1. Category Bar Chart
    const catCanvas = document.getElementById('chart-category');
    if (catCanvas && data.category_chart) {
      new window.Chart(catCanvas, {
        type: 'bar',
        data: {
          labels: data.category_chart.map(c => c.category),
          datasets: [{
            label: 'Complaints',
            data: data.category_chart.map(c => c.count),
            backgroundColor: '#2C3A47',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { font: { size: 9 }, color: '#2C3A47' } },
            y: { ticks: { precision: 0, font: { size: 10 }, color: '#2C3A47' } }
          }
        }
      });
    }

    // 2. SLA Performance Doughnut Chart
    const slaCanvas = document.getElementById('chart-sla');
    if (slaCanvas && data.sla_performance) {
      new window.Chart(slaCanvas, {
        type: 'doughnut',
        data: {
          labels: data.sla_performance.map(s => s.name),
          datasets: [{
            data: data.sla_performance.map(s => s.count),
            backgroundColor: ['#059669', '#10B981', '#3B82F6', '#EF4444']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }
        }
      });
    }

    // 3. Status Bar Chart
    const statusCanvas = document.getElementById('chart-status');
    if (statusCanvas && data.status_chart) {
      new window.Chart(statusCanvas, {
        type: 'bar',
        data: {
          labels: data.status_chart.map(s => s.status),
          datasets: [{
            label: 'Count',
            data: data.status_chart.map(s => s.count),
            backgroundColor: '#5C6F84',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // 4. Priority Bar Chart
    const priorityCanvas = document.getElementById('chart-priority');
    if (priorityCanvas && data.priority_chart) {
      new window.Chart(priorityCanvas, {
        type: 'bar',
        data: {
          labels: data.priority_chart.map(p => p.priority),
          datasets: [{
            label: 'Count',
            data: data.priority_chart.map(p => p.count),
            backgroundColor: ['#6B7280', '#F59E0B', '#EA580C', '#DC2626'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // 5. Monthly Trend Line Chart
    const trendCanvas = document.getElementById('chart-trend');
    if (trendCanvas && data.monthly_trend) {
      new window.Chart(trendCanvas, {
        type: 'line',
        data: {
          labels: data.monthly_trend.map(m => m.month),
          datasets: [
            {
              label: 'Total Complaints',
              data: data.monthly_trend.map(m => m.complaints),
              borderColor: '#2C3A47',
              backgroundColor: '#2C3A47',
              tension: 0.3
            },
            {
              label: 'Resolved',
              data: data.monthly_trend.map(m => m.resolved),
              borderColor: '#5C6F84',
              backgroundColor: '#5C6F84',
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  }

  function renderDepartmentTable(depts) {
    const tbody = document.getElementById('dept-tbody');
    if (!tbody) return;

    if (depts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center italic text-gray-500">No department stats available.</td></tr>';
      return;
    }

    tbody.innerHTML = depts.map(d => `
      <tr class="hover:bg-[#F4F7F9] transition-colors">
        <td class="p-4 font-bold text-[#2C3A47]">${d.department}</td>
        <td class="p-4 font-mono font-bold text-gray-700">${d.total}</td>
        <td class="p-4 font-mono font-bold text-green-700">${d.resolved}</td>
        <td class="p-4 font-mono font-bold text-amber-700">${d.pending}</td>
        <td class="p-4 font-mono font-bold text-red-700">${d.overdue}</td>
      </tr>
    `).join('');
  }
}
