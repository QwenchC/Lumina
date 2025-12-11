"""
Lumina 明见量化 - WebSocket 实时推送
"""
import asyncio
import json
from datetime import datetime
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from app.core.database import async_session_factory
from app.services.data import data_service
from app.services.trading import TradingService
from app.services.strategy import strategy_scheduler

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """WebSocket 连接管理器"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.is_broadcasting = False
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket 连接: 当前连接数 {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket 断开: 当前连接数 {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """广播消息给所有连接"""
        if not self.active_connections:
            return
        
        message_json = json.dumps(message, ensure_ascii=False, default=str)
        
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception:
                disconnected.add(connection)
        
        # 清理断开的连接
        for conn in disconnected:
            self.active_connections.discard(conn)


manager = ConnectionManager()


async def broadcast_loop():
    """实时广播循环"""
    while True:
        try:
            if manager.active_connections:
                # 获取投资组合状态
                async with async_session_factory() as db:
                    trading_service = TradingService(db)
                    portfolio = await trading_service.get_or_create_portfolio()
                    status = await trading_service.get_portfolio_status(portfolio.id)
                
                # 广播状态更新
                await manager.broadcast({
                    "type": "portfolio_update",
                    "timestamp": datetime.now().isoformat(),
                    "data": status
                })
            
            # 每 5 秒更新一次
            await asyncio.sleep(5)
            
        except Exception as e:
            logger.error(f"广播循环错误: {e}")
            await asyncio.sleep(10)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket 端点"""
    await manager.connect(websocket)
    
    try:
        # 发送初始状态
        async with async_session_factory() as db:
            trading_service = TradingService(db)
            portfolio = await trading_service.get_or_create_portfolio()
            status = await trading_service.get_portfolio_status(portfolio.id)
            pnl_history = await trading_service.get_pnl_history(portfolio.id, 30)
        
        await websocket.send_json({
            "type": "initial_state",
            "data": {
                "portfolio": status,
                "pnl_history": pnl_history
            }
        })
        
        # 保持连接并处理消息
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30
                )
                
                # 处理客户端消息
                message = json.loads(data)
                
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                
                elif message.get("type") == "subscribe_quotes":
                    # 订阅行情
                    symbols = message.get("symbols", [])
                    if symbols:
                        quotes = await data_service.get_realtime_quote(symbols)
                        if not quotes.empty:
                            await websocket.send_json({
                                "type": "quotes_update",
                                "data": quotes.to_dict("records")
                            })
                
                elif message.get("type") == "trigger_analysis":
                    # 触发分析
                    await strategy_scheduler.manual_analysis()
                    await websocket.send_json({
                        "type": "analysis_triggered",
                        "message": "分析已触发"
                    })
                    
            except asyncio.TimeoutError:
                # 发送心跳
                await websocket.send_json({"type": "heartbeat"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket 错误: {e}")
        manager.disconnect(websocket)
