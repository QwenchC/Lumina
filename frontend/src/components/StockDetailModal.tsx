import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  X, 
  TrendingUp, 
  TrendingDown,
  BarChart2,
  Clock,
  RefreshCw
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
  Line,
  ReferenceLine
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

interface MinuteData {
  time: string
  price: number
  volume: number
  total_volume: number
  avg_price: number
  change_pct: number
  prev_close: number
}

interface StockDetailModalProps {
  stock: Stock
  onClose: () => void
}

type ChartType = 'minute' | 'daily' | 'weekly' | 'monthly'

export default function StockDetailModal({ stock, onClose }: StockDetailModalProps) {
  const [chartType, setChartType] = useState<ChartType>('minute')
  
  // 获取分时数据
  const { data: minuteData, isLoading: minuteLoading, refetch: refetchMinute } = useQuery({
    queryKey: ['minute', stock.symbol],
    queryFn: async () => {
      const res = await api.get(`/market/minute/${stock.symbol}`)
      return res.data as MinuteData[]
    },
    enabled: chartType === 'minute',
    refetchInterval: chartType === 'minute' ? 15000 : false, // 15秒自动刷新
  })
  
  // 获取历史K线数据
  const klinePeriod = chartType === 'minute' ? 'daily' : chartType
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['history', stock.symbol, klinePeriod],
    queryFn: async () => {
      const res = await api.get(`/market/history/${stock.symbol}`, {
        params: { period: klinePeriod }
      })
      return res.data as HistoryData[]
    },
    enabled: chartType !== 'minute',
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
          
          {/* 走势图 */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                {chartType === 'minute' ? (
                  <Clock className="w-5 h-5 text-sky-400" />
                ) : (
                  <BarChart2 className="w-5 h-5 text-sky-400" />
                )}
                {chartType === 'minute' ? '分时走势' : 'K线走势'}
              </h3>
              <div className="flex items-center gap-2">
                {chartType === 'minute' && (
                  <button
                    onClick={() => refetchMinute()}
                    className="p-1.5 rounded text-slate-400 hover:bg-slate-700 hover:text-sky-400"
                    title="刷新"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                {(['minute', 'daily', 'weekly', 'monthly'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartType(t)}
                    className={`px-3 py-1 rounded text-sm ${
                      chartType === t
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {t === 'minute' ? '分时' : t === 'daily' ? '日K' : t === 'weekly' ? '周K' : '月K'}
                  </button>
                ))}
              </div>
            </div>
            
            {(chartType === 'minute' ? minuteLoading : historyLoading) ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full"></div>
              </div>
            ) : chartType === 'minute' ? (
              // 分时图
              minuteData && minuteData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={minuteData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#9ca3af"
                        fontSize={11}
                        tickFormatter={(value: string) => {
                          // 只显示整点和半点
                          if (value && (value.endsWith(':00') || value.endsWith(':30'))) {
                            return value
                          }
                          return ''
                        }}
                        interval={0}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        fontSize={11}
                        domain={['auto', 'auto']}
                        tickFormatter={(value: number) => value.toFixed(2)}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as MinuteData
                            return (
                              <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
                                <p className="text-white font-medium">{data.time}</p>
                                <p className={`${data.change_pct >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  价格: {data.price.toFixed(2)} ({data.change_pct >= 0 ? '+' : ''}{data.change_pct.toFixed(2)}%)
                                </p>
                                <p className="text-amber-400">均价: {data.avg_price.toFixed(2)}</p>
                                <p className="text-slate-400">成交: {(data.volume / 100).toFixed(0)}手</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      {/* 昨收参考线 */}
                      {minuteData[0]?.prev_close && (
                        <ReferenceLine 
                          y={minuteData[0].prev_close} 
                          stroke="#6b7280" 
                          strokeDasharray="5 5"
                        />
                      )}
                      {/* 价格线 */}
                      <Area
                        type="monotone"
                        dataKey="price"
                        fill={isUp ? '#ef444420' : '#22c55e20'}
                        stroke={isUp ? '#ef4444' : '#22c55e'}
                        strokeWidth={1.5}
                      />
                      {/* 均价线 */}
                      <Line
                        type="monotone"
                        dataKey="avg_price"
                        stroke="#f59e0b"
                        strokeWidth={1}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  暂无分时数据（非交易时段）
                </div>
              )
            ) : (
              // K线图
              history && history.length > 0 ? (
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
              )
            )}
            
            {/* 图例 */}
            <div className="flex items-center justify-center gap-6 mt-4">
              {chartType === 'minute' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-0.5 ${isUp ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-xs text-slate-400">价格</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-amber-500"></div>
                    <span className="text-xs text-slate-400">均价</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-gray-500 border-dashed"></div>
                    <span className="text-xs text-slate-400">昨收</span>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
