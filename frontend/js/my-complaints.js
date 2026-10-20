import { requireAuthPage, getCurrentUser } from './auth.js';
import { getMyComplaints } from './api.js';

export async function initMyComplaintsPage() {
  const authed = await requireAuthPage();
  if (!authed) return;

  const user = getCurrentUser();

  const userEmailDisplay = document.getElementById('user-email-display');
  if (userEmailDisplay && user) {
    userEmailDisplay.textContent = user.email;
  }

  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statInvestigating = document.getElementById('stat-investigating');
  const statResolved = document.getElementById('stat-resolved');
  const tableBody = document.getElementById('complaints-tbody');
  const loadingEl = document.getElementById('loading-state');
  const emptyEl = document.getElementById('empty-state');
  const tableContainer = document.getElementById('table-container');
  const refreshBtn = document.getElementById('btn-refresh');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadUserComplaints);
  }

  loadUserComplaints();

  async function loadUserComplaints() {
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (tableContainer) tableContainer.classList.add('hidden');

    try {
      const data = await getMyComplaints();
      const stats = data.stats || { total: 0, pending: 0, under_investigation: 0, resolved: 0 };
      const complaints = data.complaints || [];

      if (statTotal) statTotal.textContent = stats.total;
      if (statPending) statPending.textContent = stats.pending;
      if (statInvestigating) statInvestigating.textContent = stats.under_investigation;
      if (statResolved) statResolved.textContent = stats.resolved;

      if (loadingEl) loadingEl.classList.add('hidden');

      if (complaints.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
      } else {
        if (tableContainer) tableContainer.classList.remove('hidden');
        if (tableBody) {
          tableBody.innerHTML = complaints.map(c => {
            const statusKey = (c.status || '').toLowerCase().replace(/\s+/g, '-');
            const priorityKey = (c.priority || 'low').toLowerCase();

            return `
              <tr class="hover:bg-[#F4F7F9] transition-colors">
                <td class="p-4 font-mono font-bold text-[#2C3A47] whitespace-nowrap">${c.id}</td>
                <td class="p-4 font-semibold text-[#1C252E] max-w-xs truncate">${c.title}</td>
                <td class="p-4 text-gray-600 whitespace-nowrap">${c.category}</td>
                <td class="p-4 whitespace-nowrap">
                  <span class="badge badge-priority-${priorityKey}">${c.priority}</span>
                </td>
                <td class="p-4 whitespace-nowrap">
                  <span class="badge badge-status-${statusKey}">${c.status}</span>
                </td>
                <td class="p-4 text-gray-500 whitespace-nowrap">${c.created_at?.split(' ')[0] || ''}</td>
                <td class="p-4 text-center whitespace-nowrap">
                  <a href="/track-complaint.html?id=${c.id}" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2C3A47] text-[#A4B4C0] hover:bg-[#5C6F84] transition-colors font-bold text-[11px]">
                    View
                  </a>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
    } catch (err) {
      console.error("Error loading user complaints:", err);
      if (loadingEl) loadingEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
    }
  }
}
