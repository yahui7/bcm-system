"""
BIA 业务影响分析 — 定级引擎

新因子体系（3大类 × 15因子）：
1. 客户影响：对客属性(4) + 客户规模(3) + 受影响客户数(1) + 客户财务(1)
2. 银行影响：财务(3) + 流动性(1) + 运营(1) + 合规(1) + 声誉(1)
3. 市场影响：连锁效应(1) + 可替代性(1)

评分逻辑：
- 对客属性：对私 > 对公 > 对同业 > 对政府，取最高分 1-4
- 数值因子：按阈值自动折算 1-4
- 评级因子：0.5H/4H/1D/7D 各选1-4，取最高分
- 维度得三个维度最高分加权平均
- >= 3.5 Tier 1, >= 2.5 Tier 2, < 2.5 Tier 3
"""
import json

# 数值因子折算阈值
NUMERIC_THRESHOLDS = {
    "1.2.1": [1, 10, 100],     # 存量客户数(万个): <1=1, 1-10=2, 10-100=3, >=100=4
    "1.2.2": [0.5, 5, 50],     # 活跃客户数(万个)
    "1.2.3": [10, 100, 1000],  # 年交易笔数(万笔)
    "1.3.1": [1, 10, 100],     # 年交易金额(万元) - using 亿 equivalent
    "2.1.1": [100, 1000, 10000], # 年收入(万元)
    "2.1.2": [10, 100, 1000],  # 年净利润(万元)
    "2.1.3": [10, 100, 1000],  # 年成本(万元)
}

# 对客属性评分：取勾选中的最高分
CUSTOMER_TYPE_SCORE = {
    "1.1.4": 1,  # 对政府 = 1
    "1.1.3": 2,  # 对同业 = 2
    "1.1.1": 3,  # 对公 = 3
    "1.1.2": 4,  # 对私 = 4
}

# 评级因子列表（有时间维度 0.5H/4H/1D/7D）
RATING_FACTORS = ["2.2.1", "2.3.1", "2.4.1", "2.5.1", "3.1.1", "3.2.1"]

# 维度映射
DIM_MAP = {
    "1": "客户影响", "2": "银行影响", "3": "市场影响"
}


class BIAEngine:
    def __init__(self, business_id: int):
        self.business_id = business_id

    def calculate(self, conn) -> dict:
        cursor = conn.cursor()
        cursor.execute("SELECT bia_data FROM businesses WHERE id = ?", (self.business_id,))
        row = cursor.fetchone()
        if not row:
            return {"tier": "", "score": 0}

        try:
            data = json.loads(row["bia_data"]) if row["bia_data"] else {}
        except (json.JSONDecodeError, TypeError):
            data = {}

        dim_scores = {"客户影响": 0, "银行影响": 0, "市场影响": 0}

        for key, val in data.items():
            dim_key = key.split(".")[0]
            dim_name = DIM_MAP.get(dim_key)
            if not dim_name:
                continue

            score = 0
            if key in CUSTOMER_TYPE_SCORE:
                # 对客属性：yes = 对应分数
                if val is True or val == 1 or val == "true":
                    score = CUSTOMER_TYPE_SCORE[key]
            elif key in NUMERIC_THRESHOLDS:
                # 数值因子：按阈值折算
                thresholds = NUMERIC_THRESHOLDS[key]
                try:
                    num = float(val) if val else 0
                    score = 1
                    for i, t in enumerate(thresholds):
                        if num >= t:
                            score = i + 2
                except (ValueError, TypeError):
                    score = 1
            elif key in RATING_FACTORS:
                # 评级因子：取 4 个时间阈值的最高分
                if isinstance(val, dict):
                    scores = []
                    for t in ["0.5H", "4H", "1D", "7D"]:
                        try:
                            s = int(val.get(t, 1))
                            scores.append(s)
                        except (ValueError, TypeError):
                            scores.append(1)
                    score = max(scores) if scores else 1
                else:
                    score = 1

            if score > dim_scores[dim_name]:
                dim_scores[dim_name] = score

        # 加权平均（三维度等权）
        valid_scores = [s for s in dim_scores.values() if s > 0]
        if not valid_scores:
            score = 0
        else:
            score = round(sum(valid_scores) / len(valid_scores), 1)

        if score >= 3.5:
            tier = "Tier 1"
        elif score >= 2.5:
            tier = "Tier 2"
        else:
            tier = "Tier 3"

        cursor.execute(
            "UPDATE businesses SET bia_score = ?, bia_tier = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (score, tier, self.business_id),
        )
        conn.commit()

        return {"tier": tier, "score": score, "dimensions": dim_scores}
