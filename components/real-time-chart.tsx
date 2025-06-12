"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, TrendingUp, TrendingDown } from "lucide-react"

interface MonitoringStats {
  timestamp: string
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  avgResponseTime: number
  upUrls: number
  downUrls: number
}

interface RealTimeChartProps {
  data: MonitoringStats[]
}

export function RealTimeChart({ data }: RealTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Chart dimensions
    const padding = 40
    const chartWidth = rect.width - padding * 2
    const chartHeight = rect.height - padding * 2

    // Get data ranges
    const maxResponseTime = Math.max(...data.map(d => d.avgResponseTime), 1)
    const maxUrls = Math.max(...data.map(d => d.upUrls + d.downUrls), 1)

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, padding + chartHeight)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + chartWidth, y)
      ctx.stroke()
    }

    // Draw response time line
    if (data.length > 1) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index
        const y = padding + chartHeight - (point.avgResponseTime / maxResponseTime) * chartHeight
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()

      // Draw points
      ctx.fillStyle = '#3b82f6'
      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index
        const y = padding + chartHeight - (point.avgResponseTime / maxResponseTime) * chartHeight
        
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw URL status bars
    const barWidth = chartWidth / data.length * 0.6
    data.forEach((point, index) => {
      const x = padding + (chartWidth / data.length) * index + (chartWidth / data.length - barWidth) / 2
      const totalUrls = point.upUrls + point.downUrls
      
      if (totalUrls > 0) {
        const upHeight = (point.upUrls / maxUrls) * chartHeight * 0.3
        const downHeight = (point.downUrls / maxUrls) * chartHeight * 0.3
        
        // Up URLs (green)
        ctx.fillStyle = '#10b981'
        ctx.fillRect(x, padding + chartHeight - upHeight, barWidth, upHeight)
        
        // Down URLs (red)
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(x, padding + chartHeight - upHeight - downHeight, barWidth, downHeight)
      }
    })

    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    
    // Time labels
    data.forEach((point, index) => {
      if (index % Math.ceil(data.length / 5) === 0) {
        const x = padding + (chartWidth / (data.length - 1)) * index
        const time = new Date(point.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        ctx.fillText(time, x, rect.height - 10)
      }
    })

    // Y-axis labels
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      const value = Math.round(maxResponseTime * (1 - i / 5))
      ctx.fillText(`${value}ms`, padding - 10, y + 4)
    }

  }, [data])

  const latestData = data[data.length - 1]

  return (
    <Card className="glass border-blue-500/30 animate-slide-up">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Real-time Monitoring
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400">Live</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Online</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {latestData?.upUrls || 0}
            </div>
          </div>
          
          <div className="glass rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-gray-400">Offline</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {latestData?.downUrls || 0}
            </div>
          </div>
          
          <div className="glass rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Avg Response</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {Math.round(latestData?.avgResponseTime || 0)}ms
            </div>
          </div>
          
          <div className="glass rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {latestData ? Math.round((latestData.successfulChecks / Math.max(latestData.totalChecks, 1)) * 100) : 0}%
            </div>
          </div>
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-64 rounded-lg bg-gray-900/30"
            style={{ width: '100%', height: '256px' }}
          />
          
          <div className="absolute top-4 left-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-0.5 bg-blue-400"></div>
              <span className="text-gray-300">Response Time</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
              <span className="text-gray-300">Online URLs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
              <span className="text-gray-300">Offline URLs</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}