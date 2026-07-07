import { useEffect, useState, useRef } from "react";
import { Row, Col, Card, Timeline, Tag, Spin } from "antd";
import {
  BankOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import api from "../api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const role = localStorage.getItem("bcm_role") || "admin";
  const barRef = useRef(null);
  const pieRef = useRef(null);

  useEffect(() => {
    api.get("/dashboard/overview").then((res) => {
      setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data || loading) return;

    const echarts = window.echarts;
    if (!echarts) return;

    // 柱状图
    if (barRef.current) {
      const barChart = echarts.init(barRef.current);
      barChart.setOption({
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: data.chart?.names || [] },
        yAxis: { type: "value" },
        series: [
          { name: "BIA 完成", type: "bar", data: data.chart?.bia || [], itemStyle: { color: "#4a90d9" } },
          { name: "BCP 完成", type: "bar", data: data.chart?.bcp || [], itemStyle: { color: "#52c41a" } },
        ],
        grid: { left: 40, right: 20, top: 20, bottom: 30 },
      });
      const handleResize = () => barChart.resize();
      window.addEventListener("resize", handleResize);
      barChart._resizeHandler = handleResize;
    }

    // 饼图
    if (pieRef.current) {
      const pieChart = echarts.init(pieRef.current);
      pieChart.setOption({
        tooltip: { trigger: "item" },
        series: [{
          type: "pie", radius: ["40%", "70%"],
          data: data.pie || [],
          label: { formatter: "{b}: {c}" },
        }],
      });
      const handleResize = () => pieChart.resize();
      window.addEventListener("resize", handleResize);
      pieChart._resizeHandler = handleResize;
    }

    return () => {
      // cleanup listeners handled by window
    };
  }, [data, loading]);

  if (loading) return <Spin size="large" style={{ display: "block", margin: "120px auto" }} />;

  const stats = data?.stats || { businesses: 0, critical: 0, bcp_rate: 0, drill_rate: 0, issue_count: 0 };

  const scoreCards = [
    { label: "业务总数", value: stats.businesses, icon: <BankOutlined />, cls: "high" },
    { label: "重要业务", value: stats.critical, icon: <AlertOutlined />, cls: "mid" },
    { label: "BCP 覆盖率", value: `${stats.bcp_rate}%`, icon: <SafetyCertificateOutlined />, cls: stats.bcp_rate >= 80 ? "high" : "mid" },
    { label: "演练完成率", value: `${stats.drill_rate}%`, icon: <CheckCircleOutlined />, cls: stats.drill_rate >= 80 ? "high" : "mid" },
    { label: "待整改问题", value: stats.issue_count, icon: <ExclamationCircleOutlined />, cls: stats.issue_count === 0 ? "high" : "low" },
  ];

  return (
    <div>
      <h2 className="page-title">
        {role === "executive" ? "全行 BCM 健康度总览" : role === "admin" ? "BCM 管理 Dashboard" : "我的 BCM Dashboard"}
      </h2>

      <div className="score-row">
        {scoreCards.map((s, i) => (
          <div key={i} className={`score-card ${s.cls}`}>
            <div className="label">{s.icon} {s.label}</div>
            <div className="value">{s.value}</div>
            <div className="bar"><div className="fill" style={{ width: "60%" }} /></div>
          </div>
        ))}
      </div>

      <Row gutter={20}>
        <Col span={14}>
          <div className="chart-panel">
            <h3>各业务 BCM 进度</h3>
            <div ref={barRef} style={{ width: "100%", height: 360 }} />
          </div>
        </Col>
        <Col span={10}>
          <div className="chart-panel">
            <h3>风险类别分布</h3>
            <div ref={pieRef} style={{ width: "100%", height: 360 }} />
          </div>
        </Col>
      </Row>

      <Card title="近期风险事件" style={{ marginTop: 20 }}>
        <Timeline items={(data?.events || []).map((e) => ({
          children: (
            <div key={e.id}>
              <Tag color={e.category === "网络攻击" ? "red" : e.category === "系统变更" ? "orange" : "blue"}>{e.category}</Tag>
              <span style={{ marginLeft: 8, fontWeight: 600 }}>{e.title}</span>
              <div style={{ color: "#999", fontSize: "0.8rem", marginTop: 4 }}>{e.event_date} · {(e.description || "").substring(0, 60)}...</div>
            </div>
          ),
        }))} />
      </Card>
    </div>
  );
}
