import { useState, useEffect, useCallback, useRef } from 'react'
import type { Portfolio, PnLRecord, WebSocketMessage } from '../types'

const WS_URL = import.meta.env.DEV 
  ? 'ws://localhost:8000/ws' 
  : `ws://${window.location.host}/ws`

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [portfolioData, setPortfolioData] = useState<Portfolio | null>(null)
  const [pnlHistory, setPnlHistory] = useState<PnLRecord[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket 已连接')
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          switch (message.type) {
            case 'initial_state':
              if (message.data?.portfolio) {
                setPortfolioData(message.data.portfolio)
              }
              if (message.data?.pnl_history) {
                setPnlHistory(message.data.pnl_history)
              }
              break
            
            case 'portfolio_update':
              if (message.data) {
                setPortfolioData(message.data)
              }
              break
            
            case 'pong':
            case 'heartbeat':
              // 心跳响应，忽略
              break
            
            default:
              console.log('收到消息:', message)
          }
        } catch (e) {
          console.error('解析消息失败:', e)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket 已断开')
        setIsConnected(false)
        wsRef.current = null
        
        // 5秒后重连
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('尝试重新连接...')
          connect()
        }, 5000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error)
      }
    } catch (e) {
      console.error('WebSocket 连接失败:', e)
    }
  }, [])

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const triggerAnalysis = useCallback(() => {
    sendMessage({ type: 'trigger_analysis' })
  }, [sendMessage])

  useEffect(() => {
    connect()

    // 定时发送心跳
    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' })
    }, 25000)

    return () => {
      clearInterval(pingInterval)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect, sendMessage])

  return {
    isConnected,
    portfolioData,
    pnlHistory,
    sendMessage,
    triggerAnalysis,
  }
}
