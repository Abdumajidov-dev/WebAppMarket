import axios from "axios";

export const saApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "X-Tenant-Slug": "platform",
  },
});

export function setSaAuthToken(token: string | null) {
  if (token) {
    saApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete saApi.defaults.headers.common["Authorization"];
  }
}

saApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      try {
        const res = await saApi.post<{ data: { accessToken: string } }>("/auth/refresh");
        setSaAuthToken(res.data.data.accessToken);
        return saApi.request(err.config);
      } catch {
        setSaAuthToken(null);
        window.location.href = "/superadmin/login";
      }
    }
    return Promise.reject(err);
  }
);
