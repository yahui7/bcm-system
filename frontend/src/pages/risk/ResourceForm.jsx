import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space, Tag, Tabs } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

const RESOURCE_TYPES = ["应用系统", "硬件设备", "数据", "人员", "第三方服务", "场地设施"];

export default function ResourceForm() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("应用系统");
  const [showInst, setShowInst] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => { api.get("/bia/businesses").then((r) => setBusinesses(r.data.businesses || [])); }, []);

  const loadResources = (bizId) => {
    setSelectedBiz(bizId);
    setLoading(true);
    api.get(`/risk/businesses/${bizId}/resources`).then((r) => setResources(r.data.resources || [])).finally(() => setLoading(false));
  };

  const filtered = resources.filter((r) => r.resource_type === activeTab);

  const columns = [
    { title: "资源名称", dataIndex: "name", key: "name" },
    { title: "重要程度", dataIndex: "importance", key: "importance", render: (v) => <Tag color={v === "high" ? "red" : v === "medium" ? "orange" : "green"}>{v === "high" ? "高" : v === "medium" ? "中" : "低"}</Tag> },
    { title: "RTO", dataIndex: "rto", key: "rto" },
    { title: "RPO", dataIndex: "rpo", key: "rpo" },
    { title: "操作", render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue(r); setModalOpen(true); }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => api.delete(`/risk/resources/${r.id}`).then(() => loadResources(selectedBiz))}>
            <Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    values.resource_type = activeTab;
    if (editingId) {
      await api.put(`/risk/resources/${editingId}`, values);
    } else {
      await api.post(`/risk/businesses/${selectedBiz}/resources`, values);
    }
    message.success(editingId ? "更新成功" : "添加成功");
    setModalOpen(false); setEditingId(null); form.resetFields();
    loadResources(selectedBiz);
  };

  return (
    <div>
      <h2 className="page-title">资源识别（6 大类）</h2>

      <div className="bcm-card" style={{ background: "#fafbff", border: "1px solid #e6f0ff", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: showInst ? 10 : 0, color: "#1a1f3a", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 8 }} onClick={() => setShowInst(!showInst)}>
          <span style={{ fontSize: "0.65rem", color: "#bbb", transition: "transform 0.2s", transform: showInst ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
          📋 填写说明
        </div>
        {showInst && <div style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.8 }}>
          <p>本页识别支撑业务运行所需的 <strong>6 类关键资源</strong>，是风险评估的基础。</p>
          <p style={{ marginTop: 8 }}><strong>6 类资源说明：</strong></p>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}>
            <thead>
              <tr style={{ background: "#f0f5ff" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e6f0ff", width: 120 }}>资源类别</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e6f0ff", width: "45%" }}>包含内容</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e6f0ff", width: "45%" }}>填写示例</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", fontWeight: 600 }}>应用系统</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0" }}>支撑业务运行的关键 IT 系统、软件平台</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", color: "#888" }}>核心银行系统、手机银行APP、支付系统</td></tr>
              <tr><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", fontWeight: 600 }}>硬件设备</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0" }}>服务器、网络设备、办公终端、ATM 等物理设备</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", color: "#888" }}>核心数据库服务器、柜面终端、ATM自助设备</td></tr>
              <tr><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", fontWeight: 600 }}>数据</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0" }}>业务单据、凭证、客户资料、交易记录、电子文档</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", color: "#888" }}>客户账户数据库、交易流水、合同档案</td></tr>
              <tr><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", fontWeight: 600 }}>人员</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0" }}>关键岗位人员配置、技能要求、储备人员</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", color: "#888" }}>零售业务运营团队（5人，含1名主管）</td></tr>
              <tr><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", fontWeight: 600 }}>第三方服务</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0" }}>外部供应商、外包服务商、云服务提供商</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", color: "#888" }}>短信通知服务商、银联支付通道</td></tr>
              <tr><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", fontWeight: 600 }}>场地设施</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0" }}>办公场所、营业网点、数据中心机房</td><td style={{ padding: "6px 12px", border: "1px solid #f0f0f0", color: "#888" }}>总行营业部、数据中心A机房</td></tr>
            </tbody>
          </table>
          <p style={{ marginTop: 10 }}>
            <strong>填写要点：</strong><br />
            · 仅填写对业务运行必不可少的关键资源，非关键资源无需录入<br />
            · <strong>重要程度：</strong>高=业务严重依赖，资源损毁则业务无法办理；中=影响业务效率；低=轻微依赖<br />
            · <strong>RTO（恢复时间目标）：</strong>该资源允许的最大中断时长，如"{"< 4小时"}""{"< 24小时"}"<br />
            · <strong>RPO（恢复点目标）：</strong>该资源允许的最大数据丢失时长，如"Near-Zero""{"< 4小时"}"<br />
            · 每个资源类别独立填写，切换上方 Tab 页签即可
          </p>
        </div>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8, fontWeight: 600 }}>选择业务：</span>
        <Select style={{ width: 300 }} placeholder="选择一个业务" onChange={loadResources}
          options={businesses.map((b) => ({ label: b.name, value: b.id }))} />
      </div>
      {selectedBiz && (
        <div className="bcm-card">
          <div style={{ marginBottom: 16 }}>
            <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }}
              onClick={() => { setEditingId(null); form.resetFields(); form.setFieldsValue({ resource_type: activeTab }); setModalOpen(true); }}>添加资源</Button>
          </div>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={RESOURCE_TYPES.map((t) => ({
            key: t, label: `${t}（${resources.filter((r) => r.resource_type === t).length}）`,
            children: <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} size="small" />,
          }))} />
        </div>
      )}
      <Modal title={editingId ? "编辑资源" : "添加资源"} open={modalOpen} onOk={handleSubmit} onCancel={() => { setModalOpen(false); setEditingId(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="资源名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="importance" label="重要程度" rules={[{ required: true }]}>
            <Select options={[{ label: "高", value: "high" }, { label: "中", value: "medium" }, { label: "低", value: "low" }]} /></Form.Item>
          <Form.Item name="rto" label="RTO（恢复时间目标）"><Input placeholder="如：< 4小时" /></Form.Item>
          <Form.Item name="rpo" label="RPO（恢复点目标）"><Input placeholder="如：< 24小时" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
