import axios from 'axios'
import type { Portfolio, Order, PnLRecord, StockQuote } from '../types'

const API_BASE = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// 投资组合 API
export const portfolioApi = {
  getStatus: () => api.get<Portfolio>('/portfolio/status'),
  getOrders: (limit = 50) => api.get<Order[]>('/portfolio/orders', { params: { limit } }),
  getPnlHistory: (days = 30) => api.get<PnLRecord[]>('/portfolio/pnl', { params: { days } }),
  triggerAnalysis: () => api.post('/portfolio/analyze'),
  reset: () => api.post('/portfolio/reset'),
}

// 市场数据 API
export const marketApi = {
  getQuote: (symbol: string) => api.get<StockQuote>(`/market/quote/${symbol}`),
  getQuotes: (symbols: string[]) => api.get('/market/quotes', { params: { symbols: symbols.join(',') } }),
  getHistory: (symbol: string, startDate?: string, endDate?: string) => 
    api.get(`/market/history/${symbol}`, { params: { start_date: startDate, end_date: endDate } }),
  getHotStocks: (limit = 20) => api.get('/market/hot', { params: { limit } }),
  searchStocks: (keyword: string) => api.get('/market/search', { params: { keyword } }),
}

export default api
