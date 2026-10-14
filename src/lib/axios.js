import axios from "axios";

// Access token lives in memory only - never localStorage/sessionStorage.
// A page refresh clears it; AuthContext re-hydrates it via /auth/refresh
// (the httpOnly refresh cookie survives the refresh, this in-memory value
// does not - that's the point: it keeps the token out of reach of XSS).
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. http://localhost:5000/api
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // sends the httpOnly refresh cookie
});

// Attach the current access token to every request.
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On a 401 with an expired token, try exactly one silent refresh, then
// retry the original request. Anything else (bad refresh, second 401)
// is surfaced to the caller instead of looping forever.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response || response.status !== 401 || config._retry) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      // Share one in-flight refresh across concurrent 401s.
      refreshPromise =
        refreshPromise ||
        axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

      const { data } = await refreshPromise;
      refreshPromise = null;

      const newToken = data?.data?.accessToken ?? data?.accessToken;
      setAccessToken(newToken);
      config.headers.Authorization = `Bearer ${newToken}`;
      return api(config);
    } catch (refreshError) {
      refreshPromise = null;
      setAccessToken(null);
      // Let the app react (e.g. redirect to login) via AuthContext state.
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(refreshError);
    }
  }
);

export default api;
