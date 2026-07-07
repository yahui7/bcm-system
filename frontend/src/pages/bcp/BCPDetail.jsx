import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, Descriptions, Tag, Spin, Table, message } from "antd";
import { FileWordOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import api from "../../api";

export default function BCPDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bcp, setBcp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bcp/plans/${id}`).then((r) => setBcp(r.data.bcp)).finally(() => setLoading(false));
  }, [id]);

  const exportWord = () => {
    window.open(`/api/bcp/plans/${id}/export`, "_blank");
    message.success("BCP Word 文档下载中...");
  };

  if (loading) return <Spin size="large" style={{ display: "block", margin: "120px auto" }} />;
  if (!bcp) return <div className="empty-state"><div className="empty-text">BCP 未找到</div></div>;

  const data = typeof bcp.bcp_json === "string" ? JSON.parse(bcp.bcp_json) : bcp.bcp_json;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/bcp")}>返回</Button>
        <Button type="primary" icon={<FileWordOutlined />} style={{ background: "#1a1f3a" }} onClick={exportWord}>导出 Word</Button>
      </div>

      <Card title={`${data.bcp_name || bcp.plan_name}（${data.version || "1.0"}）`}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="负责人">{data.plan_info?.owner}</Descriptions.Item>
          <Descriptions.Item label="部门">{data.plan_info?.department}</Descriptions.Item>
          <Descriptions.Item label="联系方式">{data.plan_info?.contact}</Descriptions.Item>
          <Descriptions.Item label="更新日期">{data.plan_info?.last_updated}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="关键业务流程" style={{ marginTop: 16 }}>
        <Table dataSource={data.critical_processes || []} rowKey="name" pagination={false} size="small"
          columns={[
            { title: "流程名称", dataIndex: "name" },
            { title: "MAD", dataIndex: "mad" },
            { title: "RTO", dataIndex: "rto" },
            { title: "RPO", dataIndex: "rpo" },
          ]} />
      </Card>

      <Card title="恢复策略" style={{ marginTop: 16 }}>
        <h4>预防策略</h4>
        <ul>{(data.preventive_strategies || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
        <h4 style={{ marginTop: 12 }}>恢复策略</h4>
        <ul>{(data.recovery_strategies || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
      </Card>

      <Card title="恢复关键人员（REP）" style={{ marginTop: 16 }}>
        <Table dataSource={data.rep || []} rowKey="name" pagination={false} size="small"
          columns={[
            { title: "姓名", dataIndex: "name" },
            { title: "角色", dataIndex: "role" },
            { title: "电话", dataIndex: "phone" },
          ]} />
      </Card>

      <Card title="备用工作场所（WAR）" style={{ marginTop: 16 }}>
        <p>{data.war_location || "—"}</p>
      </Card>

      <Card title="关键联系人" style={{ marginTop: 16 }}>
        <Table dataSource={data.contacts || []} rowKey="name" pagination={false} size="small"
          columns={[
            { title: "姓名/单位", dataIndex: "name" },
            { title: "类型", dataIndex: "type", render: (v) => <Tag>{v}</Tag> },
            { title: "电话", dataIndex: "phone" },
          ]} />
      </Card>

      <Card title="恢复行动步骤" style={{ marginTop: 16 }}>
        <Table dataSource={data.recovery_actions || []} rowKey="scenario" pagination={false} size="small"
          columns={[
            { title: "场景", dataIndex: "scenario" },
            { title: "优先级", dataIndex: "priority" },
            { title: "行动", dataIndex: "action" },
            { title: "负责人", dataIndex: "responsible" },
          ]} />
      </Card>
    </div>
  );
}
