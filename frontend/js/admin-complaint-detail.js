import { requireAdminPage } from './auth.js';
import { getComplaintById, updateComplaint, addComplaintUpdate, getComplaintTimeline } from './api.js';
import { ALL_STATUSES, DEPARTMENTS } from './constants.js';

export async function initAdminComplaintDetailPage() {
  const authed = await requireAdminPage();
  if (!authed) return;

  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get('id');

  if (!complaintId) {
    alert("No complaint ID specified.");
    window.location.href = '/admin-dashboard.html';
    return;
  }

  const statusSelect = document.getElementById('select-status');
  const prioritySelect = document.getElementById('select-priority');
  const deptSelect = document.getElementById('select-department');

  // Fill status & dept options
  if (statusSelect) {
    statusSelect.innerHTML = ALL_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('');
  }
  if (deptSelect) {
    deptSelect.innerHTML = DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join('');
  }

  const alertContainer = document.getElementById('alert-container');
  const resolveModal = document.getElementById('resolve-modal');
  const resolveForm = document.getElementById('resolve-form');

  loadComplaintDetail();

  async function loadComplaintDetail() {
    try {
      const complaint = await getComplaintById(complaintId);
      renderDetail(complaint);
    } catch (err) {
      console.error(err);
      alert(`Error loading complaint ${complaintId}: ` + err.message);
      window.location.href = '/admin-dashboard.html';
    }
  }

  function renderDetail(c) {
    document.getElementById('detail-id').textContent = c.id;
    document.getElementById('detail-title').textContent = c.title;

    const statusBadge = document.getElementById('detail-status-badge');
    if (statusBadge) {
      statusBadge.textContent = c.status;
      const statusKey = (c.status || '').toLowerCase().replace(/\s+/g, '-');
      statusBadge.className = `badge badge-status-${statusKey}`;
    }

    const priorityBadge = document.getElementById('detail-priority-badge');
    if (priorityBadge) {
      priorityBadge.textContent = c.priority;
      priorityBadge.className = `badge badge-priority-${(c.priority || 'low').toLowerCase()}`;
    }

    document.getElementById('detail-student-name').textContent = c.anonymous ? 'Anonymous Student' : c.student_name;
    document.getElementById('detail-student-email').textContent = c.anonymous ? 'Hidden (Anonymous)' : (c.student_email || 'N/A');
    document.getElementById('detail-category').textContent = c.category;
    document.getElementById('detail-location').textContent = c.location;
    document.getElementById('detail-date').textContent = c.created_at;
    document.getElementById('detail-department').textContent = c.department;
    document.getElementById('detail-description').textContent = c.description;

    // Pre-select editable values
    if (statusSelect) statusSelect.value = c.status;
    if (prioritySelect) prioritySelect.value = c.priority;
    if (deptSelect) deptSelect.value = c.department;

    // SLA Info
    const slaInfo = c.sla_info || {};
    document.getElementById('sla-hours').textContent = `${c.sla?.duration_hours || 72} Hours`;
    document.getElementById('sla-deadline').textContent = slaInfo.deadline || c.created_at;
    const slaEscalation = document.getElementById('sla-escalation');
    if (slaEscalation) {
      slaEscalation.textContent = slaInfo.display_text || 'ON TRACK';
      if (slaInfo.is_overdue) {
        slaEscalation.className = 'badge badge-priority-critical';
      } else {
        slaEscalation.className = 'badge badge-priority-low';
      }
    }

    // Evidence
    const evidenceContainer = document.getElementById('evidence-container');
    if (evidenceContainer) {
      if (c.evidence_url) {
        evidenceContainer.classList.remove('hidden');
        document.getElementById('evidence-link').href = c.evidence_url;
      } else {
        evidenceContainer.classList.add('hidden');
      }
    }

    // Resolution Details
    const resolutionBox = document.getElementById('resolution-box');
    if (resolutionBox) {
      if (c.status === 'Resolved' || c.status === 'RESOLVED' || c.resolution_summary) {
        resolutionBox.classList.remove('hidden');
        document.getElementById('resolution-summary-text').textContent = c.resolution_summary || 'Issue addressed and resolved by campus admin.';
      } else {
        resolutionBox.classList.add('hidden');
      }
    }

    // Render Timeline Events
    const timelineEl = document.getElementById('timeline-events');
    if (timelineEl) {
      const updates = c.timeline || c.updates || [];
      if (updates.length === 0) {
        timelineEl.innerHTML = '<p class="text-xs text-gray-500 italic">No timeline updates recorded.</p>';
      } else {
        timelineEl.innerHTML = updates.map((evt, idx) => `
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

  // Save changes button handler
  const btnSaveControl = document.getElementById('btn-save-control');
  if (btnSaveControl) {
    btnSaveControl.addEventListener('click', async () => {
      try {
        const newStatus = statusSelect.value;
        const newPriority = prioritySelect.value;
        const newDept = deptSelect.value;

        const updated = await updateComplaint(complaintId, {
          status: newStatus,
          priority: newPriority,
          department: newDept
        });

        showAlert('Status, Priority & Department updated successfully!', 'success');
        renderDetail(updated);
      } catch (err) {
        showAlert('Failed to update complaint: ' + err.message, 'error');
      }
    });
  }

  // Resolution modal handlers
  const btnOpenResolve = document.getElementById('btn-open-resolve');
  if (btnOpenResolve && resolveModal) {
    btnOpenResolve.addEventListener('click', () => {
      resolveModal.classList.remove('hidden');
    });
  }

  const btnCloseResolve = document.getElementById('btn-close-resolve');
  if (btnCloseResolve && resolveModal) {
    btnCloseResolve.addEventListener('click', () => {
      resolveModal.classList.add('hidden');
    });
  }

  if (resolveForm) {
    resolveForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const summary = document.getElementById('resolution-summary-input').value.trim();
      if (!summary) return;

      try {
        const updated = await updateComplaint(complaintId, {
          status: 'RESOLVED',
          resolution_summary: summary
        });

        if (resolveModal) resolveModal.classList.add('hidden');
        showAlert('Complaint marked as RESOLVED successfully!', 'success');
        renderDetail(updated);
      } catch (err) {
        showAlert('Failed to resolve complaint: ' + err.message, 'error');
      }
    });
  }

  // Post update note handler
  const updateForm = document.getElementById('add-update-form');
  if (updateForm) {
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('update-msg-input').value.trim();
      const isInternal = document.getElementById('internal-check').checked;

      if (!msg) return;

      try {
        const updated = await addComplaintUpdate(complaintId, {
          message: msg,
          status: statusSelect ? statusSelect.value : 'Under Investigation',
          is_internal: isInternal
        });

        document.getElementById('update-msg-input').value = '';
        showAlert('Progress update note posted successfully!', 'success');
        renderDetail(updated);
      } catch (err) {
        showAlert('Failed to post update note: ' + err.message, 'error');
      }
    });
  }

  function showAlert(msg, type = 'success') {
    if (!alertContainer) return;
    alertContainer.classList.remove('hidden');
    const isSuccess = type === 'success';
    alertContainer.innerHTML = `
      <div class="p-4 rounded-xl ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} border text-xs font-bold flex items-center justify-between animate-fade-in">
        <span>${msg}</span>
        <button onclick="this.parentElement.remove()" class="font-bold">✕</button>
      </div>
    `;
    setTimeout(() => { alertContainer.classList.add('hidden'); }, 4000);
  }
}
