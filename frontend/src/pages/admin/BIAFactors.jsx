import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, Popconfirm, message, Space } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

export default function BIAFactors() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetch = () => {
    setLoading(true);
    api.get("/bia/factors").then((r) => setData(r.data.factors || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await api.put(`/bia/factors/${editingId}`, values);
    } else {
      await api.post("/bia/factors", values);
    }
    message.success(editingId ? "更新成功" : "添加成功");
    setModalOpen(false); setEditingId(null); form.resetFields();
    fetch();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>BIA 评估因子维护</h2>
        <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }}
          onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }}>添加因子</Button>
      </div>
      <div className="bcm-card">
        <Table columns={[
          { title: "因子名称", dataIndex: "name" },
          { title: "维度", dataIndex: "dimension" },
          { title: "权重", dataIndex: "weight" },
          { title: "排序", dataIndex: "sort_order" },
          { title: "操作", render: (_, r) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue(r); setModalOpen(true); }}>编辑</Button>
                <Popconfirm title="确定删除？" onConfirm={() => api.delete(`/bia/factors/${r.id}`).then(fetch)}>
                  <Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
              </Space>
            )},
        ]} dataSource={data} rowKey="id" loading={loading} />
      </div>
      <Modal title={editingId ? "编辑因子" : "添加因子"} open={modalOpen} onOk={handleSubmit} onCancel={() => { setModalOpen(false); setEditingId(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="因子名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="dimension" label="维度"><Input /></Form.Item>
          <Form.Item name="weight" label="权重"><InputNumber min={0} max={1} step={0.05} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="sort_order" label="排序"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
