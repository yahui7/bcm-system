import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import MainLayout from "./layouts/MainLayout";

// 页面导入
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import BusinessInfo from "./pages/bia/BusinessInfo";
import BusinessScoring from "./pages/bia/BusinessScoring";
import Dependencies from "./pages/bia/Dependencies";
import ResourceForm from "./pages/risk/ResourceForm";
import RiskAssessment from "./pages/risk/RiskAssessment";
import StrategyForm from "./pages/bcp/StrategyForm";
import BCPDetail from "./pages/bcp/BCPDetail";
import DrillPlan from "./pages/drill/DrillPlan";
import DrillResult from "./pages/drill/DrillResult";
import RiskEvents from "./pages/maintenance/RiskEvents";
import Issues from "./pages/maintenance/Issues";
import BusinessList from "./pages/admin/BusinessList";
import BIAFactors from "./pages/admin/BIAFactors";
import RiskFactors from "./pages/admin/RiskFactors";
import SystemList from "./pages/admin/SystemList";
import Strategies from "./pages/admin/Strategies";
import ReportTemplates from "./pages/report/ReportTemplates";
import ReportGenerate from "./pages/report/ReportGenerate";
import ReportHistory from "./pages/report/ReportHistory";

// Ant Design 金融主题配置
const theme = {
  token: {
    colorPrimary: "#1a1f3a",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f0f2f5",
    borderRadius: 6,
    fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
  },
  components: {
    Menu: {
      itemBg: "#ffffff",
      subMenuItemBg: "#ffffff",
      itemSelectedBg: "#fff7e6",
      itemSelectedColor: "#d46b08",
      itemHoverBg: "#fffbe6",
      itemHoverColor: "#fa8c16",
      itemActiveBg: "#fff7e6",
      subMenuItemBg: "#ffffff",
    },
    Card: {
      borderRadiusLG: 10,
    },
  },
};

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={<MainLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* BIA */}
            <Route path="/bia/info" element={<BusinessInfo />} />
            <Route path="/bia/scoring" element={<BusinessScoring />} />
            <Route path="/bia/dependencies" element={<Dependencies />} />

            {/* RA */}
            <Route path="/risk/resources" element={<ResourceForm />} />
            <Route path="/risk/assessment" element={<RiskAssessment />} />

            {/* BCP */}
            <Route path="/bcp" element={<StrategyForm />} />
            <Route path="/bcp/:id" element={<BCPDetail />} />

            {/* 演练 */}
            <Route path="/drill/plan" element={<DrillPlan />} />
            <Route path="/drill/result" element={<DrillResult />} />

            {/* 维护改进 */}
            <Route path="/maintenance/events" element={<RiskEvents />} />
            <Route path="/maintenance/issues" element={<Issues />} />

            {/* 报告管理 */}
            <Route path="/report/templates" element={<ReportTemplates />} />
            <Route path="/report/generate" element={<ReportGenerate />} />
            <Route path="/report/history" element={<ReportHistory />} />

            {/* 管理员 */}
            <Route path="/admin/businesses" element={<BusinessList />} />
            <Route path="/admin/bia-factors" element={<BIAFactors />} />
            <Route path="/admin/risk-factors" element={<RiskFactors />} />
            <Route path="/admin/systems" element={<SystemList />} />
            <Route path="/admin/strategies" element={<Strategies />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
