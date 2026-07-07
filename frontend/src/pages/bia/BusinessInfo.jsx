import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

export default function BusinessInfo() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    api.get("/bia/businesses").then((res) => setData(res.data.businesses || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const tierColor = (t) => t === "Tier 1" ? "red" : t === "Tier 2" ? "orange" : t === "Tier 3" ? "green" : "default";
  const tierLabel = (t) => t === "Tier 1" ? "Tier 1 · 关键" : t === "Tier 2" ? "Tier 2 · 重要" : t === "Tier 3" ? "Tier 3 · 一般" : "未评级";

  const columns = [
    { title: "业务名称", dataIndex: "name", key: "name", width: 100 },
    { title: "业务描述", dataIndex: "description", key: "desc", width: 350 },
    { title: "负责部门", dataIndex: "department", key: "department", width: 100 },
    { title: "负责人", dataIndex: "owner", key: "owner", width: 100 },
    { title: "BCM联络人", dataIndex: "bcm_contact", key: "bcm_contact", width: 100 },
    { title: "BIA等级（上次评估）", dataIndex: "bia_tier", key: "tier", width: 150, render: (v) => v ? <Tag color={tierColor(v)}>{tierLabel(v)}</Tag> : <Tag>未评级</Tag> },
    {
      title: "操作", key: "action", width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(record.id); form.setFieldsValue(record); setModalOpen(true); }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => api.delete(`/bia/businesses/${record.id}`).then(fetchData)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await api.put(`/bia/businesses/${editingId}`, values);
    } else {
      await api.post("/bia/businesses", values);
    }
    message.success(editingId ? "更新成功" : "创建成功");
    setModalOpen(false);
    setEditingId(null);
    form.resetFields();
    fetchData();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>业务基础信息</h2>
        <Button type="primary" icon={<PlusOutlined />} style={{ background: "#1a1f3a" }}
          onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }}>新增业务</Button>
      </div>
      <div className="bcm-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1000 }} />
      </div>
      <Modal title={editingId ? "编辑业务" : "新增业务"} open={modalOpen} onOk={handleSubmit} onCancel={() => { setModalOpen(false); setEditingId(null); }} width={520}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="业务名称" rules={[{ required: true, message: "请输入业务名称" }]}><Input /></Form.Item>
          <Form.Item name="department" label="负责部门"><Input /></Form.Item>
          <Form.Item name="owner" label="负责人"><Input /></Form.Item>
          <Form.Item name="bcm_contact" label="BCM联络人"><Input /></Form.Item>
          <Form.Item name="description" label="业务描述"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
