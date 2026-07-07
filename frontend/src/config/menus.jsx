import React from "react";
import {
  DashboardOutlined,
  FileTextOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  ApartmentOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

const boldLabel = (text) => <span style={{ fontWeight: 700 }}>{text}</span>;

// BU 业务人员菜单
export const buMenuItems = [
  { key: "/dashboard", icon: <DashboardOutlined style={{ color: "#4a90d9" }} />, label: boldLabel("Dashboard") },
  { key: "/bia", icon: <FileTextOutlined style={{ color: "#52c41a" }} />, label: boldLabel("BIA 业务影响分析"), children: [
      { key: "/bia/info", label: "业务基础信息" },
      { key: "/bia/scoring", label: "业务因子评分" },
      { key: "/bia/dependencies", label: "上下游关系" },
    ],
  },
  { key: "/risk", icon: <AlertOutlined style={{ color: "#e74c3c" }} />, label: boldLabel("RA 风险评估"), children: [
      { key: "/risk/resources", label: "资源识别" },
      { key: "/risk/assessment", label: "风险评估模型" },
    ],
  },
  { key: "/bcp", icon: <SafetyCertificateOutlined style={{ color: "#faad14" }} />, label: boldLabel("BCP 连续性计划") },
  { key: "/drill", icon: <ThunderboltOutlined style={{ color: "#7b68ee" }} />, label: boldLabel("演练管理"), children: [
      { key: "/drill/plan", label: "演练计划" },
      { key: "/drill/result", label: "演练结果" },
    ],
  },
  { key: "/maintenance", icon: <ToolOutlined style={{ color: "#e67e22" }} />, label: boldLabel("维护改进"), children: [
      { key: "/maintenance/events", label: "风险事件" },
      { key: "/maintenance/issues", label: "问题管理" },
    ],
  },
  { key: "/report", icon: <FileTextOutlined style={{ color: "#722ed1" }} />, label: boldLabel("报告管理"), children: [
      { key: "/report/templates", label: "报告模板管理" },
      { key: "/report/generate", label: "报告生成" },
      { key: "/report/history", label: "历史报告" },
    ],
  },
];

// BCM 管理员菜单
export const adminMenuItems = [
  { key: "/dashboard", icon: <DashboardOutlined style={{ color: "#4a90d9" }} />, label: boldLabel("Dashboard") },
  { key: "/admin/businesses", icon: <ApartmentOutlined style={{ color: "#1890ff" }} />, label: boldLabel("业务清单维护") },
  { key: "/admin/bia-factors", icon: <FileTextOutlined style={{ color: "#52c41a" }} />, label: boldLabel("BIA 评估因子") },
  { key: "/admin/risk-factors", icon: <AlertOutlined style={{ color: "#e74c3c" }} />, label: boldLabel("风险评估因子") },
  { key: "/admin/systems", icon: <DatabaseOutlined style={{ color: "#13c2c2" }} />, label: boldLabel("系统清单") },
  { key: "/admin/strategies", icon: <SafetyCertificateOutlined style={{ color: "#faad14" }} />, label: boldLabel("恢复策略库") },
  { key: "/drill", icon: <ThunderboltOutlined style={{ color: "#7b68ee" }} />, label: boldLabel("演练管理"), children: [
      { key: "/drill/plan", label: "所有演练计划" },
      { key: "/drill/result", label: "演练进度" },
    ],
  },
  { key: "/maintenance", icon: <ToolOutlined style={{ color: "#e67e22" }} />, label: boldLabel("维护改进"), children: [
      { key: "/maintenance/events", label: "风险事件管理" },
      { key: "/maintenance/issues", label: "问题管理" },
    ],
  },
  { key: "/report", icon: <FileTextOutlined style={{ color: "#722ed1" }} />, label: boldLabel("报告管理"), children: [
      { key: "/report/templates", label: "报告模板管理" },
      { key: "/report/generate", label: "报告生成" },
      { key: "/report/history", label: "历史报告" },
    ],
  },
];

// 高管菜单
export const execMenuItems = [
  { key: "/dashboard", icon: <DashboardOutlined style={{ color: "#4a90d9" }} />, label: boldLabel("Dashboard") },
  { key: "/report", icon: <FileTextOutlined style={{ color: "#722ed1" }} />, label: boldLabel("报告管理"), children: [
      { key: "/report/templates", label: "报告模板管理" },
      { key: "/report/generate", label: "报告生成" },
      { key: "/report/history", label: "历史报告" },
    ],
  },
];

export function getMenuItems(role) {
  if (role === "admin") return adminMenuItems;
  if (role === "executive") return execMenuItems;
  return buMenuItems;
}
