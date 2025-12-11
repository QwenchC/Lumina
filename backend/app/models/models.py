"""
Lumina 明见量化 - 数据模型
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base, TimestampMixin


class TradeAction(str, enum.Enum):
    """交易动作"""
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class OrderStatus(str, enum.Enum):
    """订单状态"""
    PENDING = "pending"
    FILLED = "filled"
    CANCELLED = "cancelled"
    FAILED = "failed"


class Portfolio(Base, TimestampMixin):
    """投资组合"""
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    initial_capital = Column(Float, nullable=False)
    current_capital = Column(Float, nullable=False)  # 当前现金
    total_value = Column(Float, nullable=False)       # 总市值
    is_active = Column(Boolean, default=True)
    
    # 关联
    positions = relationship("Position", back_populates="portfolio", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="portfolio", cascade="all, delete-orphan")
    pnl_records = relationship("PnLRecord", back_populates="portfolio", cascade="all, delete-orphan")


class Position(Base, TimestampMixin):
    """持仓"""
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    
    symbol = Column(String(20), nullable=False)        # 股票代码
    name = Column(String(100))                          # 股票名称
    quantity = Column(Integer, nullable=False)          # 持仓数量
    avg_cost = Column(Float, nullable=False)            # 平均成本
    current_price = Column(Float, default=0)            # 当前价格
    market_value = Column(Float, default=0)             # 市值
    unrealized_pnl = Column(Float, default=0)           # 未实现盈亏
    unrealized_pnl_ratio = Column(Float, default=0)     # 未实现盈亏比例
    
    # 关联
    portfolio = relationship("Portfolio", back_populates="positions")


class Order(Base, TimestampMixin):
    """交易订单"""
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    
    symbol = Column(String(20), nullable=False)
    name = Column(String(100))
    action = Column(String(10), nullable=False)         # buy / sell
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)               # 委托价格
    filled_price = Column(Float)                        # 成交价格
    filled_quantity = Column(Integer, default=0)        # 成交数量
    status = Column(String(20), default="pending")      # pending / filled / cancelled / failed
    reason = Column(Text)                               # 交易原因 (LLM 给出)
    
    # 关联
    portfolio = relationship("Portfolio", back_populates="orders")


class PnLRecord(Base, TimestampMixin):
    """盈亏记录 (用于绘制曲线)"""
    __tablename__ = "pnl_records"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    total_value = Column(Float, nullable=False)         # 总资产
    cash = Column(Float, nullable=False)                # 现金
    market_value = Column(Float, nullable=False)        # 持仓市值
    daily_pnl = Column(Float, default=0)                # 当日盈亏
    total_pnl = Column(Float, default=0)                # 累计盈亏
    total_pnl_ratio = Column(Float, default=0)          # 累计收益率
    
    # 关联
    portfolio = relationship("Portfolio", back_populates="pnl_records")


class StockData(Base, TimestampMixin):
    """股票数据缓存"""
    __tablename__ = "stock_data"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, index=True)
    name = Column(String(100))
    date = Column(DateTime, nullable=False, index=True)
    
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)
    amount = Column(Float)      # 成交额
    
    # 技术指标
    ma5 = Column(Float)
    ma10 = Column(Float)
    ma20 = Column(Float)
    ma60 = Column(Float)
    rsi = Column(Float)
    macd = Column(Float)
    macd_signal = Column(Float)
    macd_hist = Column(Float)


class LLMDecision(Base, TimestampMixin):
    """LLM 决策记录"""
    __tablename__ = "llm_decisions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    
    model = Column(String(100), nullable=False)         # 使用的模型
    prompt = Column(Text)                               # 输入提示
    response = Column(Text)                             # 模型响应
    decisions = Column(JSON)                            # 解析后的决策
    
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    
    executed = Column(Boolean, default=False)           # 是否已执行


class SystemLog(Base, TimestampMixin):
    """系统日志"""
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    level = Column(String(20), nullable=False)          # INFO / WARNING / ERROR
    module = Column(String(100))                        # 模块名
    message = Column(Text, nullable=False)
    details = Column(JSON)                              # 详细信息
