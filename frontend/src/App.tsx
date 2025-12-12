import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import MarketBrowser from './pages/MarketBrowser'
import Positions from './pages/Positions'
import Analysis from './pages/Analysis'
import History from './pages/History'
import Strategy from './pages/Strategy'
import Settings from './pages/Settings'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  const { portfolioData, pnlHistory, isConnected } = useWebSocket()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-900">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header 
            isConnected={isConnected} 
            portfolioData={portfolioData}
          />
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    portfolioData={portfolioData}
                    pnlHistory={pnlHistory}
                  />
                } 
              />
              <Route path="/market" element={<MarketBrowser />} />
              <Route path="/positions" element={<Positions />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/history" element={<History />} />
              <Route path="/strategy" element={<Strategy />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
