import axios from 'axios';

// Build dynamic base URL with local override and environment default
const envBackend = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/,'');
const DEFAULT_BASE_URL = envBackend ? `${envBackend}/api` : '/api';

const getStoredBase = () => {
  try {
    const stored = localStorage.getItem('apiBaseUrl');
    if (!stored) return null;
    const trimmed = stored.replace(/\/+$/,'');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  } catch {
    return null;
  }
};

let currentBaseURL = getStoredBase() || DEFAULT_BASE_URL;

export const api = axios.create({
  baseURL: currentBaseURL,
  timeout: 10000,
});

const switchBaseURL = (nextBase) => {
  if (!nextBase || nextBase === currentBaseURL) return;
  api.defaults.baseURL = nextBase;
  currentBaseURL = nextBase;
  try { localStorage.setItem('apiBaseUrl', nextBase.replace(/\/api$/,'')); } catch {}
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Dev-only logging
  try {
    const debug = process.env.REACT_APP_HTTP_DEBUG === '1' || localStorage.getItem('httpDebug') === '1';
    if (process.env.NODE_ENV === 'development' && debug) {
      const { method, url, params, data, headers } = config;
      const safeHeaders = { ...(headers || {}) };
      if (safeHeaders && safeHeaders.Authorization) safeHeaders.Authorization = 'Bearer ***redacted***';
      // Avoid logging large payloads
      const safeData = typeof data === 'string' && data.length > 500 ? data.slice(0, 500) + '…' : data;
      // eslint-disable-next-line no-console
      console.debug('[HTTP Request]', {
        method,
        baseURL: config.baseURL,
        url: (config.baseURL || '') + (url || ''),
        params,
        data: safeData,
        headers: safeHeaders,
      });
    }
  } catch (_) { /* noop */ }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Dev-only logging
    try {
      const debug = process.env.REACT_APP_HTTP_DEBUG === '1' || localStorage.getItem('httpDebug') === '1';
      if (process.env.NODE_ENV === 'development' && debug) {
        // eslint-disable-next-line no-console
        console.debug('[HTTP Error]', {
          url: error.config && (error.config.baseURL || '') + (error.config.url || ''),
          status: error.response?.status,
          data: error.response?.data,
        });
      }
    } catch (_) { /* noop */ }

    // Network error/fallback handling: try alternate known base URLs once
    const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || /Network Error|ERR_CONNECTION_REFUSED/i.test(error.message || ''));
    if (isNetworkError && !error.config?._retryAlternate) {
      const current = error.config.baseURL || currentBaseURL;
      const candidates = [];
      if (DEFAULT_BASE_URL) candidates.push(DEFAULT_BASE_URL);
      // Try swapping common dev ports 44308 and 49724 if present
      try {
        const swap1 = current.replace('49724', '44308');
        const swap2 = current.replace('44308', '49724');
        [swap1, swap2].forEach((u) => { if (u && !candidates.includes(u)) candidates.push(u); });
      } catch {}
      const next = candidates.find((u) => u && u !== current);
      if (next) {
        // eslint-disable-next-line no-console
        console.warn('[HTTP] Network error. Retrying with alternate baseURL:', next);
        switchBaseURL(next);
        const newConfig = { ...error.config, baseURL: next, _retryAlternate: true };
        return api.request(newConfig);
      }
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      // Surface a clear message in console; UI pages can also catch and show banners
      console.warn('Forbidden (403): You do not have permission to perform this action.');
    }
    return Promise.reject(error);
  }
);

export default api;
