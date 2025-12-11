"""
Lumina 明见量化 - 交易执行服务
"""
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models import Portfolio, Position, Order, PnLRecord
from app.services.llm import TradingDecision


class TradingService:
    """交易执行服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.commission_rate = 0.0003  # 佣金率 0.03%
        self.stamp_duty_rate = 0.001   # 印花税 0.1% (仅卖出)
        self.min_commission = 5.0       # 最低佣金
    
    async def get_or_create_portfolio(self, name: str = "默认组合") -> Portfolio:
        """获取或创建投资组合"""
        result = await self.db.execute(
            select(Portfolio).where(Portfolio.name == name, Portfolio.is_active == True)
        )
        portfolio = result.scalar_one_or_none()
        
        if not portfolio:
            portfolio = Portfolio(
                name=name,
                initial_capital=settings.initial_capital,
                current_capital=settings.initial_capital,
                total_value=settings.initial_capital
            )
            self.db.add(portfolio)
            await self.db.flush()
            logger.info(f"创建新投资组合: {name}, 初始资金: {settings.initial_capital}")
        
        return portfolio
    
    async def get_portfolio_status(self, portfolio_id: int) -> Dict:
        """获取投资组合状态"""
        portfolio = await self.db.get(Portfolio, portfolio_id)
        if not portfolio:
            return {}
        
        # 获取持仓
        result = await self.db.execute(
            select(Position).where(Position.portfolio_id == portfolio_id)
        )
        positions = result.scalars().all()
        
        # 计算持仓市值
        market_value = sum(p.market_value for p in positions)
        
        # 获取最新盈亏记录
        result = await self.db.execute(
            select(PnLRecord)
            .where(PnLRecord.portfolio_id == portfolio_id)
            .order_by(PnLRecord.timestamp.desc())
            .limit(1)
        )
        latest_pnl = result.scalar_one_or_none()
        
        return {
            "portfolio_id": portfolio.id,
            "name": portfolio.name,
            "initial_capital": portfolio.initial_capital,
            "cash": portfolio.current_capital,
            "market_value": market_value,
            "total_value": portfolio.current_capital + market_value,
            "total_pnl": (portfolio.current_capital + market_value) - portfolio.initial_capital,
            "total_pnl_ratio": ((portfolio.current_capital + market_value) / portfolio.initial_capital - 1),
            "daily_pnl": latest_pnl.daily_pnl if latest_pnl else 0,
            "positions": [
                {
                    "symbol": p.symbol,
                    "name": p.name,
                    "quantity": p.quantity,
                    "avg_cost": p.avg_cost,
                    "current_price": p.current_price,
                    "market_value": p.market_value,
                    "unrealized_pnl": p.unrealized_pnl,
                    "unrealized_pnl_ratio": p.unrealized_pnl_ratio
                }
                for p in positions
            ]
        }
    
    async def execute_decision(
        self,
        portfolio_id: int,
        decision: TradingDecision,
        current_price: float
    ) -> Optional[Order]:
        """
        执行交易决策
        
        Args:
            portfolio_id: 投资组合 ID
            decision: 交易决策
            current_price: 当前价格
        
        Returns:
            Order: 订单对象，如果执行失败返回 None
        """
        if decision.action == "hold":
            return None
        
        portfolio = await self.db.get(Portfolio, portfolio_id)
        if not portfolio:
            logger.error(f"投资组合不存在: {portfolio_id}")
            return None
        
        # 创建订单
        order = Order(
            portfolio_id=portfolio_id,
            symbol=decision.symbol,
            name=decision.name,
            action=decision.action,
            quantity=decision.quantity,
            price=current_price,
            reason=decision.reason
        )
        
        try:
            if decision.action == "buy":
                await self._execute_buy(portfolio, order, current_price)
            elif decision.action == "sell":
                await self._execute_sell(portfolio, order, current_price)
            
            order.status = "filled"
            order.filled_price = current_price
            order.filled_quantity = decision.quantity
            
        except Exception as e:
            logger.error(f"执行订单失败: {e}")
            order.status = "failed"
            order.reason = f"{order.reason} | 失败原因: {str(e)}"
        
        self.db.add(order)
        await self.db.flush()
        
        return order
    
    async def _execute_buy(
        self,
        portfolio: Portfolio,
        order: Order,
        price: float
    ):
        """执行买入"""
        # 计算总成本
        amount = price * order.quantity
        commission = max(amount * self.commission_rate, self.min_commission)
        total_cost = amount + commission
        
        # 检查资金是否充足
        if portfolio.current_capital < total_cost:
            raise ValueError(f"资金不足: 需要 {total_cost:.2f}, 可用 {portfolio.current_capital:.2f}")
        
        # 检查持仓比例限制
        max_position_value = portfolio.total_value * settings.max_position_ratio
        if amount > max_position_value:
            raise ValueError(f"超出单只股票最大持仓限制: {max_position_value:.2f}")
        
        # 查找现有持仓
        result = await self.db.execute(
            select(Position).where(
                Position.portfolio_id == portfolio.id,
                Position.symbol == order.symbol
            )
        )
        position = result.scalar_one_or_none()
        
        if position:
            # 更新现有持仓
            new_quantity = position.quantity + order.quantity
            new_avg_cost = (
                (position.avg_cost * position.quantity + price * order.quantity) /
                new_quantity
            )
            position.quantity = new_quantity
            position.avg_cost = new_avg_cost
            position.current_price = price
            position.market_value = new_quantity * price
            position.unrealized_pnl = (price - new_avg_cost) * new_quantity
            position.unrealized_pnl_ratio = (price - new_avg_cost) / new_avg_cost
        else:
            # 检查持仓数量限制
            result = await self.db.execute(
                select(Position).where(Position.portfolio_id == portfolio.id)
            )
            positions = result.scalars().all()
            if len(positions) >= settings.max_holdings:
                raise ValueError(f"超出最大持仓数量限制: {settings.max_holdings}")
            
            # 创建新持仓
            position = Position(
                portfolio_id=portfolio.id,
                symbol=order.symbol,
                name=order.name,
                quantity=order.quantity,
                avg_cost=price,
                current_price=price,
                market_value=order.quantity * price,
                unrealized_pnl=0,
                unrealized_pnl_ratio=0
            )
            self.db.add(position)
        
        # 扣除资金
        portfolio.current_capital -= total_cost
        
        logger.info(
            f"买入成功: {order.symbol} {order.quantity}股 @ {price:.2f}, "
            f"费用: {total_cost:.2f}"
        )
    
    async def _execute_sell(
        self,
        portfolio: Portfolio,
        order: Order,
        price: float
    ):
        """执行卖出"""
        # 查找持仓
        result = await self.db.execute(
            select(Position).where(
                Position.portfolio_id == portfolio.id,
                Position.symbol == order.symbol
            )
        )
        position = result.scalar_one_or_none()
        
        if not position:
            raise ValueError(f"没有 {order.symbol} 的持仓")
        
        if position.quantity < order.quantity:
            raise ValueError(
                f"持仓不足: 持有 {position.quantity}股, 尝试卖出 {order.quantity}股"
            )
        
        # 计算收入
        amount = price * order.quantity
        commission = max(amount * self.commission_rate, self.min_commission)
        stamp_duty = amount * self.stamp_duty_rate
        net_income = amount - commission - stamp_duty
        
        # 更新持仓
        if position.quantity == order.quantity:
            # 全部卖出，删除持仓
            await self.db.delete(position)
        else:
            # 部分卖出
            position.quantity -= order.quantity
            position.current_price = price
            position.market_value = position.quantity * price
            position.unrealized_pnl = (price - position.avg_cost) * position.quantity
            position.unrealized_pnl_ratio = (price - position.avg_cost) / position.avg_cost
        
        # 增加资金
        portfolio.current_capital += net_income
        
        # 计算实现盈亏
        realized_pnl = (price - position.avg_cost) * order.quantity - commission - stamp_duty
        
        logger.info(
            f"卖出成功: {order.symbol} {order.quantity}股 @ {price:.2f}, "
            f"收入: {net_income:.2f}, 盈亏: {realized_pnl:.2f}"
        )
    
    async def update_positions_price(
        self,
        portfolio_id: int,
        prices: Dict[str, float]
    ):
        """更新持仓价格"""
        result = await self.db.execute(
            select(Position).where(Position.portfolio_id == portfolio_id)
        )
        positions = result.scalars().all()
        
        for position in positions:
            if position.symbol in prices:
                price = prices[position.symbol]
                position.current_price = price
                position.market_value = position.quantity * price
                position.unrealized_pnl = (price - position.avg_cost) * position.quantity
                position.unrealized_pnl_ratio = (price - position.avg_cost) / position.avg_cost
        
        await self.db.flush()
    
    async def record_pnl(self, portfolio_id: int):
        """记录盈亏"""
        status = await self.get_portfolio_status(portfolio_id)
        
        if not status:
            return
        
        # 获取昨日记录
        result = await self.db.execute(
            select(PnLRecord)
            .where(PnLRecord.portfolio_id == portfolio_id)
            .order_by(PnLRecord.timestamp.desc())
            .limit(1)
        )
        last_record = result.scalar_one_or_none()
        
        last_value = last_record.total_value if last_record else status["initial_capital"]
        daily_pnl = status["total_value"] - last_value
        
        record = PnLRecord(
            portfolio_id=portfolio_id,
            timestamp=datetime.utcnow(),
            total_value=status["total_value"],
            cash=status["cash"],
            market_value=status["market_value"],
            daily_pnl=daily_pnl,
            total_pnl=status["total_pnl"],
            total_pnl_ratio=status["total_pnl_ratio"]
        )
        
        self.db.add(record)
        await self.db.flush()
        
        logger.info(
            f"记录盈亏: 总资产 {status['total_value']:.2f}, "
            f"今日盈亏 {daily_pnl:.2f}, 累计收益率 {status['total_pnl_ratio']*100:.2f}%"
        )
    
    async def get_orders(
        self,
        portfolio_id: int,
        limit: int = 50
    ) -> List[Dict]:
        """获取订单历史"""
        result = await self.db.execute(
            select(Order)
            .where(Order.portfolio_id == portfolio_id)
            .order_by(Order.created_at.desc())
            .limit(limit)
        )
        orders = result.scalars().all()
        
        return [
            {
                "id": o.id,
                "symbol": o.symbol,
                "name": o.name,
                "action": o.action,
                "quantity": o.quantity,
                "price": o.price,
                "filled_price": o.filled_price,
                "filled_quantity": o.filled_quantity,
                "status": o.status,
                "reason": o.reason,
                "created_at": o.created_at.isoformat()
            }
            for o in orders
        ]
    
    async def get_pnl_history(
        self,
        portfolio_id: int,
        days: int = 30
    ) -> List[Dict]:
        """获取盈亏历史"""
        from datetime import timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.execute(
            select(PnLRecord)
            .where(
                PnLRecord.portfolio_id == portfolio_id,
                PnLRecord.timestamp >= start_date
            )
            .order_by(PnLRecord.timestamp.asc())
        )
        records = result.scalars().all()
        
        return [
            {
                "timestamp": r.timestamp.isoformat(),
                "total_value": r.total_value,
                "cash": r.cash,
                "market_value": r.market_value,
                "daily_pnl": r.daily_pnl,
                "total_pnl": r.total_pnl,
                "total_pnl_ratio": r.total_pnl_ratio
            }
            for r in records
        ]
