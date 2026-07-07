import { useState, useEffect } from "react";
import { Select, Table, Button, Modal, Form, Popconfirm, message, Tag, Space } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../api";

export default function Dependencies() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [deps, setDeps] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { api.get("/bia/businesses").then((r) => setBusinesses(r.data.businesses || [])); }, []);

  const loadDeps = async (bizId) => {
    setSelectedBiz(bizId);
    const r = await api.get(`/bia/businesses/${bizId}/dependencies`);
    setDeps(r.data.dependencies || []);
  };

  const columns = [
    { title: "关联业务", dataIndex: "related_name", key: "related_name" },
    { title: "依赖类型", dataIndex: "dependency_type", key: "type", render: (v) => <Tag color={v === "upstream" ? "blue" : "green"}>{v === "upstream" ? "上游（我依赖它）" : "下游（它依赖我）"}</Tag> },
    { title: "说明", dataIndex: "description", key: "desc" },
    { title: "操作", render: (_, r) => <Popconfirm title="确定删除？" onConfirm={() => api.delete(`/bia/dependencies/${r.id}`).then(() => loadDeps(selectedBiz))}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm> },
  ];

  const handleAdd = async () => {
    const values = await form.validateFields();
    await api.post(`/bia/businesses/${selectedBiz}/dependencies`, values);
    message.success("添加成功");
    setModalOpen(false);
    form.resetFields();
    loadDeps(selectedBiz);
  };

  const otherBiz = businesses.filter((b) => b.id !== selectedBiz);

  return (
    <div>
      <h2 className="page-title">业务上下游关系</h2>
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8, fontWeight: 600 }}>选择业务：</span>
        <Select style={{ width: 300 }} placeholder="选择一个业务" onChange={loadDeps}
          options={businesses.map((b) => ({ label: b.name, value: b.id }))} />
      </div>
      {selectedBiz && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }} onClick={() => setModalOpen(true)}>添加依赖关系</Button>
          </div>
          <div className="bcm-card">
            <Table columns={columns} dataSource={deps} rowKey="id" />
          </div>
        </>
      )}
      <Modal title="添加依赖关系" open={modalOpen} onOk={handleAdd} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="related_business_id" label="关联业务" rules={[{ required: true }]}>
            <Select options={otherBiz.map((b) => ({ label: b.name, value: b.id }))} />
          </Form.Item>
          <Form.Item name="dependency_type" label="依赖类型" rules={[{ required: true }]}>
            <Select options={[{ label: "上游（我依赖它）", value: "upstream" }, { label: "下游（它依赖我）", value: "downstream" }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
