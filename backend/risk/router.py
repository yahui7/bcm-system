"""
RA 风险评估 API
"""
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.database import get_connection
from backend.risk.engine import RiskEngine, THREATS

router = APIRouter()


# ============================================================
# 资源 CRUD
# ============================================================

@router.get("/businesses/{business_id}/resources")
async def list_resources(business_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM resources WHERE business_id = ? ORDER BY id", (business_id,))
    rows = cursor.fetchall()
    conn.close()
    return {"status": "ok", "resources": [dict(r) for r in rows]}


class ResourceCreate(BaseModel):
    resource_type: str
    name: str
    importance: str = "medium"
    rto: str = ""
    rpo: str = ""


@router.post("/businesses/{business_id}/resources")
async def add_resource(business_id: int, data: ResourceCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO resources (business_id, resource_type, name, importance, rto, rpo) VALUES (?, ?, ?, ?, ?, ?)",
        (business_id, data.resource_type, data.name, data.importance, data.rto, data.rpo),
    )
    conn.commit()
    rid = cursor.lastrowid
    conn.close()
    return {"status": "ok", "id": rid, "message": "资源已添加"}


@router.put("/resources/{resource_id}")
async def update_resource(resource_id: int, data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    allowed = ["resource_type", "name", "importance", "rto", "rpo"]
    updates = {k: data[k] for k in data if k in allowed}
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="无有效更新字段")
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [resource_id]
    cursor.execute(f"UPDATE resources SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "更新成功"}


@router.delete("/resources/{resource_id}")
async def delete_resource(resource_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM resources WHERE id = ?", (resource_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "已删除"}


# ============================================================
# 风险评估 — 三步法
# ============================================================

@router.get("/threats")
async def get_threats():
    """返回威胁清单"""
    return {"status": "ok", "threats": THREATS}


@router.get("/businesses/{business_id}/risk-data")
async def get_risk_data(business_id: int):
    """获取已保存的风险评估数据"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT risk_data FROM businesses WHERE id = ?", (business_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="业务不存在")
    try:
        data = json.loads(row["risk_data"]) if row["risk_data"] else {}
    except (json.JSONDecodeError, TypeError):
        data = {}
    return {"status": "ok", "risk_data": data}


@router.post("/businesses/{business_id}/save-risk-data")
async def save_risk_data(business_id: int, data: dict):
    """保存风险评估中间数据（威胁评分、脆弱性评分）"""
    conn = get_connection()
    cursor = conn.cursor()
    risk_data = data.get("risk_data", {})
    cursor.execute(
        "UPDATE businesses SET risk_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (json.dumps(risk_data, ensure_ascii=False), business_id),
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "数据已保存"}


@router.post("/businesses/{business_id}/assess")
async def run_assessment(business_id: int):
    """执行风险评估，返回结果"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT risk_data FROM businesses WHERE id = ?", (business_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="业务不存在")

    try:
        risk_data = json.loads(row["risk_data"]) if row["risk_data"] else {}
    except (json.JSONDecodeError, TypeError):
        risk_data = {}

    engine = RiskEngine(business_id)
    results = engine.assess(conn, risk_data)
    conn.close()
    return {"status": "ok", "results": results, "count": len(results)}


@router.get("/businesses/{business_id}/scenarios")
async def list_scenarios(business_id: int):
    """获取已计算的风险场景（兼容旧接口）"""
    return await run_assessment(business_id)


# ============================================================
# 风险评估因子 + 系统清单（管理员）
# ============================================================

@router.get("/factors")
async def list_factors():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM risk_factors WHERE enabled = 1 ORDER BY factor_type, sort_order")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "ok", "factors": [dict(r) for r in rows]}


class RiskFactorCreate(BaseModel):
    name: str
    factor_type: str
    sort_order: int = 0


@router.post("/factors")
async def create_factor(data: RiskFactorCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO risk_factors (name, factor_type, sort_order) VALUES (?, ?, ?)",
        (data.name, data.factor_type, data.sort_order),
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "message": f"因子 '{data.name}' 已添加"}


@router.put("/factors/{factor_id}")
async def update_factor(factor_id: int, data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    allowed = ["name", "factor_type", "sort_order"]
    updates = {k: data[k] for k in data if k in allowed}
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="无有效更新字段")
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [factor_id]
    cursor.execute(f"UPDATE risk_factors SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "更新成功"}


@router.delete("/factors/{factor_id}")
async def delete_factor(factor_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE risk_factors SET enabled = 0 WHERE id = ?", (factor_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "已禁用"}


@router.get("/systems")
async def list_systems():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM systems WHERE enabled = 1 ORDER BY app_type, name")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "ok", "systems": [dict(r) for r in rows]}


class SystemCreate(BaseModel):
    name: str
    owner: str = ""
    rto: str = ""
    rpo: str = ""
    app_type: str = ""


@router.post("/systems")
async def create_system(data: SystemCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO systems (name, owner, rto, rpo, app_type) VALUES (?, ?, ?, ?, ?)",
        (data.name, data.owner, data.rto, data.rpo, data.app_type),
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "message": f"系统 '{data.name}' 已添加"}


@router.put("/systems/{system_id}")
async def update_system(system_id: int, data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    allowed = ["name", "owner", "rto", "rpo", "app_type"]
    updates = {k: data[k] for k in data if k in allowed}
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="无有效更新字段")
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [system_id]
    cursor.execute(f"UPDATE systems SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "更新成功"}


@router.delete("/systems/{system_id}")
async def delete_system(system_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE systems SET enabled = 0 WHERE id = ?", (system_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "已禁用"}
