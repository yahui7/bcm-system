import { useState, useEffect, useRef } from "react";
import { Card, Input, Button, message, Spin, Row, Col, Tag, Select } from "antd";
import { FileWordOutlined, CopyOutlined, SaveOutlined } from "@ant-design/icons";
import api from "../../api";

const TEMPLATE_VARS = [
  { key: "{{公司名称}}", label: "公司名称" },
  { key: "{{评估日期}}", label: "评估日期" },
  { key: "{{编制部门}}", label: "编制部门" },
];

export default function ReportGenerate() {
  const [templates, setTemplates] = useState([]);
  const [selectedTpl, setSelectedTpl] = useState("tpl_bia");
  const [title, setTitle] = useState("BIA 业务影响分析报告");
  const [reportNo, setReportNo] = useState("BCM-RPT-001");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [company, setCompany] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const activeTARef = useRef(null);

  useEffect(() => {
    api.get("/report/templates").then((r) => {
      setTemplates(r.data.templates || []);
    });
  }, []);

  const handleTplChange = (tplId) => {
    setSelectedTpl(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) setTitle(tpl.name);
  };

  const resolveVars = (content) => {
    const vars = {
      "公司名称": company || "XX银行",
      "评估日期": date,
      "编制部门": author || "风险管理部",
    };
    return (content || "").replace(/\{\{(.+?)\}\}/g, (m, key) => vars[key.trim()] || m);
  };

  const generate = async () => {
    const tpl = templates.find((t) => t.id === selectedTpl);
    if (!tpl) return message.error("请先选择模板");
    setLoading(true);
    try {
      const res = await api.post("/report/generate", { title, report_no: reportNo, author, date, template_id: selectedTpl });
      const r = res.data.report;
      r.sections = r.sections.map((s) => ({ ...s, content: resolveVars(s.content) }));
      setReport(r);
      document.getElementById("previewPanel")?.scrollIntoView({ behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const downloadWord = async () => {
    if (!report) return;
    setWordLoading(true);
    try {
      const sections = report.sections.map((s) => ({ ...s, content: resolveVars(s.content) }));
      const res = await api.post("/report/export-word", { title, report_no: reportNo, author, date, template_id: selectedTpl, sections }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = `${title}_${date}.docx`;
      a.click(); window.URL.revokeObjectURL(url);
      message.success("下载成功");
    } finally {
      setWordLoading(false);
    }
  };

  const copyReport = () => {
    if (!report) return;
    let text = `${report.title}\n报告编号：${report.report_no}  编制人：${report.author}  日期：${report.date}\n\n`;
    report.sections.forEach((s) => { text += `${s.title}\n${resolveVars(s.content)}\n\n`; });
    navigator.clipboard.writeText(text).then(() => message.success("已复制到剪贴板"));
  };

  const saveHistory = async () => {
    if (!report) return;
    setSaving(true);
    try {
      const sections = report.sections.map((s) => ({ ...s, content: resolveVars(s.content) }));
      await api.post("/report/history", {
        title, report_no: reportNo, author, date, template_id: selectedTpl,
        content_json: { sections },
      });
      message.success("报告已保存到历史");
    } finally {
      setSaving(false);
    }
  };

  const onSectionEdit = (idx, content) => {
    const updated = [...report.sections];
    updated[idx] = { ...updated[idx], content };
    setReport({ ...report, sections: updated });
  };

  const insertVar = (v) => {
    const ta = activeTARef.current?.resizableTextArea?.textArea;
    if (!ta) return;
    const start = ta.selectionStart;
    ta.value = ta.value.slice(0, start) + v + ta.value.slice(ta.selectionEnd);
    ta.focus(); ta.selectionStart = ta.selectionEnd = start + v.length;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return (
    <div>
      <h2 className="page-title">报告生成</h2>

      <Card size="small" style={{ marginBottom: 20 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>模板：</span>
            <Select value={selectedTpl} onChange={handleTplChange} style={{ width: "100%" }}
              options={templates.map((t) => ({ label: (t.preset ? "📋 " : "📝 ") + t.name, value: t.id }))} />
          </Col>
          <Col span={6}><span style={{ fontWeight: 600, fontSize: "0.85rem" }}>标题：</span><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Col>
          <Col span={4}><span style={{ fontWeight: 600, fontSize: "0.85rem" }}>编号：</span><Input value={reportNo} onChange={(e) => setReportNo(e.target.value)} /></Col>
          <Col span={4}><span style={{ fontWeight: 600, fontSize: "0.85rem" }}>编制人：</span><Input value={author} onChange={(e) => setAuthor(e.target.value)} /></Col>
          <Col span={4}><span style={{ fontWeight: 600, fontSize: "0.85rem" }}>日期：</span><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 12 }}>
          <Col span={6}>
            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>机构：</span>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="如：XX银行" />
          </Col>
          <Col span={18} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <Button type="primary" style={{ background: "#1a1f3a" }} icon={<span>🚀</span>} onClick={generate} loading={loading}>生成报告</Button>
            <Button icon={<FileWordOutlined />} onClick={downloadWord} loading={wordLoading} disabled={!report}>下载Word</Button>
            <Button icon={<CopyOutlined />} onClick={copyReport} disabled={!report}>复制全文</Button>
            <Button icon={<SaveOutlined />} onClick={saveHistory} loading={saving} disabled={!report}>保存到历史</Button>
            <Select value={undefined} placeholder="插入变量..." style={{ width: 130, marginLeft: "auto" }}
              onChange={(v) => { if (v) insertVar(v); }}
              options={TEMPLATE_VARS.map((v) => ({ label: v.label, value: v.key }))} />
          </Col>
        </Row>
      </Card>

      {loading && <Spin size="large" style={{ display: "block", margin: "60px auto" }} />}

      <div id="previewPanel">
        {report && (
          <Card title={report.title}>
            <p style={{ color: "#999", marginBottom: 20, textAlign: "center" }}>
              报告编号：{report.report_no}　　编制人：{report.author}　　日期：{report.date}
            </p>
            {report.sections.map((sec, i) => (
              <div key={i} style={{ marginBottom: 24, border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ background: "#fafafa", padding: "10px 16px", fontWeight: 600, fontSize: "0.9rem", color: "#1a1f3a", borderBottom: "1px solid #f0f0f0" }}>
                  {sec.title}
                  <Tag color={sec.source === "manual" ? "default" : "blue"} style={{ marginLeft: 8, fontSize: "0.7rem" }}>
                    {sec.source === "manual" ? "手动填写" : "自动填充"}
                  </Tag>
                </div>
                <Input.TextArea
                  value={sec.content} onChange={(e) => onSectionEdit(i, e.target.value)}
                  rows={Math.min(Math.max((sec.content || "").split("\n").length + 2, 4), 22)}
                  style={{ border: "none", fontFamily: "inherit", fontSize: "0.88rem", lineHeight: 1.7, resize: "vertical" }}
                  onFocus={(e) => { activeTARef.current = { resizableTextArea: { textArea: e.target } }; }} />
              </div>
            ))}
          </Card>
        )}

        {!report && !loading && (
          <div className="empty-state">
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📄</div>
            <div className="empty-text">配置报告参数并点击「生成报告」，即可预览和编辑</div>
          </div>
        )}
      </div>
    </div>
  );
}
