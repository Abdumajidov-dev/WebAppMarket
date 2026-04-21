import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      try {
        await api.post("/auth/refresh");
        return api.request(err.config);
      } catch {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(err);
  }
);
