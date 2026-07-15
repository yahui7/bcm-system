"""
BCM 业务连续性管理系统 — 主应用入口
FastAPI + SQLite + React
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.database import init_db
from backend.seed_data import seed_all

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时初始化数据库和种子数据"""
    init_db()
    seed_all()
    print("[OK] BCM 业务连续性管理系统初始化完成")
    yield


app = FastAPI(
    title="BCM 业务连续性管理系统",
    description="BIA · RA · BCP · 演练 · 维护改进",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册各模块路由
from backend.bia.router import router as bia_router
from backend.risk.router import router as risk_router
from backend.bcp.router import router as bcp_router
from backend.drill.router import router as drill_router
from backend.report_generator.router import router as report_router
from backend.maintenance.router import router as maintenance_router
from backend.dashboard.router import router as dashboard_router
from backend.auth.router import router as auth_router

app.include_router(auth_router, prefix="/api/auth", tags=["认证"])
app.include_router(bia_router, prefix="/api/bia", tags=["BIA业务影响分析"])
app.include_router(risk_router, prefix="/api/risk", tags=["RA风险评估"])
app.include_router(bcp_router, prefix="/api/bcp", tags=["BCP连续性计划"])
app.include_router(drill_router, prefix="/api/drill", tags=["演练管理"])
app.include_router(report_router, prefix="/api/report", tags=["报告生成"])
app.include_router(maintenance_router, prefix="/api/maintenance", tags=["维护改进"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "BCM 业务连续性管理系统运行中"}


# SPA 回退：所有非 API 路径返回 index.html
# 先处理静态资源（JS/CSS/图片），再回退到 index.html
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """非 API 路由 → 静态文件 → SPA index.html"""
    # 安全校验：防止路径遍历
    safe_path = os.path.normpath(full_path)
    if safe_path.startswith(".."):
        return {"detail": "Invalid path"}

    file_path = os.path.join(DIST_DIR, safe_path) if safe_path else os.path.join(DIST_DIR, "index.html")

    # 请求的是具体文件且存在 → 直接返回
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    # 其余所有路径 → index.html（React Router 接管）
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)

    return {"detail": "Frontend not built. Run: cd frontend && npm run build"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
