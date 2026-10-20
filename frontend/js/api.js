/**
 * CampusShield API Client Service (Vanilla JS Fetch)
 */
import { getAuthToken, getCurrentUser } from './auth.js';

// In production, set window.CAMPUSSHIELD_API_BASE to your deployed backend URL
// e.g. "https://campusshield-api.vercel.app"
const API_BASE = window.CAMPUSSHIELD_API_BASE
  ? `${window.CAMPUSSHIELD_API_BASE}/api`
  : window.location.origin.includes(':5000')
    ? '/api'
    : 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const headers = options.headers || {};
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach auth token if available
  try {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const user = getCurrentUser();
    if (user) {
      if (user.email) headers['X-User-Email'] = user.email;
      if (user.name) headers['X-User-Name'] = user.name;
    }
  } catch (e) {
    console.warn("Error attaching auth token:", e);
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `API Error: ${response.status} ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    console.error(`[API Call Error] ${endpoint}:`, error);
    throw error;
  }
}

export const getHealth = () => request('/health');
export const getPublicStats = () => request('/public/stats');
export const getDashboardStats = () => request('/dashboard/stats');
export const getCriticalComplaints = () => request('/admin/critical');
export const getOverdueComplaints = () => request('/admin/overdue');
export const getAdminAnalytics = () => request('/admin/analytics');
export const getAdminActivity = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/activity${query ? '?' + query : ''}`);
};

export const getMyComplaints = () => request('/my-complaints');
export const getComplaints = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/complaints${query ? '?' + query : ''}`);
};

export const getComplaintById = (id) => request(`/complaints/${encodeURIComponent(id)}`);
export const getComplaintTimeline = (id) => request(`/complaints/${encodeURIComponent(id)}/timeline`);
export const searchComplaint = (id) => request(`/complaints/search/${encodeURIComponent(id)}`);

export const createComplaint = (data) => request('/complaints', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateComplaint = (id, data) => request(`/complaints/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const approveComplaint = (id, data = {}) => request(`/admin/complaints/${encodeURIComponent(id)}/approve`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const rejectComplaint = (id, rejection_reason) => request(`/admin/complaints/${encodeURIComponent(id)}/reject`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const assignComplaint = (id, department) => request(`/admin/complaints/${encodeURIComponent(id)}/assign`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const addComplaintUpdate = (id, updateData) => request(`/complaints/${encodeURIComponent(id)}/updates`, {
  method: 'POST',
  body: JSON.stringify(updateData)
});

export const uploadEvidence = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request('/upload', {
    method: 'POST',
    body: formData
  });
};
