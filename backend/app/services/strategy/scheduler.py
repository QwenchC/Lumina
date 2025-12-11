"""
Lumina 明见量化 - 策略调度服务
定时执行策略分析和交易决策
"""
import asyncio
from datetime import datetime, time
from typing import Optional
from loguru import logger
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.database import async_session_factory
from app.services.data import data_service
from app.services.llm import llm_engine
from app.services.trading import TradingService


class StrategyScheduler:
    """策略调度器"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        self.last_analysis_time: Optional[datetime] = None
        self.portfolio_id: Optional[int] = None
    
    async def init(self):
        """初始化调度器"""
        # 确保有默认投资组合
        async with async_session_factory() as db:
            trading_service = TradingService(db)
            portfolio = await trading_service.get_or_create_portfolio()
            self.portfolio_id = portfolio.id
            await db.commit()
        
        logger.info(f"策略调度器初始化完成，投资组合 ID: {self.portfolio_id}")
    
    def start(self):
        """启动调度器"""
        if self.is_running:
            return
        
        # 交易时段行情更新 (每分钟)
        self.scheduler.add_job(
            self._update_positions,
            CronTrigger(
                day_of_week='mon-fri',
                hour='9-11,13-15',
                minute='*',
                timezone='Asia/Shanghai'
            ),
            id='update_positions',
            replace_existing=True
        )
        
        # 开盘前分析 (9:25)
        self.scheduler.add_job(
            self._morning_analysis,
            CronTrigger(
                day_of_week='mon-fri',
                hour=9,
                minute=25,
                timezone='Asia/Shanghai'
            ),
            id='morning_analysis',
            replace_existing=True
        )
        
        # 午盘分析 (13:00)
        self.scheduler.add_job(
            self._afternoon_analysis,
            CronTrigger(
                day_of_week='mon-fri',
                hour=13,
                minute=0,
                timezone='Asia/Shanghai'
            ),
            id='afternoon_analysis',
            replace_existing=True
        )
        
        # 收盘后记录 (15:05)
        self.scheduler.add_job(
            self._daily_summary,
            CronTrigger(
                day_of_week='mon-fri',
                hour=15,
                minute=5,
                timezone='Asia/Shanghai'
            ),
            id='daily_summary',
            replace_existing=True
        )
        
        # 每小时定期分析 (交易时段)
        self.scheduler.add_job(
            self._hourly_analysis,
            CronTrigger(
                day_of_week='mon-fri',
                hour='10,11,14',
                minute=0,
                timezone='Asia/Shanghai'
            ),
            id='hourly_analysis',
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        logger.info("策略调度器已启动")
    
    def stop(self):
        """停止调度器"""
        if not self.is_running:
            return
        
        self.scheduler.shutdown()
        self.is_running = False
        logger.info("策略调度器已停止")
    
    async def _update_positions(self):
        """更新持仓价格"""
        try:
            async with async_session_factory() as db:
                trading_service = TradingService(db)
                status = await trading_service.get_portfolio_status(self.portfolio_id)
                
                if not status.get("positions"):
                    return
                
                # 获取持仓股票的最新价格
                symbols = [p["symbol"] for p in status["positions"]]
                quotes = await data_service.get_realtime_quote(symbols)
                
                if quotes.empty:
                    return
                
                prices = dict(zip(quotes["symbol"], quotes["price"]))
                await trading_service.update_positions_price(self.portfolio_id, prices)
                await db.commit()
                
        except Exception as e:
            logger.error(f"更新持仓价格失败: {e}")
    
    async def _morning_analysis(self):
        """早盘分析"""
        logger.info("开始早盘分析...")
        await self._run_analysis("morning")
    
    async def _afternoon_analysis(self):
        """午盘分析"""
        logger.info("开始午盘分析...")
        await self._run_analysis("afternoon")
    
    async def _hourly_analysis(self):
        """每小时分析"""
        logger.info("开始定时分析...")
        await self._run_analysis("hourly")
    
    async def _run_analysis(self, session_type: str = "regular"):
        """运行分析和决策"""
        try:
            async with async_session_factory() as db:
                trading_service = TradingService(db)
                
                # 获取投资组合状态
                portfolio_status = await trading_service.get_portfolio_status(self.portfolio_id)
                
                # 获取市场数据
                market_data = await self._get_market_data()
                
                # 获取候选股票
                candidates = await self._get_candidates()
                
                # 调用 LLM 分析
                result = await llm_engine.analyze_and_decide(
                    market_data=market_data,
                    portfolio=portfolio_status,
                    candidates=candidates
                )
                
                logger.info(
                    f"LLM 分析完成: 市场情绪={result.market_sentiment}, "
                    f"决策数量={len(result.decisions)}, "
                    f"用时={result.latency_ms}ms"
                )
                
                # 执行交易决策
                for decision in result.decisions:
                    if decision.action == "hold":
                        continue
                    
                    # 获取当前价格
                    quotes = await data_service.get_realtime_quote([decision.symbol])
                    if quotes.empty:
                        continue
                    
                    current_price = quotes.iloc[0]["price"]
                    
                    # 执行交易
                    order = await trading_service.execute_decision(
                        self.portfolio_id,
                        decision,
                        current_price
                    )
                    
                    if order and order.status == "filled":
                        logger.info(
                            f"交易执行: {decision.action.upper()} "
                            f"{decision.symbol} {decision.quantity}股 @ {current_price:.2f}"
                        )
                
                await db.commit()
                self.last_analysis_time = datetime.now()
                
        except Exception as e:
            logger.error(f"分析执行失败: {e}")
    
    async def _get_market_data(self) -> dict:
        """获取市场数据"""
        try:
            # 优先使用新浪实时指数（更稳定）
            indices = await data_service.get_index_quote()
            if indices and "s_sh000001" in indices:
                sh_data = indices["s_sh000001"]
                return {
                    "sh_index": sh_data["price"],
                    "sh_change": round(sh_data["change_pct"], 2),
                    "sentiment": "bullish" if sh_data["change_pct"] > 0.5 else ("bearish" if sh_data["change_pct"] < -0.5 else "neutral")
                }
        except Exception as e:
            logger.warning(f"获取实时指数失败: {e}")
        
        # 备选：尝试获取指数日线
        try:
            index_data = await data_service.get_index_daily("000001")
            
            if not index_data.empty:
                latest = index_data.iloc[-1]
                prev_close = index_data.iloc[-2]["close"] if len(index_data) > 1 else latest["close"]
                change = (latest["close"] - prev_close) / prev_close * 100
                
                return {
                    "sh_index": latest["close"],
                    "sh_change": round(change, 2),
                    "sentiment": "bullish" if change > 0.5 else ("bearish" if change < -0.5 else "neutral")
                }
        except Exception as e:
            logger.warning(f"获取指数日线失败: {e}")
        
        return {
            "sh_index": "N/A",
            "sh_change": "N/A",
            "sentiment": "unknown"
        }

    async def _get_candidates(self) -> list:
        """获取候选股票"""
        try:
            # 获取热门股票
            hot_stocks = await data_service.get_hot_stocks(20)
            
            if hot_stocks.empty:
                return []
            
            candidates = []
            for _, row in hot_stocks.iterrows():
                stock_info = {
                    "symbol": row["symbol"],
                    "name": row.get("name", ""),
                    "price": row.get("price", 0),
                    "change_pct": row.get("change_pct", 0),
                    "amount": row.get("amount", 0),
                    "turnover_rate": row.get("turnover_rate", 0),
                    "pe_ratio": row.get("pe_ratio", 0),
                    "market_cap": row.get("market_cap", 0)
                }
                
                # 尝试获取历史数据和技术指标（失败不影响主流程）
                try:
                    hist = await data_service.get_historical_data(
                        row["symbol"],
                        period="daily"
                    )
                    
                    # 添加技术指标
                    if not hist.empty:
                        latest = hist.iloc[-1]
                        stock_info.update({
                            "ma5": latest.get("ma5"),
                            "ma20": latest.get("ma20"),
                            "rsi": latest.get("rsi"),
                            "macd": latest.get("macd")
                        })
                except Exception:
                    # 历史数据获取失败，使用 N/A
                    stock_info.update({
                        "ma5": "N/A",
                        "ma20": "N/A", 
                        "rsi": "N/A",
                        "macd": "N/A"
                    })
                
                candidates.append(stock_info)
            
            return candidates
            
        except Exception as e:
            logger.warning(f"获取候选股票失败: {e}")
            return []
    
    async def _daily_summary(self):
        """每日收盘总结"""
        try:
            async with async_session_factory() as db:
                trading_service = TradingService(db)
                
                # 更新最终持仓价格
                await self._update_positions()
                
                # 记录盈亏
                await trading_service.record_pnl(self.portfolio_id)
                
                # 获取状态
                status = await trading_service.get_portfolio_status(self.portfolio_id)
                
                logger.info(
                    f"每日收盘总结: "
                    f"总资产={status['total_value']:.2f}, "
                    f"今日盈亏={status['daily_pnl']:.2f}, "
                    f"累计收益率={status['total_pnl_ratio']*100:.2f}%"
                )
                
                await db.commit()
                
        except Exception as e:
            logger.error(f"每日总结失败: {e}")
    
    async def manual_analysis(self) -> dict:
        """手动触发分析"""
        logger.info("手动触发分析...")
        await self._run_analysis("manual")
        
        async with async_session_factory() as db:
            trading_service = TradingService(db)
            return await trading_service.get_portfolio_status(self.portfolio_id)


# 全局调度器实例
strategy_scheduler = StrategyScheduler()
