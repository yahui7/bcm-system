import axios from "axios";
import { message } from "antd";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// 响应拦截 — 统一错误处理
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.detail || err.message || "请求失败";
    message.error(msg);
    return Promise.reject(err);
  }
);

// 后续 Phase 4 加上 Token 拦截器
// api.interceptors.request.use(...)

export default api;
