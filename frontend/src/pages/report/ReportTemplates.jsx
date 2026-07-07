import { useState, useEffect } from "react";
import { Card, Input, Button, message, Tag, Space, Popconfirm, Select, List } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from "@ant-design/icons";
import api from "../../api";

const TEMPLATE_VARS = [
  { key: "{{公司名称}}", label: "公司名称" },
  { key: "{{评估日期}}", label: "评估日期" },
  { key: "{{编制部门}}", label: "编制部门" },
  { key: "{{业务概况}}", label: "业务概况" },
  { key: "{{评分矩阵}}", label: "评分矩阵" },
  { key: "{{等级结果}}", label: "等级结果" },
  { key: "{{依赖分析}}", label: "依赖分析" },
  { key: "{{资源统计}}", label: "资源统计" },
  { key: "{{资源清单}}", label: "资源清单" },
  { key: "{{场景总数}}", label: "场景总数" },
  { key: "{{场景分析}}", label: "场景分析" },
  { key: "{{高风险汇总}}", label: "高风险汇总" },
  { key: "{{整改建议}}", label: "整改建议" },
  { key: "{{演练基本信息}}", label: "演练基本信息" },
  { key: "{{演练过程}}", label: "演练过程" },
  { key: "{{演练结果}}", label: "演练结果" },
  { key: "{{改进建议}}", label: "改进建议" },
  { key: "{{结论}}", label: "结论" },
];

export default function ReportTemplates() {
  const [templates, setTemplates] = useState([]);
  const [editingTpl, setEditingTpl] = useState(null);
  const [editTplName, setEditTplName] = useState("");
  const [editSections, setEditSections] = useState([]);

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get("/report/templates").then((r) => setTemplates(r.data.templates || []));
  };

  const openNew = () => {
    setEditingTpl(null); setEditTplName(""); setEditSections([{ title: "", content: "" }]);
  };
  const openEdit = (tpl) => {
    if (tpl.preset) return message.warning("系统预设模板不可编辑，请先复制");
    setEditingTpl(tpl.id);
    setEditTplName(tpl.name);
    setEditSections(tpl.sections.map((s) => ({ title: s.title, content: s.content || "" })));
  };
  const addSection = () => setEditSections([...editSections, { title: "", content: "" }]);
  const removeSection = (i) => setEditSections(editSections.filter((_, idx) => idx !== i));
  const updateSection = (i, field, val) => {
    const u = [...editSections];
    u[i] = { ...u[i], [field]: val };
    setEditSections(u);
  };
  const saveTpl = async () => {
    if (!editTplName.trim()) return message.warning("请输入模板名称");
    const sections = editSections.filter((s) => s.title.trim());
    if (!sections.length) return message.warning("至少需要一个章节");
    await api.post("/report/templates", { id: editingTpl, name: editTplName, sections });
    message.success("模板已保存");
    setEditingTpl(null); setEditSections([]);
    load();
  };
  const copyTpl = async (tpl) => {
    await api.post("/report/templates", { id: null, name: tpl.name + " (副本)", sections: tpl.sections.map((s) => ({ title: s.title, content: s.content || "" })) });
    load();
    message.success("模板已复制");
  };
  const delTpl = async (id) => {
    await api.delete(`/report/templates/${id}`);
    load();
    message.success("已删除");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>报告模板管理</h2>
        <Button icon={<PlusOutlined />} style={{ background: "#1a1f3a", color: "#fff" }} onClick={openNew}>新建模板</Button>
      </div>

      <Card>
        <List dataSource={templates} renderItem={(t) => (
          <List.Item actions={[
            <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(t)} key="edit">编辑</Button>,
            <Button type="link" icon={<CopyOutlined />} onClick={() => copyTpl(t)} key="copy">复制</Button>,
            !t.preset && <Popconfirm key="del" title="确定删除？" onConfirm={() => delTpl(t.id)}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
          ].filter(Boolean)}>
            <List.Item.Meta
              title={<span>{t.name} {t.preset ? <Tag color="blue" style={{ marginLeft: 8 }}>系统预设</Tag> : <Tag>自定义</Tag>}</span>}
              description={`${t.sections?.length || 0} 个章节`}
            />
          </List.Item>
        )} />

        {editSections.length > 0 && (
          <Card size="small" title={editingTpl ? `编辑：${editTplName}` : "新建模板"} style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600 }}>名称：</span>
              <Input value={editTplName} onChange={(e) => setEditTplName(e.target.value)} placeholder="模板名称" style={{ width: 280 }} />
              <Select value={undefined} placeholder="插入变量..." style={{ width: 140 }}
                onChange={(v) => { /* handled per-textarea */ }}
                options={TEMPLATE_VARS.map((v) => ({ label: v.label, value: v.key }))} />
              <span style={{ fontSize: "0.78rem", color: "#999" }}>章节内容中可使用 {"{{变量名}}"}</span>
            </div>
            {editSections.map((s, i) => (
              <div key={i} style={{ marginBottom: 12, border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: "#999", minWidth: 20 }}>{i + 1}.</span>
                  <Input placeholder="章节标题" value={s.title} onChange={(e) => updateSection(i, "title", e.target.value)} style={{ flex: 1 }} />
                  <Button danger size="small" onClick={() => removeSection(i)}>×</Button>
                </div>
                <Input.TextArea placeholder="章节内容，可使用 {{变量名}}" value={s.content}
                  onChange={(e) => updateSection(i, "content", e.target.value)} rows={4} style={{ fontFamily: "inherit" }} />
              </div>
            ))}
            <Space style={{ marginTop: 12 }}>
              <Button icon={<PlusOutlined />} onClick={addSection}>添加章节</Button>
              <Button type="primary" style={{ background: "#1a1f3a" }} onClick={saveTpl}>保存模板</Button>
              <Button onClick={() => setEditSections([])}>取消</Button>
            </Space>
          </Card>
        )}
      </Card>
    </div>
  );
}
