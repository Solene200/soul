"""FastAPI 主应用"""
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, chat, assessment, training, diary, growth, analytics

# 加载环境变量
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 创建 FastAPI 应用
app = FastAPI(
    title="心灵奇旅 Soul API",
    description="心理健康陪伴助手后端 API",
    version="1.0.0"
)

# 配置 CORS（允许前端跨域请求）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(assessment.router)
app.include_router(training.router)
app.include_router(diary.router)
app.include_router(growth.router)
app.include_router(analytics.router)

# 根路径
@app.get("/")
async def root():
    """API 根路径"""
    return {
        "message": "心灵奇旅 Soul API",
        "version": "1.0.0",
        "status": "running"
    }

# 健康检查
@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}
