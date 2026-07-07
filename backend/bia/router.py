"""
BIA 业务影响分析 API
"""
import json
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import get_connection
from backend.bia.engine import BIAEngine

router = APIRouter()


# ============================================================
# 业务 CRUD
# ============================================================

@router.get("/businesses")
async def list_businesses(department: Optional[str] = Query(None)):
    conn = get_connection()
    cursor = conn.cursor()
    if department:
        cursor.execute("SELECT * FROM businesses WHERE department = ? ORDER BY id DESC", (department,))
    else:
        cursor.execute("SELECT * FROM businesses ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "ok", "businesses": [dict(r) for r in rows]}


@router.get("/businesses/{business_id}")
async def get_business(business_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM businesses WHERE id = ?", (business_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="业务不存在")
    biz = dict(row)
    try:
        biz["bia_data"] = json.loads(biz["bia_data"]) if biz["bia_data"] else {}
    except (json.JSONDecodeError, TypeError):
        biz["bia_data"] = {}
    return {"status": "ok", "business": biz}


class BusinessBase(BaseModel):
    name: str
    department: str = ""
    owner: str = ""
    bcm_contact: str = ""
    description: str = ""


@router.post("/businesses")
async def create_business(data: BusinessBase):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO businesses (name, department, owner, bcm_contact, description) VALUES (?, ?, ?, ?, ?)",
            (data.name, data.department, data.owner, data.bcm_contact, data.description),
        )
        conn.commit()
        bid = cursor.lastrowid
        conn.close()
        return {"status": "ok", "id": bid, "message": f"业务 '{data.name}' 已创建"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/businesses/{business_id}")
async def update_business(business_id: int, data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    allowed = ["name", "department", "owner", "bcm_contact", "description"]
    updates = {k: data[k] for k in data if k in allowed}
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="无有效更新字段")
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [business_id]
    cursor.execute(f"UPDATE businesses SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "更新成功"}


@router.delete("/businesses/{business_id}")
async def delete_business(business_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM businesses WHERE id = ?", (business_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "已删除"}


# ============================================================
# BIA 评分
# ============================================================

@router.get("/businesses/{business_id}/scores")
async def get_scores(business_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT bia_data, bia_score, bia_tier FROM businesses WHERE id = ?", (business_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="业务不存在")
    try:
        bia_data = json.loads(row["bia_data"]) if row["bia_data"] else {}
    except (json.JSONDecodeError, TypeError):
        bia_data = {}
    return {
        "status": "ok",
        "bia_data": bia_data,
        "score": row["bia_score"],
        "tier": row["bia_tier"],
    }


@router.post("/businesses/{business_id}/scores")
async def submit_scores(business_id: int, data: dict):
    """提交 BIA 评分数据，触发定级引擎"""
    conn = get_connection()
    cursor = conn.cursor()

    bia_data = data.get("bia_data", {})
    cursor.execute(
        "UPDATE businesses SET bia_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (json.dumps(bia_data, ensure_ascii=False), business_id),
    )

    engine = BIAEngine(business_id)
    result = engine.calculate(conn)

    conn.close()
    return {"status": "ok", "tier": result["tier"], "score": result["score"], "dimensions": result["dimensions"]}


# ============================================================
# 上下游依赖
# ============================================================

@router.get("/businesses/{business_id}/dependencies")
async def list_dependencies(business_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT d.*, b.name as related_name
           FROM business_dependencies d
           JOIN businesses b ON d.related_business_id = b.id
           WHERE d.business_id = ?""",
        (business_id,),
    )
    deps = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"status": "ok", "dependencies": deps}


class DependencyCreate(BaseModel):
    related_business_id: int
    dependency_type: str
    description: str = ""


@router.post("/businesses/{business_id}/dependencies")
async def add_dependency(business_id: int, data: DependencyCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO business_dependencies (business_id, related_business_id, dependency_type, description) VALUES (?, ?, ?, ?)",
        (business_id, data.related_business_id, data.dependency_type, data.description),
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "依赖关系已添加"}


@router.delete("/dependencies/{dep_id}")
async def delete_dependency(dep_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM business_dependencies WHERE id = ?", (dep_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "已删除"}
