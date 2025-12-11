import { 
  LayoutDashboard, 
  LineChart, 
  Briefcase, 
  History, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  TrendingUp
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const menuItems = [
  { icon: LayoutDashboard, label: '仪表盘', path: '/' },
  { icon: TrendingUp, label: '市场行情', path: '/market' },
  { icon: Briefcase, label: '持仓管理', path: '/positions' },
  { icon: LineChart, label: '盈亏分析', path: '/analysis' },
  { icon: History, label: '交易历史', path: '/history' },
  { icon: Bot, label: 'AI 策略', path: '/strategy' },
  { icon: Settings, label: '系统设置', path: '/settings' },
]

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <aside 
      className={`bg-slate-800 border-r border-slate-700 transition-all duration-300 ${
        isOpen ? 'w-60' : 'w-16'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* 收起/展开按钮 */}
        <div className="p-4 border-b border-slate-700">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>

        {/* 菜单项 */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* 底部信息 */}
        {isOpen && (
          <div className="p-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              Lumina v1.0.0
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
