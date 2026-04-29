import axios from 'axios';

// Axios kliens a backend hívásokhoz, alapértelmezett baseURL
const api = axios.create({
  baseURL: 'http://localhost:6969',
});

// Kérés előtt: csatoljuk a legfrissebb tokent (ha van)
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

// Válasz interceptor: globális 401 kezelés (auth törlése és átirányítás)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null, token: null } }));
        // Átirányítás bejelentkezésre
        if (typeof window !== 'undefined') window.location.href = '/login';
      } catch (e) {
        console.debug('Error handling 401', e);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
