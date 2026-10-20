import { requireAdminPage } from './auth.js';
import { getOverdueComplaints } from './api.js';

export async function initOverdueComplaintsPage() {
  const authed = await requireAdminPage();
  if (!authed) return;

  const refreshBtn = document.getElementById('btn-refresh-overdue');
  const loadingEl = document.getElementById('loading-state');
  const emptyEl = document.getElementById('empty-state');
  const tableContainer = document.getElementById('table-container');
  const tbody = document.getElementById('overdue-tbody');
  const countSpan = document.getElementById('overdue-count');

  if (refreshBtn) refreshBtn.addEventListener('click', loadOverdue);

  loadOverdue();

  async function loadOverdue() {
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (tableContainer) tableContainer.classList.add('hidden');

    try {
      const list = await getOverdueComplaints();
      if (loadingEl) loadingEl.classList.add('hidden');

      if (countSpan) countSpan.textContent = list.length;

      if (!list || list.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
      } else {
        if (tableContainer) tableContainer.classList.remove('hidden');
        if (tbody) {
          tbody.innerHTML = list.map(c => {
            const slaInfo = c.sla_info || {};
            const isCrit = c.priority === 'Critical' || ['Ragging / Bullying', 'Harassment'].includes(c.category);
            const statusKey = (c.status || '').toLowerCase().replace(/\s+/g, '-');
            const priorityKey = (c.priority || 'low').toLowerCase();

            return `
              <tr class="hover:bg-[#F4F7F9] transition-colors ${isCrit ? 'bg-red-50/30' : ''}">
                <td class="p-4 font-mono font-bold text-[#2C3A47] whitespace-nowrap">
                  ${c.id}
                  ${isCrit ? '<span class="text-red-600 font-bold ml-1">🔥</span>' : ''}
                </td>
                <td class="p-4 font-semibold text-[#1C252E] max-w-xs truncate">${c.title}</td>
                <td class="p-4 text-gray-600 whitespace-nowrap">${c.category}</td>
                <td class="p-4 whitespace-nowrap">
                  <span class="badge badge-priority-${priorityKey}">${c.priority}</span>
                </td>
                <td class="p-4 text-gray-600 whitespace-nowrap">${c.department}</td>
                <td class="p-4 font-mono text-gray-500 whitespace-nowrap">${slaInfo.deadline || c.created_at}</td>
                <td class="p-4 whitespace-nowrap font-bold text-red-700">${slaInfo.display_text || 'OVERDUE'}</td>
                <td class="p-4 whitespace-nowrap">
                  <span class="badge badge-status-${statusKey}">${c.status}</span>
                </td>
                <td class="p-4 text-center whitespace-nowrap">
                  <a href="/admin-complaint-detail.html?id=${c.id}" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2C3A47] text-[#A4B4C0] hover:bg-[#1E293B] font-bold text-[11px] transition-colors">
                    View
                  </a>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
    } catch (err) {
      console.error("Error loading overdue complaints:", err);
      if (loadingEl) loadingEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
    }
  }
}
