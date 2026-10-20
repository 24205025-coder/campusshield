import { requireAdminPage } from './auth.js';
import { getDashboardStats, getComplaints } from './api.js';
import { CATEGORY_NAMES, ALL_STATUSES } from './constants.js';

export async function initAdminDashboardPage() {
  const authed = await requireAdminPage();
  if (!authed) return;

  const statTotal = document.getElementById('stat-total');
  const statSubmitted = document.getElementById('stat-submitted');
  const statInvestigating = document.getElementById('stat-investigating');
  const statAction = document.getElementById('stat-action');
  const statResolved = document.getElementById('stat-resolved');

  const searchInput = document.getElementById('search-term');
  const dateSelect = document.getElementById('filter-date');
  const categorySelect = document.getElementById('filter-category');
  const statusSelect = document.getElementById('filter-status');
  const sortBtn = document.getElementById('btn-sort');
  const refreshBtn = document.getElementById('btn-refresh');
  const tableContainer = document.getElementById('grouped-tables-container');

  let complaintsData = [];
  let sortOrder = 'desc';

  // Fill category & status dropdowns
  if (categorySelect) {
    categorySelect.innerHTML = `<option value="All">All Categories</option>` +
      CATEGORY_NAMES.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  if (statusSelect) {
    statusSelect.innerHTML = `<option value="All">All Statuses</option>` +
      ALL_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  // Event Listeners
  if (searchInput) searchInput.addEventListener('input', debounce(loadData, 300));
  if (dateSelect) dateSelect.addEventListener('change', renderTable);
  if (categorySelect) categorySelect.addEventListener('change', loadData);
  if (statusSelect) statusSelect.addEventListener('change', loadData);
  if (refreshBtn) refreshBtn.addEventListener('click', loadData);

  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
      sortBtn.querySelector('span').textContent = sortOrder === 'desc' ? 'Newest' : 'Oldest';
      loadData();
    });
  }

  loadData();

  async function loadData() {
    try {
      const search = searchInput ? searchInput.value.trim() : '';
      const category = categorySelect ? categorySelect.value : 'All';
      const status = statusSelect ? statusSelect.value : 'All';

      const [stats, complaints] = await Promise.all([
        getDashboardStats(),
        getComplaints({ search, category, status, sort: sortOrder })
      ]);

      if (statTotal) statTotal.textContent = stats.total || 0;
      if (statSubmitted) statSubmitted.textContent = stats.submitted || stats.pending || 0;
      if (statInvestigating) statInvestigating.textContent = stats.under_investigation || 0;
      if (statAction) statAction.textContent = stats.action_taken || 0;
      if (statResolved) statResolved.textContent = stats.resolved || 0;

      complaintsData = complaints || [];

      // Update date dropdown options
      if (dateSelect) {
        const uniqueDates = Array.from(new Set(
          complaintsData.map(c => c.created_at_date || c.created_at?.split(' ')[0]).filter(Boolean)
        ));
        const currentVal = dateSelect.value;
        dateSelect.innerHTML = `<option value="All">All Dates</option>` +
          uniqueDates.map(d => `<option value="${d}">${d}</option>`).join('');
        if (uniqueDates.includes(currentVal)) dateSelect.value = currentVal;
      }

      renderTable();
    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
    }
  }

  function renderTable() {
    if (!tableContainer) return;

    const selectedDate = dateSelect ? dateSelect.value : 'All';
    const filtered = complaintsData.filter(c => {
      if (selectedDate !== 'All') {
        const cDate = c.created_at_date || c.created_at?.split(' ')[0];
        if (cDate !== selectedDate) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      tableContainer.innerHTML = '<div class="text-center py-12 text-gray-500 text-sm italic">No complaints found matching criteria.</div>';
      return;
    }

    // Group complaints by Date & Day
    const groups = filtered.reduce((acc, c) => {
      const rawDate = c.created_at_date || c.created_at?.split(' ')[0] || 'Unknown Date';
      const day = c.created_at_day || getDayOfWeek(rawDate);
      const displayDate = c.created_at_display_date || formatDateDisplay(rawDate);
      const key = `${day}, ${displayDate}`;

      if (!acc[key]) {
        acc[key] = { groupKey: key, items: [] };
      }
      acc[key].items.push(c);
      return acc;
    }, {});

    tableContainer.innerHTML = Object.keys(groups).map(key => {
      const group = groups[key];
      return `
        <div class="space-y-3 mb-8">
          <div class="flex items-center justify-between px-3 py-1.5 bg-[#DCE4EC]/60 rounded-xl border border-[#C2CFDB]/60">
            <span class="text-xs font-black text-[#2C3A47] uppercase tracking-wider">📅 ${group.groupKey}</span>
            <span class="text-[11px] font-bold text-[#5C6F84] bg-white px-2.5 py-0.5 rounded-full border border-[#C2CFDB]">
              ${group.items.length} ${group.items.length === 1 ? 'Complaint' : 'Complaints'}
            </span>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-[#C2CFDB]">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#2C3A47] text-[#A4B4C0] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th class="p-3.5">Complaint ID</th>
                  <th class="p-3.5">Complaint Title</th>
                  <th class="p-3.5">Student Name</th>
                  <th class="p-3.5">Category</th>
                  <th class="p-3.5">Date</th>
                  <th class="p-3.5">Day</th>
                  <th class="p-3.5">Time</th>
                  <th class="p-3.5">Current Status</th>
                  <th class="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#C2CFDB]/60 bg-white">
                ${group.items.map(c => {
                  const timeStr = c.created_at_time || c.created_at?.split(' ')[1]?.slice(0, 5) || 'N/A';
                  const statusKey = (c.status || '').toLowerCase().replace(/\s+/g, '-');
                  return `
                    <tr class="hover:bg-[#F4F7F9] transition-colors">
                      <td class="p-3.5 font-mono font-bold text-[#2C3A47] whitespace-nowrap">${c.id}</td>
                      <td class="p-3.5 font-semibold text-[#1C252E] max-w-xs truncate">${c.title}</td>
                      <td class="p-3.5 text-gray-700 font-medium whitespace-nowrap">${c.anonymous ? 'Anonymous Student' : c.student_name}</td>
                      <td class="p-3.5 text-gray-600 whitespace-nowrap">${c.category}</td>
                      <td class="p-3.5 text-gray-600 font-mono whitespace-nowrap">${c.created_at_display_date || c.created_at_date || ''}</td>
                      <td class="p-3.5 text-gray-600 font-medium whitespace-nowrap">${c.created_at_day || ''}</td>
                      <td class="p-3.5 text-gray-600 font-mono whitespace-nowrap">${timeStr}</td>
                      <td class="p-3.5 whitespace-nowrap">
                        <span class="badge badge-status-${statusKey}">${c.status}</span>
                      </td>
                      <td class="p-3.5 text-center whitespace-nowrap">
                        <a href="/admin-complaint-detail.html?id=${c.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C3A47] text-[#A4B4C0] hover:bg-[#5C6F84] transition-colors font-bold text-[11px]">
                          View Details
                        </a>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function getDayOfWeek(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
    } catch { return 'Monday'; }
  }

  function formatDateDisplay(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  }
}
