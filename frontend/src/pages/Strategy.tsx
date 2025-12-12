import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Brain,
  Play,
  Pause,
  Settings,
  Target,
  TrendingUp,
  Shield,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react'
import api from '../services/api'

interface StrategyConfig {
  risk_level: 'conservative' | 'moderate' | 'aggressive'
  max_position_ratio: number
  stop_loss_ratio: number
  take_profit_ratio: number
  max_daily_trades: number
  trading_hours: {
    start: string
    end: string
  }
}

export default function Strategy() {
  const queryClient = useQueryClient()
  const [isAutoTrading, setIsAutoTrading] = useState(false)
  const [config, setConfig] = useState<StrategyConfig>({
    risk_level: 'moderate',
    max_position_ratio: 30,
    stop_loss_ratio: 5,
    take_profit_ratio: 10,
    max_daily_trades: 5,
    trading_hours: {
      start: '09:30',
      end: '15:00',
    },
  })
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)

  const analysisMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/llm/analyze-portfolio')
      return res.data
    },
    onSuccess: (data) => {
      setAnalysisResult(data.analysis || JSON.stringify(data, null, 2))
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    },
  })

  const riskLevelColors = {
    conservative: 'from-blue-600 to-blue-700',
    moderate: 'from-sky-600 to-sky-700',
    aggressive: 'from-orange-600 to-orange-700',
  }

  const riskLevelLabels = {
    conservative: { name: '保守型', desc: '低风险，稳健增长' },
    moderate: { name: '平衡型', desc: '适度风险，均衡收益' },
    aggressive: { name: '激进型', desc: '高风险，追求高收益' },
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-sky-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">AI 策略</h1>
            <p className="text-sm text-slate-400">智能交易策略配置与监控</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoTrading(!isAutoTrading)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isAutoTrading
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            {isAutoTrading ? (
              <>
                <Pause className="w-4 h-4" />
                暂停自动交易
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                启动自动交易
              </>
            )}
          </button>
        </div>
      </div>

      {/* 状态指示器 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">策略状态</span>
            {isAutoTrading ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
          </div>
          <p className={`text-lg font-bold ${isAutoTrading ? 'text-green-400' : 'text-yellow-400'}`}>
            {isAutoTrading ? '运行中' : '已暂停'}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">今日分析</span>
            <Zap className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-lg font-bold text-white">3 次</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">今日交易</span>
            <TrendingUp className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-lg font-bold text-white">2 笔</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">策略收益</span>
            <Sparkles className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-lg font-bold text-green-400">+2.5%</p>
        </div>
      </div>

      {/* 风险等级选择 */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-sky-400" />
          风险等级
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(riskLevelLabels) as Array<keyof typeof riskLevelLabels>).map((level) => (
            <button
              key={level}
              onClick={() => setConfig({ ...config, risk_level: level })}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                config.risk_level === level
                  ? `border-sky-500 bg-gradient-to-br ${riskLevelColors[level]}`
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              {config.risk_level === level && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
              <h4 className="text-lg font-semibold text-white mb-1">
                {riskLevelLabels[level].name}
              </h4>
              <p className="text-sm text-slate-300">
                {riskLevelLabels[level].desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 策略参数 */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            策略参数
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                单只股票最大仓位 ({config.max_position_ratio}%)
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={config.max_position_ratio}
                onChange={(e) =>
                  setConfig({ ...config, max_position_ratio: Number(e.target.value) })
                }
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>10%</span>
                <span>50%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                止损比例 ({config.stop_loss_ratio}%)
              </label>
              <input
                type="range"
                min="2"
                max="15"
                value={config.stop_loss_ratio}
                onChange={(e) =>
                  setConfig({ ...config, stop_loss_ratio: Number(e.target.value) })
                }
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>2%</span>
                <span>15%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                止盈比例 ({config.take_profit_ratio}%)
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={config.take_profit_ratio}
                onChange={(e) =>
                  setConfig({ ...config, take_profit_ratio: Number(e.target.value) })
                }
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5%</span>
                <span>30%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                每日最大交易次数
              </label>
              <select
                value={config.max_daily_trades}
                onChange={(e) =>
                  setConfig({ ...config, max_daily_trades: Number(e.target.value) })
                }
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
              >
                <option value={3}>3 次</option>
                <option value={5}>5 次</option>
                <option value={10}>10 次</option>
                <option value={20}>20 次</option>
              </select>
            </div>
          </div>
        </div>

        {/* 交易时间 */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            交易时间
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">开始时间</label>
                <input
                  type="time"
                  value={config.trading_hours.start}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      trading_hours: { ...config.trading_hours, start: e.target.value },
                    })
                  }
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">结束时间</label>
                <input
                  type="time"
                  value={config.trading_hours.end}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      trading_hours: { ...config.trading_hours, end: e.target.value },
                    })
                  }
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2">A股交易时段</h4>
              <p className="text-xs text-slate-400">
                上午：09:30 - 11:30<br />
                下午：13:00 - 15:00
              </p>
            </div>
          </div>

          {/* 手动分析按钮 */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <button
              onClick={() => analysisMutation.mutate()}
              disabled={analysisMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 rounded-lg text-white font-medium transition-all disabled:opacity-50"
            >
              {analysisMutation.isPending ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  分析中...
                </>
              ) : (
                <>
                  <Target className="w-5 h-5" />
                  立即分析持仓
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI 分析结果 */}
      {(analysisResult || analysisMutation.isError) && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-sky-400" />
            AI 分析结果
          </h3>
          {analysisMutation.isError ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400">分析失败，请稍后重试</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                {analysisResult}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 策略说明 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-400" />
          关于 AI 策略
        </h3>
        <div className="space-y-3 text-sm text-slate-400">
          <p>
            • <strong className="text-white">DeepSeek 大模型：</strong>
            采用 DeepSeek 大语言模型进行市场分析和交易决策
          </p>
          <p>
            • <strong className="text-white">多维度分析：</strong>
            综合考虑技术指标、市场情绪、资金流向等多个维度
          </p>
          <p>
            • <strong className="text-white">风险控制：</strong>
            严格执行止损止盈策略，控制单笔交易风险
          </p>
          <p>
            • <strong className="text-white">T+1 规则：</strong>
            自动遵守 A 股 T+1 交易规则，当日买入的股票次日才能卖出
          </p>
        </div>
      </div>
    </div>
  )
}
