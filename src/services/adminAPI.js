const API_BASE = '/api/admin';

// Get admin token from localStorage
function getToken() {
  return localStorage.getItem('admin_token');
}

// Helper for authenticated requests
async function authFetch(url, options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('No admin token');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    // Redirect to admin login
    if (window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
    throw new Error('Session expired');
  }

  return res;
}

// ========== Auth ==========
export async function adminLogin(username, password) {
  console.log('[adminAPI] Login request to:', `${API_BASE}/login`);
  console.log('[adminAPI] Username:', username);
  let res;
  try {
    res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    console.log('[adminAPI] Response status:', res.status, res.statusText);
  } catch (fetchErr) {
    console.error('[adminAPI] Fetch error:', fetchErr);
    throw fetchErr;
  }
  const data = await res.json();
  console.log('[adminAPI] Response data:', data);
  if (data.success) {
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.admin));
  }
  return data;
}

export function adminLogout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function isAdminLoggedIn() {
  return !!getToken();
}

export function getAdminUser() {
  const user = localStorage.getItem('admin_user');
  return user ? JSON.parse(user) : null;
}

export async function verifyAdminToken() {
  const res = await authFetch(`${API_BASE}/verify`);
  return res.json();
}

// ========== Dashboard ==========
export async function getDashboard() {
  const res = await authFetch(`${API_BASE}/dashboard`);
  return res.json();
}

// ========== Users ==========
export async function getUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await authFetch(`${API_BASE}/users?${query}`);
  return res.json();
}

export async function getUserDetail(userId) {
  const res = await authFetch(`${API_BASE}/users/${userId}`);
  return res.json();
}

export async function banUser(userId, reason) {
  const res = await authFetch(`${API_BASE}/users/${userId}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'Administrative action' })
  });
  return res.json();
}

export async function unbanUser(userId) {
  const res = await authFetch(`${API_BASE}/users/${userId}/unban`, {
    method: 'POST'
  });
  return res.json();
}

export async function updateUserPoints(userId, points, operation = 'set') {
  const res = await authFetch(`${API_BASE}/users/${userId}/points`, {
    method: 'PUT',
    body: JSON.stringify({ points, operation })
  });
  return res.json();
}

export async function exportUsersCsv() {
  const res = await authFetch(`${API_BASE}/users?limit=10000`);
  const data = await res.json();
  if (data.success && data.users) {
    const headers = ['ID', 'Username', 'Email', 'Points', 'Created At', 'Status', 'Pet Count', 'Post Count'];
    const rows = data.users.map(u => [
      u.id,
      u.username,
      u.email,
      u.points,
      u.createdAt,
      u.isBanned ? 'Banned' : 'Active',
      u.petCount,
      u.postCount
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  return data;
}

// ========== Pets ==========
export async function getPets(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await authFetch(`${API_BASE}/pets?${query}`);
  return res.json();
}

export async function getPetDetail(petId) {
  const res = await authFetch(`${API_BASE}/pets/${petId}`);
  return res.json();
}

export async function deletePet(petId) {
  const res = await authFetch(`${API_BASE}/pets/${petId}`, { method: 'DELETE' });
  return res.json();
}

export async function updatePetStats(petId, stats) {
  const res = await authFetch(`${API_BASE}/pets/${petId}/stats`, {
    method: 'POST',
    body: JSON.stringify(stats)
  });
  return res.json();
}

// ========== Posts ==========
export async function getPosts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await authFetch(`${API_BASE}/posts?${query}`);
  return res.json();
}

export async function approvePost(postId) {
  const res = await authFetch(`${API_BASE}/posts/${postId}/approve`, { method: 'POST' });
  return res.json();
}

export async function rejectPost(postId, reason) {
  const res = await authFetch(`${API_BASE}/posts/${postId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  return res.json();
}

export async function deletePost(postId) {
  const res = await authFetch(`${API_BASE}/posts/${postId}`, { method: 'DELETE' });
  return res.json();
}

// ========== Training ==========
export async function getTrainingTasks() {
  const res = await authFetch(`${API_BASE}/training`);
  return res.json();
}

export async function deleteTrainingTask(taskId) {
  const res = await authFetch(`${API_BASE}/training/${taskId}`, { method: 'DELETE' });
  return res.json();
}

// ========== Workshop ==========
export async function getWorkshopCreations() {
  const res = await authFetch(`${API_BASE}/workshop`);
  return res.json();
}

export async function deleteWorkshopCreation(creationId) {
  const res = await authFetch(`${API_BASE}/workshop/${creationId}`, { method: 'DELETE' });
  return res.json();
}

// ========== Config ==========
export async function getSystemConfig() {
  const res = await authFetch(`${API_BASE}/config`);
  return res.json();
}

// ========== Audit Logs ==========
export async function getAuditLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await authFetch(`${API_BASE}/audit-logs?${query}`);
  return res.json();
}

// ========== Backup ==========
export async function createBackup() {
  const res = await authFetch(`${API_BASE}/data/backup`, { method: 'POST' });
  return res.json();
}

// ========== Dataset ==========
export async function getDatasetOverview() {
  const res = await authFetch(`${API_BASE}/dataset/overview`);
  return res.json();
}

export async function getDatasetPets(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await authFetch(`${API_BASE}/dataset/pets?${query}`);
  return res.json();
}

export async function getDatasetTraining(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await authFetch(`${API_BASE}/dataset/training?${query}`);
  return res.json();
}

export async function getDatasetTags() {
  const res = await authFetch(`${API_BASE}/dataset/tags`);
  return res.json();
}

export async function getDatasetTypes() {
  const res = await authFetch(`${API_BASE}/dataset/types`);
  return res.json();
}

export async function exportDataset(format = 'json', category = 'all') {
  const token = getToken();
  const res = await fetch(`${API_BASE}/dataset/export?format=${format}&category=${category}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Export failed');
  
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `pawpawtrain_dataset.${format === 'csv' ? 'csv' : 'json'}`;
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
  
  return { success: true, filename };
}
