import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { getMenuItems } from "../config/menus";

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // 开发阶段默认 admin 角色
  const role = localStorage.getItem("bcm_role") || "admin";
  const username = localStorage.getItem("bcm_username") || "admin_demo";
  const displayName = localStorage.getItem("bcm_display_name") || "李管理";

  const menuItems = getMenuItems(role);

  // 根据路径计算选中的菜单 key
  const selectedKey = "/" + location.pathname.split("/").slice(1, 3).join("/");
  const openKeys = ["/" + location.pathname.split("/")[1]];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header className="bcm-header">
        <span className="brand">BCM 业务连续性管理系统</span>
        <div className="header-right">
          <span>{displayName} · {role === "admin" ? "BCM管理员" : role === "executive" ? "高管" : "BU业务人员"}</span>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: "#7eb8da" }}
          >
            退出
          </Button>
        </div>
      </Header>
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={220}
          className="bcm-sider"
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={openKeys}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ marginTop: 8 }}
          />
        </Sider>
        <Content style={{ padding: 24, overflow: "auto" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
