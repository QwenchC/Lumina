import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  RefreshCw,
  Bot
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import StatCard from '../components/StatCard'
import PnLChart from '../components/PnLChart'
import PositionTable from '../components/PositionTable'
import { portfolioApi } from '../services/api'
import type { Portfolio, PnLRecord } from '../types'

interface DashboardProps {
  portfolioData: Portfolio | null
  pnlHistory: PnLRecord[]
}

export default function Dashboard({ portfolioData, pnlHistory }: DashboardProps) {
  const queryClient = useQueryClient()

  // 获取订单历史
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => portfolioApi.getOrders(10).then(res => res.data),
    refetchInterval: 30000,
  })

  // 触发分析
  const analysisMutation = useMutation({
    mutationFn: portfolioApi.triggerAnalysis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
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

  // 加载状态
  if (!portfolioData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">正在加载数据...</p>
        </div>
      </div>
    )
  }

  const isProfitable = portfolioData.total_pnl >= 0
  const isDailyProfitable = portfolioData.daily_pnl >= 0

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">仪表盘</h2>
        <button
          onClick={() => analysisMutation.mutate()}
          disabled={analysisMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          <Bot className="w-4 h-4" />
          <span>{analysisMutation.isPending ? '分析中...' : '立即分析'}</span>
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总资产"
          value={formatCurrency(portfolioData.total_value)}
          subtitle={`初始资金: ${formatCurrency(portfolioData.initial_capital)}`}
          icon={<Wallet className="w-5 h-5 text-sky-400" />}
        />
        <StatCard
          title="累计盈亏"
          value={formatCurrency(portfolioData.total_pnl)}
          subtitle={formatPercent(portfolioData.total_pnl_ratio)}
          icon={isProfitable ? 
            <TrendingUp className="w-5 h-5 text-gain" /> : 
            <TrendingDown className="w-5 h-5 text-loss" />
          }
          trend={isProfitable ? 'up' : 'down'}
        />
        <StatCard
          title="今日盈亏"
          value={formatCurrency(portfolioData.daily_pnl)}
          icon={isDailyProfitable ? 
            <TrendingUp className="w-5 h-5 text-gain" /> : 
            <TrendingDown className="w-5 h-5 text-loss" />
          }
          trend={isDailyProfitable ? 'up' : 'down'}
        />
        <StatCard
          title="持仓数量"
          value={portfolioData.positions.length.toString()}
          subtitle={`可用资金: ${formatCurrency(portfolioData.cash)}`}
          icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
        />
      </div>

      {/* 盈亏曲线 */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">盈亏曲线</h3>
        <PnLChart data={pnlHistory} />
      </div>

      {/* 当前持仓 */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">当前持仓</h3>
        <PositionTable positions={portfolioData.positions} />
      </div>

      {/* 最近交易 */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">最近交易</h3>
        {orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    order.action === 'buy' ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'
                  }`}>
                    {order.action === 'buy' ? '买入' : '卖出'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{order.name || order.symbol}</p>
                    <p className="text-xs text-slate-400">{order.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white font-mono-num">
                    {order.filled_quantity || order.quantity} 股 @ {(order.filled_price || order.price).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleString('zh-CN')}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  order.status === 'filled' ? 'bg-green-500/20 text-green-400' :
                  order.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {order.status === 'filled' ? '已成交' :
                   order.status === 'failed' ? '失败' :
                   order.status === 'pending' ? '待处理' : order.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            暂无交易记录
          </div>
        )}
      </div>
    </div>
  )
}
