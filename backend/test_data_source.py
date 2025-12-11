"""测试各种数据源的可用性"""
import requests
import re
import time

def test_tencent_api():
    """测试腾讯财经接口"""
    print("=" * 50)
    print("测试腾讯财经接口...")
    
    # 测试获取单只股票
    test_stocks = ['sh600519', 'sz000001', 'sh601318', 'sz300750', 'sh603288']
    url = f"https://qt.gtimg.cn/q={','.join(test_stocks)}"
    
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        print(f"Status: {r.status_code}")
        
        # Parse response
        for line in r.text.strip().split(';'):
            if line.strip():
                match = re.match(r'v_([a-z]{2}\d+)="(.*)"', line.strip())
                if match:
                    code = match.group(1)
                    data = match.group(2).split('~')
                    if len(data) > 32:
                        name = data[1]
                        price = data[3]
                        change_pct = data[32]
                        volume = data[6]
                        amount = data[37] if len(data) > 37 else 'N/A'
                        print(f"  {code}: {name} | 价格={price} | 涨跌={change_pct}% | 成交量={volume}")
        print("腾讯财经接口: ✓ 可用")
        return True
    except Exception as e:
        print(f"腾讯财经接口: ✗ 错误 - {e}")
        return False

def test_tencent_stock_list():
    """测试腾讯获取股票列表"""
    print("\n" + "=" * 50)
    print("测试腾讯股票列表接口...")
    
    # 腾讯的分页接口
    url = "https://qt.gtimg.cn/q=sh600000,sh600004,sh600006,sh600007,sh600008,sh600009,sh600010,sh600011,sh600012,sh600015"
    
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        count = 0
        for line in r.text.strip().split(';'):
            if line.strip() and '="' in line:
                count += 1
        print(f"获取到 {count} 只股票")
        return True
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_sina_index():
    """测试新浪财经指数接口"""
    print("\n" + "=" * 50)
    print("测试新浪财经指数接口...")
    
    # 用 list 参数试试
    url = "https://hq.sinajs.cn/list=s_sh000001,s_sz399001,s_sz399006"
    
    try:
        r = requests.get(url, headers={
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://finance.sina.com.cn'
        }, timeout=10)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print(f"Response: {r.text[:200]}...")
            return True
        return False
    except Exception as e:
        print(f"错误: {e}")
        return False

def test_akshare_alternatives():
    """测试 AKShare 其他接口"""
    print("\n" + "=" * 50)
    print("测试 AKShare 其他接口...")
    
    import akshare as ak
    
    # 测试不同的接口
    tests = [
        ("stock_zh_index_daily_em (指数日线)", lambda: ak.stock_zh_index_daily_em(symbol="sh000001")),
        ("stock_zh_a_hist (历史数据)", lambda: ak.stock_zh_a_hist(symbol="000001", period="daily", start_date="20241201", end_date="20241211")),
        ("stock_info_a_code_name (股票列表)", lambda: ak.stock_info_a_code_name()),
    ]
    
    for name, func in tests:
        try:
            start = time.time()
            df = func()
            elapsed = time.time() - start
            print(f"  {name}: ✓ 成功 ({len(df)} 行, {elapsed:.2f}s)")
        except Exception as e:
            print(f"  {name}: ✗ {type(e).__name__}: {str(e)[:50]}")

def test_eastmoney_api():
    """测试东方财富 Web API"""
    print("\n" + "=" * 50)
    print("测试东方财富 Web API (带 headers)...")
    
    url = "https://push2.eastmoney.com/api/qt/clist/get"
    params = {
        "pn": 1,
        "pz": 20,
        "po": 1,
        "np": 1,
        "fltt": 2,
        "invt": 2,
        "fid": "f3",
        "fs": "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23",
        "fields": "f1,f2,f3,f4,f5,f6,f7,f12,f14"
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://quote.eastmoney.com/',
        'Accept': '*/*'
    }
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=15)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            if 'data' in data and data['data']:
                items = data['data'].get('diff', [])
                print(f"获取到 {len(items)} 只股票")
                for item in items[:5]:
                    print(f"  {item.get('f12', 'N/A')}: {item.get('f14', 'N/A')} | 价格={item.get('f2', 'N/A')} | 涨跌={item.get('f3', 'N/A')}%")
                return True
        return False
    except Exception as e:
        print(f"错误: {type(e).__name__}: {e}")
        return False


if __name__ == "__main__":
    print("开始测试数据源...\n")
    
    results = {
        "腾讯财经": test_tencent_api(),
        "腾讯股票列表": test_tencent_stock_list(),
        "新浪财经": test_sina_index(),
        "东方财富API": test_eastmoney_api(),
    }
    
    # 测试 AKShare
    test_akshare_alternatives()
    
    print("\n" + "=" * 50)
    print("测试结果汇总:")
    for name, result in results.items():
        status = "✓ 可用" if result else "✗ 不可用"
        print(f"  {name}: {status}")
