import { TrendingUp, TrendingDown, Lock, Unlock } from 'lucide-react'
import type { Position } from '../types'

interface PositionTableProps {
  positions: Position[]
  onStockClick?: (position: Position) => void
}

export default function PositionTable({ positions, onStockClick }: PositionTableProps) {
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

  if (!positions || positions.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        暂无持仓
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">股票</th>
            <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">状态</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">持仓数量</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">成本价</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">现价</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">市值</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">盈亏</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">盈亏比例</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => {
            const isProfitable = position.unrealized_pnl >= 0
            const canSell = position.can_sell !== false  // 默认可卖
            
            return (
              <tr 
                key={position.symbol}
                className={`border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors ${onStockClick ? 'cursor-pointer' : ''}`}
                onClick={() => onStockClick?.(position)}
              >
                <td className="py-4 px-4">
                  <div>
                    <p className="text-sm font-medium text-white hover:text-sky-400 transition-colors">{position.name}</p>
                    <p className="text-xs text-slate-400">{position.symbol}</p>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  {canSell ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                      <Unlock className="w-3 h-3" />可卖
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400" title={`买入日期: ${position.last_buy_date}`}>
                      <Lock className="w-3 h-3" />T+1
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm text-white font-mono-num">
                    {position.quantity.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm text-white font-mono-num">
                    {position.avg_cost.toFixed(2)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm text-white font-mono-num">
                    {position.current_price.toFixed(2)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm text-white font-mono-num">
                    {formatCurrency(position.market_value)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {isProfitable ? (
                      <TrendingUp className="w-4 h-4 text-gain" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-loss" />
                    )}
                    <span className={`text-sm font-mono-num ${isProfitable ? 'text-gain' : 'text-loss'}`}>
                      {formatCurrency(position.unrealized_pnl)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`text-sm font-mono-num ${isProfitable ? 'text-gain' : 'text-loss'}`}>
                    {formatPercent(position.unrealized_pnl_ratio)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
