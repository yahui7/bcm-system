"""
维护改进 API（风险事件 + 问题管理）
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.database import get_connection

router = APIRouter()


# ============================================================
# 风险事件
# ============================================================

@router.get("/events")
async def list_events():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM risk_events ORDER BY event_date DESC")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "ok", "events": [dict(r) for r in rows]}


class EventCreate(BaseModel):
    title: str
    event_date: str = ""
    category: str = ""
    description: str = ""
    source_url: str = ""


@router.post("/events")
async def create_event(data: EventCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO risk_events (title, event_date, category, description, source_url) VALUES (?, ?, ?, ?, ?)",
        (data.title, data.event_date, data.category, data.description, data.source_url),
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "事件已录入"}


@router.put("/events/{event_id}")
async def update_event(event_id: int, data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    allowed = ["title", "event_date", "category", "description", "source_url"]
    updates = {k: data[k] for k in data if k in allowed}
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="无有效更新字段")
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [event_id]
    cursor.execute(f"UPDATE risk_events SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "更新成功"}


@router.delete("/events/{event_id}")
async def delete_event(event_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM risk_events WHERE id = ?", (event_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "已删除"}


# ============================================================
# 问题管理
# ============================================================

@router.get("/issues")
async def list_issues():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM issues ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "ok", "issues": [dict(r) for r in rows]}


class IssueCreate(BaseModel):
    description: str
    assignee: str = ""
    solution: str = ""
    status: str = "待解决"


@router.post("/issues")
async def create_issue(data: IssueCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO issues (description, assignee, solution, status) VALUES (?, ?, ?, ?)",
        (data.description, data.assignee, data.solution, data.status),
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "问题已创建"}


@router.put("/issues/{issue_id}")
async def update_issue(issue_id: int, data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    allowed = ["description", "assignee", "solution", "status"]
    updates = {k: data[k] for k in data if k in allowed}
    if not updates:
        conn.close()
        raise HTTPException(status_code=400, detail="无有效更新字段")
    if updates.get("status") == "已解决":
        updates["resolved_at"] = "CURRENT_TIMESTAMP"
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [issue_id]
    cursor.execute(f"UPDATE issues SET {set_clause} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "更新成功"}


@router.delete("/issues/{issue_id}")
async def delete_issue(issue_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM issues WHERE id = ?", (issue_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "已删除"}
