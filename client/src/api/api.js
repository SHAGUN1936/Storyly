const API_BASE = '/api';

const NETWORK_MSG =
  "Can't reach the server. Please check your internet connection and try again.";

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
  // Pre-flight: offline browsers immediately
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error(NETWORK_MSG);
  }
  let res;
  try {
    res = await fetch(url, config);
  } catch {
    // TypeError: Failed to fetch / DNS / CORS preflight — treat as network outage
    throw new Error(NETWORK_MSG);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 502 / 503 / 504 → backend is up but a dependency (DB, etc.) is down
    if (res.status >= 502 && res.status <= 504) {
      throw new Error(data.message || NETWORK_MSG);
    }
    throw new Error(data.message || res.statusText);
  }
  return data;
}

export const authAPI = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  google: (credential) => request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  updateProfile: (body) => request('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body) => request('/auth/password', { method: 'POST', body: JSON.stringify(body) }),
};

export const musicAPI = {
  // source 'itunes' → any song (30s preview) · 'archive' → full royalty-free.
  search: (q, source = 'itunes') => request(`/music/search?q=${encodeURIComponent(q)}&source=${source}`),
  // Resolve an Internet Archive item to a playable file URL.
  resolve: (id) => request(`/music/resolve?id=${encodeURIComponent(id)}`),
};

export const templatesAPI = {
  /**
   * Browse Templates list — combines admin templates AND builder
   * templates into a single grid. Each item gets a `sourceType` tag
   * ('Template' or 'BuilderTemplate') so the editor knows which API
   * to refetch from. Admin templates always come first, then builder
   * templates by newest.
   */
  list: async (category) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    const [admin, builder] = await Promise.all([
      request(`/templates${q}`).catch(() => []),
      request(`/builder-templates${q}`).catch(() => []),
    ]);
    const adminTagged   = (admin   || []).map((t) => ({ ...t, sourceType: 'Template' }));
    const builderTagged = (builder || []).map((t) => ({ ...t, sourceType: 'BuilderTemplate' }));
    return [...adminTagged, ...builderTagged];
  },
  get: (id, sourceType = 'Template') =>
    request(sourceType === 'BuilderTemplate' ? `/builder-templates/${id}` : `/templates/${id}`),
};

/* Builder-only — managing the calling user's own builder templates. */
export const builderTemplatesAPI = {
  mine: () => request('/builder-templates/mine'),
  get: (id) => request(`/builder-templates/${id}`),
  create: (body) => request('/builder-templates', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/builder-templates/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => request(`/builder-templates/${id}`, { method: 'DELETE' }),
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
  // Save (or update) a draft — no processing, status = 'draft'. Pass an
  // `id` to patch an existing draft, or omit it to create a fresh one.
  saveDraft: (body) => request('/videos/draft', { method: 'POST', body: JSON.stringify(body) }),
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
  unpublishTemplate: (id) => request(`/admin/templates/${id}/unpublish`, { method: 'POST' }),
};
