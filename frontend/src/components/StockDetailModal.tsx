import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  X, 
  TrendingUp, 
  TrendingDown,
  BarChart2
} from 'lucide-react'
import api from '../services/api'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line
} from 'recharts'

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

interface HistoryData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change_pct: number
  ma5?: number
  ma10?: number
  ma20?: number
}

interface StockDetailModalProps {
  stock: Stock
  onClose: () => void
}

export default function StockDetailModal({ stock, onClose }: StockDetailModalProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  
  // 获取历史数据
  const { data: history, isLoading } = useQuery({
    queryKey: ['history', stock.symbol, period],
    queryFn: async () => {
      const res = await api.get(`/market/history/${stock.symbol}`, {
        params: { period }
      })
      return res.data as HistoryData[]
    },
  })
  
  // 按 ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])
  
  const isUp = stock.change_pct > 0
  const isDown = stock.change_pct < 0
  const priceColor = isUp ? 'text-red-400' : isDown ? 'text-green-400' : 'text-white'
  const bgColor = isUp ? 'from-red-900/20' : isDown ? 'from-green-900/20' : 'from-slate-800'
  
  const formatMarketCap = (cap: number) => {
    if (cap >= 10000) {
      return (cap / 10000).toFixed(2) + '万亿'
    }
    return cap.toFixed(2) + '亿'
  }
  
  const infoItems = [
    { label: '今开', value: stock.open?.toFixed(2) || '-' },
    { label: '最高', value: stock.high?.toFixed(2) || '-' },
    { label: '最低', value: stock.low?.toFixed(2) || '-' },
    { label: '昨收', value: stock.prev_close?.toFixed(2) || '-' },
    { label: '换手率', value: stock.turnover_rate ? stock.turnover_rate.toFixed(2) + '%' : '-' },
    { label: '市盈率', value: stock.pe_ratio?.toFixed(2) || '-' },
    { label: '市净率', value: stock.pb_ratio?.toFixed(2) || '-' },
    { label: '总市值', value: stock.market_cap ? formatMarketCap(stock.market_cap) : '-' },
  ]
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-b ${bgColor} to-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden`}>
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{stock.name}</h2>
              <span className="text-sm text-slate-400">{stock.symbol}</span>
            </div>
            <div className={`flex items-center gap-2 ${priceColor}`}>
              <span className="text-3xl font-bold">{stock.price.toFixed(2)}</span>
              <div className="flex flex-col">
                <span className="text-sm">
                  {isUp ? '+' : ''}{stock.change.toFixed(2)}
                </span>
                <span className="text-sm">
                  {isUp ? '+' : ''}{stock.change_pct.toFixed(2)}%
                </span>
              </div>
              {isUp ? (
                <TrendingUp className="w-6 h-6" />
              ) : isDown ? (
                <TrendingDown className="w-6 h-6" />
              ) : null}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 基本信息 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {infoItems.map((item) => (
              <div key={item.label} className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                <div className="text-sm font-medium text-white">{item.value}</div>
              </div>
            ))}
          </div>
          
          {/* K线图 */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-sky-400" />
                走势图
              </h3>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded text-sm ${
                      period === p
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {p === 'daily' ? '日K' : p === 'weekly' ? '周K' : '月K'}
                  </button>
                ))}
              </div>
            </div>
            
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full"></div>
              </div>
            ) : history && history.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={history.slice(-60)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={12}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      fontSize={12}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      fill="#0ea5e920"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="ma5"
                      stroke="#f59e0b"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ma10"
                      stroke="#10b981"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ma20"
                      stroke="#ec4899"
                      strokeWidth={1}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                暂无历史数据
              </div>
            )}
            
            {/* 均线图例 */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-sky-500"></div>
                <span className="text-xs text-slate-400">收盘价</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-amber-500"></div>
                <span className="text-xs text-slate-400">MA5</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-emerald-500"></div>
                <span className="text-xs text-slate-400">MA10</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-pink-500"></div>
                <span className="text-xs text-slate-400">MA20</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
