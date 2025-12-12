import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  PieChart,
  DollarSign
} from 'lucide-react'
import api from '../services/api'
import StockDetailModal from '../components/StockDetailModal'
import type { Portfolio, Position } from '../types'

// 将 Position 转换为 StockDetailModal 需要的 Stock 类型
const positionToStock = (position: Position) => ({
  symbol: position.symbol,
  name: position.name,
  price: position.current_price,
  change_pct: position.unrealized_pnl_ratio * 100,
  change: position.current_price - position.avg_cost,
  volume: 0,
  amount: 0,
  turnover_rate: 0,
  pe_ratio: 0,
  pb_ratio: 0,
  market_cap: 0,
  high: position.current_price,
  low: position.current_price,
  open: position.avg_cost,
  prev_close: position.avg_cost,
})

export default function Positions() {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  
  const { data: portfolio, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await api.get('/portfolio/status')
      return res.data as Portfolio
    },
    refetchInterval: 10000,
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

  const positions = portfolio?.positions || []
  const totalMarketValue = positions.reduce((sum, p) => sum + p.market_value, 0)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-sky-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">持仓管理</h1>
            <p className="text-sm text-slate-400">查看和管理当前持仓</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 持仓概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm">持仓数量</span>
          </div>
          <p className="text-2xl font-bold text-white">{positions.length} 只</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <PieChart className="w-4 h-4" />
            <span className="text-sm">持仓市值</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalMarketValue)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">可用资金</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(portfolio?.cash || 0)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">仓位比例</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {portfolio?.total_value ? ((totalMarketValue / portfolio.total_value) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* 持仓列表 */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">持仓明细</h2>
        </div>
        
        {positions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无持仓</p>
            <p className="text-sm mt-2">AI 分析后会自动建立持仓</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">股票</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">持仓数量</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">成本价</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">现价</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">市值</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">盈亏</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">盈亏比例</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">状态</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => {
                  const isProfitable = position.unrealized_pnl >= 0
                  const canSell = (position as any).can_sell !== false
                  
                  return (
                    <tr 
                      key={position.symbol}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedPosition(position)}
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm font-medium text-white hover:text-sky-400 transition-colors">{position.name}</p>
                          <p className="text-xs text-slate-400">{position.symbol}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-white font-mono">
                          {position.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-white font-mono">
                          {position.avg_cost.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-white font-mono">
                          {position.current_price.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm text-white font-mono">
                          {formatCurrency(position.market_value)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isProfitable ? (
                            <TrendingUp className="w-4 h-4 text-red-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-green-400" />
                          )}
                          <span className={`text-sm font-mono ${isProfitable ? 'text-red-400' : 'text-green-400'}`}>
                            {formatCurrency(position.unrealized_pnl)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`text-sm font-mono ${isProfitable ? 'text-red-400' : 'text-green-400'}`}>
                          {formatPercent(position.unrealized_pnl_ratio)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {canSell ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                            可卖出
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400" title="T+1限制">
                            T+1
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 持仓分布饼图占位 */}
      {positions.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">持仓分布</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {positions.map((p) => (
              <div key={p.symbol} className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)` }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">
                    {((p.market_value / totalMarketValue) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 股票详情弹窗 */}
      {selectedPosition && (
        <StockDetailModal
          stock={positionToStock(selectedPosition)}
          onClose={() => setSelectedPosition(null)}
        />
      )}
    </div>
  )
}
