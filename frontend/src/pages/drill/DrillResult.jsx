import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, Radio, Tag, message } from "antd";
import { FileWordOutlined, CheckCircleOutlined } from "@ant-design/icons";
import api from "../../api";

export default function DrillResult() {
  const [plans, setPlans] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get("/drill/plans"),
      api.get("/drill/results"),
    ]).then(([r1, r2]) => {
      setPlans(r1.data.plans || []);
      setResults(r2.data.results || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const getResultByPlan = (planId) => results.find((r) => r.plan_id === planId);

  const columns = [
    { title: "业务", dataIndex: "business_name", key: "biz" },
    { title: "演练日期", dataIndex: "drill_date", key: "date" },
    { title: "类型", dataIndex: "drill_type", key: "type", render: (v) => <Tag>{v}</Tag> },
    { title: "状态", dataIndex: "status", key: "status", render: (v) => <Tag color={v === "已完成" ? "green" : "default"}>{v}</Tag> },
    { title: "结果", key: "result", render: (_, r) => {
        const res = getResultByPlan(r.id);
        return res ? <Tag color={res.passed ? "green" : "red"}>{res.passed ? "✅ 通过" : "❌ 失败"}</Tag> : <Tag>未记录</Tag>;
      }},
    { title: "操作", key: "action", render: (_, r) => (
        <Button size="small" icon={<CheckCircleOutlined />} onClick={() => { setSelectedPlan(r.id); form.resetFields(); setModalOpen(true); }}>
          记录结果
        </Button>
      ),
    },
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await api.post(`/drill/plans/${selectedPlan}/result`, values);
    message.success("演练结果已记录");
    setModalOpen(false);
    fetchData();
  };

  const exportWord = (planId) => {
    window.open(`/api/drill/plans/${planId}/export`, "_blank");
  };

  return (
    <div>
      <h2 className="page-title">演练结果</h2>
      <div className="bcm-card">
        <Table columns={columns} dataSource={plans} rowKey="id" loading={loading} />
      </div>
      {results.length > 0 && (
        <div className="bcm-card" style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>已完成演练记录</h4>
          <Table dataSource={results} rowKey="id" size="small" pagination={false}
            columns={[
              { title: "计划ID", dataIndex: "plan_id" },
              { title: "通过", dataIndex: "passed", render: (v) => v ? "✅" : "❌" },
              { title: "失败原因", dataIndex: "failure_reason" },
              { title: "实际恢复时间", dataIndex: "actual_recovery_time" },
              { title: "操作", render: (_, r) => <Button size="small" icon={<FileWordOutlined />} onClick={() => exportWord(r.plan_id)}>导出报告</Button> },
            ]} />
        </div>
      )}
      <Modal title="记录演练结果" open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="passed" label="演练结果" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={1}>✅ 通过</Radio>
              <Radio value={0}>❌ 失败</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="failure_reason" label="失败原因（如通过可不填）"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="actual_recovery_time" label="实际恢复时间"><Input placeholder="如：12分钟" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
