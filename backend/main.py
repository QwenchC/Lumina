"""
Lumina 明见量化 - 主入口
"""
import asyncio
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings, check_api_key_interactive
from app.core.database import init_db
from app.api import portfolio_router, market_router, websocket_router
from app.api.websocket import broadcast_loop
from app.services.strategy import strategy_scheduler


# 配置日志
os.makedirs("./logs", exist_ok=True)
os.makedirs("./data", exist_ok=True)
logger.add(
    settings.log_file,
    rotation="10 MB",
    retention="30 days",
    level=settings.log_level,
    encoding="utf-8"
)

# 全局标记：LLM 是否可用
llm_available = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global llm_available
    
    # 启动时
    logger.info("=" * 50)
    logger.info(f"🚀 {settings.app_name} v{settings.app_version} 启动中...")
    logger.info("=" * 50)
    
    # 初始化数据库
    await init_db()
    logger.info("✅ 数据库初始化完成")
    
    # 检查 LLM 密钥状态
    api_key = settings.get_llm_api_key()
    if api_key and api_key not in ["your_deepseek_api_key", "your_openai_api_key", 
                                     "your_github_personal_access_token"]:
        llm_available = True
        logger.info(f"✅ LLM 已配置 (提供商: {settings.llm_provider})")
    else:
        llm_available = False
        logger.warning(f"⚠️ LLM 未配置，自动选股功能将不可用")
    
    # 初始化调度器
    await strategy_scheduler.init()
    if llm_available:
        strategy_scheduler.start()
        logger.info("✅ 策略调度器启动完成")
    else:
        logger.info("⏸️ 策略调度器暂停（等待 LLM 配置）")
    
    # 启动广播任务
    broadcast_task = asyncio.create_task(broadcast_loop())
    logger.info("✅ WebSocket 广播服务启动完成")
    
    logger.info("=" * 50)
    logger.info(f"🎉 {settings.app_name} 启动成功!")
    logger.info(f"📊 API 文档: http://{settings.backend_host}:{settings.backend_port}/docs")
    logger.info(f"🔗 WebSocket: ws://{settings.backend_host}:{settings.backend_port}/ws")
    if not llm_available:
        logger.info(f"💡 设置环境变量或重启配置 LLM 密钥以启用自动选股")
    logger.info("=" * 50)
    
    yield
    
    # 关闭时
    logger.info("正在关闭服务...")
    broadcast_task.cancel()
    try:
        await broadcast_task
    except asyncio.CancelledError:
        pass
    strategy_scheduler.stop()
    logger.info("服务已关闭")


# 创建应用
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI驱动的智能量化交易系统",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境请限制来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(portfolio_router, prefix="/api")
app.include_router(market_router, prefix="/api")
app.include_router(websocket_router)


@app.get("/")
async def root():
    """根路由"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """健康检查"""
    return {
        "status": "healthy",
        "llm_available": llm_available,
        "llm_provider": settings.llm_provider if llm_available else None,
        "scheduler_running": strategy_scheduler.is_running,
        "last_analysis": strategy_scheduler.last_analysis_time
    }


if __name__ == "__main__":
    import uvicorn
    
    # 交互式检查 API 密钥
    print("\n" + "=" * 60)
    print(f"  🌟 {settings.app_name} v{settings.app_version}")
    print("=" * 60)
    
    check_api_key_interactive()
    
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
