import { initClerk, getCurrentUser, isAdminUser } from './auth.js';
import { createComplaint, uploadEvidence } from './api.js';
import { CATEGORY_NAMES, DEFAULT_PRIORITIES } from './constants.js';

export async function initSubmitPage() {
  const form = document.getElementById('complaint-form');
  const categorySelect = document.getElementById('category');
  const prioritySelect = document.getElementById('priority');
  const anonymousCheck = document.getElementById('anonymous');
  const studentInfoRow = document.getElementById('student-info-row');
  const studentNameInput = document.getElementById('student_name');
  const studentEmailInput = document.getElementById('student_email');
  const fileInput = document.getElementById('evidence');
  const fileNameDisplay = document.getElementById('file-name-display');
  const alertContainer = document.getElementById('alert-container');
  const sensitiveNotice = document.getElementById('sensitive-notice');
  const modal = document.getElementById('success-modal');

  // Fill category options if empty
  if (categorySelect && categorySelect.options.length === 0) {
    categorySelect.innerHTML = CATEGORY_NAMES.map(cat => 
      `<option value="${cat}">${cat}</option>`
    ).join('');
  }

  // Check URL query parameters for category pre-selection
  const urlParams = new URLSearchParams(window.location.search);
  const preCat = urlParams.get('category');
  if (categorySelect && preCat && CATEGORY_NAMES.includes(preCat)) {
    categorySelect.value = preCat;
  }

  // Update initial category priority & sensitive banner
  updateCategoryState();

  if (categorySelect) {
    categorySelect.addEventListener('change', updateCategoryState);
  }

  function updateCategoryState() {
    if (!categorySelect) return;
    const cat = categorySelect.value;
    const defaultPriority = DEFAULT_PRIORITIES[cat] || 'Medium';
    if (prioritySelect) prioritySelect.value = defaultPriority;

    const isSensitive = cat === 'Ragging / Bullying' || cat === 'Harassment';
    if (sensitiveNotice) {
      if (isSensitive) sensitiveNotice.classList.remove('hidden');
      else sensitiveNotice.classList.add('hidden');
    }
  }

  // Anonymous toggle handler
  if (anonymousCheck && studentInfoRow) {
    anonymousCheck.addEventListener('change', () => {
      if (anonymousCheck.checked) {
        studentInfoRow.classList.add('hidden');
      } else {
        studentInfoRow.classList.remove('hidden');
      }
    });
  }

  // File name display handler
  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        fileNameDisplay.textContent = fileInput.files[0].name;
      } else {
        fileNameDisplay.textContent = 'Click to upload file';
      }
    });
  }

  // Form submission handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      showAlert('');

      const title = document.getElementById('title').value.trim();
      const description = document.getElementById('description').value.trim();
      const category = categorySelect ? categorySelect.value : 'Other Complaints';
      const priority = prioritySelect ? prioritySelect.value : 'Low';
      const location = document.getElementById('location').value.trim() || 'Campus Main Grounds';
      const anonymous = anonymousCheck ? anonymousCheck.checked : false;
      const studentName = studentNameInput ? studentNameInput.value.trim() : '';
      const studentEmail = studentEmailInput ? studentEmailInput.value.trim() : '';

      if (!title || !description) {
        showAlert('Please fill in Title & Description.');
        return;
      }

      if (!anonymous && (!studentName || !studentEmail)) {
        showAlert('Student Name & Email are required unless submitting anonymously.');
        return;
      }

      const submitBtn = document.getElementById('btn-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Submitting Complaint...';
      }

      try {
        let evidenceUrl = null;

        if (fileInput && fileInput.files && fileInput.files[0]) {
          try {
            const uploadRes = await uploadEvidence(fileInput.files[0]);
            evidenceUrl = uploadRes.file_url;
          } catch (uploadErr) {
            console.warn("Evidence upload warning:", uploadErr);
          }
        }

        const payload = {
          student_name: studentName,
          student_email: studentEmail,
          category,
          title,
          description,
          location,
          priority,
          anonymous,
          evidence_url: evidenceUrl
        };

        const result = await createComplaint(payload);

        if (modal) {
          document.getElementById('modal-complaint-id').textContent = result.id;
          document.getElementById('modal-status').textContent = result.status;
          document.getElementById('modal-category').textContent = result.category;

          modal.classList.remove('hidden');

          document.getElementById('btn-track-submitted').onclick = () => {
            window.location.href = `/track-complaint.html?id=${result.id}`;
          };
        }

      } catch (err) {
        console.error(err);
        showAlert(err.message || 'Failed to submit complaint.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            <span>Submit Complaint</span>
          `;
        }
      }
    });
  }

  // Load auth in background to pre-fill user info
  try {
    await initClerk();
    if (isAdminUser()) {
      window.location.href = '/admin-dashboard.html';
      return;
    }
    const currentUser = getCurrentUser();
    if (currentUser) {
      if (studentNameInput && !studentNameInput.value) studentNameInput.value = currentUser.name || '';
      if (studentEmailInput && !studentEmailInput.value) studentEmailInput.value = currentUser.email || '';
    }
  } catch (err) {
    console.warn("Auth pre-fill notice:", err);
  }

  function showAlert(msg) {
    if (!alertContainer) return;
    if (!msg) {
      alertContainer.classList.add('hidden');
      alertContainer.innerHTML = '';
      return;
    }
    alertContainer.classList.remove('hidden');
    alertContainer.innerHTML = `
      <div class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
        <span>${msg}</span>
        <button onclick="this.parentElement.remove()" class="text-red-600 font-bold">✕</button>
      </div>
    `;
  }
}
