import { useState, useEffect } from "react";
import { Select, Button, Input, Checkbox, Collapse, Tag, message, Spin, InputNumber } from "antd";
import { CaretRightOutlined } from "@ant-design/icons";
import api from "../../api";

// 评分选项
const SCORE_OPTIONS = [
  { label: "1 — 影响最低", value: 1 },
  { label: "2 — 有一定影响", value: 2 },
  { label: "3 — 影响较大", value: 3 },
  { label: "4 — 影响严重", value: 4 },
];

// 时间阈值
const TIME_SLOTS = ["0.5H", "4H", "1D", "7D"];
const TIME_LABELS = { "0.5H": "半小时", "4H": "4小时", "1D": "1天", "7D": "7天" };

// 因子定义
const FACTORS = {
  customer: {
    title: "1. 客户影响",
    color: "#4a90d9",
    sections: [
      {
        type: "checkbox",
        title: "对客属性（勾选该业务服务的客户类型，可多选）",
        items: [
          { key: "1.1.1", label: "对公", desc: "服务企业客户" },
          { key: "1.1.2", label: "对私", desc: "服务个人客户" },
          { key: "1.1.3", label: "对同业", desc: "服务银行/证券等同业机构" },
          { key: "1.1.4", label: "对政府机构", desc: "服务政府/监管/事业单位" },
        ],
      },
      {
        type: "numeric",
        title: "客户规模（填写上年度数据）",
        items: [
          { key: "1.2.1", label: "存量客户数（万个）", desc: "截至上年度末的客户总数" },
          { key: "1.2.2", label: "活跃客户数（万个）", desc: "上年度有交易的活跃客户数" },
          { key: "1.2.3", label: "年交易笔数（万笔）", desc: "上年度全年交易笔数" },
        ],
      },
      {
        type: "numericSingle",
        items: [
          { key: "1.3.1", label: "年交易金额（万元）", desc: "上年度全年交易金额" },
        ],
      },
    ],
  },
  bank: {
    title: "2. 银行影响",
    color: "#e67e22",
    sections: [
      {
        type: "numericRow",
        title: "银行财务指标（填写上年度数据）",
        items: [
          { key: "2.1.1", label: "年业务收入（万元）", desc: "上年度该业务收入" },
          { key: "2.1.2", label: "年净利润（万元）", desc: "上年度该业务净利润" },
          { key: "2.1.3", label: "年业务成本（万元）", desc: "上年度该业务运营成本" },
        ],
      },
      {
        type: "rating",
        title: "银行影响评级",
        items: [
          { key: "2.2.1", label: "流动性影响", desc: "1=无影响  2=指标下降但不影响其他业务  3=全面流动性风险，到期债务无法支付  4=影响金融稳定或公共利益" },
          { key: "2.3.1", label: "内部运营影响", desc: "1=少量积压，现有资源即可处理  2=产生少量额外工作量  3=大量积压，需额外资源  4=后续运营难以开展" },
          { key: "2.4.1", label: "法律合规影响", desc: "1=完全合规，无违规  2=合规但需向监管自我报告  3=轻微违规  4=严重违规，面临监管处罚" },
          { key: "2.5.1", label: "声誉影响", desc: "1=无媒体报道  2=连续报道1天以上  3=批评性报道1-3天  4=批评性报道超3天" },
        ],
      },
    ],
  },
  market: {
    title: "3. 市场影响",
    color: "#7b68ee",
    sections: [
      {
        type: "rating",
        title: "市场影响评级",
        items: [
          { key: "3.1.1", label: "市场份额-连锁效应", desc: "1=无连锁效应  2=引起1个市场参与者连锁反应  3=引起多个参与者连锁反应  4=引起所有参与者连锁反应" },
          { key: "3.2.1", label: "可替代性", desc: "1=市场有多个可替代服务商  2=少量可替代服务商  3=极少数可替代  4=本行独有，无可替代" },
        ],
      },
    ],
  },
};

