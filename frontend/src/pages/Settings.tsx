import { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon,
  Brain,
  Wallet,
  Bell,
  Shield,
  Database,
  Info,
  Save,
  RotateCcw,
  CheckCircle,
  ExternalLink,
  Github
} from 'lucide-react'

interface SettingsState {
  // LLM 设置
  llm: {
    provider: string
    model: string
    apiKey: string
    baseUrl: string
    temperature: number
    maxTokens: number
  }
  // 交易设置
  trading: {
    initialCapital: number
    maxPositionRatio: number
    maxSinglePosition: number
    enableAutoTrading: boolean
  }
  // 风控设置
  risk: {
    stopLossRatio: number
    takeProfitRatio: number
    maxDailyLoss: number
    maxDrawdown: number
  }
  // 通知设置
  notifications: {
    enableTradeNotify: boolean
    enableAnalysisNotify: boolean
    enableErrorNotify: boolean
  }
}

const defaultSettings: SettingsState = {
  llm: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    temperature: 0.7,
    maxTokens: 4096,
  },
  trading: {
    initialCapital: 100000,
    maxPositionRatio: 80,
    maxSinglePosition: 30,
    enableAutoTrading: false,
  },
  risk: {
    stopLossRatio: 5,
    takeProfitRatio: 10,
    maxDailyLoss: 3,
    maxDrawdown: 15,
  },
  notifications: {
    enableTradeNotify: true,
    enableAnalysisNotify: true,
    enableErrorNotify: true,
  },
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  const [activeTab, setActiveTab] = useState<'llm' | 'trading' | 'risk' | 'notifications' | 'about'>('llm')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // 从 localStorage 加载设置
    const savedSettings = localStorage.getItem('lumina_settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('lumina_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (confirm('确定要重置所有设置吗？')) {
      setSettings(defaultSettings)
      localStorage.removeItem('lumina_settings')
    }
  }

  const tabs = [
    { id: 'llm' as const, label: 'LLM 配置', icon: Brain },
    { id: 'trading' as const, label: '交易设置', icon: Wallet },
    { id: 'risk' as const, label: '风险控制', icon: Shield },
    { id: 'notifications' as const, label: '通知设置', icon: Bell },
    { id: 'about' as const, label: '关于', icon: Info },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-sky-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">系统设置</h1>
            <p className="text-sm text-slate-400">配置系统参数和偏好</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white transition-colors"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 侧边导航 */}
        <div className="w-48 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 设置内容 */}
        <div className="flex-1 bg-slate-800 rounded-xl p-6">
          {activeTab === 'llm' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-sky-400" />
                LLM 大模型配置
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">提供商</label>
                  <select
                    value={settings.llm.provider}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        llm: { ...settings.llm, provider: e.target.value },
                      })
                    }
                    className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
                  >
                    <option value="deepseek">DeepSeek</option>
                    <option value="openai">OpenAI</option>
                    <option value="zhipu">智谱 AI</option>
                    <option value="qwen">通义千问</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">模型</label>
                  <input
                    type="text"
                    value={settings.llm.model}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        llm: { ...settings.llm, model: e.target.value },
                      })
                    }
                    className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
                    placeholder="deepseek-chat"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">API Key</label>
                <input
                  type="password"
                  value={settings.llm.apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      llm: { ...settings.llm, apiKey: e.target.value },
                    })
                  }
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
                  placeholder="sk-..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  如未设置，将使用 .env 文件中的配置
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">API Base URL</label>
                <input
                  type="text"
                  value={settings.llm.baseUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      llm: { ...settings.llm, baseUrl: e.target.value },
                    })
                  }
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
                  placeholder="https://api.deepseek.com/v1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Temperature ({settings.llm.temperature})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.llm.temperature}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        llm: { ...settings.llm, temperature: Number(e.target.value) },
                      })
                    }
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Max Tokens</label>
                  <input
                    type="number"
                    value={settings.llm.maxTokens}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        llm: { ...settings.llm, maxTokens: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trading' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-sky-400" />
                交易设置
              </h3>

              <div>
                <label className="block text-sm text-slate-400 mb-2">初始资金</label>
                <input
                  type="number"
                  value={settings.trading.initialCapital}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      trading: { ...settings.trading, initialCapital: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  最大仓位比例 ({settings.trading.maxPositionRatio}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={settings.trading.maxPositionRatio}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      trading: { ...settings.trading, maxPositionRatio: Number(e.target.value) },
                    })
                  }
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  单只股票最大仓位 ({settings.trading.maxSinglePosition}%)
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={settings.trading.maxSinglePosition}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      trading: { ...settings.trading, maxSinglePosition: Number(e.target.value) },
                    })
                  }
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">自动交易</p>
                  <p className="text-sm text-slate-400">允许 AI 自动执行交易决策</p>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      trading: {
                        ...settings.trading,
                        enableAutoTrading: !settings.trading.enableAutoTrading,
                      },
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.trading.enableAutoTrading ? 'bg-sky-600' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.trading.enableAutoTrading ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-400" />
                风险控制
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    止损比例 ({settings.risk.stopLossRatio}%)
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={settings.risk.stopLossRatio}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        risk: { ...settings.risk, stopLossRatio: Number(e.target.value) },
                      })
                    }
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    止盈比例 ({settings.risk.takeProfitRatio}%)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={settings.risk.takeProfitRatio}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        risk: { ...settings.risk, takeProfitRatio: Number(e.target.value) },
                      })
                    }
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    单日最大亏损 ({settings.risk.maxDailyLoss}%)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.risk.maxDailyLoss}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        risk: { ...settings.risk, maxDailyLoss: Number(e.target.value) },
                      })
                    }
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    最大回撤限制 ({settings.risk.maxDrawdown}%)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={settings.risk.maxDrawdown}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        risk: { ...settings.risk, maxDrawdown: Number(e.target.value) },
                      })
                    }
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ 风控参数会影响交易决策，请谨慎设置。当触发风控条件时，系统将自动拒绝或调整交易。
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky-400" />
                通知设置
              </h3>

              <div className="space-y-4">
                {[
                  {
                    key: 'enableTradeNotify' as const,
                    label: '交易通知',
                    desc: '买入、卖出操作完成时通知',
                  },
                  {
                    key: 'enableAnalysisNotify' as const,
                    label: '分析通知',
                    desc: 'AI 分析完成时通知',
                  },
                  {
                    key: 'enableErrorNotify' as const,
                    label: '错误通知',
                    desc: '系统错误或异常时通知',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            [item.key]: !settings.notifications[item.key],
                          },
                        })
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.notifications[item.key] ? 'bg-sky-600' : 'bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.notifications[item.key] ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-400" />
                关于 Lumina
              </h3>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">明</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Lumina 明见量化</h2>
                  <p className="text-slate-400">AI 驱动的量化交易系统</p>
                  <p className="text-sm text-slate-500">版本 1.0.0</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <Database className="w-5 h-5 text-sky-400" />
                  <div>
                    <p className="text-white">数据源</p>
                    <p className="text-slate-400">AKShare（A股实时数据）</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                  <Brain className="w-5 h-5 text-sky-400" />
                  <div>
                    <p className="text-white">AI 引擎</p>
                    <p className="text-slate-400">DeepSeek 大语言模型</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-sm font-medium text-white mb-3">技术栈</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Python',
                    'FastAPI',
                    'React',
                    'TypeScript',
                    'TailwindCSS',
                    'SQLite',
                    'AKShare',
                    'DeepSeek',
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-lg text-center">
                <p className="text-slate-400 text-sm">
                  ⚠️ 免责声明：本系统仅供学习研究使用，不构成投资建议。
                  <br />
                  股市有风险，投资需谨慎。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
