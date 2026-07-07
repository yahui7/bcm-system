import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

export default function Strategies() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    api.get("/bcp/strategies").then((r) => setData(r.data.strategies || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await api.put(`/bcp/strategies/${editingId}`, values);
    } else {
      await api.post("/bcp/strategies", values);
    }
    message.success(editingId ? "更新成功" : "添加成功");
    setModalOpen(false); setEditingId(null); form.resetFields();
    fetch();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>恢复策略库维护</h2>
        <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }}
          onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }}>添加策略</Button>
      </div>
      <div className="bcm-card">
        <Table columns={[
          { title: "策略名称", dataIndex: "name" },
          { title: "类型", dataIndex: "strategy_type", render: (v) => <Tag color={v === "preventive" ? "blue" : "orange"}>{v === "preventive" ? "预防" : "恢复"}</Tag> },
          { title: "适用资源", dataIndex: "resource_type" },
          { title: "描述", dataIndex: "description", ellipsis: true },
          { title: "操作", render: (_, r) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue(r); setModalOpen(true); }}>编辑</Button>
                <Popconfirm title="确定删除？" onConfirm={() => api.delete(`/bcp/strategies/${r.id}`).then(fetch)}>
                  <Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
              </Space>
            )},
        ]} dataSource={data} rowKey="id" loading={loading} />
      </div>
      <Modal title={editingId ? "编辑策略" : "添加策略"} open={modalOpen} onOk={handleSubmit} onCancel={() => { setModalOpen(false); setEditingId(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="策略名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="strategy_type" label="策略类型" rules={[{ required: true }]}>
            <Select options={[{ label: "预防策略", value: "preventive" }, { label: "恢复策略", value: "recovery" }]} /></Form.Item>
          <Form.Item name="resource_type" label="适用资源类型"><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
