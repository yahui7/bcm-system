import { useState, useEffect, useRef } from "react";
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, message, Row, Col } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

const CATEGORIES = ["网络攻击", "系统故障", "电力中断", "火灾", "恶劣天气", "恐怖袭击", "网络中断", "硬件故障", "系统变更"];

export default function RiskEvents() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const pieRef = useRef(null);

  const fetchData = () => {
    setLoading(true);
    api.get("/maintenance/events").then((r) => setData(r.data.events || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (data.length === 0 || !pieRef.current) return;
    const echarts = window.echarts;
    if (!echarts) return;

    const catCount = {};
    data.forEach((e) => { catCount[e.category] = (catCount[e.category] || 0) + 1; });
    const pieData = Object.entries(catCount).map(([name, value]) => ({ name, value }));

    const chart = echarts.init(pieRef.current);
    chart.setOption({
      tooltip: { trigger: "item" },
      series: [{ type: "pie", radius: "60%", data: pieData, label: { formatter: "{b}: {c}" } }],
    });
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data]);

  const columns = [
    { title: "发生时间", dataIndex: "event_date", key: "date", width: 110 },
    { title: "标题", dataIndex: "title", key: "title" },
    { title: "类别", dataIndex: "category", key: "cat", render: (v) => <Tag color={v === "网络攻击" ? "red" : v === "系统变更" ? "orange" : "blue"}>{v}</Tag> },
    { title: "描述", dataIndex: "description", key: "desc", render: (v) => (v || "").substring(0, 80) + "..." },
    { title: "操作", width: 120, render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue(r); setModalOpen(true); }} />
          <Popconfirm title="确定删除？" onConfirm={() => api.delete(`/maintenance/events/${r.id}`).then(fetchData)}>
            <Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await api.put(`/maintenance/events/${editingId}`, values);
    } else {
      await api.post("/maintenance/events", values);
    }
    message.success(editingId ? "更新成功" : "录入成功");
    setModalOpen(false); setEditingId(null); form.resetFields();
    fetchData();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>风险事件管理</h2>
        <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }}
          onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }}>录入风险事件</Button>
      </div>

      <Row gutter={20}>
        <Col span={16}>
          <div className="bcm-card">
            <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="small" />
          </div>
        </Col>
        <Col span={8}>
          {data.length > 0 && (
            <div className="chart-panel">
              <h4>事件类别分布</h4>
              <div ref={pieRef} style={{ width: "100%", height: 260 }} />
            </div>
          )}
        </Col>
      </Row>

      <Modal title={editingId ? "编辑风险事件" : "录入风险事件"} open={modalOpen} onOk={handleSubmit} onCancel={() => { setModalOpen(false); setEditingId(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="事件标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="event_date" label="发生时间"><Input placeholder="如：2023-11-08" /></Form.Item>
          <Form.Item name="category" label="事件类别">
            <Select options={CATEGORIES.map((c) => ({ label: c, value: c }))} /></Form.Item>
          <Form.Item name="description" label="事件描述"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="source_url" label="来源链接"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
