"""
Lumina 明见量化 - 投资组合 API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.services.trading import TradingService
from app.services.strategy import strategy_scheduler

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


class PositionResponse(BaseModel):
    symbol: str
    name: str
    quantity: int
    avg_cost: float
    current_price: float
    market_value: float
    unrealized_pnl: float
    unrealized_pnl_ratio: float


class PortfolioResponse(BaseModel):
    portfolio_id: int
    name: str
    initial_capital: float
    cash: float
    market_value: float
    total_value: float
    total_pnl: float
    total_pnl_ratio: float
    daily_pnl: float
    positions: List[PositionResponse]


class OrderResponse(BaseModel):
    id: int
    symbol: str
    name: Optional[str]
    action: str
    quantity: int
    price: float
    filled_price: Optional[float]
    filled_quantity: int
    status: str
    reason: Optional[str]
    created_at: str


class PnLRecordResponse(BaseModel):
    timestamp: str
    total_value: float
    cash: float
    market_value: float
    daily_pnl: float
    total_pnl: float
    total_pnl_ratio: float


@router.get("/status", response_model=PortfolioResponse)
async def get_portfolio_status(db: AsyncSession = Depends(get_db)):
    """获取投资组合状态"""
    trading_service = TradingService(db)
    portfolio = await trading_service.get_or_create_portfolio()
    status = await trading_service.get_portfolio_status(portfolio.id)
    
    if not status:
        raise HTTPException(status_code=404, detail="投资组合不存在")
    
    return PortfolioResponse(**status)


@router.get("/orders", response_model=List[OrderResponse])
async def get_orders(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """获取订单历史"""
    trading_service = TradingService(db)
    portfolio = await trading_service.get_or_create_portfolio()
    orders = await trading_service.get_orders(portfolio.id, limit)
    return [OrderResponse(**o) for o in orders]


@router.get("/pnl", response_model=List[PnLRecordResponse])
async def get_pnl_history(
    days: int = 30,
    db: AsyncSession = Depends(get_db)
):
    """获取盈亏历史"""
    trading_service = TradingService(db)
    portfolio = await trading_service.get_or_create_portfolio()
    records = await trading_service.get_pnl_history(portfolio.id, days)
    return [PnLRecordResponse(**r) for r in records]


@router.post("/analyze")
async def trigger_analysis(db: AsyncSession = Depends(get_db)):
    """手动触发分析"""
    status = await strategy_scheduler.manual_analysis()
    return {
        "status": "success",
        "message": "分析已触发",
        "portfolio": status
    }


@router.post("/reset")
async def reset_portfolio(db: AsyncSession = Depends(get_db)):
    """重置投资组合"""
    from app.models import Portfolio, Position, Order, PnLRecord
    from sqlalchemy import delete
    
    # 删除现有数据
    await db.execute(delete(Position))
    await db.execute(delete(Order))
    await db.execute(delete(PnLRecord))
    await db.execute(delete(Portfolio))
    await db.commit()
    
    # 创建新的投资组合
    trading_service = TradingService(db)
    await trading_service.get_or_create_portfolio()
    await db.commit()
    
    return {"status": "success", "message": "投资组合已重置"}
