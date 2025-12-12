import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { PnLRecord } from '../types'

interface PnLChartProps {
  data: PnLRecord[]
}

export default function PnLChart({ data }: PnLChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-400">
        暂无盈亏数据
      </div>
    )
  }

  // 格式化数据
  const chartData = data.map((record) => ({
    ...record,
    date: format(parseISO(record.timestamp), 'MM/dd'),
    pnlRatio: record.total_pnl_ratio * 100,
  }))

  const minPnl = Math.min(...chartData.map((d) => d.pnlRatio))
  const maxPnl = Math.max(...chartData.map((d) => d.pnlRatio))

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={chartData[chartData.length - 1]?.pnlRatio >= 0 ? '#10b981' : '#ef4444'} 
                stopOpacity={0.3}
              />
              <stop 
                offset="95%" 
                stopColor={chartData[chartData.length - 1]?.pnlRatio >= 0 ? '#10b981' : '#ef4444'} 
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis 
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
            domain={[minPnl - 1, maxPnl + 1]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#f1f5f9' }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, '收益率']}
          />
          <Area
            type="monotone"
            dataKey="pnlRatio"
            stroke={chartData[chartData.length - 1]?.pnlRatio >= 0 ? '#10b981' : '#ef4444'}
            fillOpacity={1}
            fill="url(#colorPnl)"
            strokeWidth={2}
          />
          {/* 零线 */}
          <Line
            type="monotone"
            dataKey={() => 0}
            stroke="#64748b"
            strokeDasharray="5 5"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
