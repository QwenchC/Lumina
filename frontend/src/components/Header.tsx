import { Wifi, WifiOff, TrendingUp, TrendingDown } from 'lucide-react'
import type { Portfolio } from '../types'

interface HeaderProps {
  isConnected: boolean
  portfolioData: Portfolio | null
}

export default function Header({ isConnected, portfolioData }: HeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2) + '%'
  }

  const isProfitable = (portfolioData?.total_pnl ?? 0) >= 0

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">明</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Lumina 明见量化</h1>
            <p className="text-xs text-slate-400">AI驱动的智能量化交易系统</p>
          </div>
        </div>

        {/* 状态信息 */}
        <div className="flex items-center space-x-6">
          {portfolioData && (
            <>
              {/* 总资产 */}
              <div className="text-right">
                <p className="text-xs text-slate-400">总资产</p>
                <p className="text-lg font-semibold text-white font-mono-num">
                  {formatCurrency(portfolioData.total_value)}
                </p>
              </div>

              {/* 累计盈亏 */}
              <div className="text-right">
                <p className="text-xs text-slate-400">累计盈亏</p>
                <div className="flex items-center space-x-1">
                  {isProfitable ? (
                    <TrendingUp className="w-4 h-4 text-gain" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-loss" />
                  )}
                  <p className={`text-lg font-semibold font-mono-num ${isProfitable ? 'text-gain' : 'text-loss'}`}>
                    {formatCurrency(portfolioData.total_pnl)}
                  </p>
                </div>
              </div>

              {/* 收益率 */}
              <div className="text-right">
                <p className="text-xs text-slate-400">收益率</p>
                <p className={`text-lg font-semibold font-mono-num ${isProfitable ? 'text-gain' : 'text-loss'}`}>
                  {formatPercent(portfolioData.total_pnl_ratio)}
                </p>
              </div>
            </>
          )}

          {/* 连接状态 */}
          <div className="flex items-center space-x-2 pl-4 border-l border-slate-600">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500">已连接</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-500">已断开</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
