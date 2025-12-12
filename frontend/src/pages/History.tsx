import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  History as HistoryIcon, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download
} from 'lucide-react'
import api from '../services/api'
import StockDetailModal from '../components/StockDetailModal'
import type { Order } from '../types'

// 将 Order 转换为 StockDetailModal 需要的 Stock 类型
interface StockForModal {
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

const orderToStock = (order: Order): StockForModal => ({
  symbol: order.symbol,
  name: order.name,
  price: order.filled_price || order.price,
  change_pct: 0,
  change: 0,
  volume: 0,
  amount: 0,
  turnover_rate: 0,
  pe_ratio: 0,
  pb_ratio: 0,
  market_cap: 0,
  high: order.filled_price || order.price,
  low: order.filled_price || order.price,
  open: order.price,
  prev_close: order.price,
})

export default function History() {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const [limit, setLimit] = useState(100)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', limit],
    queryFn: async () => {
      const res = await api.get('/portfolio/orders', { params: { limit } })
      return res.data as Order[]
    },
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'filled':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
            <CheckCircle className="w-3 h-3" />
            已成交
          </span>
        )
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
            <Clock className="w-3 h-3" />
            待处理
          </span>
        )
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-500/20 text-slate-400">
            <XCircle className="w-3 h-3" />
            已取消
          </span>
        )
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
            <XCircle className="w-3 h-3" />
            失败
          </span>
        )
      default:
        return <span className="text-slate-400">{status}</span>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const allOrders = orders || []
  const filteredOrders = filter === 'all' 
    ? allOrders 
    : allOrders.filter(o => o.action === filter)

  // 统计数据
  const buyCount = allOrders.filter(o => o.action === 'buy').length
  const sellCount = allOrders.filter(o => o.action === 'sell').length
  const filledCount = allOrders.filter(o => o.status === 'filled').length

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HistoryIcon className="w-8 h-8 text-sky-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">交易历史</h1>
            <p className="text-sm text-slate-400">查看所有交易记录</p>
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          导出
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <HistoryIcon className="w-4 h-4" />
            <span className="text-sm">总交易数</span>
          </div>
          <p className="text-2xl font-bold text-white">{allOrders.length}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <ArrowUpCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm">买入次数</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{buyCount}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <ArrowDownCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm">卖出次数</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{sellCount}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">成交率</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {allOrders.length > 0 ? ((filledCount / allOrders.length) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm">筛选：</span>
        </div>
        <div className="flex gap-2">
          {(['all', 'buy', 'sell'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm ${
                filter === f
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {f === 'all' ? '全部' : f === 'buy' ? '买入' : '卖出'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-slate-400">显示：</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-slate-700 text-white rounded px-2 py-1 text-sm"
          >
            <option value={50}>50条</option>
            <option value={100}>100条</option>
            <option value={200}>200条</option>
            <option value={500}>500条</option>
          </select>
        </div>
      </div>

      {/* 交易记录表格 */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无交易记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">股票</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">方向</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">数量</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">价格</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">金额</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">原因</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isBuy = order.action === 'buy'
                  const price = order.filled_price || order.price
                  const quantity = order.filled_quantity || order.quantity
                  const amount = price * quantity
                  
                  return (
                    <tr 
                      key={order.id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-400">
                          {formatDateTime(order.created_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-white hover:text-sky-400 transition-colors">{order.name}</p>
                          <p className="text-xs text-slate-400">{order.symbol}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isBuy ? (
                          <span className="flex items-center justify-center gap-1 text-red-400">
                            <ArrowUpCircle className="w-4 h-4" />
                            <span className="text-sm">买入</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-green-400">
                            <ArrowDownCircle className="w-4 h-4" />
                            <span className="text-sm">卖出</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-white font-mono">
                          {quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-white font-mono">
                          {price.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-mono ${isBuy ? 'text-red-400' : 'text-green-400'}`}>
                          {isBuy ? '-' : '+'}{formatCurrency(amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-slate-400 truncate max-w-xs" title={order.reason}>
                          {order.reason || '-'}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 股票详情弹窗 */}
      {selectedOrder && (
        <StockDetailModal
          stock={orderToStock(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}
