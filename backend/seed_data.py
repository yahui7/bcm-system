"""
BCM 系统 — 种子数据
预填评估因子、策略库、系统清单、演示业务数据和演示用户
"""
from backend.database import get_connection
import bcrypt


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def seed_all():
    conn = get_connection()
    cursor = conn.cursor()

    # 检查是否已初始化
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        conn.close()
        print("[Seed] 数据库已有数据，跳过种子填充")
        return

    # ========== 演示用户 ==========
    users = [
        ("bu_demo", _hash("demo123"), "bu", "张业务", "零售银行部", 1),
        ("admin_demo", _hash("demo123"), "admin", "李管理", "风险管理部", None),
        ("exec_demo", _hash("demo123"), "executive", "王高管", "行长办公室", None),
    ]
    cursor.executemany(
        "INSERT INTO users (username, password_hash, role, display_name, department, business_id) VALUES (?, ?, ?, ?, ?, ?)",
        users,
    )

    # ========== BIA 评估因子 ==========
    bia_factors = [
        ("经济影响", "economic", 0.2, 1),
        ("监管合规", "regulatory", 0.2, 2),
        ("声誉风险", "reputational", 0.2, 3),
        ("客户影响", "client", 0.2, 4),
        ("市场影响", "market", 0.2, 5),
    ]
    cursor.executemany(
        "INSERT INTO bia_factors (name, dimension, weight, sort_order) VALUES (?, ?, ?, ?)",
        bia_factors,
    )

    # ========== 风险评估因子 — 威胁 ==========
    threats = [
        ("网络攻击", 1), ("系统故障", 2), ("电力中断", 3),
        ("火灾", 4), ("恶劣天气", 5), ("恐怖袭击", 6),
        ("网络中断", 7), ("硬件故障", 8), ("系统变更", 9),
    ]
    cursor.executemany(
        "INSERT INTO risk_factors (name, factor_type, sort_order) VALUES (?, 'threat', ?)",
        threats,
    )

    # ========== 风险评估因子 — 脆弱性 ==========
    vulns = [
        ("极低", 1), ("低", 2), ("中", 3), ("高", 4),
    ]
    cursor.executemany(
        "INSERT INTO risk_factors (name, factor_type, sort_order) VALUES (?, 'vulnerability', ?)",
        vulns,
    )

    # ========== 系统清单 ==========
    systems = [
        ("核心银行系统", "IT部", "< 4小时", "Near-Zero", "核心业务系统"),
        ("网上银行系统", "IT部", "< 4小时", "< 4小时", "业务应用"),
        ("手机银行APP", "IT部", "< 8小时", "< 24小时", "业务应用"),
        ("支付清算系统", "IT部", "< 2小时", "Near-Zero", "核心业务系统"),
        ("反洗钱系统", "合规部", "< 24小时", "< 24小时", "企业应用"),
        ("征信报送系统", "IT部", "< 24小时", "< 24小时", "监管系统"),
        ("客户关系管理系统(CRM)", "IT部", "< 8小时", "< 24小时", "业务应用"),
        ("财务管理系统", "财务部", "< 24小时", "< 24小时", "企业应用"),
        ("人力资源系统", "HR", "< 48小时", "< 24小时", "企业应用"),
        ("邮件系统", "IT部", "< 4小时", "< 4小时", "基础设施"),
        ("数据中心网络", "IT部", "< 1小时", "N/A", "基础设施"),
        ("安防监控系统", "安保部", "< 2小时", "N/A", "安全系统"),
    ]
    cursor.executemany(
        "INSERT INTO systems (name, owner, rto, rpo, app_type) VALUES (?, ?, ?, ?, ?)",
        systems,
    )

    # ========== 恢复策略库 ==========
    strategies = [
        ("备用数据中心切换", "recovery", "启用灾备数据中心，切换关键业务系统", "应用系统"),
        ("备用网络线路", "preventive", "部署双线路冗余，主线路中断自动切换", "应用系统"),
        ("备用场所(WAR)", "recovery", "启用备用办公场所，关键人员在备用场所恢复业务", "场地设施"),
        ("关键人员备份(REP)", "preventive", "每个关键岗位指定主备2人，定期交叉培训", "人员"),
        ("数据异地备份", "preventive", "关键数据每日备份至异地，定期验证可恢复性", "数据"),
        ("UPS不间断电源", "preventive", "核心设备配备UPS+发电机，保障至少4小时供电", "硬件设备"),
        ("手工替代流程", "recovery", "系统不可用时，启用纸质手工处理流程作为临时方案", "第三方服务"),
        ("第三方服务商切换", "recovery", "预先签约备用服务商，主服务商不可用时24小时内切换", "第三方服务"),
        ("系统高可用架构", "preventive", "核心系统采用双活/主备架构，自动故障转移", "应用系统"),
        ("应急通讯方案", "recovery", "办公电话中断时，启用卫星电话/对讲机/微信应急群", "场地设施"),
    ]
    cursor.executemany(
        "INSERT INTO recovery_strategies (name, strategy_type, description, resource_type) VALUES (?, ?, ?, ?)",
        strategies,
    )

    # ========== 演示业务：零售银行业务 ==========
    import json
    demo_bia_data = {
        "1.1.1": False, "1.1.2": True, "1.1.3": False, "1.1.4": False,
        "1.2.1": "0.03", "1.2.2": "0.03", "1.2.3": "0.03",
        "1.3.1": "0",
        "2.1.1": "0", "2.1.2": "0", "2.1.3": "0",
        "2.2.1": {"0.5H": 1, "4H": 1, "1D": 1, "7D": 1},
        "2.3.1": {"0.5H": 1, "4H": 2, "1D": 2, "7D": 3},
        "2.4.1": {"0.5H": 1, "4H": 1, "1D": 1, "7D": 1},
        "2.5.1": {"0.5H": 1, "4H": 1, "1D": 1, "7D": 2},
        "3.1.1": {"0.5H": 1, "4H": 1, "1D": 2, "7D": 3},
        "3.2.1": {"0.5H": 1, "4H": 1, "1D": 2, "7D": 4},
    }
    demo_risk_data = {
        "threats": {
            "自然灾害-地震/洪水": {"likelihood": 1, "impact": 3, "warning": 1, "affected": ["1", "3", "5", "7", "8"]},
            "自然灾害-恶劣天气（台风/暴雨/暴雪）": {"likelihood": 3, "impact": 2, "warning": 1, "affected": ["5", "7", "8"]},
            "自然灾害-火灾": {"likelihood": 1, "impact": 3, "warning": 2, "affected": ["3", "5", "7"]},
            "技术性威胁-电力中断": {"likelihood": 3, "impact": 2, "warning": 2, "affected": ["1", "2", "3", "4"]},
            "技术性威胁-通信/网络中断": {"likelihood": 2, "impact": 2, "warning": 2, "affected": ["1", "2", "3", "6"]},
            "技术性威胁-IT硬件设备或软件故障": {"likelihood": 3, "impact": 2, "warning": 1, "affected": ["1", "2", "3", "4"]},
            "技术性威胁-系统不当变更": {"likelihood": 3, "impact": 2, "warning": 1, "affected": ["1", "2", "3"]},
            "人为破坏-网络攻击（数据泄露/篡改）": {"likelihood": 2, "impact": 3, "warning": 3, "affected": ["1", "2", "3", "5", "6"]},
            "人为破坏-操作失误": {"likelihood": 2, "impact": 1, "warning": 2, "affected": ["1", "2"]},
            "外部服务中断-供应商服务中断": {"likelihood": 2, "impact": 2, "warning": 1, "affected": ["6", "7"]},
        },
        "vulnerabilities": {
            "1-自然灾害-地震/洪水": {"score": 1}, "3-自然灾害-地震/洪水": {"score": 1},
            "5-自然灾害-地震/洪水": {"score": 1}, "7-自然灾害-地震/洪水": {"score": 1.5},
            "8-自然灾害-地震/洪水": {"score": 1}, "5-自然灾害-恶劣天气（台风/暴雨/暴雪）": {"score": 1},
            "7-自然灾害-恶劣天气（台风/暴雨/暴雪）": {"score": 1.5}, "8-自然灾害-恶劣天气（台风/暴雨/暴雪）": {"score": 1},
            "3-自然灾害-火灾": {"score": 1}, "5-自然灾害-火灾": {"score": 1.5}, "7-自然灾害-火灾": {"score": 1},
            "1-技术性威胁-电力中断": {"score": 1}, "2-技术性威胁-电力中断": {"score": 1.75},
            "3-技术性威胁-电力中断": {"score": 2}, "4-技术性威胁-电力中断": {"score": 1},
            "1-技术性威胁-通信/网络中断": {"score": 1}, "2-技术性威胁-通信/网络中断": {"score": 1},
            "3-技术性威胁-通信/网络中断": {"score": 1}, "6-技术性威胁-通信/网络中断": {"score": 1},
            "1-技术性威胁-IT硬件设备或软件故障": {"score": 2}, "2-技术性威胁-IT硬件设备或软件故障": {"score": 2},
            "3-技术性威胁-IT硬件设备或软件故障": {"score": 1}, "4-技术性威胁-IT硬件设备或软件故障": {"score": 2},
            "1-技术性威胁-系统不当变更": {"score": 2}, "2-技术性威胁-系统不当变更": {"score": 2},
            "3-技术性威胁-系统不当变更": {"score": 1.5}, "1-人为破坏-网络攻击（数据泄露/篡改）": {"score": 1},
            "2-人为破坏-网络攻击（数据泄露/篡改）": {"score": 1}, "3-人为破坏-网络攻击（数据泄露/篡改）": {"score": 1},
            "5-人为破坏-网络攻击（数据泄露/篡改）": {"score": 1.5}, "6-人为破坏-网络攻击（数据泄露/篡改）": {"score": 1},
            "1-人为破坏-操作失误": {"score": 1.5}, "2-人为破坏-操作失误": {"score": 1.5},
            "6-外部服务中断-供应商服务中断": {"score": 1.5}, "7-外部服务中断-供应商服务中断": {"score": 1},
        },
    }
    cursor.execute(
        "INSERT INTO businesses (name, department, owner, bcm_contact, description, is_critical, bia_data, risk_data, bia_score, bia_tier, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            "零售银行业务", "零售银行部", "张业务", "李管理",
            "面向个人客户的存贷款、理财、支付结算等综合金融服务。日均交易量约50万笔，是银行核心收入来源之一。",
            1, json.dumps(demo_bia_data, ensure_ascii=False), json.dumps(demo_risk_data, ensure_ascii=False),
            3.0, "Tier 2", "completed",
        ),
    )
    biz_id = cursor.lastrowid

    # 上下游依赖
    cursor.execute(
        "INSERT INTO businesses (name, department, owner, bcm_contact, description, is_critical, bia_tier) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ("IT基础设施服务", "信息技术部", "王技术", "李管理", "提供全行网络、服务器、数据库等基础IT服务", 1, "Tier 1"),
    )
    infra_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO businesses (name, department, owner, bcm_contact, description, is_critical, bia_tier) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ("支付清算业务", "运营管理部", "赵运营", "李管理", "负责行内跨行支付清算和资金划拨", 1, "Tier 1"),
    )
    pay_id = cursor.lastrowid

    cursor.execute(
        "INSERT INTO business_dependencies (business_id, related_business_id, dependency_type, description) VALUES (?, ?, ?, ?)",
        (biz_id, infra_id, "upstream", "零售银行业务依赖IT基础设施"),
    )
    cursor.execute(
        "INSERT INTO business_dependencies (business_id, related_business_id, dependency_type, description) VALUES (?, ?, ?, ?)",
        (biz_id, pay_id, "upstream", "零售银行业务依赖支付清算系统"),
    )

    # 资源（6类）
    resources = [
        ("应用系统", "核心银行系统", "high", "< 4小时", "Near-Zero"),
        ("应用系统", "手机银行APP", "high", "< 8小时", "< 24小时"),
        ("应用系统", "网上银行系统", "medium", "< 8小时", "< 24小时"),
        ("硬件设备", "核心数据库服务器", "high", "< 2小时", "Near-Zero"),
        ("数据", "客户账户数据库", "high", "< 4小时", "Near-Zero"),
        ("人员", "零售业务运营团队", "high", "< 24小时", "N/A"),
        ("第三方服务", "短信通知服务商", "medium", "< 24小时", "N/A"),
        ("场地设施", "总行营业部", "high", "< 24小时", "N/A"),
    ]
    res_ids = []
    for res_type, name, importance, rto, rpo in resources:
        cursor.execute(
            "INSERT INTO resources (business_id, resource_type, name, importance, rto, rpo) VALUES (?, ?, ?, ?, ?, ?)",
            (biz_id, res_type, name, importance, rto, rpo),
        )
        res_ids.append(cursor.lastrowid)

    # 风险场景
    scenarios = [
        (res_ids[0], "网络攻击", "高", 4.0, 3.0, 12.0, "high"),
        (res_ids[0], "系统故障", "中", 3.0, 2.0, 6.0, "medium"),
        (res_ids[1], "网络攻击", "中", 3.0, 3.0, 9.0, "high"),
        (res_ids[2], "网络攻击", "中", 3.0, 2.0, 6.0, "medium"),
        (res_ids[3], "硬件故障", "中", 3.0, 2.0, 6.0, "medium"),
        (res_ids[3], "电力中断", "低", 2.0, 3.0, 6.0, "medium"),
        (res_ids[4], "系统故障", "中", 3.0, 2.0, 6.0, "medium"),
        (res_ids[5], "恶劣天气", "低", 2.0, 2.0, 4.0, "medium"),
        (res_ids[6], "系统故障", "低", 2.0, 2.0, 4.0, "medium"),
        (res_ids[7], "火灾", "低", 1.0, 4.0, 4.0, "medium"),
        (res_ids[7], "恶劣天气", "低", 2.0, 3.0, 6.0, "medium"),
    ]
    for rid, threat, vuln, ts, vs, rs, rl in scenarios:
        cursor.execute(
            "INSERT INTO risk_scenarios (business_id, resource_id, threat, vulnerability, threat_score, vulnerability_score, risk_score, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (biz_id, rid, threat, vuln, ts, vs, rs, rl),
        )

    # BCP 计划
    bcp_json = """{
        "bcp_name": "零售银行业务连续性计划",
        "version": "1.0",
        "plan_info": {
            "owner": "张业务",
            "department": "零售银行部",
            "contact": "13971374333",
            "last_updated": "2026-07-07"
        },
        "critical_processes": [
            {"name": "个人账户开户", "mad": "< 4小时", "rto": "< 2小时", "rpo": "Near-Zero"},
            {"name": "存款/取款交易", "mad": "< 4小时", "rto": "< 1小时", "rpo": "Near-Zero"},
            {"name": "转账汇款", "mad": "< 4小时", "rto": "< 2小时", "rpo": "< 4小时"},
            {"name": "理财购买/赎回", "mad": "< 24小时", "rto": "< 8小时", "rpo": "< 24小时"}
        ],
        "preventive_strategies": [
            "核心银行系统双活架构",
            "数据库实时同步+异地备份",
            "关键岗位AB角备份"
        ],
        "recovery_strategies": [
            "备用数据中心切换",
            "启用备用办公场所(WAR)",
            "手工替代流程"
        ],
        "rep": [
            {"name": "张业务", "role": "业务负责人", "phone": "13971374333"},
            {"name": "李技术", "role": "技术恢复负责人", "phone": "13800001111"}
        ],
        "war_location": "XX市XX区科技园B座3层（备用办公区）",
        "contacts": [
            {"name": "IT服务台", "type": "内部", "phone": "8000"},
            {"name": "核心银行系统厂商", "type": "外部", "phone": "400-XXX-XXXX"},
            {"name": "银联支付", "type": "外部", "phone": "95516"}
        ],
        "recovery_actions": [
            {"scenario": "系统故障", "priority": 1, "action": "启动备用数据中心,15分钟内完成核心系统切换", "responsible": "IT部"},
            {"scenario": "场所不可用", "priority": 2, "action": "通知REP前往WAR,2小时内恢复关键业务", "responsible": "业务负责人"},
            {"scenario": "人员不可用", "priority": 3, "action": "启动AB角替代方案", "responsible": "部门主管"},
            {"scenario": "第三方中断", "priority": 4, "action": "启动手工替代流程,联系备用服务商", "responsible": "运营主管"}
        ]
    }"""
    cursor.execute(
        "INSERT INTO bcp_plans (business_id, plan_name, bcp_json, status) VALUES (?, ?, ?, ?)",
        (biz_id, "零售银行业务连续性计划 v1.0", bcp_json, "published"),
    )
    bcp_id = cursor.lastrowid

    # 演练计划和结果
    cursor.execute(
        "INSERT INTO drill_plans (bcp_id, business_id, drill_date, drill_type, participants, objective, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (bcp_id, biz_id, "2026-06-15", "桌面推演", "张业务、李技术、王运营共5人",
         "验证核心银行系统故障场景下的BCP可执行性", "已完成"),
    )
    plan_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO drill_results (plan_id, passed, failure_reason, actual_recovery_time, report_json) VALUES (?, ?, ?, ?, ?)",
        (plan_id, 1, "", "12分钟",
         '{"summary":"桌面推演顺利通过。参与人员对BCP流程熟悉，系统切换步骤清晰。改进点：通讯录需更新厂商联系方式。"}'),
    )

    # 风险事件
    events = [
        ("2023-06", "70余家银行保险机构数据泄露", "网络攻击",
         "某数据中心服务商系统被入侵，员工个人信息在海外网站售卖。"),
        ("2023-11-08", "工银金融服务(工行美国子公司)勒索软件攻击", "网络攻击",
         "LockBit 3.0勒索软件利用Citrix漏洞攻击，导致美国国债交易结算中断，引发市场流动性波动。"),
        ("2023-08", "北京洪涝灾害导致银行网点停业", "电力中断",
         "暴雨引发供电中断，215家网点停业，线上服务维持。"),
        ("2023-09", "中信证券服务器异常关机事件", "硬件故障",
         "UPS电源中断导致交易服务器关机，客户交易受影响。"),
        ("2024-03", "恒丰银行武汉分行光缆受损事件", "网络中断",
         "大楼鼠患导致楼层光缆受损，5分钟内定位故障并切换备用线路恢复。"),
        ("2023-09", "台风'苏拉'影响广东金融机构", "恶劣天气",
         "部分网点停业，线上服务维持。"),
        ("2024-01", "交通银行手机银行APP故障", "网络中断",
         "网络通讯故障导致功能中断，影响客户使用。"),
    ]
    for date, title, cat, desc in events:
        cursor.execute(
            "INSERT INTO risk_events (event_date, title, category, description) VALUES (?, ?, ?, ?)",
            (date, title, cat, desc),
        )

    # 问题整改
    cursor.execute(
        "INSERT INTO issues (business_id, description, assignee, solution, status) VALUES (?, ?, ?, ?, ?)",
        (biz_id, "BCP通讯录中第三方厂商联系方式未及时更新", "张业务",
         "每季度更新一次通讯录，演练前必查", "进行中"),
    )
    cursor.execute(
        "INSERT INTO issues (business_id, description, assignee, solution, status) VALUES (?, ?, ?, ?, ?)",
        (biz_id, "备用光纤资源不足，仅一条备用线路", "王技术",
         "2026 Q3新增第二条备用线路", "待解决"),
    )
    cursor.execute(
        "INSERT INTO issues (description, assignee, solution, status) VALUES (?, ?, ?, ?)",
        ("2025年度BCM审计发现：部分BU未按时完成年度演练", "李管理",
         "Q1前完成所有BU演练计划排期，纳入绩效考核", "已解决"),
    )

    conn.commit()
    conn.close()
    print("[Seed] 种子数据填充完成（3用户 + 3业务 + 5因子 + 13风险因子 + 12系统 + 10策略 + 1演示数据）")
