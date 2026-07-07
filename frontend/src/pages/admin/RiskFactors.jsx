import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, InputNumber, Popconfirm, message, Space, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

export default function RiskFactors() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    api.get("/risk/factors").then((r) => setData(r.data.factors || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await api.put(`/risk/factors/${editingId}`, values);
    } else {
      await api.post("/risk/factors", values);
    }
    message.success(editingId ? "更新成功" : "添加成功");
    setModalOpen(false); setEditingId(null); form.resetFields();
    fetch();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>风险评估因子维护</h2>
        <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }}
          onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }}>添加因子</Button>
      </div>
      <div className="bcm-card">
        <Table columns={[
          { title: "因子名称", dataIndex: "name" },
          { title: "类型", dataIndex: "factor_type", render: (v) => <Tag color={v === "threat" ? "red" : "blue"}>{v === "threat" ? "威胁" : "脆弱性"}</Tag> },
          { title: "排序", dataIndex: "sort_order" },
          { title: "操作", render: (_, r) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue(r); setModalOpen(true); }}>编辑</Button>
                <Popconfirm title="确定删除？" onConfirm={() => api.delete(`/risk/factors/${r.id}`).then(fetch)}>
                  <Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
              </Space>
            )},
        ]} dataSource={data} rowKey="id" loading={loading} />
      </div>
      <Modal title={editingId ? "编辑因子" : "添加因子"} open={modalOpen} onOk={handleSubmit} onCancel={() => { setModalOpen(false); setEditingId(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="因子名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="factor_type" label="类型" rules={[{ required: true }]}>
            <Select options={[{ label: "威胁", value: "threat" }, { label: "脆弱性", value: "vulnerability" }]} /></Form.Item>
          <Form.Item name="sort_order" label="排序"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
