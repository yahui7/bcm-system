import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, DatePicker, Popconfirm, message, Space, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api";

export default function DrillPlan() {
  const [data, setData] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    api.get("/drill/plans").then((r) => setData(r.data.plans || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    api.get("/bia/businesses").then((r) => setBusinesses(r.data.businesses || []));
  }, []);

  const columns = [
    { title: "业务名称", dataIndex: "business_name", key: "biz" },
    { title: "演练日期", dataIndex: "drill_date", key: "date" },
    { title: "演练类型", dataIndex: "drill_type", key: "type", render: (v) => <Tag>{v}</Tag> },
    { title: "参与人员", dataIndex: "participants", key: "ppl" },
    { title: "状态", dataIndex: "status", key: "status", render: (v) => <Tag color={v === "已完成" ? "green" : v === "进行中" ? "blue" : "default"}>{v}</Tag> },
    { title: "操作", render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(r.id); form.setFieldsValue({ ...r, drill_date: r.drill_date ? dayjs(r.drill_date) : null }); setModalOpen(true); }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => api.delete(`/drill/plans/${r.id}`).then(fetchData)}>
            <Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (values.drill_date) values.drill_date = values.drill_date.format("YYYY-MM-DD");
    if (editingId) {
      await api.put(`/drill/plans/${editingId}`, values);
    } else {
      await api.post("/drill/plans", values);
    }
    message.success(editingId ? "更新成功" : "创建成功");
    setModalOpen(false); setEditingId(null); form.resetFields();
    fetchData();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>演练计划</h2>
        <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }}
          onClick={() => { setEditingId(null); form.resetFields(); setModalOpen(true); }}>制定演练计划</Button>
      </div>
      <div className="bcm-card">
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </div>
      <Modal title={editingId ? "编辑演练计划" : "制定演练计划"} open={modalOpen} onOk={handleSubmit} onCancel={() => { setModalOpen(false); setEditingId(null); }}>
        <Form form={form} layout="vertical">
          <Form.Item name="business_id" label="业务" rules={[{ required: true }]}>
            <Select options={businesses.map((b) => ({ label: b.name, value: b.id }))} /></Form.Item>
          <Form.Item name="drill_date" label="演练日期" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="drill_type" label="演练类型" rules={[{ required: true }]}>
            <Select options={[{ label: "桌面推演", value: "桌面推演" }, { label: "实战演练", value: "实战演练" }, { label: "通讯演练", value: "通讯演练" }]} /></Form.Item>
          <Form.Item name="participants" label="参与人员"><Input /></Form.Item>
          <Form.Item name="objective" label="预期目标"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
