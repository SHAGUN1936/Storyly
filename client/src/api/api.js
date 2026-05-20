const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };
  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export const authAPI = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  google: (credential) => request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

export const templatesAPI = {
  list: (category) => request(category ? `/templates?category=${category}` : '/templates'),
  get: (id) => request(`/templates/${id}`),
};

export const videosAPI = {
  get: (id) => request(`/videos/${id}`),
  update: (id, body) => request(`/videos/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => request(`/videos/${id}`, { method: 'DELETE' }),
  uploadMedia: async (file) => {
    const form = new FormData();
    form.append('media', file);
    const res = await fetch(`${API_BASE}/videos/upload`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  },
  createJob: (body) => request('/videos', { method: 'POST', body: JSON.stringify(body) }),
  process: (id) => request(`/videos/${id}/process`, { method: 'POST' }),
  myVideos: () => request('/videos/my'),
  getQR: (id) => request(`/videos/${id}/qr`),
};

export const publicAPI = {
  getVideoBySlug: (slug) => request(`/public/video/${slug}`),
};

export const adminAPI = {
  getTemplates: () => request('/admin/templates'),
  createTemplate: async (formData) => {
    const res = await fetch(`${API_BASE}/admin/templates`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed');
    return data;
  },
  updateTemplate: async (id, formData) => {
    const res = await fetch(`${API_BASE}/admin/templates/${id}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed');
    return data;
  },
  deleteTemplate: (id) => request(`/admin/templates/${id}`, { method: 'DELETE' }),
  publishTemplate: (id) => request(`/admin/templates/${id}/publish`, { method: 'POST' }),
};
