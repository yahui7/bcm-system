import { useState, useEffect } from "react";
import { Select, Button, Table, Tag, Card, Form, Input, Row, Col, message, Spin, Collapse } from "antd";
import { FileWordOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export default function StrategyForm() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [resources, setResources] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [bcps, setBcps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/bia/businesses").then((r) => setBusinesses(r.data.businesses || []));
    api.get("/bcp/strategies").then((r) => setStrategies(r.data.strategies || []));
  }, []);

  const loadData = (bizId) => {
    setSelectedBiz(bizId);
    setLoading(true);
    Promise.all([
      api.get(`/risk/businesses/${bizId}/resources`),
      api.get(`/bcp/businesses/${bizId}/plans`),
    ]).then(([resR, resP]) => {
      setResources(resR.data.resources || []);
      setBcps(resP.data.plans || []);
    }).finally(() => setLoading(false));
  };

  const generateBCP = async () => {
    if (!selectedBiz) return message.warning("请先选择业务");
    if (resources.length === 0) return message.warning("该业务没有资源，请先在 RA 模块添加资源");
    setGenerating(true);
    const r = await api.post(`/bcp/businesses/${selectedBiz}/plans`, {});
    setGenerating(false);
    message.success("BCP 已生成！");
    navigate(`/bcp/${r.data.bcp_id}`);
  };

  const bcpColumns = [
    { title: "BCP 名称", dataIndex: "plan_name", key: "name" },
    { title: "状态", dataIndex: "status", key: "status", render: (v) => <Tag color={v === "published" ? "green" : "blue"}>{v === "published" ? "已发布" : "草稿"}</Tag> },
    { title: "更新时间", dataIndex: "updated_at", key: "time" },
    {
      title: "操作", key: "action",
      render: (_, r) => (
        <Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate(`/bcp/${r.id}`)}>查看详情</Button>
      ),
    },
  ];

  return (
    <div>
      <h2 className="page-title">BCP 业务连续性计划</h2>
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8, fontWeight: 600 }}>选择业务：</span>
        <Select style={{ width: 300 }} placeholder="选择一个业务" onChange={loadData}
          options={businesses.map((b) => ({ label: b.name, value: b.id }))} />
      </div>

      {loading ? <Spin /> : selectedBiz && (
        <>
          {resources.length > 0 && bcps.length === 0 && (
            <Card style={{ marginBottom: 20, textAlign: "center" }}>
              <p style={{ color: "#888", marginBottom: 16 }}>
                该业务有 {resources.length} 个关键资源，可以基于风险场景和策略库自动生成 BCP
              </p>
              <Button type="primary" size="large" loading={generating} style={{ background: "#1a1f3a" }}
                icon={<FileWordOutlined />} onClick={generateBCP}>
                自动生成 BCP
              </Button>
            </Card>
          )}

          {bcps.length > 0 && (
            <div className="bcm-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <h4>已有 BCP 计划</h4>
                <Button icon={<FileWordOutlined />} style={{ background: "#1a1f3a", color: "#fff" }} onClick={generateBCP} loading={generating}>生成新 BCP</Button>
              </div>
              <Table columns={bcpColumns} dataSource={bcps} rowKey="id" />
            </div>
          )}

          <div className="bcm-card">
            <h4 style={{ marginBottom: 12 }}>可用恢复策略（策略库）</h4>
            <Table dataSource={strategies} rowKey="id" size="small" pagination={false}
              columns={[
                { title: "策略名称", dataIndex: "name" },
                { title: "类型", dataIndex: "strategy_type", render: (v) => <Tag color={v === "preventive" ? "blue" : "orange"}>{v === "preventive" ? "预防策略" : "恢复策略"}</Tag> },
                { title: "适用资源", dataIndex: "resource_type" },
                { title: "描述", dataIndex: "description" },
              ]} />
          </div>
        </>
      )}
    </div>
  );
}
