import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, message, Select } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import api from "../api";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", values);
      const user = res.data.user;
      localStorage.setItem("bcm_username", user.username);
      localStorage.setItem("bcm_role", user.role);
      localStorage.setItem("bcm_display_name", user.display_name);
      message.success(`欢迎，${user.display_name}`);
      navigate("/dashboard");
    } catch {
      // api.js interceptor already shows error
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1f3a" }}>BCM 业务连续性管理系统</div>
          <div style={{ color: "#999", marginTop: 8, fontSize: "0.85rem" }}>请登录您的账户</div>
        </div>
        <Form onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block
              style={{ background: "#1a1f3a", height: 44 }}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: "center", color: "#bbb", fontSize: "0.75rem", marginTop: 16 }}>
          演示账号：admin_demo / bu_demo / exec_demo · 密码：demo123
        </div>
      </Card>
    </div>
  );
}
