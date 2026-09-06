import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "X-Tenant-Slug": process.env.NEXT_PUBLIC_TENANT_SLUG ?? "default",
  },
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = api
      .post<{ data: { accessToken: string } }>("/auth/refresh")
      .then((res) => res.data.data.accessToken)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config?._retried) {
      try {
        const accessToken = await refreshAccessToken();
        setAuthToken(accessToken);
        err.config._retried = true;
        err.config.headers = { ...err.config.headers, Authorization: `Bearer ${accessToken}` };
        return api.request(err.config);
      } catch {
        setAuthToken(null);
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(err);
  }
);
