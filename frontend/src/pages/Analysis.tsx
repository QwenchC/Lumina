import { useQuery } from '@tanstack/react-query'
import { 
  LineChart as LineChartIcon, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Percent,
  BarChart3
} from 'lucide-react'
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine
} from 'recharts'
import api from '../services/api'
import type { PnLRecord } from '../types'

export default function Analysis() {
  const { data: pnlHistory, isLoading } = useQuery({
    queryKey: ['pnl', 90],
    queryFn: async () => {
      const res = await api.get('/portfolio/pnl', { params: { days: 90 } })
      return res.data as PnLRecord[]
    },
  })

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await api.get('/portfolio/status')
      return res.data
    },
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return sign + (value * 100).toFixed(2) + '%'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const history = pnlHistory || []
  
  // 计算统计数据
  const totalPnL = portfolio?.total_pnl || 0
  const totalPnLRatio = portfolio?.total_pnl_ratio || 0
  const dailyPnL = portfolio?.daily_pnl || 0
  
  // 计算周收益和月收益
  const weekPnL = history.slice(-7).reduce((sum, r) => sum + r.daily_pnl, 0)
  const monthPnL = history.slice(-30).reduce((sum, r) => sum + r.daily_pnl, 0)
  
  // 计算最大回撤
  let maxDrawdown = 0
  let peak = history[0]?.total_value || 0
  for (const record of history) {
    if (record.total_value > peak) {
      peak = record.total_value
    }
    const drawdown = (peak - record.total_value) / peak
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }
  
  // 计算胜率
  const winDays = history.filter(r => r.daily_pnl > 0).length
  const winRate = history.length > 0 ? winDays / history.length : 0

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <LineChartIcon className="w-8 h-8 text-sky-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">盈亏分析</h1>
          <p className="text-sm text-slate-400">查看投资组合收益表现</p>
        </div>
      </div>

      {/* 收益统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">累计收益</span>
          </div>
          <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            {formatCurrency(totalPnL)}
          </p>
          <p className={`text-sm ${totalPnLRatio >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            {formatPercent(totalPnLRatio)}
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">今日盈亏</span>
          </div>
          <p className={`text-2xl font-bold ${dailyPnL >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            {formatCurrency(dailyPnL)}
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">本周收益</span>
          </div>
          <p className={`text-2xl font-bold ${weekPnL >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            {formatCurrency(weekPnL)}
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">本月收益</span>
          </div>
          <p className={`text-2xl font-bold ${monthPnL >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            {formatCurrency(monthPnL)}
          </p>
        </div>
      </div>

      {/* 风险指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Percent className="w-4 h-4" />
            <span className="text-sm">胜率</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {(winRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400">{winDays} 盈利 / {history.length} 交易日</p>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm">最大回撤</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">
            -{(maxDrawdown * 100).toFixed(2)}%
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">初始资金</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(portfolio?.initial_capital || 1000000)}
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">当前总资产</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(portfolio?.total_value || 0)}
          </p>
        </div>
      </div>

      {/* 收益曲线 */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">收益曲线</h2>
        {history.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => value.slice(5, 10)}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => (value / 10000).toFixed(0) + '万'}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <ReferenceLine 
                  y={portfolio?.initial_capital || 1000000} 
                  stroke="#6b7280" 
                  strokeDasharray="5 5"
                  label={{ value: '初始资金', fill: '#9ca3af', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="total_value"
                  fill={totalPnL >= 0 ? '#ef444420' : '#22c55e20'}
                  stroke={totalPnL >= 0 ? '#ef4444' : '#22c55e'}
                  strokeWidth={2}
                  name="总资产"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <LineChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无收益数据</p>
              <p className="text-sm mt-2">开始交易后将显示收益曲线</p>
            </div>
          </div>
        )}
      </div>

      {/* 每日盈亏 */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">每日盈亏</h2>
        {history.length > 0 ? (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={history.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => value.slice(5, 10)}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => (value / 1000).toFixed(0) + 'k'}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), '日盈亏']}
                />
                <ReferenceLine y={0} stroke="#6b7280" />
                <Line
                  type="monotone"
                  dataKey="daily_pnl"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-60 flex items-center justify-center text-slate-400">
            暂无数据
          </div>
        )}
      </div>
    </div>
  )
}
