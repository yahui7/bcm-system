"""
风险评估引擎 — 三步评估法

Step 1: 资源评分（从 resources 表读取重要程度）
Step 2: 威胁评分（18 种威胁 × 发生可能性/影响程度/预警时间）
Step 3: 脆弱性评分（每资源-威胁对的脆弱性）
结果: 资源分 × 威胁分 × (行业脆弱性 + 本行脆弱性调整) = 固有风险 → 残余风险
"""
import json

# 威胁清单
THREATS = [
    {"category": "自然灾害", "id": "1.1", "name": "地震/洪水"},
    {"category": "自然灾害", "id": "1.2", "name": "恶劣天气（台风/暴雨/暴雪）"},
    {"category": "自然灾害", "id": "1.3", "name": "火灾"},
    {"category": "技术性威胁", "id": "2.3", "name": "灰尘/腐蚀/鼠蚁虫害"},
    {"category": "技术性威胁", "id": "2.4", "name": "电力中断"},
    {"category": "技术性威胁", "id": "2.5", "name": "通信/网络中断"},
    {"category": "技术性威胁", "id": "2.7", "name": "IT硬件设备或软件故障"},
    {"category": "技术性威胁", "id": "2.8", "name": "系统不当变更"},
    {"category": "人为破坏", "id": "3.1", "name": "恐怖袭击/破坏性行为"},
    {"category": "人为破坏", "id": "3.2", "name": "操作失误"},
    {"category": "人为破坏", "id": "3.3", "name": "网络攻击（数据泄露/篡改）"},
    {"category": "人为破坏", "id": "3.4", "name": "罢工/聚众/示威"},
    {"category": "人为破坏", "id": "3.5", "name": "人力不足/意外事故"},
    {"category": "公共卫生", "id": "4.1", "name": "大范围流感和疾病爆发"},
    {"category": "外部服务中断", "id": "5.1", "name": "供应商服务中断"},
    {"category": "外部服务中断", "id": "5.2", "name": "外部合作机构终止合作"},
    {"category": "外部服务中断", "id": "5.3", "name": "外联单位中断连接"},
]

# 行业固有脆弱性（默认值，每个资源类型不同）
INDUSTRY_VULN = {"应用系统": 2.8, "硬件设备": 2.5, "数据": 2.0, "人员": 2.5, "第三方服务": 2.0, "场地设施": 2.5}


class RiskEngine:
    def __init__(self, business_id: int):
        self.business_id = business_id

    def get_threats(self):
        """返回威胁清单"""
        return THREATS

    def get_resources(self, conn):
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM resources WHERE business_id = ?", (self.business_id,))
        return cursor.fetchall()

    def assess(self, conn, risk_data: dict) -> list:
        """根据三步数据计算风险结果"""
        cursor = conn.cursor()
        resources = self.get_resources(conn)
        if not resources:
            return []

        threats_data = risk_data.get("threats", {})
        vuln_data = risk_data.get("vulnerabilities", {})

        results = []
        for res in resources:
            rid = str(res["id"])
            imp = {"high": 3, "medium": 2, "low": 1}.get(res["importance"], 2)
            ind_vuln = INDUSTRY_VULN.get(res["resource_type"], 2.5)

            for t in THREATS:
                tkey = f"{t['category']}-{t['name']}"
                threat_info = threats_data.get(tkey, {})
                if not threat_info:
                    continue
                affected = threat_info.get("affected", [])
                if rid not in affected:
                    continue

                likelihood = float(threat_info.get("likelihood", 1))
                impact = float(threat_info.get("impact", 1))
                warning = float(threat_info.get("warning", 1))
                threat_val = round((likelihood + impact + warning) / 3, 1)

                vtkey = f"{rid}-{tkey}"
                bank_vuln = float(vuln_data.get(vtkey, {}).get("score", 1.5))

                inherent = round(imp * threat_val * ind_vuln / 10, 2)
                if bank_vuln >= 3:
                    residual = inherent
                elif bank_vuln >= 2:
                    residual = round(inherent - 0.2, 2)
                elif bank_vuln >= 1.5:
                    residual = round(inherent - 0.4, 2)
                else:
                    residual = round(inherent - 0.6, 2)
                residual = max(0, residual)

                if inherent >= 2.4:
                    ir_level = "高风险"
                elif inherent >= 2.0:
                    ir_level = "中风险"
                else:
                    ir_level = "低风险"

                if residual >= 2.4:
                    rr_level = "高风险"
                elif residual >= 2.2:
                    rr_level = "中高风险"
                elif residual >= 2.0:
                    rr_level = "中风险"
                elif residual >= 1.5:
                    rr_level = "中低风险"
                else:
                    rr_level = "低风险"

                results.append({
                    "resource_id": res["id"],
                    "resource_name": res["name"],
                    "resource_type": res["resource_type"],
                    "importance": imp,
                    "threat": t["name"],
                    "threat_category": t["category"],
                    "likelihood": likelihood,
                    "impact": impact,
                    "warning": warning,
                    "threat_value": threat_val,
                    "inherent_risk": inherent,
                    "inherent_level": ir_level,
                    "bank_vulnerability": bank_vuln,
                    "residual_risk": residual,
                    "residual_level": rr_level,
                })

        results.sort(key=lambda r: r["residual_risk"], reverse=True)
        return results
