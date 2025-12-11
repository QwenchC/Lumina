import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon,
  trend = 'neutral',
  className = ''
}: StatCardProps) {
  const trendColors = {
    up: 'text-gain',
    down: 'text-loss',
    neutral: 'text-white'
  }

  return (
    <div className={`bg-slate-800 rounded-xl p-6 border border-slate-700 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className={`text-2xl font-bold font-mono-num ${trendColors[trend]}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-slate-700/50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
