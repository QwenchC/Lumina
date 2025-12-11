"""
Lumina 明见量化 - 数据库配置
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from datetime import datetime
import os

from app.core.config import settings


# 确保数据目录存在
os.makedirs("./data", exist_ok=True)

# 创建异步引擎
if settings.database_url.startswith("sqlite"):
    # SQLite 需要使用 aiosqlite
    database_url = settings.database_url.replace("sqlite:///", "sqlite+aiosqlite:///")
else:
    database_url = settings.database_url

engine = create_async_engine(
    database_url,
    echo=settings.debug,
    future=True
)

# 创建会话工厂
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    """数据库模型基类"""
    pass


class TimestampMixin:
    """时间戳混入类"""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


async def get_db() -> AsyncSession:
    """获取数据库会话"""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """初始化数据库"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
