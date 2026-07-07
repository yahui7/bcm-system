"""
报告模板管理
- 系统预设模板 + 用户自定义模板
- 存储为 JSON 文件
"""
import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "data", "templates")

DATA_SOURCES = [
    {"key": "bia_summary", "name": "BIA 业务影响分析"},
    {"key": "risk_assessment", "name": "RA 风险评估"},
    {"key": "bcp_summary", "name": "BCP 连续性计划"},
    {"key": "drill_summary", "name": "演练结果"},
    {"key": "manual", "name": "手动填写"},
]

PRESET_TEMPLATES = [
    {
        "id": "tpl_bia",
        "name": "BIA 业务影响分析报告",
        "preset": True,
        "sections": [
            {
                "title": "一、业务概况",
                "content": "评估机构：{{公司名称}}\n评估日期：{{评估日期}}\n编制部门：{{编制部门}}\n\n本次业务影响分析覆盖以下业务：\n\n{{业务概况}}"
            },
            {
                "title": "二、BIA 评分矩阵",
                "content": "各业务 BIA 因子评分如下：\n\n{{评分矩阵}}"
            },
            {
                "title": "三、业务连续性等级",
                "content": "根据 BIA 评分结果，业务连续性等级如下：\n\n{{等级结果}}"
            },
            {
                "title": "四、上下游依赖分析",
                "content": "{{依赖分析}}"
            },
            {
                "title": "五、结论与建议",
                "content": "综合来看，{{公司名称}}在{{评估日期}}的业务连续性评估中，{{结论}}。\n\n针对上述分析结果，建议如下：\n1. 对 Tier 1 关键业务制定并维护 BCP 计划\n2. 定期开展 BIA 回顾，确保评估因子的时效性\n3. 加强上下游依赖管理，建立变更通知机制\n\n编制人：{{编制部门}}\n日期：{{评估日期}}"
            },
        ],
    },
    {
        "id": "tpl_risk",
        "name": "RA 风险评估报告",
        "preset": True,
        "sections": [
            {
                "title": "一、评估概要",
                "content": "评估机构：{{公司名称}}\n评估日期：{{评估日期}}\n编制部门：{{编制部门}}\n\n本次风险评估覆盖重要业务及其关键资源，采用威胁×脆弱性矩阵模型进行风险场景分析。\n\n{{资源统计}}"
            },
            {
                "title": "二、资源清单",
                "content": "{{资源清单}}"
            },
            {
                "title": "三、风险场景分析",
                "content": "经威胁×脆弱性矩阵分析，共生成风险场景 {{场景总数}} 个。\n\n{{场景分析}}"
            },
            {
                "title": "四、高风险项汇总",
                "content": "{{高风险汇总}}"
            },
            {
                "title": "五、整改建议",
                "content": "根据本次风险评估结果，提出以下整改建议：\n\n{{整改建议}}"
            },
        ],
    },
    {
        "id": "tpl_drill",
        "name": "演练报告",
        "preset": True,
        "sections": [
            {
                "title": "一、演练基本信息",
                "content": "演练机构：{{公司名称}}\n报告日期：{{评估日期}}\n编制部门：{{编制部门}}\n\n{{演练基本信息}}"
            },
            {
                "title": "二、演练过程",
                "content": "{{演练过程}}"
            },
            {
                "title": "三、演练结果评估",
                "content": "{{演练结果}}"
            },
            {
                "title": "四、问题与改进建议",
                "content": "根据本次演练情况，提出以下改进建议：\n\n{{改进建议}}"
            },
        ],
    },
]


def _ensure_dir():
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    for tpl in PRESET_TEMPLATES:
        path = os.path.join(TEMPLATES_DIR, f"{tpl['id']}.json")
        if not os.path.exists(path):
            with open(path, "w", encoding="utf-8") as f:
                json.dump(tpl, f, ensure_ascii=False, indent=2)


def list_templates() -> list[dict]:
    """列出所有模板"""
    _ensure_dir()
    templates = []
    for fname in os.listdir(TEMPLATES_DIR):
        if fname.endswith(".json"):
            with open(os.path.join(TEMPLATES_DIR, fname), "r", encoding="utf-8") as f:
                templates.append(json.load(f))
    return sorted(templates, key=lambda t: (not t.get("preset", False), t["name"]))


def get_template(tpl_id: str) -> dict | None:
    """获取单个模板"""
    path = os.path.join(TEMPLATES_DIR, f"{tpl_id}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def save_template(data: dict) -> dict:
    """保存自定义模板"""
    _ensure_dir()
    tpl_id = data.get("id") or f"tpl_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    data["id"] = tpl_id
    data["preset"] = False
    path = os.path.join(TEMPLATES_DIR, f"{tpl_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return data


def delete_template(tpl_id: str) -> bool:
    """删除自定义模板"""
    path = os.path.join(TEMPLATES_DIR, f"{tpl_id}.json")
    if not os.path.exists(path):
        return False
    tpl = json.load(open(path, "r", encoding="utf-8"))
    if tpl.get("preset"):
        return False
    os.remove(path)
    return True


def get_data_sources() -> list[dict]:
    return DATA_SOURCES
