import { useState } from 'react'
import { ArrowUp, ArrowDown, Minus, ChevronUp, ChevronDown } from 'lucide-react'

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

interface StockTableProps {
  stocks: Stock[]
  onSelectStock: (stock: Stock) => void
}

type SortField = 'price' | 'change_pct' | 'amount' | 'turnover_rate' | 'market_cap'
type SortOrder = 'asc' | 'desc'

export default function StockTable({ stocks, onSelectStock }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>('amount')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }
  
  const sortedStocks = [...stocks].sort((a, b) => {
    const aVal = a[sortField] || 0
    const bVal = b[sortField] || 0
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })
  
  const formatAmount = (amount: number) => {
    // amount 单位是万元
    if (amount >= 10000) {
      return (amount / 10000).toFixed(2) + '亿'
    }
    return amount.toFixed(2) + '万'
  }
  
  const formatMarketCap = (cap: number) => {
    // cap 单位是亿元
    if (cap >= 10000) {
      return (cap / 10000).toFixed(2) + '万亿'
    }
    return cap.toFixed(2) + '亿'
  }
  
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }
  
  const renderChangeCell = (stock: Stock) => {
    const isUp = stock.change_pct > 0
    const isDown = stock.change_pct < 0
    const colorClass = isUp ? 'text-red-400' : isDown ? 'text-green-400' : 'text-slate-400'
    const bgClass = isUp ? 'bg-red-900/30' : isDown ? 'bg-green-900/30' : 'bg-slate-700/30'
    
    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        {isUp ? <ArrowUp className="w-3 h-3" /> : isDown ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        <span className={`px-2 py-0.5 rounded ${bgClass}`}>
          {isUp ? '+' : ''}{stock.change_pct.toFixed(2)}%
        </span>
      </div>
    )
  }
  
  if (stocks.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        暂无数据
      </div>
    )
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-700/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              代码/名称
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => handleSort('price')}
            >
              <div className="flex items-center justify-end gap-1">
                最新价
                <SortIcon field="price" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => handleSort('change_pct')}
            >
              <div className="flex items-center justify-end gap-1">
                涨跌幅
                <SortIcon field="change_pct" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center justify-end gap-1">
                成交额
                <SortIcon field="amount" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => handleSort('turnover_rate')}
            >
              <div className="flex items-center justify-end gap-1">
                换手率
                <SortIcon field="turnover_rate" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => handleSort('market_cap')}
            >
              <div className="flex items-center justify-end gap-1">
                总市值
                <SortIcon field="market_cap" />
              </div>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
              市盈率
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {sortedStocks.map((stock, index) => (
            <tr 
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className="hover:bg-slate-700/50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-6">{index + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{stock.name}</div>
                    <div className="text-xs text-slate-400">{stock.symbol}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <span className={`text-sm font-medium ${
                  stock.change_pct > 0 ? 'text-red-400' : stock.change_pct < 0 ? 'text-green-400' : 'text-white'
                }`}>
                  {stock.price.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {renderChangeCell(stock)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-slate-300">
                {formatAmount(stock.amount)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-slate-300">
                {stock.turnover_rate?.toFixed(2) || '-'}%
              </td>
              <td className="px-4 py-3 text-right text-sm text-slate-300">
                {stock.market_cap ? formatMarketCap(stock.market_cap) : '-'}
              </td>
              <td className="px-4 py-3 text-right text-sm text-slate-300">
                {stock.pe_ratio?.toFixed(2) || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
