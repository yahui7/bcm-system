# BCM 业务连续性管理系统 — 多阶段构建
# Stage 1: 构建 React 前端
FROM node:22-alpine AS frontend

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --silent 2>/dev/null || npm install --silent

COPY frontend/ ./
RUN npm run build

# Stage 2: Python 运行时
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p data data/templates

# 从构建阶段复制 dist
COPY --from=frontend /app/frontend/dist ./frontend/dist

EXPOSE 8008

CMD ["python", "main.py"]
