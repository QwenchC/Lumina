import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface IndexData {
  name: string
  price: number
  change: number
  change_pct: number
  volume: number
  amount: number
}

interface IndexCardProps {
  code: string
  data: IndexData
}

export default function IndexCard({ code, data }: IndexCardProps) {
  const isUp = data.change_pct > 0
  const isDown = data.change_pct < 0
  
  const bgColor = isUp 
    ? 'bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-700/30' 
    : isDown 
    ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/30'
    : 'bg-slate-800 border-slate-700'
  
  const textColor = isUp ? 'text-red-400' : isDown ? 'text-green-400' : 'text-slate-400'
  
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(2) + '万亿'
    } else if (num >= 1) {
      return num.toFixed(2) + '亿'
    }
    return num.toFixed(2)
  }
  
  return (
    <div className={`rounded-xl p-4 border ${bgColor} hover:scale-105 transition-transform cursor-pointer`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400 truncate">{data.name}</span>
        {isUp ? (
          <TrendingUp className="w-4 h-4 text-red-400" />
        ) : isDown ? (
          <TrendingDown className="w-4 h-4 text-green-400" />
        ) : (
          <Minus className="w-4 h-4 text-slate-400" />
        )}
      </div>
      <div className={`text-xl font-bold ${textColor}`}>
        {data.price.toFixed(2)}
      </div>
      <div className={`text-sm ${textColor} flex items-center gap-2`}>
        <span>{isUp ? '+' : ''}{data.change.toFixed(2)}</span>
        <span>{isUp ? '+' : ''}{data.change_pct.toFixed(2)}%</span>
      </div>
    </div>
  )
}