export default function BusinessScoring() {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [biaData, setBiaData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showInst, setShowInst] = useState(true);

  useEffect(() => {
    api.get("/bia/businesses").then((r) => setBusinesses(r.data.businesses || []));
  }, []);

  const loadScores = async (bizId) => {
    setSelectedBiz(bizId);
    setLoading(true);
    try {
      const r = await api.get(`/bia/businesses/${bizId}/scores`);
      setBiaData(r.data.bia_data || {});
      setResult(r.data.tier ? { tier: r.data.tier, score: r.data.score } : null);
    } finally {
      setLoading(false);
    }
  };

  const updateCheckbox = (key, checked) => {
    setBiaData((prev) => ({ ...prev, [key]: checked }));
  };

  const updateNumeric = (key, value) => {
    setBiaData((prev) => ({ ...prev, [key]: value }));
  };

  const updateRating = (key, slot, value) => {
    setBiaData((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [slot]: value },
    }));
  };

  const submit = async () => {
    if (!selectedBiz) return message.warning("请先选择业务");
    setSubmitting(true);
    try {
      const r = await api.post(`/bia/businesses/${selectedBiz}/scores`, { bia_data: biaData });
      setResult({ tier: r.data.tier, score: r.data.score });
      message.success(`BIA 评分已提交，等级：${r.data.tier}`);
    } finally {
      setSubmitting(false);
    }
  };

  const thStyle = {
    padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: "0.83rem",
    color: "#555", background: "#fafafa", borderBottom: "2px solid #e8e8e8",
  };
  const tdStyle = {
    padding: "12px 14px", borderBottom: "1px solid #f5f5f5",
    fontSize: "0.85rem", verticalAlign: "middle",
  };
  const tdDesc = { ...tdStyle, color: "#555", fontSize: "0.84rem", lineHeight: 1.6 };
  const tdLabel = { ...tdStyle, fontWeight: 600, whiteSpace: "nowrap" };
  const stripeBg = { background: "#fafafa" };

  // 渲染评级行
  const renderRatingRow = (item, idx) => (
    <tr key={item.key} style={idx % 2 === 0 ? stripeBg : undefined}>
      <td style={tdLabel}>{item.label}</td>
      <td style={tdDesc}>{item.desc}</td>
      {TIME_SLOTS.map((slot) => (
        <td key={slot} style={{ ...tdStyle, textAlign: "center" }}>
          <Select
            size="middle" style={{ width: 150 }}
            value={biaData[item.key]?.[slot] || undefined}
            onChange={(v) => updateRating(item.key, slot, v)}
            options={SCORE_OPTIONS}
            placeholder="选择" />
        </td>
      ))}
    </tr>
  );

  // 渲染数值行
  const renderNumericRow = (item, idx) => (
    <tr key={item.key} style={idx % 2 === 0 ? stripeBg : undefined}>
      <td style={tdLabel}>{item.label}</td>
      <td style={tdDesc}>{item.desc}</td>
      <td colSpan={4} style={tdStyle}>
        <Input
          style={{ width: 220 }}
          size="middle"
          value={biaData[item.key] || ""}
          onChange={(e) => updateNumeric(item.key, e.target.value)}
          placeholder="填写数值" />
      </td>
    </tr>
  );

  // 渲染勾选框行
  const renderCheckboxRow = (item, idx) => (
    <tr key={item.key} style={idx % 2 === 0 ? stripeBg : undefined}>
      <td style={tdLabel}>{item.label}</td>
      <td style={tdDesc}>{item.desc}</td>
      <td colSpan={4} style={tdStyle}>
        <Checkbox
          checked={!!biaData[item.key]}
          onChange={(e) => updateCheckbox(item.key, e.target.checked)} />
      </td>
    </tr>
  );

  // 渲染评级表格
  const renderRatingTable = (items) => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={thStyle}>因子</th>
          <th style={thStyle}>因子说明</th>
          {TIME_SLOTS.map((t) => (
            <th key={t} style={{ ...thStyle, textAlign: "center", width: 162 }}>
              {t}<div style={{ fontWeight: 400, color: "#999", fontSize: "0.7rem" }}>{TIME_LABELS[t]}</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{items.map(renderRatingRow)}</tbody>
    </table>
  );

  // 渲染数值表格
  const renderNumericTable = (items) => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={thStyle}>因子</th>
          <th style={thStyle}>因子说明</th>
          <th style={thStyle} colSpan={4}>数值</th>
        </tr>
      </thead>
      <tbody>{items.map(renderNumericRow)}</tbody>
    </table>
  );

  // 渲染勾选框表格
  const renderCheckboxTable = (items) => (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={thStyle}>因子</th>
          <th style={thStyle}>因子说明</th>
          <th style={thStyle} colSpan={4}>勾选</th>
        </tr>
      </thead>
      <tbody>{items.map(renderCheckboxRow)}</tbody>
    </table>
  );

  // 渲染区块
  const renderSection = (section) => {
    if (section.type === "checkbox") return renderCheckboxTable(section.items);
    if (section.type === "numeric" || section.type === "numericRow" || section.type === "numericSingle") return renderNumericTable(section.items);
    if (section.type === "rating") return renderRatingTable(section.items);
    return null;
  };

  const dimKeys = ["customer", "bank", "market"];

  return (
    <div>
      <h2 className="page-title">业务因子评分（BIA）</h2>

      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8, fontWeight: 600 }}>选择业务：</span>
        <Select style={{ width: 300 }} placeholder="选择一个业务" onChange={loadScores} value={selectedBiz}
          options={businesses.map((b) => ({ label: b.name, value: b.id }))} />
      </div>

      {loading ? <Spin /> : selectedBiz && (
        <>
          {/* 填写说明 */}
          <div className="bcm-card" style={{ background: "#fafbff", border: "1px solid #e6f0ff", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: showInst ? 10 : 0, color: "#1a1f3a", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 8 }} onClick={() => setShowInst(!showInst)}>
              <span style={{ fontSize: "0.65rem", color: "#bbb", transition: "transform 0.2s", transform: showInst ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
              📋 填写说明
            </div>
            {showInst && <div style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.8 }}>
              <p>本页评估业务中断在 <strong>4 个时间阈值</strong> 下对银行的影响程度。</p>
              <p style={{ marginTop: 6 }}><strong>填写步骤：</strong></p>
              <ol style={{ paddingLeft: 20, margin: "4px 0" }}>
                <li>勾选「对客属性」中该业务服务的客户类型（可多选）</li>
                <li>填写数值类因子的上年度数据（存量客户数、交易笔数、收入等）</li>
                <li>评分类因子逐项选择 0.5H / 4H / 1D / 7D 下的影响等级</li>
              </ol>
              <p style={{ marginTop: 8 }}>
                <strong>评分标准：</strong>1=影响最低 &nbsp; 2=有一定影响 &nbsp; 3=影响较大 &nbsp; 4=影响严重
              </p>
              <p style={{ color: "#e67e22", marginTop: 4 }}>
                ⚠️ 同一因子从左到右，等级应只增不减（0.5H ≤ 4H ≤ 1D ≤ 7D）
              </p>
            </div>}
          </div>

          {/* 三个大类卡片 */}
          <Collapse
            defaultActiveKey={dimKeys}
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
            items={dimKeys.map((dk) => {
              const dim = FACTORS[dk];
              return {
                key: dk,
                label: <span style={{ fontWeight: 700, fontSize: "1rem", color: dim.color }}>{dim.title}</span>,
                children: (
                  <div>
                    {dim.sections.map((sec, si) => (
                      <div key={si} style={{ marginBottom: si < dim.sections.length - 1 ? 20 : 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#555", marginBottom: 10, marginTop: si > 0 ? 20 : 0 }}>
                          {sec.title}
                        </div>
                        {renderSection(sec)}
                      </div>
                    ))}
                  </div>
                ),
              };
            })} />

          {/* 提交按钮 */}
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Button type="primary" size="large" loading={submitting} style={{ background: "#1a1f3a", padding: "0 40px" }} onClick={submit}>
              提交评分并计算等级
            </Button>
          </div>
        </>
      )}

      {/* 定级结果 */}
      {result && (
        <div className="bcm-card" style={{ textAlign: "center", marginTop: 20 }}>
          <div style={{ fontSize: "0.9rem", color: "#888", marginBottom: 8 }}>BIA 业务连续性等级</div>
          <Tag color={result.tier === "Tier 1" ? "red" : result.tier === "Tier 2" ? "orange" : "green"}
            style={{ fontSize: "1.5rem", padding: "8px 32px" }}>{result.tier}</Tag>
          <div style={{ marginTop: 8, color: "#999", fontSize: "0.85rem" }}>综合评分：{result.score} 分</div>
        </div>
      )}
    </div>
  );
}
