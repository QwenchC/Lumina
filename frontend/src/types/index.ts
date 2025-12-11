/**
 * Lumina 明见量化 - 类型定义
 */

export interface Position {
  symbol: string
  name: string
  quantity: number
  avg_cost: number
  current_price: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_ratio: number
}

export interface Portfolio {
  portfolio_id: number
  name: string
  initial_capital: number
  cash: number
  market_value: number
  total_value: number
  total_pnl: number
  total_pnl_ratio: number
  daily_pnl: number
  positions: Position[]
}

export interface PnLRecord {
  timestamp: string
  total_value: number
  cash: number
  market_value: number
  daily_pnl: number
  total_pnl: number
  total_pnl_ratio: number
}

export interface Order {
  id: number
  symbol: string
  name: string
  action: 'buy' | 'sell'
  quantity: number
  price: number
  filled_price: number | null
  filled_quantity: number
  status: 'pending' | 'filled' | 'cancelled' | 'failed'
  reason: string
  created_at: string
}

export interface StockQuote {
  symbol: string
  name: string
  price: number
  change_pct: number
  change: number
  volume: number
  amount: number
  open: number
  high: number
  low: number
  prev_close: number
  turnover_rate?: number
  pe_ratio?: number
  pb_ratio?: number
  market_cap?: number
}

export interface WebSocketMessage {
  type: string
  data?: any
  timestamp?: string
  message?: string
}
