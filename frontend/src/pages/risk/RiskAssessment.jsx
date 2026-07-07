import { useState, useEffect } from "react";
import { Select, Button, Table, Tag, Tabs, message, Spin, InputNumber, Checkbox } from "antd";
import api from "../../api";

const IMP_LABELS = { high: "3-高", medium: "2-中", low: "1-低" };
const SCORE_OPTIONS = [
  { label: "3 — 高", value: 3 },
  { label: "2 — 中", value: 2 },
  { label: "1 — 低", value: 1 },
];

export default function RiskAssessment() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [resources, setResources] = useState([]);
  const [threats, setThreats] = useState([]);
  const [riskData, setRiskData] = useState({ threats: {}, vulnerabilities: {} });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [activeTab, setActiveTab] = useState("resource");
  const [showInst, setShowInst] = useState(true);

  useEffect(() => {
    api.get("/bia/businesses").then((r) => setBusinesses(r.data.businesses || []));
    api.get("/risk/threats").then((r) => setThreats(r.data.threats || []));
  }, []);

  const loadData = async (bizId) => {
    setSelectedBiz(bizId);
    setLoading(true);
    try {
      const [resR, resD] = await Promise.all([
        api.get(`/risk/businesses/${bizId}/resources`),
        api.get(`/risk/businesses/${bizId}/risk-data`),
      ]);
      setResources(resR.data.resources || []);
      const rd = resD.data.risk_data || {};
      setRiskData({ threats: rd.threats || {}, vulnerabilities: rd.vulnerabilities || {} });
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData) => {
    setSaving(true);
    try {
      await api.post(`/risk/businesses/${selectedBiz}/save-risk-data`, { risk_data: newData });
    } finally {
      setSaving(false);
    }
  };

  const updateThreat = (tkey, field, value) => {
    const updated = { ...riskData, threats: { ...riskData.threats, [tkey]: { ...riskData.threats[tkey], [field]: value } } };
    setRiskData(updated);
    saveData(updated);
  };

  const toggleAffected = (tkey, rid) => {
    const t = riskData.threats[tkey] || {};
    const affected = t.affected || [];
    const next = affected.includes(rid) ? affected.filter((r) => r !== rid) : [...affected, rid];
    updateThreat(tkey, "affected", next);
  };

  const updateVuln = (vtkey, score) => {
    const updated = { ...riskData, vulnerabilities: { ...riskData.vulnerabilities, [vtkey]: { score } } };
    setRiskData(updated);
    saveData(updated);
  };

  const runAssessment = async () => {
    setAssessing(true);
    try {
      const r = await api.post(`/risk/businesses/${selectedBiz}/assess`);
      setResults(r.data.results || []);
      setActiveTab("result");
      message.success("风险评估完成");
    } finally {
      setAssessing(false);
    }
  };

  // ---- Tab 1: 资源评分 ----
  const resourceColumns = [
    { title: "资源名称", dataIndex: "name", key: "name" },
    { title: "资源类型", dataIndex: "resource_type", key: "type" },
    { title: "重要程度", dataIndex: "importance", key: "imp", render: (v) => <Tag color={v === "high" ? "red" : v === "medium" ? "orange" : "green"}>{IMP_LABELS[v] || v}</Tag> },
    { title: "RTO", dataIndex: "rto", key: "rto" },
    { title: "RPO", dataIndex: "rpo", key: "rpo" },
  ];

  // ---- Tab 2: 威胁评分 ----
  const categories = [...new Set(threats.map((t) => t.category))];
  const threatColumns = [
    { title: "威胁类别", dataIndex: "category", key: "cat", width: 100, render: (v, _, i) => {
      const first = i === 0 || threats[i - 1]?.category !== v;
      return first ? <span style={{ fontWeight: 700 }}>{v}</span> : "";
    }},
    { title: "威胁名称", dataIndex: "name", key: "name", width: 160 },
    ...resources.map((r) => ({
      title: r.name.substring(0, 6),
      key: `res_${r.id}`,
      width: 60,
      render: (_, t) => {
        const tkey = `${t.category}-${t.name}`;
        const affected = riskData.threats[tkey]?.affected || [];
        return <Checkbox checked={affected.includes(String(r.id))} onChange={() => toggleAffected(tkey, String(r.id))} />;
      },
    })),
    { title: "可能性", key: "likelihood", width: 90, render: (_, t) => {
      const tkey = `${t.category}-${t.name}`;
      return <Select size="small" style={{ width: 80 }} value={riskData.threats[tkey]?.likelihood || undefined}
        onChange={(v) => updateThreat(tkey, "likelihood", v)} options={SCORE_OPTIONS} placeholder="选" />;
    }},
    { title: "影响", key: "impact", width: 90, render: (_, t) => {
      const tkey = `${t.category}-${t.name}`;
      return <Select size="small" style={{ width: 80 }} value={riskData.threats[tkey]?.impact || undefined}
        onChange={(v) => updateThreat(tkey, "impact", v)} options={SCORE_OPTIONS} placeholder="选" />;
    }},
    { title: "预警", key: "warning", width: 90, render: (_, t) => {
      const tkey = `${t.category}-${t.name}`;
      return <Select size="small" style={{ width: 80 }} value={riskData.threats[tkey]?.warning || undefined}
        onChange={(v) => updateThreat(tkey, "warning", v)} options={SCORE_OPTIONS} placeholder="选" />;
    }},
    { title: "赋值", key: "value", width: 60, render: (_, t) => {
      const tkey = `${t.category}-${t.name}`;
      const d = riskData.threats[tkey];
      if (!d || !d.likelihood || !d.impact || !d.warning) return "-";
      return <strong>{((d.likelihood + d.impact + d.warning) / 3).toFixed(1)}</strong>;
    }},
  ];

  // ---- Tab 3: 脆弱性评分 ----
  const vulnData = [];
  resources.forEach((r) => {
    threats.forEach((t) => {
      const tkey = `${t.category}-${t.name}`;
      const affected = riskData.threats[tkey]?.affected || [];
      if (affected.includes(String(r.id))) {
        vulnData.push({ resource: r, threat: t, tkey });
      }
    });
  });
  const vulnColumns = [
    { title: "资源", dataIndex: ["resource", "name"], key: "res", width: 140 },
    { title: "威胁", dataIndex: ["threat", "name"], key: "threat", width: 160 },
    { title: "脆弱性评分", key: "score", width: 120, render: (_, item) => {
      const vtkey = `${item.resource.id}-${item.tkey}`;
      return <Select size="small" style={{ width: 80 }} value={riskData.vulnerabilities[vtkey]?.score || undefined}
        onChange={(v) => updateVuln(vtkey, v)}
        options={[
          { label: "3 — 高（暂无有效防护）", value: 3 },
          { label: "2 — 中（存在差距）", value: 2 },
          { label: "1.5 — 中低", value: 1.5 },
          { label: "1 — 低（有合理防护）", value: 1 },
        ]} placeholder="选" />;
    }},
  ];

  // ---- 结果表 ----
  const resultColumns = [
    { title: "资源", dataIndex: "resource_name", key: "res", width: 120 },
    { title: "威胁", dataIndex: "threat", key: "threat", width: 140 },
    { title: "资源分", dataIndex: "importance", key: "imp", width: 60 },
    { title: "威胁值", dataIndex: "threat_value", key: "tv", width: 60 },
    { title: "固有风险", dataIndex: "inherent_risk", key: "ir", width: 80, render: (v) => <strong>{v.toFixed(2)}</strong> },
    { title: "固有等级", dataIndex: "inherent_level", key: "il", width: 80, render: (v) => <Tag color={v === "高风险" ? "red" : v === "中风险" ? "orange" : "green"}>{v}</Tag> },
    { title: "本行脆弱性", dataIndex: "bank_vulnerability", key: "bv", width: 80 },
    { title: "残余风险", dataIndex: "residual_risk", key: "rr", width: 80, render: (v) => <strong style={{ color: v >= 2.4 ? "#e74c3c" : v >= 2.0 ? "#faad14" : "#52c41a" }}>{v.toFixed(2)}</strong> },
    { title: "残余等级", dataIndex: "residual_level", key: "rl", width: 90, render: (v) => <Tag color={v.includes("高") ? "red" : v.includes("中") ? "orange" : "green"}>{v}</Tag> },
  ];

  const tabItems = [
    { key: "resource", label: "资源评分", children: (
        <div className="bcm-card" style={{ background: "#fafbff" }}>
          <p style={{ color: "#888", marginBottom: 12, fontSize: "0.85rem" }}>以下资源从「资源识别」页面自动带入，重要程度将参与风险计算。如需修改请前往资源识别页面。</p>
          <Table columns={resourceColumns} dataSource={resources} rowKey="id" size="small" pagination={false} />
        </div>
      ),
    },
    { key: "threat", label: "威胁评分", children: (
        <div>
          <p style={{ color: "#888", marginBottom: 8, fontSize: "0.85rem" }}>勾选每个威胁影响的资源（☑），并为发生可能性 / 影响程度 / 预警时间评分 1-3。威胁赋值 = 三者均值（自动计算）。</p>
          <div className="bcm-card" style={{ overflow: "auto" }}>
            <Table columns={threatColumns} dataSource={threats} rowKey="id" size="small" pagination={false} />
          </div>
        </div>
      ),
    },
    { key: "vuln", label: "脆弱性评分", children: (
        <div>
          <p style={{ color: "#888", marginBottom: 8, fontSize: "0.85rem" }}>对已勾选的资源-威胁组合，评估本行管控措施的脆弱性。3=暂无有效防护 / 2=存在差距 / 1.5=中低 / 1=有合理防护。</p>
          <div className="bcm-card">
            <Table columns={vulnColumns} dataSource={vulnData} rowKey={(r) => `${r.resource.id}-${r.tkey}`} size="small" pagination={false}
              locale={{ emptyText: "请先在「威胁评分」Tab 中勾选影响的资源" }} />
          </div>
        </div>
      ),
    },
  ];

  if (results) {
    tabItems.push({
      key: "result",
      label: `评估结果（${results.length}）`,
      children: (
        <div className="bcm-card" style={{ overflow: "auto" }}>
          <Table columns={resultColumns} dataSource={results} rowKey={(r) => `${r.resource_id}-${r.threat}`} size="small" pagination={false} />
        </div>
      ),
    });
  }

  return (
    <div>
      <h2 className="page-title">风险评估模型</h2>

      <div className="bcm-card" style={{ background: "#fafbff", border: "1px solid #e6f0ff", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: showInst ? 10 : 0, color: "#1a1f3a", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 8 }} onClick={() => setShowInst(!showInst)}>
          <span style={{ fontSize: "0.65rem", color: "#bbb", transition: "transform 0.2s", transform: showInst ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
          📋 填写说明
        </div>
        {showInst && <div style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.8 }}>
          <p>本页采用 <strong>三步评估法</strong>，评估业务面临的风险场景：</p>
          <p style={{ marginTop: 6 }}><strong>Step 1 — 资源评分：</strong>查看从「资源识别」带入的关键资源及其重要程度（只读）</p>
          <p><strong>Step 2 — 威胁评分：</strong>勾选每个威胁影响的资源，评发生可能性/影响程度/预警时间（1-3分），威胁赋值自动计算</p>
          <p><strong>Step 3 — 脆弱性评分：</strong>对已勾选的资源-威胁组合，评估本行防护措施的脆弱性</p>
          <p style={{ marginTop: 6 }}><strong>评分标准：</strong>3=高（频繁/严重/无预警/无防护）· 2=中 · 1=低（罕见/轻微/有预警/有防护）</p>
          <p style={{ marginTop: 4 }}><strong>计算公式：</strong>固有风险 = 资源重要程度 × 威胁赋值 × 行业固有脆弱性 → 减去本行管控措施 = 残余风险</p>
        </div>}
      </div>

      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontWeight: 600 }}>选择业务：</span>
        <Select style={{ width: 300 }} placeholder="选择一个业务" onChange={loadData}
          options={businesses.map((b) => ({ label: b.name, value: b.id }))} />
        {selectedBiz && (
          <Button type="primary" loading={assessing} style={{ background: "#1a1f3a" }} onClick={runAssessment}>
            执行风险评估
          </Button>
        )}
      </div>

      {loading ? <Spin /> : selectedBiz && (
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      )}
    </div>
  );
}
