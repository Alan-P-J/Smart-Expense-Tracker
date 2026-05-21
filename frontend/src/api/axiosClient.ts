import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * Axios instance for all API calls.
 *
 * - baseURL '/api' so callers say `axiosClient.get('/expenses')`.
 *   In dev, Vite's proxy forwards /api to Spring Boot.
 * - withCredentials: true ensures the HttpOnly access_token + refresh_token
 *   cookies set by /api/auth/login flow back automatically.
 * - On 401, the response interceptor tries POST /api/auth/refresh exactly once
 *   and retries the original request. If the refresh fails, the user is
 *   redirected to /login.
 */
const axiosClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Single-flight refresh ───────────────────────────────────────────────
// While a refresh is in progress, queue concurrent 401s so they share one
// /auth/refresh call instead of stampeding.
let refreshInFlight: Promise<void> | null = null;

function performRefresh(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post('/api/auth/refresh', null, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    // Don't try to refresh on the refresh / login endpoints themselves.
    const url = original?.url ?? '';
    const isAuthEndpoint = url.startsWith('/auth/login') || url.startsWith('/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        await performRefresh();
        return axiosClient.request(original);
      } catch (refreshErr) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
