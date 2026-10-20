import { getComplaintById } from './api.js';

export async function initTrackPage() {
  const form = document.getElementById('track-form');
  const input = document.getElementById('search-input');
  const loadingEl = document.getElementById('loading-state');
  const errorEl = document.getElementById('error-state');
  const detailEl = document.getElementById('complaint-detail');

  const urlParams = new URLSearchParams(window.location.search);
  const initialId = urlParams.get('id') || '';

  if (input && initialId) {
    input.value = initialId;
    fetchAndRender(initialId);
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (query) {
        window.history.replaceState(null, '', `?id=${encodeURIComponent(query)}`);
        fetchAndRender(query);
      }
    });
  }

  // Demo ID pills handler
  document.querySelectorAll('.demo-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const demoId = btn.getAttribute('data-id');
      if (input) input.value = demoId;
      window.history.replaceState(null, '', `?id=${encodeURIComponent(demoId)}`);
      fetchAndRender(demoId);
    });
  });

  async function fetchAndRender(complaintId) {
    if (!complaintId) return;

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (detailEl) detailEl.classList.add('hidden');

    try {
      const complaint = await getComplaintById(complaintId);
      if (loadingEl) loadingEl.classList.add('hidden');

      if (!complaint) {
        showError(`Complaint ${complaintId} not found.`);
        return;
      }

      renderComplaintDetail(complaint);
    } catch (err) {
      if (loadingEl) loadingEl.classList.add('hidden');
      showError(err.message || `Complaint ${complaintId} not found.`);
    }
  }

  function showError(msg) {
    if (errorEl) {
      errorEl.classList.remove('hidden');
      document.getElementById('error-msg-text').textContent = msg;
    }
  }

  function renderComplaintDetail(c) {
    if (!detailEl) return;
    detailEl.classList.remove('hidden');

    // Header info
    document.getElementById('detail-id').textContent = c.id;
    document.getElementById('detail-title').textContent = c.title;

    // Badges
    const priorityBadge = document.getElementById('detail-priority-badge');
    if (priorityBadge) {
      priorityBadge.textContent = c.priority;
      priorityBadge.className = `badge badge-priority-${(c.priority || 'low').toLowerCase()}`;
    }

    const statusBadge = document.getElementById('detail-status-badge');
    if (statusBadge) {
      statusBadge.textContent = c.status;
      const statusKey = (c.status || '').toLowerCase().replace(/\s+/g, '-');
      statusBadge.className = `badge badge-status-${statusKey}`;
    }

    // Grid metadata
    document.getElementById('detail-category').textContent = c.category;
    document.getElementById('detail-department').textContent = c.department;
    document.getElementById('detail-location').textContent = c.location;
    document.getElementById('detail-student').textContent = c.anonymous ? 'Anonymous Student' : c.student_name;
    document.getElementById('detail-date').textContent = c.created_at;
    document.getElementById('detail-description').textContent = c.description;

    // Evidence
    const evidenceContainer = document.getElementById('detail-evidence-container');
    if (evidenceContainer) {
      if (c.evidence_url) {
        evidenceContainer.classList.remove('hidden');
        document.getElementById('detail-evidence-link').href = c.evidence_url;
      } else {
        evidenceContainer.classList.add('hidden');
      }
    }

    // Resolution section
    const resolutionContainer = document.getElementById('detail-resolution-container');
    if (resolutionContainer) {
      if (c.status === 'Resolved' || c.status === 'RESOLVED' || c.resolution_summary) {
        resolutionContainer.classList.remove('hidden');
        document.getElementById('detail-resolution-summary').textContent = c.resolution_summary || 'Issue was resolved by campus administration.';
        document.getElementById('detail-resolution-date').textContent = `Resolved Date: ${c.resolved_at || c.updated_at || 'N/A'}`;
      } else {
        resolutionContainer.classList.add('hidden');
      }
    }

    // Timeline events
    const timelineEventsEl = document.getElementById('detail-timeline-events');
    if (timelineEventsEl) {
      const updates = c.timeline || c.updates || [];
      if (updates.length === 0) {
        timelineEventsEl.innerHTML = '<p class="text-xs text-gray-500 italic">No timeline updates posted yet.</p>';
      } else {
        timelineEventsEl.innerHTML = updates.map((evt, idx) => `
          <div class="timeline-item ${idx === updates.length - 1 ? 'active' : ''}">
            <div class="bg-white p-4 rounded-xl border border-[#C2CFDB] shadow-sm">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-xs text-[#2C3A47]">${evt.status || 'Update'}</span>
                <span class="text-[10px] text-gray-500 font-mono">${evt.date || ''} ${evt.time || ''}</span>
              </div>
              <p class="text-xs text-[#1C252E] leading-relaxed">${evt.message}</p>
              ${evt.actor ? `<span class="text-[10px] text-[#5C6F84] mt-1 block">By: ${evt.actor}</span>` : ''}
            </div>
          </div>
        `).join('');
      }
    }
  }
}
