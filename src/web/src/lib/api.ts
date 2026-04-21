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

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      try {
        const res = await api.post<{ data: { accessToken: string } }>("/auth/refresh");
        setAuthToken(res.data.data.accessToken);
        return api.request(err.config);
      } catch {
        setAuthToken(null);
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(err);
  }
);
