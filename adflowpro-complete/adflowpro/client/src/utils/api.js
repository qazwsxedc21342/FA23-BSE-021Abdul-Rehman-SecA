import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('token');
      Cookies.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  me:       ()      => api.get('/auth/me'),
};

// ─── Public ──────────────────────────────────────────────────
export const publicAPI = {
  getAds:       (params) => api.get('/ads', { params }),
  getAdBySlug:  (slug)   => api.get(`/ads/${slug}`),
  getPackages:  ()       => api.get('/packages'),
  getCategories:()       => api.get('/categories'),
  getCities:    ()       => api.get('/cities'),
  getQuestion:  ()       => api.get('/questions/random'),
  healthCheck:  ()       => api.get('/health/db'),
};

// ─── Client ──────────────────────────────────────────────────
export const clientAPI = {
  getDashboard:       ()         => api.get('/client/dashboard'),
  createAd:           (data)     => api.post('/client/ads', data),
  updateAd:           (id, data) => api.patch(`/client/ads/${id}`, data),
  submitAd:           (id)       => api.post(`/client/ads/${id}/submit`),
  submitPayment:      (data)     => api.post('/client/payments', data),
  getNotifications:   ()         => api.get('/client/notifications'),
};

// ─── Moderator ───────────────────────────────────────────────
export const moderatorAPI = {
  getQueue:     ()          => api.get('/moderator/review-queue'),
  reviewAd:     (id, data)  => api.patch(`/moderator/ads/${id}/review`, data),
};

// ─── Admin ───────────────────────────────────────────────────
export const adminAPI = {
  getPaymentQueue:  ()          => api.get('/admin/payment-queue'),
  verifyPayment:    (id, data)  => api.patch(`/admin/payments/${id}/verify`, data),
  publishAd:        (id, data)  => api.patch(`/admin/ads/${id}/publish`, data),
  featureAd:        (id)        => api.patch(`/admin/ads/${id}/feature`),
  boostAd:          (id, boost) => api.patch(`/admin/ads/${id}/boost`, { boost }),
  getUsers:         ()          => api.get('/admin/users'),
  updateUserStatus: (id, status)=> api.patch(`/admin/users/${id}/status`, { status }),
  getAuditLogs:     ()          => api.get('/admin/audit-logs'),
};

// ─── Analytics ───────────────────────────────────────────────
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
};
