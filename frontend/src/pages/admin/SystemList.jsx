import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Popconfirm, message, Space } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

export default function SystemList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    api.get("/risk/systems").then((r) => setData(r.data.systems || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await api.put(`/risk/systems/${editingId}`, values);
    } else {
      await api.post("/risk/systems", values);
    }
    message.success(editingId ? "更新成功" : "添加成功");
    setModalOpen(false); setEditingId(null); form.resetFields();
    fetch();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>系统清单维护</h2>
        <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }}
          onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }}>添加系统</Button>
      </div>
      <div className="bcm-card">
        <Table columns={[
          { title: "系统名称", dataIndex: "name" },
          { title: "负责人", dataIndex: "owner" },
          { title: "RTO", dataIndex: "rto" },
          { title: "RPO", dataIndex: "rpo" },
          { title: "类型", dataIndex: "app_type" },
          { title: "操作", render: (_, r) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue(r); setModalOpen(true); }}>编辑</Button>
                <Popconfirm title="确定删除？" onConfirm={() => api.delete(`/risk/systems/${r.id}`).then(fetch)}>
                  <Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
              </Space>
            )},
        ]} dataSource={data} rowKey="id" loading={loading} />
      </div>
      <Modal title={editingId ? "编辑系统" : "添加系统"} open={modalOpen} onOk={handleSubmit} onCancel={() => { setModalOpen(false); setEditingId(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="系统名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="owner" label="负责人"><Input /></Form.Item>
          <Form.Item name="rto" label="RTO"><Input placeholder="如：< 4小时" /></Form.Item>
          <Form.Item name="rpo" label="RPO"><Input placeholder="如：< 24小时" /></Form.Item>
          <Form.Item name="app_type" label="应用类型"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
