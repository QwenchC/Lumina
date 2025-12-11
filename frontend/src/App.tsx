import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import MarketBrowser from './pages/MarketBrowser'
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
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
