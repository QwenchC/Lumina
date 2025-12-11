"""
Lumina 明见量化 - 市场数据 API
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.services.data import data_service

router = APIRouter(prefix="/market", tags=["Market"])


class StockQuote(BaseModel):
    symbol: str
    name: str
    price: float
    change_pct: float
    change: float
    volume: float
    amount: float
    open: float
    high: float
    low: float
    prev_close: float
    turnover_rate: Optional[float] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    market_cap: Optional[float] = None


class HistoricalData(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    amount: Optional[float] = None
    change_pct: Optional[float] = None
    ma5: Optional[float] = None
    ma10: Optional[float] = None
    ma20: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None


@router.get("/quote/{symbol}", response_model=StockQuote)
async def get_quote(symbol: str):
    """获取股票实时行情"""
    quotes = await data_service.get_realtime_quote([symbol])
    
    if quotes.empty:
        raise HTTPException(status_code=404, detail="股票不存在或无数据")
    
    row = quotes.iloc[0]
    return StockQuote(
        symbol=row.get("symbol", symbol),
        name=row.get("name", ""),
        price=row.get("price", 0),
        change_pct=row.get("change_pct", 0),
        change=row.get("change", 0),
        volume=row.get("volume", 0),
        amount=row.get("amount", 0),
        open=row.get("open", 0),
        high=row.get("high", 0),
        low=row.get("low", 0),
        prev_close=row.get("prev_close", 0),
        turnover_rate=row.get("turnover_rate"),
        pe_ratio=row.get("pe_ratio"),
        pb_ratio=row.get("pb_ratio"),
        market_cap=row.get("market_cap")
    )


@router.get("/quotes")
async def get_quotes(symbols: str = Query(..., description="股票代码，逗号分隔")):
    """批量获取股票行情"""
    symbol_list = [s.strip() for s in symbols.split(",")]
    quotes = await data_service.get_realtime_quote(symbol_list)
    
    if quotes.empty:
        return []
    
    return quotes.to_dict("records")


@router.get("/history/{symbol}", response_model=List[HistoricalData])
async def get_history(
    symbol: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    period: str = "daily"
):
    """获取历史K线数据"""
    df = await data_service.get_historical_data(
        symbol,
        start_date=start_date,
        end_date=end_date,
        period=period
    )
    
    if df.empty:
        return []
    
    # 转换为响应格式
    result = []
    for _, row in df.iterrows():
        result.append(HistoricalData(
            date=row["date"].strftime("%Y-%m-%d"),
            open=row["open"],
            high=row["high"],
            low=row["low"],
            close=row["close"],
            volume=row["volume"],
            amount=row.get("amount"),
            change_pct=row.get("change_pct"),
            ma5=row.get("ma5") if not (row.get("ma5") is None or (isinstance(row.get("ma5"), float) and row.get("ma5") != row.get("ma5"))) else None,
            ma10=row.get("ma10") if not (row.get("ma10") is None or (isinstance(row.get("ma10"), float) and row.get("ma10") != row.get("ma10"))) else None,
            ma20=row.get("ma20") if not (row.get("ma20") is None or (isinstance(row.get("ma20"), float) and row.get("ma20") != row.get("ma20"))) else None,
            rsi=row.get("rsi") if not (row.get("rsi") is None or (isinstance(row.get("rsi"), float) and row.get("rsi") != row.get("rsi"))) else None,
            macd=row.get("macd") if not (row.get("macd") is None or (isinstance(row.get("macd"), float) and row.get("macd") != row.get("macd"))) else None
        ))
    
    return result


@router.get("/hot")
async def get_hot_stocks(limit: int = 20):
    """获取热门股票"""
    df = await data_service.get_hot_stocks(limit)
    
    if df.empty:
        return []
    
    return df.to_dict("records")


@router.get("/screen")
async def screen_stocks(
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_market_cap: Optional[float] = None,
    max_market_cap: Optional[float] = None,
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_turnover: Optional[float] = None,
    max_turnover: Optional[float] = None,
    min_change_pct: Optional[float] = None,
    max_change_pct: Optional[float] = None,
    limit: int = 100
):
    """股票筛选"""
    df = await data_service.screen_stocks(
        min_price=min_price,
        max_price=max_price,
        min_market_cap=min_market_cap,
        max_market_cap=max_market_cap,
        min_pe=min_pe,
        max_pe=max_pe,
        min_turnover=min_turnover,
        max_turnover=max_turnover,
        min_change_pct=min_change_pct,
        max_change_pct=max_change_pct
    )
    
    if df.empty:
        return []
    
    return df.head(limit).to_dict("records")


@router.get("/indices")
async def get_indices():
    """获取主要指数行情"""
    indices = await data_service.get_index_quote()
    return indices


@router.get("/gainers")
async def get_gainers(limit: int = 50):
    """获取涨幅榜"""
    df = await data_service.get_gainers(limit)
    if df.empty:
        return []
    return df.to_dict("records")


@router.get("/losers")
async def get_losers(limit: int = 50):
    """获取跌幅榜"""
    df = await data_service.get_losers(limit)
    if df.empty:
        return []
    return df.to_dict("records")


@router.get("/volume-leaders")
async def get_volume_leaders(limit: int = 50):
    """获取成交量排行"""
    df = await data_service.get_volume_leaders(limit)
    if df.empty:
        return []
    return df.to_dict("records")


@router.get("/turnover-leaders")
async def get_turnover_leaders(limit: int = 50):
    """获取换手率排行"""
    df = await data_service.get_turnover_leaders(limit)
    if df.empty:
        return []
    return df.to_dict("records")


@router.get("/all")
async def get_all_stocks():
    """获取全市场股票行情"""
    df = await data_service.get_all_stocks_quote()
    if df.empty:
        return []
    return df.to_dict("records")


@router.get("/search")
async def search_stocks(keyword: str):
    """搜索股票"""
    stocks = await data_service.get_stock_list()
    
    if stocks.empty:
        return []
    
    # 简单搜索
    mask = (
        stocks["symbol"].str.contains(keyword, case=False, na=False) |
        stocks["name"].str.contains(keyword, case=False, na=False)
    )
    
    result = stocks[mask].head(20)
    return result.to_dict("records")
