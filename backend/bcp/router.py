"""
BCP 连续性计划 API
"""
import json
from urllib.parse import quote
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.database import get_connection
from backend.bcp.engine import BCPEngine, export_bcp_word

router = APIRouter()


# ============================================================
# BCP 计划 CRUD
# ============================================================

@router.get("/businesses/{business_id}/plans")
async def list_plans(business_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bcp_plans WHERE business_id = ? ORDER BY id DESC", (business_id,))
    rows = cursor.fetchall()
    conn.close()
    return {"status": "ok", "plans": [dict(r) for r in rows]}


@router.post("/businesses/{business_id}/plans")
async def create_plan(business_id: int):
    conn = get_connection()
    engine = BCPEngine(business_id)
    bcp_data = engine.generate(conn)

    plan_name = bcp_data.get("bcp_name", f"BCP-{business_id}")

    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO bcp_plans (business_id, plan_name, bcp_json, status) VALUES (?, ?, ?, ?)",
        (business_id, plan_name, json.dumps(bcp_data, ensure_ascii=False), "published"),
    )
    conn.commit()
    bcp_id = cursor.lastrowid
    conn.close()
    return {"status": "ok", "bcp_id": bcp_id, "message": f"BCP '{plan_name}' 已生成"}


@router.get("/plans/{bcp_id}")
async def get_plan(bcp_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bcp_plans WHERE id = ?", (bcp_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="BCP 不存在")
    bcp = dict(row)
    try:
        bcp["bcp_json"] = json.loads(bcp["bcp_json"])
    except:
        pass
    return {"status": "ok", "bcp": bcp}


@router.put("/plans/{bcp_id}")
async def update_plan(bcp_id: int, data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    allowed = ["plan_name", "bcp_json", "status"]
    updates = {k: data[k] for k in data if k in allowed}
    if "bcp_json" in updates and not isinstance(updates["bcp_json"], str):
        updates["bcp_json"] = json.dumps(updates["bcp_json"], ensure_ascii=False)
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="无有效更新字段")
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [bcp_id]
    cursor.execute(f"UPDATE bcp_plans SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "更新成功"}


@router.get("/plans/{bcp_id}/export")
async def export_plan(bcp_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bcp_plans WHERE id = ?", (bcp_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="BCP 不存在")

    bcp_data = json.loads(row["bcp_json"]) if isinstance(row["bcp_json"], str) else row["bcp_json"]
    buf = export_bcp_word(bcp_data)

    filename = quote(f"{row['plan_name']}.docx")
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


# ============================================================
# 恢复策略库（管理员）
# ============================================================

@router.get("/strategies")
async def list_strategies():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recovery_strategies WHERE enabled = 1 ORDER BY strategy_type, id")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "ok", "strategies": [dict(r) for r in rows]}


class StrategyCreate(BaseModel):
    name: str
    strategy_type: str  # preventive / recovery
    description: str = ""
    resource_type: str = ""


@router.post("/strategies")
async def create_strategy(data: StrategyCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO recovery_strategies (name, strategy_type, description, resource_type) VALUES (?, ?, ?, ?)",
        (data.name, data.strategy_type, data.description, data.resource_type),
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "message": f"策略 '{data.name}' 已添加"}


@router.put("/strategies/{strategy_id}")
async def update_strategy(strategy_id: int, data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    allowed = ["name", "strategy_type", "description", "resource_type"]
    updates = {k: data[k] for k in data if k in allowed}
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="无有效更新字段")
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [strategy_id]
    cursor.execute(f"UPDATE recovery_strategies SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "更新成功"}


@router.delete("/strategies/{strategy_id}")
async def delete_strategy(strategy_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE recovery_strategies SET enabled = 0 WHERE id = ?", (strategy_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "已禁用"}
