import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:6969',
});

// Attach latest token before each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    if (config.headers && config.headers.Authorization) delete config.headers.Authorization;
  }
  return config;
});

// Global 401 handler: clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null, token: null } }));
        // Navigate to login page
        if (typeof window !== 'undefined') window.location.href = '/login';
      } catch (e) {
        console.debug('Error handling 401', e);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
