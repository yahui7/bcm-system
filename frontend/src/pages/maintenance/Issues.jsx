import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

const STATUS_MAP = { "待解决": "red", "进行中": "orange", "已解决": "green" };

export default function Issues() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    api.get("/maintenance/issues").then((r) => setData(r.data.issues || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const advanceStatus = async (record) => {
    const next = record.status === "待解决" ? "进行中" : record.status === "进行中" ? "已解决" : "待解决";
    await api.put(`/maintenance/issues/${record.id}`, { status: next });
    message.success(`状态已更新为「${next}」`);
    fetchData();
  };

  const columns = [
    { title: "问题描述", dataIndex: "description", key: "desc", ellipsis: true },
    { title: "负责人", dataIndex: "assignee", key: "assignee", width: 100 },
    { title: "状态", dataIndex: "status", key: "status", width: 100, render: (v) => <Tag color={STATUS_MAP[v]}>{v}</Tag> },
    { title: "改进方案", dataIndex: "solution", key: "solution", ellipsis: true },
    { title: "操作", width: 180, key: "action", render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => advanceStatus(r)}>
            {r.status === "待解决" ? "→ 进行中" : r.status === "进行中" ? "→ 已解决" : "↩ 重新打开"}
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue(r); setModalOpen(true); }} />
          <Popconfirm title="确定删除？" onConfirm={() => api.delete(`/maintenance/issues/${r.id}`).then(fetchData)}>
            <Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await api.put(`/maintenance/issues/${editingId}`, values);
    } else {
      await api.post("/maintenance/issues", values);
    }
    message.success(editingId ? "更新成功" : "创建成功");
    setModalOpen(false); setEditingId(null); form.resetFields();
    fetchData();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>问题管理</h2>
        <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }}
          onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }}>创建问题</Button>
      </div>
      <div className="bcm-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </div>
      <Modal title={editingId ? "编辑问题" : "创建问题"} open={modalOpen} onOk={handleSubmit} onCancel={() => { setModalOpen(false); setEditingId(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="description" label="问题描述" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="assignee" label="负责人"><Input /></Form.Item>
          <Form.Item name="solution" label="改进方案"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ label: "待解决", value: "待解决" }, { label: "进行中", value: "进行中" }, { label: "已解决", value: "已解决" }]} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
