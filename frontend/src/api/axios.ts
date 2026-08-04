import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type TokenResponse = { accessToken: string };

const baseURL = import.meta.env.VITE_API_URL as string | undefined;

let refreshPromise: Promise<string> | null = null;

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    refreshPromise ??= axios
      .post<TokenResponse>(`${baseURL ?? ""}/api/auth/refresh-token`, { refreshToken })
      .then((response) => {
        localStorage.setItem("accessToken", response.data.accessToken);
        return response.data.accessToken;
      })
      .catch((refreshError) => {
        localStorage.clear();
        window.location.href = "/login";
        throw refreshError;
      })
      .finally(() => {
        refreshPromise = null;
      });

    const newToken = await refreshPromise;
    if (newToken) {
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export { api };
