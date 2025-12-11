"""测试数据服务"""
import asyncio
import sys
sys.path.insert(0, ".")

from app.services.data import data_service


async def test_data_service():
    print("=" * 60)
    print("测试数据服务")
    print("=" * 60)
    
    # 1. 测试单只股票行情
    print("\n1. 测试单只股票行情...")
    quotes = await data_service.get_realtime_quote(["600519", "000001", "300750"])
    print(f"   获取到 {len(quotes)} 只股票")
    if not quotes.empty:
        for _, row in quotes.iterrows():
            symbol = row["symbol"]
            name = row["name"]
            price = row["price"]
            change = row["change_pct"]
            print(f"   {symbol} {name}: 价格={price} 涨跌={change}%")
    
    # 2. 测试指数行情
    print("\n2. 测试指数行情...")
    indices = await data_service.get_index_quote()
    for code, info in indices.items():
        print(f"   {info['name']}: {info['price']} ({info['change_pct']}%)")
    
    # 3. 测试历史数据
    print("\n3. 测试历史数据 (000001)...")
    hist = await data_service.get_historical_data("000001", period="daily")
    if not hist.empty:
        print(f"   获取到 {len(hist)} 条记录")
        print(f"   最新: {hist.iloc[-1]['date'].strftime('%Y-%m-%d')} 收盘={hist.iloc[-1]['close']}")
    
    # 4. 测试热门股票
    print("\n4. 测试热门股票...")
    hot = await data_service.get_hot_stocks(10)
    if not hot.empty:
        print(f"   获取到 {len(hot)} 只热门股票")
        for i, (_, row) in enumerate(hot.head(5).iterrows()):
            print(f"   Top{i+1}: {row['symbol']} {row['name']} 成交额={row['amount']}万")
    
    # 5. 测试涨幅榜
    print("\n5. 测试涨幅榜...")
    gainers = await data_service.get_gainers(10)
    if not gainers.empty:
        print(f"   获取到 {len(gainers)} 只股票")
        for i, (_, row) in enumerate(gainers.head(5).iterrows()):
            print(f"   Top{i+1}: {row['symbol']} {row['name']} 涨幅={row['change_pct']}%")
    
    # 6. 测试跌幅榜
    print("\n6. 测试跌幅榜...")
    losers = await data_service.get_losers(10)
    if not losers.empty:
        print(f"   获取到 {len(losers)} 只股票")
        for i, (_, row) in enumerate(losers.head(5).iterrows()):
            print(f"   Top{i+1}: {row['symbol']} {row['name']} 跌幅={row['change_pct']}%")
    
    # 7. 测试搜索
    print("\n7. 测试搜索 (银行)...")
    search_result = await data_service.search_stocks("银行")
    if not search_result.empty:
        print(f"   找到 {len(search_result)} 只股票")
        for _, row in search_result.head(5).iterrows():
            print(f"   {row['symbol']} {row['name']}")
    
    await data_service.close()
    print("\n" + "=" * 60)
    print("测试完成!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_data_service())
