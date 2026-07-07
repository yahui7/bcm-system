"""
认证 API（简化版 — Phase 4 完善 JWT）
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt
from backend.database import get_connection

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(data: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (data.username,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    if not bcrypt.checkpw(data.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    return {
        "status": "ok",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "display_name": user["display_name"],
            "department": user["department"],
            "business_id": user["business_id"],
        },
        "token": "dev-token-placeholder",  # Phase 4 替换为 JWT
    }


@router.get("/users")
async def list_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, display_name, department, business_id FROM users")
    rows = cursor.fetchall()
    conn.close()
    return {"status": "ok", "users": [dict(r) for r in rows]}
