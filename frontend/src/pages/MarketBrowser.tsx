import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Search,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  BarChart2,
  Flame,
  Activity
} from 'lucide-react'
import api from '../services/api'
import StockTable from '../components/StockTable'
import IndexCard from '../components/IndexCard'
import StockDetailModal from '../components/StockDetailModal'

type TabType = 'hot' | 'gainers' | 'losers' | 'volume' | 'turnover'

interface Stock {
  symbol: string
  name: string
  price: number
  change_pct: number
  change: number
  volume: number
  amount: number
  turnover_rate: number
  pe_ratio: number
  pb_ratio: number
  market_cap: number
  high: number
  low: number
  open: number
  prev_close: number
}

interface IndexData {
  name: string
  price: number
  change: number
  change_pct: number
  volume: number
  amount: number
}

export default function MarketBrowser() {
  const [activeTab, setActiveTab] = useState<TabType>('hot')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  
  // 获取指数数据
  const { data: indices, isLoading: indicesLoading, refetch: refetchIndices } = useQuery({
    queryKey: ['indices'],
    queryFn: async () => {
      const res = await api.get('/market/indices')
      return res.data as Record<string, IndexData>
    },
    refetchInterval: 10000, // 10秒刷新
  })
  
  // 获取股票列表
  const { data: stocks, isLoading: stocksLoading, refetch: refetchStocks } = useQuery({
    queryKey: ['stocks', activeTab],
    queryFn: async () => {
      let endpoint = '/market/hot'
      switch (activeTab) {
        case 'gainers':
          endpoint = '/market/gainers'
          break
        case 'losers':
          endpoint = '/market/losers'
          break
        case 'volume':
          endpoint = '/market/volume-leaders'
          break
        case 'turnover':
          endpoint = '/market/turnover-leaders'
          break
      }
      const res = await api.get(endpoint, { params: { limit: 50 } })
      return res.data as Stock[]
    },
    refetchInterval: 30000, // 30秒刷新
  })
  
  // 搜索股票
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return []
      const res = await api.get('/market/search', { params: { keyword: searchQuery } })
      return res.data as Stock[]
    },
    enabled: searchQuery.length > 0,
  })
  
  const handleRefresh = () => {
    refetchIndices()
    refetchStocks()
  }
  
  const tabs = [
    { id: 'hot', label: '热门', icon: Flame },
    { id: 'gainers', label: '涨幅榜', icon: ArrowUp },
    { id: 'losers', label: '跌幅榜', icon: ArrowDown },
    { id: 'volume', label: '成交量', icon: BarChart2 },
    { id: 'turnover', label: '换手率', icon: Activity },
  ] as const
  
  const displayStocks = searchQuery.trim() ? searchResults : stocks
  
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">市场行情</h1>
          <p className="text-slate-400 text-sm mt-1">实时股票市场数据浏览</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>
      
      {/* 指数概览 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {indicesLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
              <div className="h-6 bg-slate-700 rounded w-24"></div>
            </div>
          ))
        ) : (
          indices && Object.entries(indices).map(([code, data]) => (
            <IndexCard key={code} code={code} data={data} />
          ))
        )}
      </div>
      
      {/* 搜索栏 */}
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索股票代码或名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* 标签页 */}
      {!searchQuery.trim() && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}
      
      {/* 股票列表 */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        {stocksLoading || searchLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-2" />
            <p className="text-slate-400">加载中...</p>
          </div>
        ) : (
          <StockTable 
            stocks={displayStocks || []} 
            onSelectStock={setSelectedStock}
          />
        )}
      </div>
      
      {/* 股票详情弹窗 */}
      {selectedStock && (
        <StockDetailModal 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </div>
  )
}
